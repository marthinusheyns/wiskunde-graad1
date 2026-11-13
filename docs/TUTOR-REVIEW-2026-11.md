# Juffrou Padda tutor review (November 2026)

An independent review of the tutor by Claude Fable 5.2 on 2026-11-13, against app version 1.0. Line
numbers refer to that version. **Status column:** what was fixed in versions 1.1 and 1.2.

**Done in 1.2:** improvements 2 (options), 3 (first-wrong hint) and 4 (learner model), as described
in [TUTOR-DESIGN.md](TUTOR-DESIGN.md). Two details differ from the suggestions here:
- The red threshold is 6 answers, 3 misses and below 65%, chosen by simulation.
- Choice answers aren't weighted lower than typed ones.

Still open: improvements 1 and 5 to 9, the wording table and Phase 2.

Reviewed: `js/tutor.js`, `js/tutor-data.js`, `js/tutor-lessons.js`, the tutor paths in `js/app.js`, `js/store.js`, `js/audio.js`, the core generators, and both design docs. Nothing under `app/` was changed.

How the evidence was gathered:

- `node tests/smoke.js` passes: 105,900 questions, 11,580 lessons, 0 missing voice clips.
- Throwaway sampling scripts generated 400 to 1,500 questions per worksheet exercise and measured options, mistake mappings, lesson length (using the real clip lengths in `audio/`) and the learner model.
- Three behaviours were confirmed in a real browser at 360 × 740 against a local copy of the app: bug 1, bug 4 and the number-line label sizes. The rest of the bugs come from reading the code and from the sampling.

All paths below are relative to `C:\Dev\Wiskunde\app`.

## Verdict

The structure is sound: lessons are short (median 10 to 17 seconds, worst case 28 seconds), they use the right classroom models, the voice coverage is complete, and the rule-based mistake idea is workable.

Four things currently stop it from teaching well:

1. **A child can get stuck.** Two wrong taps within 3.5 seconds hide the "Volgende" button for good (bug 1).
2. **The lessons never state the problem.** The sentence that sets up each lesson is replaced by the intro in every way the app starts a lesson, so a child hears "Ons begin by 3. vier, vyf" without being told the sum is 3 + 2 (bug 2).
3. **The options give the answer away by size.** After mistake distractors are injected, the right answer is the largest option in 99% of `add` choice questions, the smallest in 98% of `sub` and `bond`, and the middle one in 100% of `countInScene` and `frame`.
4. **The learner model is too jumpy for the parents' report.** One mistake in the first three observations turns a skill red, one question can count as a "repeated mistake", and several skills can never go red at all.

Fix those four before the families' test weeks produce data; none needs new recordings.

## Bugs

