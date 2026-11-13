# "Leer my / Wys my hoe": tutor design

Status: **Phase 1 built** (core number and operation skills, Grade 1). Awaiting teacher review of `SKILL-MAP.md`.
An independent review (November 2026) with bugs, ranked improvements, wording fixes and Phase 2
advice is in [`TUTOR-REVIEW-2026-11.md`](TUTOR-REVIEW-2026-11.md). Its mechanical bugs were fixed in
version 1.1. Improvements 2 to 4 (options, hints, learner model) and the star decision were done in 1.2;
improvement 1 (state the problem and show the number sentence) in 1.3.
The skill map and mistake catalogue for teacher review are in [`SKILL-MAP.md`](SKILL-MAP.md),
which is generated from the code by `node tools/skillmap-doc.js`.

## Idea

Every question type has a **critical path**: the small skills, in order, a child needs to answer
it. Together the paths form a **skill map** (each skill lists the skills it builds on). When a child
goes wrong, the tutor tries to find the lowest broken skill on that path, teaches it, and comes
back to the question.

## Decisions (agreed)

| Topic | Decision |
|---|---|
| Tutor type | Rule-based, written in advance. No live AI and no data leaves the phone. AI may help *write* content, and a teacher reviews it. |
| Character | **Juffrou Padda** 🐸 (the frog from the number lines), speaking with the recorded voice. |
| Stars | Asking for help never costs stars (confirmed 2026-11-13). A correct first attempt after "Wys my hoe" counts towards the stars and shows the orange "with help" dot. It doesn't count in the parents' skill percentages or as learner-model evidence. |
| Review | A teacher checks the skill map, the mistake list and the Afrikaans wording (`SKILL-MAP.md`). |
| Scope | Phase 1: core number and operation skills of Grade 1. The skill map is designed so Grade 2 attaches to it. |

## How the tutor finds the break

1. **The wrong answer itself.** Wrong options are no longer random: each one matches a known
   mistake. Example: 8 + 5 → 12 means "counted the start number again". A typed answer is
   interpreted the same way. One mistake gives the child a *specific* hint. Repeated mistakes
   show up in the parent report.
2. **Evidence over time.** Each small skill keeps its last 12 results, with at most one result
   per skill per question.
   - **Correct first try (without help):** counts for the target skill (the last on the path). A
     prerequisite counts only if the child could have made its mistake: the matching wrong answer
     was one of the options, or the answer was typed. Skills a question can't test stay grey.
   - **Recognised mistake:** counts against its own skill.
   - **Unrecognised wrong answer:** counts against the target skill.

   A skill turns *weak* (red) when, after at least 6 answers and 3 misses, fewer than 65% were
   right. It only stops being weak at 80%, so one good or bad moment doesn't make it flicker. In a
   simulation, a child who is right 90% of the time turns red in 48 answers only 10% of the time;
   a child at 65% or below almost always does.

   The **root gap** is a weak skill whose prerequisites are all fine, and which has been weak at
   the end of two worksheets in a row. That's where teaching should start. "Repeated mistakes"
   count only the last 14 days.
3. *(Phase 2)* **Probe questions down the path** ("Ons doen dit saam"): tiny questions, one per
   step, to find the first step that breaks when the wrong answer alone isn't conclusive.

## What the child sees

- **💡 Wys my hoe** on every question that has a lesson. Juffrou Padda shows a worked example
  on a *similar* question (so the answer isn't given away), then the child tries their own.
- **After a first wrong answer**, a short mistake hint (at most 8 words, e.g. "Moenie die eerste
  getal weer tel nie.") is followed by the question's own hint with its numbers. The hint bar
  stays until the voice is done. A tap hides it, and 🔊 repeats it.
- **Options** come from the mistake catalogue, but the answer's place by size is random. At most
  one option is a recognised mistake (two when there are four options); the rest are nearby
  values. So "always pick the biggest" doesn't work for plus.
- **After a second wrong answer**, the lesson plays on the actual question, starting with the
  recognised mistake ("Ek dink jy het die 8 twee keer getel…"). A similar question then comes
  back later in the session (already the case today).
- **🐸 Leer my** on the worksheet intro: a short lesson before starting.
- **Every lesson states the problem first.** Juffrou Padda reads the question aloud (for
  "Wys my hoe", the similar example, so the child knows which sum she is doing). The number
  sentence stays under the picture with a "?" ("8 + 5 = ?"), and on the last frame it is filled in
  and turns green ("8 + 5 = 13"). Where the question itself is a number sentence, the lesson uses
  the question's own notation ("2 plus 2 is ?" early in the year, "8 + 4 = ?" later). Frog and
  story sums are always written in words. On the number line she also says how many hops she will
  make ("Ons spring 5 keer vorentoe.").
- Lessons are short frame-by-frame sequences, with a picture plus one spoken sentence per
  frame. They follow the classroom methods: counting on with the number line, bonds with
  beads, making 10 with the ten-frame, counting in groups, sharing one by one, counting money by
  value. Order: concrete pictures, then the number sentence.

## What parents see

The parents' section gets **"Waar sukkel {naam}?"**:

- Root gaps ("Begin hier"), with the skills that depend on them.
- Mistakes seen more than once, in plain language, each with an activity to try at home.
- The skill map with a colour per skill: green (secure), orange (busy learning), red (weak),
  grey (not seen yet).

## Architecture

| File | Contains |
|---|---|
| `js/tutor-data.js` | `W.SKILLMAP` (skills + prerequisites), `W.MIS` (mistakes: skill, child hint, tutor intro, parent explanation, home tip), `W.Tutor.path(gen, q)` |
| `js/tutor-lessons.js` | `W.LESSONS[gen](q)` → frames `{ html, say }`. Pure functions using `js/visuals.js` (testable in Node) |
| `js/tutor.js` | Lesson player (Juffrou Padda overlay) and learner-model helpers (root gaps) |
| `js/gen-*.js` | Core generators add `q.data` (the numbers, for lessons) and `q.mis` (wrong answer → mistake id) |
| `js/store.js` | Per-skill evidence (`nodes`) and mistake counts (`mis`), stored on the device only |

Voice: lesson sentences and hints go through the same recording pipeline (`tools/build-audio.js`
collects them too). Numbers and names are separate clips, so lessons mostly reuse existing ones.

## Phases

1. **Phase 1 (now):** skill map (~28 skills); mistake-matched options for the core generators;
   "Wys my hoe" / "Leer my" lessons for ~27 core question types; parent report.
2. **Phase 2:** "Ons doen dit saam" probe steps to find the break inside one question; "Oefen jou
   swak plek" practice rounds built from root gaps.
3. **Phase 3:** lessons for shapes, measurement, time, data; Grade 2 skills attached to the same
   map (e.g. 2-digit addition builds on bonds of 10 and tens and ones).

## Measuring whether it helps

Per skill, compare first-try accuracy in the sessions before and after a lesson was shown. Store
it on the device and show it in the parents' section ("ná die les: 45% → 80%").
