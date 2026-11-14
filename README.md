# Wiskunde Graad 1 — practice app

Sponsored by [Heynstech](https://www.heynstech.com/).

Open source under the MIT licence: see [LICENSE](LICENSE).

An Afrikaans maths practice app for Grade 1 learners. It follows the DBE Rainbow Workbooks
*Wiskunde in Afrikaans, Graad 1*:

- **Boek 1**: Kwartaal 1 & 2, worksheets 1–64 (with 12a/b, 24a/b, 48a/b, 60a/b, 64a/b)
- **Boek 2**: Kwartaal 3 & 4, worksheets 65–128

Not affiliated with or endorsed by the Department of Basic Education.

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
- **Gemengde oefening** (mixed practice; called "Hersiening" before 1.12, renamed because several
  workbook worksheets are titled "Hersiening: …"): a mix of what the child already knows. It only uses worksheets played
  to the end with at least 2 stars (70% right on the first try), and those not played for a while
  come up more often. Worksheets with 1 star stay out; the parents' section lists them to play again.
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
  Netlify, Cloudflare Pages or Azure Static Web Apps. Open it once. On Android/Chrome the app shows
  its own **"Installeer die app?"** bar (`js/install.js`, using Chrome's `beforeinstallprompt`); on
  iPhone/iPad it explains Share → Add to Home Screen. The parents' section always has the steps.
  It installs like an app and works offline: `sw.js` caches everything.
- **Releasing:** bump `W.VERSION` in `js/util.js` and `CACHE` in `sw.js` together. The version is
  shown at the bottom of the first screens ("Weergawe 1.4") and in the parents' section, and sent
  with every note, so you know which build a note is about.
- **Back button** (phone or browser): stays in the app. It closes a lesson or pop-up, asks "Wil jy
  ophou?" during a worksheet, or goes one screen back (the same as the screen's ⬅ button). On the home
  screen it first says "Druk weer terug om die app toe te maak"; the second press leaves.
- **How phones get updates:** with internet, the app always loads the newest files. `sw.js` asks the
  server each time whether a file has changed, so it never uses an old copy from the browser's
  cache. Phones often keep the app open in the background for days, so `js/update.js` also checks
  when the app comes back to the front, and when the home screen is shown. If there is a newer
  version, it shows a bar: *"Nuwe weergawe … is gereed. Laai dit"*. It doesn't show while a child is
  busy with a worksheet. Offline, the phone keeps the version it has until it is online again.

Progress is stored in the browser's `localStorage` on that device only.

### Afrikaans voice

The app has its own recorded Afrikaans voice: **Adri**, a Microsoft Azure neural voice. Every
question works the same on any phone or browser, with no setup. Most phones have no Afrikaans
text-to-speech of their own.

- **Whole sentences** (since version 1.4): every sentence in Juffrou Padda's lessons that contains a
  number is recorded whole, for every number combination a lesson can produce. The same goes for
  the questions she reads aloud (`W.AF.sentences`). That gives a natural tone, with no break at each
  number. The lessons still use the question's own numbers; only the recording is done in advance.
- **Voice server** for sentences that aren't recorded in advance, such as the stories (word problems
  and shop sums): about 50,000 possible sentences, too many to record. The app asks the voice server
  (`server/`, see below) for the whole sentence, in the same voice. Online only; see below.
- **Pieces** as the fallback: spoken text is split into reusable sentences, names and numbers
  (`W.AF.segments`). Used offline, or when the voice server is slow or unavailable.
- **Better spellings and joins inside sentences**, chosen by ear:
  - `SAY` in `js/af.js` replaces a word by a spelling the voice says better, before recording or
    asking the server ("negentien" → "neëntien").
  - `JOIN` records the sentence twice, once with a head word and once with a tail word in its place,
    and joins them at the silent "t" ("dertien": the sentence with "dertig" up to the "t", then the
    sentence with "veertien"). `server/src/join.js` does this for both the recordings and the server,
    using Azure's word timings.
  - File names change automatically: the hash of the replaced text, and `RETAKE` for words that are
    joined. The server URL carries `W.AF.VOICE_V`, so phones fetch new server sentences too.
- **Joined numbers:** the voice says "dertien" and "negentien" badly on their own. So
  `tools/build-audio.js` builds them from two other recordings, joined at the silent "t"
  ("der" from *dertig* + "tien" from *veertien*; "neën" from *neëntien* + "tien" from *sewentien*,
  chosen by ear). See `SPLICE` there and `RETAKE` in `js/af.js`. A re-done clip must get a new file
  name (`RETAKE`), because phones keep clips in their cache for good.
- Each sentence or piece is recorded once as `audio/<hash>.mp3`, about 8,200 clips in all.
  `W.Voice` in `js/audio.js` plays the whole sentence if it exists, and the pieces otherwise.
- Clips download as they're needed and are kept on the phone for offline use. The parents' section
  also has a button to download the whole voice in one go.
- If a piece is missing (for example after new questions are added), the app uses the device's
  own Afrikaans voice if there is one. Otherwise that phrase is silent.

**Recording or updating the voice** (only new text is recorded; Azure's free F0 tier allows 500,000
characters a month, and the full set is about 255,000 characters, so even a full re-record fits in
one month):

```
cd tools
npm install
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southafricanorth node build-audio.js   # only records missing pieces
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southafricanorth node check-audio.js 50  # speech-to-text spot check
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southafricanorth node check-audio.js 40 --recent 3  # only clips from the last 3 hours
node check-audio.js --durations   # flags clips whose length doesn't fit their text
```

`node tests/smoke.js` warns if any spoken text has no recording. Never commit the key.

### Voice server (`server/`)

An Azure Function, `https://wiskunde-stem.azurewebsites.net/api/say?t=<sentence>`, in the resource
group `rg-wiskunde-stem` (the same subscription as the notes storage):

- The first time a sentence is asked for, it asks Azure Speech for it (free F0 resource
  `wiskunde-stem-f0`, same voice) and stores the mp3 in the private container `stem` of the storage
  account `wiskundenotas`. After that every phone gets the stored copy, and the service worker keeps
  it on the phone for good.
- **Only the app's own sentences:** every word must be on the approved word list in
  `server/config.json` (all words the app can say), or be a number word (built from number parts,
  so it works up to millions for later grades). Anything else gets 400. Requests from other websites
  get 403; CORS allows only `https://marthinusheyns.github.io`.
- **Speed:** the app prepares the next question while the child works on the current one, and asks
  the server for its sentences then. If a sentence isn't there within 1.5 s, the app uses the pieces.
- **Cost:** the F0 voice tier can't create charges; when its 500,000 characters a month run out, the
  server answers 503 and the app uses the pieces. The Function App runs on the consumption plan with a
  daily cap (`dailyMemoryTimeQuota` 5,000 GB-s, within the free allowance). No Application Insights.
- **Secrets** are app settings in Azure only (`SPEECH_KEY`, `SPEECH_REGION`, `STEM_URL`, `STEM_SAS`
  for the stored access policy `stem-rcw`, `TEL_URL`, `TEL_SAS` for `tel-ac`, `ALLOWED_ORIGINS`). Revoke the storage link by deleting
  that policy.
- **Privacy:** only the sentence text is sent (from the app's fixed word list), never anything about
  the child.

**Updating it** (after new texts, e.g. Grade 2, or a change to `SAY`):

```
node tools/build-audio.js        # updates tools/audio-pieces.json (needs the key, see above)
node tools/say-config.js         # writes server/config.json (word list + spellings)
cd server && npm install --omit=dev
# zip host.json, package.json, config.json, src/ and node_modules/, then:
az functionapp deployment source config-zip -g rg-wiskunde-stem -n wiskunde-stem --subscription "<subscription>" --src stem.zip
```

### Usage counts (no tracking)

The app reports how much it is used, without an ID, a name or anything else that could pick out a
device or a child (`js/stats.js`, server `server/src/tel.js`, endpoint `POST /api/tel` on the same
Function App). Each device says for itself whether something is a first, and the server only adds
up those numbers:

- **Visitors** (devices that opened the app): once a day a device sends "opened today", with flags for
  the first time this week, the first time this month and the first time ever, and whether the app is
  installed. The flags give unique devices per day, per week (ISO week) and per month.
- **Players** (devices that answered at least one question): the first question of the day, week and
  month on a device sets the same kind of flags.
- **Totals:** after each worksheet, and when the app goes to the background, the device sends how many
  questions, worksheets and lessons were done since its last report (only the difference), and how
  many child profiles did their first question that day. A question counts once, at its first answer.
- **Kept playing:** on the day a device reaches its 1st, 2nd, 3rd, 5th, 7th, 10th, 14th, 21st or 30th
  day of playing, it says so once, with the month of its first visit. So for each month you can see
  how many new visitors played on at least x days (the conversion from visiting to practising
  regularly). Devices that had already played before version 1.12 don't send this, so they don't
  skew it.
- Offline, the counts wait on the phone (at most 30 days) and go when the internet returns.
- Parents can switch it off in the parents' section ("Stuur anonieme getalle"). The app's privacy
  text says what is sent.
- The server checks every number (dates within the last 35 days, flags 0 or 1, only the listed days
  of playing), stores nothing about the request itself (no IP address), and appends one line per
  report to a file per day in the private container `tel` of `wiskundenotas`
  (`tel/2026-11-14.jsonl`). It writes with the stored access policy `tel-ac` (add and create only),
  kept in the app settings `TEL_URL` and `TEL_SAS`.
- **Read them:** `node tools/stats.js` shows visitors, new devices, players, children, questions,
  worksheets, lessons and installs per day (last 14), per week (last 8) and per month (last 6), and
  the "kept playing" table per month. `--days 60` for more days, `--json` for a spreadsheet or
  dashboard. It uses the same `tools/notes.local.json` as `tools/notes.js` and downloads to
  `../tel/`, outside the repo. Weekly, monthly and "kept playing" counts start at version 1.12.

### Notes from parents ("Help om die app te verbeter")

Parents and teachers can send a short note from the parents' section, or with the 💬 button on any
question. That button sends the worksheet and question with the note. The form asks them not to
include personal information, warns if the note looks like it contains an email address or phone
number, and never includes the child's name.

The form starts with **Ek is: Ouer / Onderwyser / Ander** (required) and an optional
**Verwysing**: initials or a code you give each teacher (e.g. `J1`, `J2`). Each note then records
`who` and `ref`, so you can read one teacher's notes together. The phone remembers both for the
next note.

- Each note is appended as one JSON line to a private file in Azure Storage: account `wiskundenotas`,
  container `notas`, one file per grade (`graad1.jsonl`; later `graad2.jsonl`, `graad3.jsonl`).
- The link in `js/notes.js` is public on purpose. It is a SAS link that can **only append** to that
  one file: it can't read, overwrite or delete anything. It uses the stored access policy
  `graad1-add` on the container and expires at the end of 2028.
  - **Revoke it:** delete or change that policy.
  - **New grade:** create an append blob plus a policy `graadN-add`. A container holds at most 5
    policies, so beyond that use a second container.
- CORS on the blob service allows only `https://marthinusheyns.github.io`, which covers every app
  under that address. CORS only limits browsers; the add-only link is what actually protects the
  data.
- Offline, notes wait on the phone (at most 20) and go when the internet returns.
- **Pick them up:** `node tools/notes.js` shows notes that are new since the last run (`--all`
  shows everything, `--since 2026-11-20` filters by date, `--who onderwyser` by sender type,
  `--ref J1` by reference), with a count per sender at the end. It downloads the files to `../notas/`,
  outside the repo, so they are never published. It needs the az CLI and a git-ignored
  `tools/notes.local.json` with `{ "subscription": "<name or id>" }`.

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
  js/install.js         "Installeer die app?" bar and install steps
  js/notes.js           "Help om die app te verbeter": note form (parent/teacher + reference), outbox, append to Azure
  js/update.js          "Nuwe weergawe is gereed" bar when a newer version is online
  js/stats.js           anonymous usage counts per day (no ID), sent to the server's /api/tel
  js/app.js             screens and the question player
  tests/smoke.js        generates ~100k questions and validates every one
  tests/gallery.html    one sample of every question type, for visual checks
  audio/                recorded voice clips + manifest.json
  server/               the Azure Function: src/say.js (voice), src/tel.js (usage counts), config.json (word list)
  tools/                build-audio.js (records the voice), check-audio.js (verifies it),
                        say-config.js (the voice server's word list),
                        notes.js (picks up parents' notes), stats.js (usage counts),
                        skillmap-doc.js (docs/SKILL-MAP.md)
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
- **Privacy:** there are no accounts, no ads and no tracking. Progress is stored only in the
  browser on each device. The app sends anonymous counts (that the app was used today, or for the
  first time this week or month; how many questions, worksheets and lessons were done; and on how
  many days it has been played), with no ID or name, and parents can switch that off (see "Usage
  counts" above). Besides that, only a note a parent or teacher chooses to send
  ("Help om die app te verbeter") leaves the phone. It contains the note,
  whether the sender is a parent or a teacher, an optional reference they type (initials or a
  code), the worksheet and question if sent from one, the app version and the kind of device
  (e.g. "Android 14 · Chrome 131"), but never the child's name.
- The voice is synthetic (Microsoft Azure neural TTS, voice "Adri"), and the app says so in the
  parents' section.