| # | Where | What happens | Fix | Status |
|---|---|---|---|---|
| 1 | `js/app.js:288` and `:271` | **Child is stuck.** The first wrong answer starts `timer = setTimeout(hideFeedback, 3500)`. If the second wrong answer comes inside 3.5 s, that timer still fires and slides away the reveal bar that holds "Volgende ➜". The question is locked, so the only way out is ✕ (losing the session). Confirmed in the browser: after closing the lesson, the button sat at y = 818 in a 740 px viewport. Affects every question type, not only those with lessons. | `clearTimeout(timer)` at the top of `result()` (or inside `feedback()`). | ✅ Fixed in 1.1 |
| 2 | `js/tutor-lessons.js:55, 63, 86, 102, 123, 135, 147, 177, 204, 230, 238` with `js/app.js:275-276, 494, 501` | **The first teaching sentence is never heard.** Every builder does `intro \|\| default`, and all three callers always pass an intro. So "Ons het 3. Ons wil 10 maak.", "Ons het 8. Ons vat 3 weg.", "Dubbel beteken twee keer dieselfde getal." and "Hier is een vol tienraam. Dit is 10." are dead text in the live app. Sampled "Wys my hoe" for `3 en ? is 10`: "Kyk hoe ek ’n soortgelyke een doen…" / "Ons sit een vir een by…" / "een … sewe" / "3 en 7 maak 10." The half lesson goes straight from the intro to "een, twee, drie". | Put the intro in its own first frame and keep the default frame after it. The defaults are already recorded. | ✅ Fixed in 1.1 (intro is its own first frame) |
| 3 | `js/app.js:489-492` | **"Similar question" check fails for fixed-prompt generators.** The loop needs a different answer *and* a different prompt. `frame`, `compareGroups`, `gridPattern` and `moneyTotal` have one prompt, so the loop never breaks and the 12th draw is used. The example then has the same answer as the child's question in 33% (`compareGroups`), 10% (`frame`), 9% (`moneyTotal`), 8% (`gridPattern`) and 11% (`missing`) of cases. Where the worksheet allows one value it is 100%: `matchGroup` on number sheets 9 onward, `repeatedAdd` on worksheet 57. | Compare `input.answer` and `JSON.stringify(data)` only. If no different question exists, widen the parameters by one step for the example. | ◐ 1.1: the example now always has a different answer; single-value worksheets still repeat |
| 4 | `js/audio.js:147-157` with `js/tutor.js:37-42` | **Lesson races when a clip can't load.** A failed fetch (offline, clip not yet cached) is skipped silently and the promise resolves in about 50 ms, so the frame auto-advances after about 0.5 s. Confirmed with audio fetches blocked: a 3.5 s intro sentence was on screen for 0.87 s. Children on prepaid data will hit this unless the parent used "Laai die stem af". | If any buffer is missing, wait `estimate(texts)` instead. Better: stop auto-advance for that frame and pulse "Volgende". | ✅ Fixed in 1.1 (missing clips still get speaking time) |
| 5 | `js/tutor.js:54` | **Tapping the picture skips the frame.** The counting lesson says "Ons raak aan elkeen net een keer", and a child who touches the objects to count along jumps ahead. Confirmed in the browser. | Remove the `.tvis` tap handler, or make a picture tap replay the frame. | ✅ Fixed in 1.1 (picture taps do nothing) |
| 6 | `js/app.js:264` with `js/tutor.js:96` | **One question can produce a "repeated mistake".** Where both distractors map to the same mistake (`count`, `frame`, `bond`, `double`, `half`, `share`, `between`, `tenAndMore`), two wrong taps record it twice. It then shows under "Foute wat herhaal" as 2× and puts two negatives on the skill. | Count a mistake id and a skill negative once per question (use `sess.misSeen`). | ✅ Fixed in 1.1 |
| 7 | `js/app.js:250-251`, `js/store.js:69-72` | **"Wys my hoe" does cost a star.** `first` is false after help, so `sess.ft` is not incremented. With the default 8 questions, 7/8 = 87.5% is below the 90% needed, so one tap on 💡 removes the third star. This contradicts the agreed "no star penalty". | Decide which is meant. If no penalty: count a helped, first-attempt-correct answer in `ft`, and keep the orange dot. | ✅ 1.2: help doesn't cost stars (user decision) |
| 8 | `js/tutor-data.js:93`, `:51`, `js/tutor-lessons.js:371-374` | **Intro doesn't match the lesson.** (a) `compareGroups` + `meer-minder` says "…op die getallelyn" over a picture of two groups in pairs. (b) `tel-glip` says "Kom ons tel saam, een vir een" before lessons that don't count (`compareGroups`, `double`, `tenAndMore`). (c) `telterug-begin` with more than 12 to take away (`moneyChange` R15 – R14, `moneySum`) says "Kom ons tel saam terug" and then shows one big jump. | (a) Reword (see wording table). (b) Use the default intro when the lesson isn't a counting lesson. (c) Give the fallback its own intro. | Open (needs recordings) |
| 9 | `js/tutor.js:96`, `js/store.js:57` | **Mistake counts never expire.** `mis[k].n >= 2` is a lifetime count; `last` is stored but unused. Two slips in term 1 stay in the report all year. | Only show mistakes with at least 2 occurrences in the last 14 days, or halve `n` monthly. | ✅ 1.2: only the last 14 days count |
| 10 | `js/app.js:252, 264, 268` | **Some answers leave no trace.** A wrong answer that isn't a known mistake, followed by a right one, records nothing on any skill. Neither does a helped answer. Skill accuracy is therefore higher than the "Vaardighede" table for the same child. | Record a negative on the target skill (last on the path) for any first-attempt miss. | ✅ 1.2: any first miss counts against the target skill |
| 11 | `js/tutor.js:61` | **Mashing "Volgende" closes the lesson.** The close button on the last frame is in the same place as "Volgende", so repeated taps skip the lesson in about a second. | Ignore taps on the last-frame button for the first 800 ms, or until the sentence ends. | ✅ Fixed in 1.1 (taps ignored briefly after each frame) |
| 12 | `js/app.js:193` | Low: tapping 💡 within 250 ms of a new question lets the queued `speakQ` cut the lesson's first sentence. | Skip `speakQ` if `.tutor-ov` exists. | ✅ Fixed in 1.1 |
| 13 | `js/app.js:611-618` | Low, desktop only: Enter advances the question underneath an open lesson, and the overlay stays up. | Ignore keys while `.tutor-ov` exists. | ✅ Fixed in 1.1 |
| 14 | `js/tutor-lessons.js:232` | "Die 1 in 11 staan vir een tien" is ambiguous for 11. | See wording table. | Open (needs recording) |

