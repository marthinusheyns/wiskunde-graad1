# Wiskunde Graad 1 — practice app

Sponsored by [Heynstech](https://www.heynstech.com/).

An Afrikaans maths practice app for Grade 1 learners. It follows the DBE Rainbow Workbooks
*Wiskunde in Afrikaans, Graad 1*:

- **Boek 1**: Kwartaal 1 & 2, worksheets 1–64 (with 12a/b, 24a/b, 48a/b, 60a/b, 64a/b)
- **Boek 2**: Kwartaal 3 & 4, worksheets 65–128

Every worksheet in the app has the same number, title and book page as the printed workbook. When
the class does worksheet 45 at school, the child can practise worksheet 45 at home. Each session
generates new questions for that worksheet's skills (8 by default), so the child can repeat it as
often as needed.

## How it helps kids master the books

- **Stars per worksheet**: 3 stars = 90%+ right on the first try, 2 stars = 70%+, 1 star = completed.
- **Hints, then the answer**: a wrong answer gets a hint. A second wrong answer shows the worked
  answer, and a similar question comes back at the end of the session (up to 3 extra, not scored).
- **Juffrou Padda ("Wys my hoe" / "Leer my")**: a built-in tutor. Each question type has a
  *critical path* of small skills (a 29-skill map). Wrong options match known mistakes, so a wrong
  answer gets a hint about that specific mistake. After a second mistake, a short spoken lesson
  shows how it's done (number-line hops, beads, ten-frames, sharing, coins), aimed at the broken
  skill. The parents' section shows where the child struggles ("Begin hier") with home activities.
  Design: [docs/TUTOR-DESIGN.md](docs/TUTOR-DESIGN.md). Teacher review:
  [docs/SKILL-MAP.md](docs/SKILL-MAP.md) (regenerate with `node tools/skillmap-doc.js`).
- **"Speel volgende"**: suggests the next worksheet that isn't mastered yet.
- **Hersiening**: a mixed review of worksheets already played, weighted toward low stars and
  worksheets not played for a while.
- **Ouerhoek** (parents' section, behind a simple times-table question): progress per term,
  accuracy per skill (flags "Oefen nog" under 70%), the list of worksheets to redo, settings, and
  player management.
- **Several children**: each child gets their own profile and progress.
- **Read-aloud**: every question, hint and explanation is read aloud in Afrikaans with a built-in
  recorded voice, on any phone (see below).

Question types include counting, number names, tracing numerals with a finger, colouring in N
shapes, ordering, number lines, ten-frames, bonds, doubling and halving, groups and repeated
addition, sharing, SA coins and notes, length, mass, capacity, time, 2D/3D shapes, patterns,
position and direction, symmetry and pictographs. There are 71 generators in all.

## Running it

It is a static web app with no build step and no dependencies.

- **Quickest:** serve the folder and open it in a browser:
  ```
  cd app
  python -m http.server 8000
  ```
  Then go to <http://localhost:8000>.
- **Double-clicking `index.html`** should also work, since the scripts are plain classic scripts.
  This was not tested here. Offline install needs http(s).
- **For a tablet or phone:** host the `app` folder on any static host, such as GitHub Pages,
  Netlify, Cloudflare Pages or Azure Static Web Apps. Open it once and use "Add to Home Screen".
  It installs like an app and works offline: `sw.js` caches everything.

Progress is stored in the browser's `localStorage` on that device only.

### Afrikaans voice

The app has its own recorded Afrikaans voice: **Adri**, a Microsoft Azure neural voice. Every
question works the same on any phone or browser, with no setup. Most phones have no Afrikaans
text-to-speech of their own.

- Spoken text is split into reusable pieces: sentences, names and numbers (`W.AF.segments`). Each
  piece is recorded once as `audio/<hash>.mp3`, about 2,100 clips in all. The app plays the pieces
  one after another (`W.Voice` in `js/audio.js`).
- Clips download as they're needed and are kept on the phone for offline use. The parents' section
  also has a button to download the whole voice in one go.
- If a piece is missing (for example after new questions are added), the app uses the device's
  own Afrikaans voice if there is one. Otherwise that phrase is silent.

**Recording or updating the voice** (one-off; fits easily in Azure's free F0 tier of 500,000
characters a month, and the full set is about 53,000 characters):

```
cd tools
npm install
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southafricanorth node build-audio.js   # only records missing pieces
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southafricanorth node check-audio.js 50  # speech-to-text spot check
```

`node tests/smoke.js` warns if any spoken text has no recording. Never commit the key.

## Project layout

```
app/
  index.html, manifest.webmanifest, sw.js, icons/
  css/styles.css
  js/util.js            helpers (random, choices)
  js/af.js              Afrikaans: number words, ordinals, nouns, names, praise, text-to-speech prep
  js/visuals.js         SVG/HTML pictures: beads, ten-frames, number lines, coins, shapes, scales...
  js/gen-*.js           question generators (number, operations, measurement, space, money/data)
  js/curriculum.js      the 128 worksheets → which generators/params each one uses
  js/store.js           profiles, progress, settings (localStorage)
  js/audio.js           speech + sound effects
  js/trace.js           finger tracing of numerals
  js/tutor-data.js      skill map, mistake catalogue, critical paths, mistake-matched options
  js/tutor-lessons.js   Juffrou Padda's lessons (frames of picture + spoken sentence)
  js/tutor.js           lesson player and the parent-report logic (root gaps)
  js/app.js             screens and the question player
  tests/smoke.js        generates ~100k questions and validates every one
  tests/gallery.html    one sample of every question type, for visual checks
  audio/                recorded voice clips + manifest.json
  tools/                build-audio.js (records the voice), check-audio.js (verifies it)
```

To change what a worksheet practises, edit its row in `js/curriculum.js`. For example:

```js
['45', 'Optelling tot by 10: tel aan', [['countOn', { max: 10 }], ['wordProblem', { max: 10, ops: ['add'] }]]],
```

## Tests

```
node tests/smoke.js        # 300 questions per generator per worksheet; exits 1 on any problem
```

The test checks that every question has a prompt, a valid answer that is among the choices, no
duplicate choices, and no `undefined`/`NaN` in the text. Open `tests/gallery.html` (served over
http) to see one example of every question type. Add `?g=add,sub` or `?ws=45` to filter.

## Note on content, affiliation and privacy

- The app is free and is **not affiliated with the Department of Basic Education**. It does not
  reproduce the workbook pages or images. It mirrors the workbooks' structure: worksheet numbers,
  titles, page numbers and the skills each worksheet covers. All questions and pictures are
  generated by the app.
- **Privacy:** the app collects no data. There are no accounts, no ads and no tracking. Progress is
  stored only in the browser on each device.
- The voice is synthetic (Microsoft Azure neural TTS, voice "Adri"), and the app says so in the
  parents' section.
