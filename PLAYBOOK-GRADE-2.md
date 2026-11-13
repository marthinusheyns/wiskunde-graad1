# Playbook: adding Grade 2

This is how Grade 1 was built, written down so Grade 2 can be done the same way, with the
lessons learned along the way. It assumes the DBE Rainbow Workbooks *Wiskunde in Afrikaans,
Graad 2* (Book 1 = terms 1–2, Book 2 = terms 3–4), in the same format as Grade 1.

**Key decision: one app, several grades.** Add Grade 2 to this app instead of starting a new
one. Generators, visuals, voice clips, tests and tools are all reused, and families keep one link
and one installed app. **Do not rename the repo**: the GitHub Pages URL would change and
installed home-screen apps would break.

---

## 0. Before you start (checklist)

- [ ] Grade 2 PDFs (Book 1 and 2) in `C:\Dev\Wiskunde\` (outside `app/`, never committed)
- [ ] Node, Python with PyMuPDF (`fitz`), ffmpeg on PATH, `gh` signed in, `az` signed in
- [ ] `node tests/smoke.js` passes on the current Grade 1 app
- [ ] Azure Speech key available (step 7)

## 1. Extract the books

The PDFs contain real text (not scans), so plain extraction works.

1. Dump text per page with PyMuPDF. Then make a **cleaned** version that drops lines made up only
   of numbers or symbols, plus repeated noise ("Onderwyser-handtekening", "Datum:"). For Grade 1
   this brought ~95k characters down to ~73k of readable instructions. Keep scripts in a scratch
   folder, not in the repo.
2. **Table of contents** (pages 2–3 of each book): worksheet number → title → page ("Bl.").
3. **Term boundaries**: search for the first page with "Kwartaal 2" / "Kwartaal 4". Grade 1 had 32
   worksheets per term (K1 = 1–32, K2 = 33–64, K3 = 65–96, K4 = 97–128). Check, don't assume.
4. **Split worksheets** (e.g. 12a/12b): Grade 1 Book 1 had five (12, 24, 48, 60, 64), which shifts
   page numbers. See the `bl` formula at the bottom of `js/curriculum.js`. Book 2 had none
   (`bl = 2 × (n − 64)`). Verify the formula against several TOC entries.
5. Render 3–5 pages to PNG at ~45 dpi and look at them. This shows the visual language: beads,
   number lines, 100-charts, coins, clocks, cut-out pages.
6. Note the pages at the back of each book (cut-outs, number cards, dice) and the "Hersiening"
   (revision) worksheets.

## 2. Map every worksheet to skills

Read the cleaned text worksheet by worksheet and write one line each: title → skills → number
range → typical instructions. Then do a **gap analysis** against the existing generators (`js/gen-*.js`,
71 of them; open `tests/gallery.html` to see them all).

Expected Grade 2 (CAPS) content, and what the app probably needs:

| Topic | Reuse | Likely new |
|---|---|---|
| Counting and number names up to 200 | `count`, `numWord`, `missing`, `gridPattern`, `order`, `moreLess` | extend `numWord` above 100 (spelling below), 100-chart for 101–200 |
| Place value (tens and units, maybe hundreds) | `placeValue`, `tenAndMore` | base-ten blocks visual (rods/units), "hoeveel tiene en ene" |
| Addition/subtraction up to 99 | `add`, `sub`, `bond`, `bridge10`, `wordProblem`, `countOn` | jumps of 10 on number lines, breaking down (bv. 34 + 25 = 30 + 20 + 4 + 5) |
| Multiplication (×2, ×3, ×4, ×5, ×10) | `groups`, `repeatedAdd`, `hops`, `gridPattern` | `×` sentences ("3 × 4 = ?", "maal"), arrays (rows × columns) |
| Division (sharing and grouping) | `share`, `groups` (rem) | `÷` sentences ("gedeel deur") |
| Fractions (halves, quarters, thirds, fifths) | `half` | shaded-shape fractions, fraction of a set |
| Money (R and c up to R99/99c) | all `money*` | bigger amounts, mixed rand + cents |
| Time: analogue clock (hour, half hour, quarter) | `daysMonths`, `sequence` | **clock face SVG + Afrikaans time phrases** (pitfall below) |
| Length/mass/capacity (still informal) | `measure`, `mass`, `capacity`, `holdsMost` | probably just bigger ranges |
| 2D/3D shapes, symmetry, position, views | `shape*`, `solid3D`, `symmetry*`, `position*` | maybe cylinder ("silinder"), more 3D names |
| Data: pictographs, bar graphs | `pictograph` | bar graph visual |
| Patterns, odd/even, doubling/halving | `pattern`, `oddEven`, `double`, `half`, `nearDouble` | bigger ranges |

**Take spelling and terms from the workbook itself**, and list any word you're unsure of for a
teacher to check. Known pitfalls:

- **Telling time in Afrikaans**: 2:30 is **"halfdrie"** (half *to* three, not half two). 2:15 is
  "kwart oor twee", 2:45 is "kwart voor drie", 2:00 is "twee-uur". Easy to get wrong; test it
  explicitly.
- **Number words above 100**: check the workbook's form (e.g. "honderd-en-een",
  "honderd vyf-en-twintig") before extending `numWord` in `js/af.js`. Below 100 it already
  produces "een-en-twintig".
- Plurals: every noun needs singular and plural (`THINGS` in `af.js`). Grade 1 had a "Kleur 1
  sirkels in" bug; always handle n = 1.
- Word problems repeat the name instead of using "hy/sy". This avoids guessing gender and keeps
  voice clips reusable.

## 3. Make the engine multi-grade (one-off refactor)

1. Split `js/curriculum.js` into `curriculum-g1.js` and `curriculum-g2.js`, each registering
   `W.CURRICULA[grade] = [...]`. Keep the row format:
   `['45', 'Titel', [['generator', {params}], ...]]`.
2. **IDs**: keep Grade 1 IDs exactly as they are ('1' … '128', '12a'), or existing children lose
   their stars. Give Grade 2 a prefix internally ('g2-45') but display '45'.
3. **Profiles get a `grade` field** (default 1 for existing profiles). Home, book screens,
   "Speel volgende" and review use the profile's grade. The parents' section can change the grade.
4. App name: "Wiskunde Graad 1" becomes "Wiskunde" plus a grade chip (`index.html` title,
   `manifest.webmanifest`, logo). Keep the URL.
5. `W.SKILLS`: add new skill names (e.g. `maal: 'Maal'`, `deel: 'Deel'`, `breuke: 'Breuke'`,
   `tyd` already exists).
6. Update `tests/smoke.js` and `tools/build-audio.js` to loop over all grades' curricula.

## 4. Write the generators and curriculum

- A generator returns `{ skill, prompt, say?, visual, input, hint, explain }`. Input kinds:
  `choice` (layouts `nums`, `big`, `words`, `pics`, `stack`), `number` (keypad, optional
  `prefix: 'R'`), `order`, `colour`, `trace`. Copy an existing generator as a template.
- Visuals are **pure functions returning SVG/HTML strings** (`js/visuals.js`), so generators run in
  Node tests. Give every SVG its natural `width`/`height` (the `svg()` helper does this). A CSS
  width on an SVG without a width attribute caused empty or huge pictures in Grade 1.
- Keep visual distractors clearly different. Grade 1 review found: pink vs red, yellow vs orange,
  look-alike face emoji (baby/child/adult), rotated squares that look like diamonds, tiny emoji
  (🏁). Avoid emoji newer than about Unicode 12, since older Android phones show boxes.
- **Helper sheets**: Grade 1 used `numberSheet(n)` and `teenSheet(n)` for the "Getal N"
  worksheets. Do the same for any repeated worksheet shape in Grade 2.
- Every curriculum row needs 2–6 generators. A session draws 8 questions round-robin, so each
  generator appears at least once.

### Tutor (Juffrou Padda) for Grade 2

- Add the Grade 2 skills to `W.SKILLMAP` in `js/tutor-data.js` and **link them to the Grade 1
  skills** (e.g. 2-digit addition builds on `bind10` and `tiene`). A Grade 2 child stuck on
  34 + 25 is then sent back to the right Grade 1 skill.
- For each new generator: add `data` (its numbers), a `W.Tutor.path` entry, mistake candidates
  (wrong answer → mistake id), and a lesson in `js/tutor-lessons.js` if it's a core skill.
- Regenerate `docs/SKILL-MAP.md` (`node tools/skillmap-doc.js`) and have a teacher review it.

## 5. Quality loop (what caught real bugs in Grade 1)

1. `node tests/smoke.js` checks thousands of questions per worksheet: the answer is among the
   options, no duplicate options or labels, no `undefined`/`NaN`, a valid skill, and voice
   coverage. It caught a duplicate vehicle and a coin-change crash.
2. **Visual review** with `tests/gallery.html?g=gen1,gen2` (one sample per generator, correct answer
   highlighted): take full-page screenshots in batches of ~8 generators and look at every one.
   **Serve with a no-cache server**. Python's `http.server` let the browser keep old CSS/JS and
   hid fixes.
3. **Real play-through** in the browser: `W.App.session()` exposes the current question. Pick a
   greedy set of worksheets that covers every generator (Grade 1 needed 39). Auto-answer them,
   including deliberate wrong answers (hint → reveal → retry question), and speed up timers by
   patching `setTimeout`. Expect zero console errors.
4. Check at 390 px wide (phone) and ~820 px (tablet).
5. Have a teacher or fluent speaker read the Afrikaans (prompts, hints, explanations). Use the
   gallery page for this.

## 6. Afrikaans voice (recorded clips)

How it works: `W.AF.segments(text)` splits spoken text into pieces (sentences, names, numbers,
money). Each piece is recorded once as `audio/<fnv-hash>.mp3`. The app plays the pieces back to
back (`W.Voice`). Grade 1 used **~2,100 clips and ~53,000 characters**.

- **Design for reuse**: put variables (numbers, names, amounts) in their own spot in a sentence
  instead of inside long, unique sentences. After a generator change, `build-audio.js` prints
  "Stukkies: N (ná X rondtes)". If N grows into many thousands, a template is too variable.
- Only **new** pieces get recorded; Grade 1 clips are reused automatically.
- Lessons learned: Azure's `<bookmark>` offsets land *before* the previous word finishes, so the
  tool cuts in the middle of the silent `<break>` (`findCut`) instead. Check new recordings with
  `check-audio.js`: a speech-to-text round trip should pass ≥ 90% (isolated single number words
  often fail speech-to-text even when they sound fine).

## 7. Azure (cost: free)

- Resource: Speech, **F0 (free) tier**, resource group `rg-wiskunde-tts`, name `wiskunde-tts-f0`,
  region `southafricanorth`. F0 can't be billed. It allows 500,000 characters a month and
  20 requests a minute (the tool already waits between requests).
- Key (never commit it; pass it as environment variables only):
  ```
  az cognitiveservices account keys list -n wiskunde-tts-f0 -g rg-wiskunde-tts --query key1 -o tsv
  ```
- Voice: `af-ZA-AdriNeural` (female). `af-ZA-WillemNeural` (male) also exists. Don't mix voices
  across grades.
- If the resource was deleted, recreate it:
  `az cognitiveservices account create -n wiskunde-tts-f0 -g rg-wiskunde-tts --kind SpeechServices --sku F0 -l southafricanorth --yes`

```
cd tools && npm install
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southafricanorth node build-audio.js
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southafricanorth node check-audio.js 60
cd .. && node tests/smoke.js        # "Stem: ... 0 ontbreek"
```

## 8. Release

1. Bump `CACHE` in `sw.js` (e.g. `wiskunde-gr1-v2` → `wiskunde-v3`) so phones pick up the new
   files. Don't rename the `AUDIO` cache; clips are immutable.
2. `node tests/smoke.js` must pass with 0 missing voice pieces.
3. Commit and push to `main` (repo `marthinusheyns/wiskunde-graad1`). GitHub Pages rebuilds in
   about a minute.
4. Check the live site: no console errors, service worker active, `audio/manifest.json` loads,
   and a Grade 2 worksheet plays with voice.
5. On an Android phone: open the link in Chrome, play a worksheet, and test the voice in the
   parents' section. An installed app updates when it's closed and reopened.

## 9. Definition of done

- [ ] Every Grade 2 worksheet (including a/b splits) is in the curriculum, with title and page
      matching the book
- [ ] Every new generator appears in `tests/gallery.html` and has been looked at
- [ ] Smoke test passes, voice coverage 100%
- [ ] Auto-play covering every generator: no errors
- [ ] Afrikaans checked by a teacher or fluent speaker (time phrases, numbers above 100,
      fractions)
- [ ] Grade 1 progress on an existing device is unaffected (open an old profile and check stars)
- [ ] Disclaimer and privacy text still shown (welcome screen and parents' section)
- [ ] Live on GitHub Pages and tested on a phone