No bug was found in pause, resume, "Weer" or close-while-speaking: the `token` guard in `tutor.js:30-41` handles those correctly.

## Top improvements

Ranked by effect on children's learning. Effort: S is under half a day, M is one to two days, L is more.

### 1. State the example and show the number sentence

- **What:** Each lesson should open by saying and showing the problem, and end with the written number sentence on screen.
- **Why:** Bug 2 removes the set-up sentence. Separately, only `wordProblem` and `repeatedAdd` ever show a written sum; the other 27 lesson types are picture plus voice only. The design doc promises "concrete pictures, then the number sentence", but the abstract step is missing. For "Wys my hoe" the child is watching a *different* sum from the one on their screen and is never told which.
- **Fix:** Keep the intro as frame 0. Add a `<div class="steps">` line under the picture that builds up (`3 + 2 = ?`, then `3 + 2 = 5` on the last frame). In `hopLesson`, add "Ons spring 2 keer." after "Ons begin by 3."
- **Effort:** M.
- **Recordings:** None for the fix itself (defaults exist). "Ons spring … keer." is one new fragment pair.

### 2. Stop the options giving the answer away

- **What:** `enrich` fills options with the answer plus the top two mistakes, in fixed priority order (`js/tutor-data.js:356-360`).
- **Why:** The top mistakes all sit on one side of the answer. Measured share of choice questions where the answer is the extreme or middle option:

| Generator | Answer is largest | Answer is smallest | Answer is middle of 3 |
|---|---|---|---|
| `add` | 99% | 0% | 0% |
| `repeatedAdd` | 88% | 0% | 6% |
| `wordProblem` | 83% | 17% | 0% |
| `sub` | 0% | 98% | 0% |
| `bond` | 0% | 98% | 0% |
| `half` | 0% | 100% | 0% |
| `countInScene`, `frame` | 0% | 0% | 100% |
| `count` | 0% | 0% | 77% |

  Also, in 65% of `share` and 41% of `tenAndMore` choice questions the answer is the only option not spoken in the prompt ("Verdeel 6 lekkers … tussen 2 kinders": options 3, 6, 2). A child who learns "plus = pick the biggest" scores well and the model credits `telaan`.
- **Fix:** Use at most one or two mistake distractors, chosen at random from the candidates rather than always the first two. Always add one plausible neutral value on the other side of the answer (for `add`, s + 1 or s + 2). For counting, vary between {n–1, n, n+1}, {n, n+1, n+2} and {n–2, n–1, n}.
- **Effort:** S to M.
- **Recordings:** None.

### 3. Make the first-wrong hint usable

- **What:** After a recognised mistake, the generic `MIS.child` sentence replaces the question's own hint (`js/app.js:285`).
- **Why:**
  - The question hint is specific ("Begin by 8 en tel 5 verder."); the replacement is abstract and longer.
  - With "Amper! Probeer weer." in front, every one of the 23 mistake hints takes 4.8 to 8.4 seconds to say, but the banner hides after 3.5 seconds and there is no way to hear it again (🔊 replays only the question).
  - Some advice can't be followed on a phone: "skuif dit eenkant as jy dit getel het".
  - Some use fixed example numbers that don't match the question: "Dertien is een tien en drie ene" on a question about 17; "Drie groepe van twee…" on 4 groups of 5.
- **Fix:** Say a short mistake cue (one sentence, eight words or fewer) and then the question's own hint. Keep the banner until the speech promise resolves. Make 🔊 replay the hint while the banner is showing. Reword the cues as in the wording table.
- **Effort:** S.
- **Recordings:** Yes, for the reworded cues (about 10 sentences).

