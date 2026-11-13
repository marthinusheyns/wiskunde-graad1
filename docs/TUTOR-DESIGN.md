# "Leer my / Wys my hoe": tutor design

Status: **Phase 1 built** (core number and operation skills, Grade 1). Awaiting teacher review of `SKILL-MAP.md`.
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
| Stars | Asking for help is never punished. A question where "Wys my hoe" was used counts as "with help" (orange dot), like a second attempt today. |
| Review | A teacher checks the skill map, the mistake list and the Afrikaans wording (`SKILL-MAP.md`). |
| Scope | Phase 1: core number and operation skills of Grade 1. The skill map is designed so Grade 2 attaches to it. |

## How the tutor finds the break

1. **The wrong answer itself.** Wrong options are no longer random: each one matches a known
   mistake. Example: 8 + 5 → 12 means "counted the start number again". A typed answer is
   interpreted the same way. One mistake gives the child a *specific* hint. Repeated mistakes
   show up in the parent report.
2. **Evidence over time.** Each small skill on the path keeps a record: a correct first try counts
   for every skill on the path, and a recognised mistake counts against its own skill. A skill is
   *weak* when, over the last answers (at least 3), fewer than 70% were right. The **root gap** is
   a weak skill whose prerequisites are all fine. That's where teaching should start.
3. *(Phase 2)* **Probe questions down the path** ("Ons doen dit saam"): tiny questions, one per
   step, to find the first step that breaks when the wrong answer alone isn't conclusive.

## What the child sees

- **💡 Wys my hoe** on every question that has a lesson. Juffrou Padda shows a worked example
  on a *similar* question (so the answer isn't given away), then the child tries their own.
- **After a second wrong answer**, the lesson plays on the actual question, starting with the
  recognised mistake ("Ek dink jy het die 8 twee keer getel…"). A similar question then comes
  back later in the session (already the case today).
- **🐸 Leer my** on the worksheet intro: a short lesson before starting.
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
