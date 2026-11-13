/* PCM (Int16, 24 kHz, mono) na MP3 van 40 kbps, soos die app se ander grepies. lamejs se gewone ingang het 'n
   bekende fout ("MPEGMode is not defined"), daarom laai ons sy saamgebondelde lame.all.js in 'n eie konteks. */
const fs = require('fs');
const vm = require('vm');

let lame = null;
function lib() {
  if (!lame) {
    const c = {};
    vm.createContext(c);
    vm.runInContext(fs.readFileSync(require.resolve('lamejs/lame.all.js'), 'utf8'), c);
    lame = c.lamejs;
  }
  return lame;
}
function encodeMp3(pcm, sampleRate = 24000, kbps = 40) {
  const enc = new (lib().Mp3Encoder)(1, sampleRate, kbps), out = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const b = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (b.length) out.push(Buffer.from(b));
  }
  const end = enc.flush();
  if (end.length) out.push(Buffer.from(end));
  return Buffer.concat(out);
}
/* Sny stilte voor en agter af (soos tools/build-audio.js). */
function trim(s, sampleRate = 24000) {
  let a = 0, b = s.length - 1;
  while (a < s.length && Math.abs(s[a]) < 350) a++;
  while (b > a && Math.abs(s[b]) < 350) b--;
  if (a >= b) return null;
  return s.subarray(Math.max(0, a - Math.round(0.02 * sampleRate)), Math.min(s.length, b + Math.round(0.05 * sampleRate) + 1));
}
module.exports = { encodeMp3, trim };