### 4. Make the learner model steady enough to show parents

- **What:** State is the last 12 observations, minimum 3, red below 70%, green at 85% (`js/tutor.js:73-77`).
- **Why:**
  - With three observations, one mistake is 67%, which is red. A simulated child who is right 90% of the time is red after three observations 27% of the time and red at some point in the first 24 observations 34% of the time. At 80% the state changes about 7 times in 48 observations.
  - Twelve observations is about one session for a skill such as `telaan`, so a single good or bad session flips the state completely.
  - A correct first try credits every skill on the path. `herken` and `w-altesaam` can never receive a negative (no mistake maps to them and they are never last on a path). `kyk` and `helfte` effectively can't either, because every distractor in `frame` and `half` maps to another skill (`tel`, `w-dubbel`). These always drift to green, which makes the root-gap rule ("no weak prerequisite") trust prerequisites that were never tested.
  - Bugs 6 and 10 distort the counts further.
- **Fix:**
  1. Require at least 5 observations and at least 2 misses from 2 different questions before red. Add hysteresis: leave red only at 80% or above.
  2. Credit a prerequisite only when the child had the chance to make its mistake and didn't (the mistake's value was among the options). Always credit the target skill. Show skills with no way to fail as grey ("nie getoets nie").
  3. In the report, show counts ("3 uit 5") next to the percentage, and only list a root gap once it has been red in two sessions.
  4. Count a 3-option choice at lower weight than a typed answer, since guessing gives 33%.
- **Effort:** M.
- **Recordings:** None.

### 5. Don't claim a diagnosis the answer can't support

- **What:** Several wrong values fit more than one misconception. `enrich` keeps the first candidate in list order (`js/tutor-data.js:345`).
- **Why (sampled across the curriculum):**

| Generator | Wrong value | Recorded as | Could equally be | How often |
|---|---|---|---|---|
| `add` | s – 1 | `telaan-begin` | `net-een` (the larger number), or a plain miscount | 61% of questions |
| `add3` | s – 1 | `telaan-begin` | `net-een` | 26% |
| `double` | n + 1 | `dubbel-woord` | miscount (2n – 1) | 29% |
| `half` | m | `helfte-woord` | miscount (n + 1) | 13% |
| `bond` | n | `bind-totaal` | miscount (ans + 1) | 12% |
| `bridge10` add | 10 + need | `brug-opbreek` | `telaan-begin` (s – 1) in 12%; also equals s + 1 for 8 + 3, 7 + 5, 6 + 7, 5 + 9 | 12% |

  Other unsound mappings:
  - `add` s – 1 is always "counted the start number", s + 1 is always "miscount". Both are off-by-one; the direction alone doesn't separate them.
  - `double` with the prompt "4 + 4 = ?" records `dubbel-woord` ("doesn't understand the word dubbel") although the word isn't in the question. Every wrong option in `double` and `half` blames the vocabulary skill, never `dubbel` or `helfte`.
  - `compareNumbers` with two numbers and `compareGroups`: every possible wrong answer is a named mistake, so a guess is recorded as `groot-klein` or `meer-minder`. In `compareGroups`, picking "minder" for "meer" may be confusion about which group is "tweede", not about the word.
  - `brug-opbreek` uses 10 + need. The more common bridging error is 10 + y (made ten, then added the whole second number: 8 + 5 → 15). That value isn't in the list.
  - `moreLess`: answering n itself is recorded as `ry-glip`.
- **Fix:** Give each candidate a confidence. When two candidates share a value, or when every option is a mistake, record a miss on the target skill only, give the question's own hint, and don't add to the parents' mistake list. Use the picture as context (all beads visible means a miscount is likelier than counting-on). Add 10 + y to `bridge10`. Only use `dubbel-woord` when the prompt contains the word.
- **Effort:** S to M.
- **Recordings:** None.

### 6. Change what happens on repeated failure

