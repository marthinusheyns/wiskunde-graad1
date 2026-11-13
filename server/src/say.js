/* Stembediener: sê 'n sin met dieselfde Azure-stem as die app (af-ZA-AdriNeural), vir sinne wat nie vooraf
   opgeneem is nie (bv. storiesomme). Die eerste keer word die sin by Azure aangevra en in die private houer
   "stem" gestoor; daarna kry elke foon die gestoorde kopie, en die foon hou dit self ook.

   Net die app se eie sinne word aanvaar: elke woord moet op die goedgekeurde woordelys wees (config.json,
   gemaak deur tools/say-config.js uit alles wat die app kan sê), of 'n getalwoord. Probleemwoorde word eers
   vervang deur 'n spelling wat die stem beter sê (config.json "say", uit W.AF.SAY in js/af.js). Woorde in
   config.json "join" (bv. "dertien") word uit twee opnames van die sin saamgelas (sien join.js).

   App-instellings (net in Azure, nooit in git nie): SPEECH_KEY, SPEECH_REGION, STEM_URL, STEM_SAS, ALLOWED_ORIGINS. */
const { app } = require('@azure/functions');
const crypto = require('crypto');
const CFG = require('../config.json');
const { words } = require('./words');
const { joinFor, replaceWord, joinTakes } = require('./join');
const { encodeMp3, trim } = require('./mp3');

const VOICE = 'af-ZA-AdriNeural', RATE = '-8%', FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
const VOCAB = new Set(CFG.vocab);
// Getalwoorde tot by miljoene: net uit hierdie dele saamgestel (bv. "drie-en-twintig", "tweehonderd")
const NUM = new RegExp('^(?:(?:' + ['nul', 'een', 'twee', 'drie', 'vier', 'vyf', 'ses', 'sewe', 'agt', 'nege', 'neë', 'tien', 'elf', 'twaalf',
  'dertien', 'veertien', 'vyftien', 'sestien', 'sewentien', 'agtien', 'negentien', 'neëntien', 'twintig', 'dertig', 'veertig', 'vyftig',
  'sestig', 'sewentig', 'tagtig', 'negentig', 'neëntig', 'honderd', 'duisend', 'miljoen', 'en'].join('|') + ')-?)+$');
const ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const SAY = Object.entries(CFG.say || {}).map(([a, b]) => [new RegExp('(?<![\\p{L}-])' + a + '(?![\\p{L}-])', 'giu'), b]);

function allowed(t) {
  if (!t || t.length > 400 || !/^[\p{L}\s.,!?;:’'"“”()-]+$/u.test(t)) return false;
  const w = words(t);
  const ok = (x) => VOCAB.has(x) || NUM.test(x);
  return w.length > 0 && w.length <= 60 && w.every((x) => ok(x) || x.split('-').every((p) => p && ok(p))); // ook "rand-noot"
}
function substitute(t) {
  for (const [re, b] of SAY) t = t.replace(re, (m) => (m[0] !== m[0].toLowerCase() ? b[0].toUpperCase() + b.slice(1) : b));
  return t;
}
const xml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const ssml = (t) => '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="af-ZA">' +
  `<voice name="${VOICE}"><mstts:silence type="Leading-exact" value="20ms"/><mstts:silence type="Tailing-exact" value="60ms"/>` +
  `<prosody rate="${RATE}">${xml(t)}</prosody></voice></speak>`;

/* Rou PCM plus woordgrense van Azure (vir die saamlas). Die SDK word net hier gelaai (dit is groot). */
let sdk = null;
function synthPcm(text) {
  sdk = sdk || require('microsoft-cognitiveservices-speech-sdk');
  const cfg = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
  cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw24Khz16BitMonoPcm;
  const x = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="af-ZA">' +
    `<voice name="${VOICE}"><prosody rate="${RATE}">${xml(text)}</prosody></voice></speak>`;
  return new Promise((res, rej) => {
    const s = new sdk.SpeechSynthesizer(cfg, null), found = [];
    s.wordBoundary = (_, e) => found.push({ text: e.text, off: e.audioOffset / 1e7, dur: e.duration / 1e7 });
    s.speakSsmlAsync(x, (r) => {
      s.close();
      if (r.reason !== sdk.ResultReason.SynthesizingAudioCompleted) return rej(new Error('synth'));
      const b = Buffer.from(r.audioData);
      res({ pcm: new Int16Array(b.buffer, b.byteOffset, b.length >> 1).slice(), words: found });
    }, (e) => { s.close(); rej(new Error(String(e))); });
  });
}
/* Die sin met 'n saamgelaste woord: neem dit met die kop- en die stert-woord op, en las by die "t". */
async function joined(t, j) {
  const [w, head, tail] = j;
  const [A, B] = await Promise.all([synthPcm(replaceWord(t, w, head)), synthPcm(replaceWord(t, w, tail))]);
  const pcm = joinTakes(A, B, head, tail);
  const cut = pcm && trim(pcm);
  return cut ? encodeMp3(cut) : null;
}

const audio = (buf, cache) => ({
  status: 200, body: buf,
  headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Stem': cache }
});

app.http('say', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (req) => {
    const origin = req.headers.get('origin');
    if (origin && !ORIGINS.includes(origin)) return { status: 403 };
    if (req.query.get('ping') !== null) { // maak die bediener wakker, en laai solank die groot stem-biblioteek (vir JOIN)
      sdk = sdk || require('microsoft-cognitiveservices-speech-sdk');
      return { status: 204, headers: { 'Cache-Control': 'no-store' } };
    }
    const t = substitute((req.query.get('t') || '').normalize('NFC').replace(/\s+/g, ' ').trim());
    if (!allowed(t)) return { status: 400, body: 'nie toegelaat nie' };

    const j = joinFor(t, CFG.join);
    // Die sleutel sluit die vervangings in: verander dit, dan word die sin oor gemaak
    const key = crypto.createHash('sha256').update([VOICE, RATE, FORMAT, JSON.stringify(CFG.say), j ? JSON.stringify(j) : '', t].join('|')).digest('hex').slice(0, 32);
    const blob = `${process.env.STEM_URL}/${key}.mp3?${process.env.STEM_SAS}`;
    try {
      const hit = await fetch(blob);
      if (hit.ok) return audio(Buffer.from(await hit.arrayBuffer()), 'hit');
    } catch (e) { /* nie in die houer nie: maak dit */ }

    let buf = null;
    if (j) buf = await joined(t, j).catch(() => null);
    if (!buf) {
      const r = await fetch(`https://${process.env.SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': process.env.SPEECH_KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': FORMAT, 'User-Agent': 'wiskunde-stem' },
        body: ssml(t)
      }).catch(() => null);
      if (!r || !r.ok) return { status: 503, body: 'stem nie nou beskikbaar nie' }; // die app gebruik dan die stukkies
      buf = Buffer.from(await r.arrayBuffer());
    }
    await fetch(blob, { method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'x-ms-blob-content-type': 'audio/mpeg' }, body: buf }).catch(() => null);
    return audio(buf, 'miss');
  }
});

module.exports = { allowed, substitute, words };