- **What:** After two wrong answers the lesson plays and the same question type with the same parameters is added to the end of the session, up to three times (`js/app.js:279-282`).
- **Why:** A second failure on the same type replays the same lesson shape. `forMistake` changes the lesson for only 2 of 23 mistakes (`js/tutor-lessons.js:365-375`); the other 21 get the standard lesson with a different first sentence. The design's "teach the lowest broken skill" isn't implemented. A failure on question 1 returns seven questions later; a failure on question 8 returns immediately.
- **Fix:** Re-ask two to three questions later. On the retry use easier numbers (lower `max`) with the picture. On a second failure of the same type, play the lesson for the previous skill on the path (for example `count` before `add`) rather than repeating. Never end a session on a failed item: add one easy success.
- **Effort:** M.
- **Recordings:** None.

### 7. Replace the lessons that only announce the answer

- **What and why:**
  - `moneySum` and `moneyChange` (`bigJumpLesson`, `js/tutor-lessons.js:74-83`): one arc and "R7 plus R5 is R12". No method is shown. On a 360 px phone the 0 to 20 number line scales to 0.46 and the labels are 6.9 px high (measured).
  - `placeValue` for "13 – 10 = ?": shows 10 and 3, then "Die antwoord is 3". The subtraction isn't modelled.
  - `frame` up to 10: counts dots one by one, although the skill (`kyk`) is seeing "5 and 2 more" without counting.
  - `hopLesson` labels are 9.6 px at 360 px.
- **Fix:** Money: count on in ones for small amounts, or make ten first, with coins. `placeValue`: cross out the full ten-frame. `frame`: "Die boonste ry is vol. Dit is 5. En nog 2. 5 en 2 is 7." Number lines: use a window of at most 10 ticks so labels stay at 14 px or more.
- **Effort:** M.
- **Recordings:** Yes, a few sentences.

### 8. Controls a non-reader can use

- **What works:** The lesson auto-plays; ↺, ⏸ and ✕ are icons; buttons are 52 px or taller.
- **What doesn't:**
  - The closing button text "Nou probeer jy!" is never spoken, although the clip exists (`AF.PHRASES.yourTurn`).
  - Nothing tells a non-reader what 💡 does.
  - Frames advance 450 ms after the sentence ends, which is little time to look at the picture.
  - The Android back button leaves the app while a lesson is open.
  - `enrich` now shuffles the word options of `compareGroups` (previously a fixed order), so a non-reader must re-listen every time.
- **Fix:** Speak "Nou probeer jy!" on the last "Wys my hoe" frame and pulse the button. After the first wrong answer, pulse 💡. Raise the gap to about 1,200 ms for non-counting frames. Push a history state when the overlay opens and close it on `popstate`. Keep word options in a fixed order.
- **Effort:** S.
- **Recordings:** None (optional: one sentence introducing 💡).

### 9. "Leer my" should cover the whole worksheet

- **What:** It plays one lesson for the first exercise that has one (`js/app.js:498-502`).
- **Why:** 67 of the 87 worksheets with a "Leer my" button contain more than one lesson type; the others are never taught up front.
- **Fix:** Play one short example per type in sequence, or choose the type whose target skill is weakest for this child.
- **Effort:** S.
- **Recordings:** None.

## Wording fixes

"Rec" says whether the change needs a new recording. Parent-only and screen-only text needs none.

| Where | Current | Replacement | Why | Rec |
|---|---|---|---|---|
| `js/af.js:131` | Kyk hoe ek ’n soortgelyke een doen. Dan probeer jy. | Kyk hoe ek ’n ander een doen. Dan probeer jy self. | "soortgelyke" is too formal for age 6 | Yes |
| `js/tutor-data.js:50` | Raak aan elkeen net een keer, en skuif dit eenkant as jy dit getel het. | Wys met jou vinger na elkeen. Tel elkeen net een keer. | Can't slide objects on the screen | Yes |
| `js/tutor-lessons.js:55` | Kom ons tel saam. Ons raak aan elkeen net een keer. | Kom ons tel saam. Ons tel elkeen net een keer. | Touching the picture is not wanted (bug 5) | Yes |
| `js/tutor-data.js:58` | …Kyk hoe spring die padda. | …Kyk hoe spring ek. | Juffrou Padda *is* the frog on the line | Yes |
| `js/tutor-data.js:170` | Kom ons loop saam met die padda op die getallelyn. | Kom ons spring saam op die getallelyn. | Same; and a frog jumps | Yes |
| `js/tutor-data.js:78` | Ons moet albei getalle bymekaar sit. | Ons moet albei getalle bymekaartel. | Classroom term for numbers | Yes |
| `js/tutor-data.js:93` | Kom ons kyk na die woorde meer en minder op die getallelyn. | Kom ons kyk wat meer en minder beteken. | Also used over a groups picture (bug 8) | Yes |
| `js/tutor-data.js:106` | Die 1 staan vir een tien. Dertien is een tien en drie ene. | Die eerste syfer wys die tien. Die tweede syfer wys die ene. | Fixed "dertien" is wrong for other numbers | Yes |
| `js/tutor-data.js:113` | Ons het reeds 10. Hoeveel is daar ná die 10? | Ons het klaar 10. Hoeveel is daar nog? | "reeds" is formal | Yes |
| `js/tutor-data.js:127` | Ons soek die deel wat nog ontbreek. Hoeveel moet ons nog bysit? | Ons soek die stukkie wat nog kort. Hoeveel moet ons nog bysit? | Simpler word | Yes |
| `js/tutor-data.js:148` | Drie groepe van twee beteken twee en twee en twee. Tel al die voorwerpe. | Kyk na die prentjie. Tel alles in al die groepe. | Fixed example; "voorwerpe" is teacher language | Yes |
| `js/tutor-data.js:155` | Tel al die voorwerpe, nie net die groepe nie. | Tel alles in die groepe, nie net die groepe nie. | "voorwerpe" | Yes |
| `js/tutor-data.js:156` | Kom ons tel elke groep se voorwerpe. | Kom ons tel wat in elke groep is. | "voorwerpe" | Yes |
| `js/tutor-data.js:176` | Ons tel die waarde wat op elke munt staan, nie hoeveel munte daar is nie. | Lees die getal op elke munt. Ons tel die getalle bymekaar, nie die munte nie. | "waarde" is abstract; 15 words in one sentence | Yes |
| `js/tutor-data.js:183` | R1 is soveel as 100 sent. | R1 is dieselfde as 100 sent. | Grammar; matches the generator hint | Yes |
| `js/tutor-data.js:204` | As jy iets koop, betaal jy geld uit. Jy het dan minder oor. | As jy iets koop, betaal jy daarvoor. Dan het jy minder geld oor. | "uitbetaal" means paying out wages | Yes |
| `js/tutor-lessons.js:337` | As ons iets koop, betaal ons geld uit. Dan het ons minder. | As ons iets koop, betaal ons daarvoor. Dan het ons minder geld. | Same | Yes |
| `js/tutor-lessons.js:136` | Die een vlerk het 4 kolle. | Die een vlerk het 4 kolletjies. | The rest of the app says "kolletjies" | Yes |
| `js/tutor-lessons.js:214` | Kyk na die een sonder ’n maat. | Kyk watter het nie ’n maat nie. | Wrong when more than one is unpaired | Yes |
| `js/tutor-lessons.js:214` | Die groepe het net soveel. | Die tweede groep het net soveel soos die eerste. | "net soveel" needs something to compare with | Yes |
| `js/tutor-lessons.js:232` | Die 1 in 13 staan vir een tien. | Die eerste syfer wys een tien. | Ambiguous for 11; avoids isolated "Die" / "in" clips | Yes |
| `js/tutor-lessons.js:253, 258` | Dit word meer, so ons tel op. / Dit word minder, so ons trek af. | Dit word meer. Ons tel op. / Dit word minder. Ons trek af. | "so" as a conjunction is an Anglicism | Yes |
| `js/tutor-lessons.js:274` | Kom ons tel net hierdie een, een vir een. | Kom ons tel net hierdie soort, een vir een. | "hierdie een, een vir een" is confusing | Yes |
| `js/tutor-lessons.js:238` | …en tel die waardes aan. | …en tel aan. | "waardes" | Yes |
| `js/tutor-lessons.js:198` | Die ontbrekende getal is 7. | Die getal wat ontbreek, is 7. | Matches the prompt "Watter getal ontbreek?" | Yes |
| `js/app.js:275` | Kom ons kyk saam hoe om dit te doen. | Kom ons kyk saam hoe ons dit doen. | More natural | Yes |
| `js/app.js:436` | Foute wat herhaal | Foute wat herhaal word | Grammar | No |
| `js/tutor-data.js:130` | Versteek ’n paar van 5 knope onder ’n koppie… | Steek ’n paar van 5 knope onder ’n koppie weg… | Idiom; the sentence ends "weggesteek" | No |
| `js/tutor-data.js:10` | Sien hoeveel in ’n tienraam | Sien hoeveel daar in ’n tienraam is | Grammar | No |
| `js/gen-ops.js:213` | …, so die antwoord is … | …, dus is die antwoord … | Anglicism | Yes |

Checked and found correct: ’n (typographic apostrophe throughout user-facing strings), diacritics (tweë, drieë, sê, ná, oë, voël, spieëlbeeld), plurals, and the classroom terms getallelyn, tienraam, tel aan, tel terug, getalbindings, tiene en ene, verdubbel, halveer, gelykop, kleingeld, altesaam.

For the teacher to confirm: "Brug oor 10 (maak eers 10)" as the skill name, and "Tel in sprongetjies".

## Phase 2 recommendations

### "Ons doen dit saam" probes

- **Build them from the existing lesson frames.** Add an optional `ask` to a frame: `{ html, say, ask: { options, answer, node } }`. The player waits for a tap instead of auto-advancing. No second content system is needed.
- **Three steps at most per question, one per skill on the path.** For 8 + 5: "Waar begin ons?" (tap 8 on the line), "Hoeveel keer spring ons?" (5), then the child taps each hop while the voice counts, then "Waar land ons?"
- **A wrong step is not an error.** No buzz sound and no orange dot. Juffrou Padda shows that one step straight away and carries on. Record a negative on that step's skill only, and a positive on the steps answered correctly. This gives the model independent evidence per skill, which removes the credit-all problem in improvement 4.
- **When to run a probe:** after a second wrong answer when the mistake was not recognised or was ambiguous (the table in improvement 5), and on a second failure of the same question type in one session (instead of replaying the lesson).
- **Keep the prompts free of numbers** ("Waar begin ons?", "Hoeveel keer spring ons?", "Tik op elke sprong.", "Waar land ons?", "Hoeveel is in elke groep?"). That is about 15 to 20 new clips for all question types.

### "Oefen jou swak plek"

- **Don't use that name with the child.** Suggest a frog button on the home screen, spoken: "Kom oefen saam met my." Keep "swak plek" for the parents' section.
- **Only offer it when the gap is stable:** red in two different sessions, with at least 5 observations (see improvement 4).
- **Round shape:** five questions on the root-gap skill. Start with the "Leer my" lesson. Questions 1 and 2 use the easiest parameters and a picture (take them from the earliest worksheet that uses the skill; `tools/skillmap-doc.js` already computes that list). Questions 3 to 5 drop the picture. One probe if a question is missed. End on a success.
- **Pick question types whose target skill (last on the path) is the root gap**, so the practice is on that skill and not on something built on top of it.
- **Tell the parent what happened:** "Het 2 keer geoefen: 2 uit 5, toe 4 uit 5."

### Spaced review

- Add a `ts` and a `box` to each skill in `store.recordNode` (nothing is timestamped today).
- Use five boxes with gaps of 1, 2, 4, 7 and 14 days. A correct first try moves the skill up one box; a miss sends it to box 1.
- Change "Hersiening" (`js/app.js:337-358`) to pick questions by skill due date rather than by worksheet stars. Keep about a third of the ten questions for the current worksheet's skills.
- Inside a session, bring a failed type back after two or three questions, and again the next day through box 1.

### Measuring whether lessons help

- **The design doc's before/after comparison will overstate the effect.** Lessons are shown after failures, and accuracy after a failure rises anyway.
- **Log one small record per lesson**, on the device: skill, mistake id, how it was started (💡, second wrong, "Leer my"), whether the last frame was reached, and the first-try result on the next question of that skill, both in the same session and in the next session.
- **Compare against lessons that were closed early.** Children who tap ✕ before the last frame form a natural comparison group for the same child and skill. Types without a lesson that are simply re-asked are a second comparison.
- **Show parents a figure only from 5 pairs upward**, and word it as counts: "Ná Juffrou Padda se les: 4 uit 5 reg. Sonder les: 2 uit 5."
- **For the test weeks:** nothing leaves the phone, so there is currently no way to learn from the families. An optional, parent-initiated "Deel verslag" button that builds a plain-text summary for the parent to send by WhatsApp would keep the privacy promise and give usable data. This is a decision for you, not a recommendation to change the constraint.
