<!-- Lilystack. Rewritten from gstack plan-design-review/sections/review-sections.md.tmpl, the generated plan-design-review/sections/review-sections.md, plan-design-review/sections/checklist.md.tmpl and scripts/resolvers/design-craft.ts at 466689b (MIT, Copyright (c) 2026 Garry Tan); and anthropics-skills skills/frontend-design/SKILL.md at ca45fc4 (Apache-2.0, Copyright 2026 Anthropic, PBC; changed); the Persuade checks derive from Elaya ai-design-skills and redesign-skill (MIT, Copyright (c) 2026 Elaya), as gstack's NOTICE records. -->

# The seven passes

Run them in order. Never condense or skip one. Each of Passes 1 to 6 starts
with its score and ends with its new score and the reason that it moved.
Each FIX TO 10 is a proposal: ask, wait for the answer, then write the
accepted fix into the block. Never write first and ask after. A faithful
copy of an accepted or existing contract (a diagram of a layout that does
not change) is evidence, not a new choice: record it without a question.

## Pass 1: Information architecture

Rate 0-10: does the plan say what the user sees first, second and third on
each screen?

FIX TO 10: a hierarchy for each screen, and an ASCII diagram of the screen
structure and the navigation flow:

```
SCREEN        FIRST           SECOND          THIRD
<name>        <element>       <element>       <element>

<screen> --(<action>)--> <screen> --(<action>)--> <screen>
```

Apply constraint worship: if the screen can show only three things, which
three? Each screen passes the trunk test: where am I, what is here, what can
I do, how do I get back.

**A Persuade surface** also settles these five checks, or each gap is a
Pass 1 finding. Ask the owner for missing proof and risk terms; never invent
them.

1. **One primary action**, by name. Nothing competes with it in the first
   viewport, and the closing call to action repeats it.
2. **Named objections**: the visitor's top objections, each answered where
   it comes up (a FAQ of real questions, a comparison, a guarantee).
3. **Proof beside each claim**: a customer, a quote or a figure that the
   owner supplied, next to the claim that it supports; never a row of
   metrics. An unsupported claim is cut, or marked `[Needs proof: ...]`.
4. **A risk reversal** that the business really offers (a free plan, a
   trial, no card, cancel at any time, a refund); never an invented one.
5. **Index or noindex**: an ad-only or time-bound page is `noindex`. An
   indexed page has a real title and description, and its FAQ ships as
   FAQPage JSON-LD.

## Pass 2: Interaction state coverage

Rate 0-10: does the plan specify the loading, empty, error, success and
partial states?

FIX TO 10: a state table in the block:

```
FEATURE            | LOADING | EMPTY  | ERROR  | SUCCESS | PARTIAL
-------------------|---------|--------|--------|---------|--------
<each UI feature>  | <spec>  | <spec> | <spec> | <spec>  | <spec>
```

Each cell says what the user sees, not what the backend does.

- An empty state is a feature: warmth, a primary action, context. An empty
  screen is an invitation to act.
- An error says what went wrong and how to fix it, in the voice of the
  interface. It does not apologize, and it is never vague about what
  happened.
- Cover the edge cases of principle 4: long names, zero and many results,
  the first visit and the thousandth.

## Pass 3: User journey and emotional arc

Rate 0-10: does the plan consider what the user feels at each step?

FIX TO 10: the journey as a storyboard in the block. Write it from the
accepted journey; do not ask whether to make it:

```
STEP | USER DOES          | USER FEELS        | PLAN SPECIFIES?
-----|--------------------|-------------------|--------------------
1    | <lands on ...>     | <which emotion?>  | <what supports it?>
```

Design for three time spans: the first 5 seconds (visceral), the first
5 minutes (behaviour), the next 5 years (reflection). An action keeps one
name through the whole flow: the "Publish" button gives a "Published"
message.

## Pass 4: AI-slop risk

Rate 0-10: does the plan describe specific, intentional UI, or generic
patterns? Read `sections/slop-rules.md` in this skill's directory, and apply
it to the plan text, the design that it names and each screen seen in the
audit. Record each Floor, Reflex and Finish hit with its evidence, and each
litmus answer (YES or NO, with evidence). An open Floor item or an unwaived
Reflex item keeps this pass at 7 or less. Litmus answers support findings;
they are not a score.

What a 10 has: a stated token system, no default look that the brief did
not ask for, and one deliberate risk that the plan spends its boldness on.
Each default look that the plan falls into lowers the score.

FIX TO 10: replace vague UI words with decisions.

- "Cards with icons": what makes these different from every SaaS template?
- "Hero section": what makes this hero belong to this product?
- "Clean, modern UI": this says nothing. Replace it with real decisions.
- "Dashboard with widgets": what makes this not every other dashboard?
- "Trusted by thousands", "99.9% uptime": on a Persuade surface, proof that
  the owner supplied, beside the claim (Pass 1, check 3), or no claim.

## Pass 5: Design system alignment

Rate 0-10: does the plan align with DESIGN.md?

**With DESIGN.md**: annotate the UI of the plan with its tokens and
components. When DESIGN.md has YAML front matter, cite each token by its
path (`{colors.primary}`, `{rounded.md}`), so that the plan and the file
share one vocabulary. Flag each new component: does it fit the existing
vocabulary?

**Without DESIGN.md**: rate the plan's own token block. A missing
specification is a finding; never assume alignment. A 10 has this compact
block:

- **Color**: the base palette as 4 to 6 named hex values.
- **Type**: the typefaces and their roles.
- **Layout**: the layout concept in one sentence, an ASCII wireframe, and
  the alignment (left, centred or justified).
- **Principles**: what makes the screens of this product its own.

Then test the block against the brief. Work through a similar brief in your
head: a part where you arrive at the same answer is a default, not a choice,
and it is a Pass 4 finding. Recommend that the owner starts DESIGN.md from
the accepted block.

Before you offer a token fix, find out whether an earlier pass approved that
outcome. If it did, apply it everywhere that it reaches. A new place for the
same fix is not a new issue.

## Pass 6: Responsive and accessibility

Rate 0-10: does the plan specify the phone and tablet layouts, keyboard
navigation and screen readers?

FIX TO 10: a layout for each viewport, with the real changes, not "stacked
on mobile": what moves, what hides, what changes form, where the thumb
reaches. For accessibility: the keyboard path and the focus order, ARIA
landmarks, touch targets of 44px or more, and contrast. The access items of
the Floor in `sections/slop-rules.md` belong to this pass. An open one keeps
this pass at 7 or less.

## Pass 7: Unresolved design decisions

No score. Start from the open choices of Passes 1 to 6. For each new item,
cite a real in-scope element and the missing decision, in the plan, the
code, DESIGN.md or a screen that you saw.

- A page name does not prove that a control exists. When you cannot tell,
  keep the item conditional and say what must be checked.
- Do not invent controls. Do not reopen an accepted treatment for an element
  that may not exist. An approval for one element does not settle another.
- A choice of implementation detail does not reopen an accepted outcome for
  the user. Ask only when a real constraint shows a new requirement.

```
DECISION NEEDED                   | IF DEFERRED, WHAT HAPPENS
----------------------------------|------------------------------------
What does the empty state show?   | The engineer ships "No items found."
Phone navigation pattern?         | The desktop nav hides behind a menu icon
```

One question for each decision, with a recommendation, the reason and the
alternatives. Write each answer into the block when it arrives. An
unanswered one goes to Unresolved decisions.

# The block

Write these parts, in this order, between the markers.

- **Scores**: Step 0, and each of Passes 1 to 6 before and after.
- **Decision ledger**: id, pass, class (Mechanical, Taste, User Challenge),
  question, answer.
- **Accepted design decisions**, by pass: the hierarchy and navigation
  diagram, the state table, the storyboard, the token annotations or the
  token block, the viewport and accessibility spec, and each Pass 7 answer.
  Only answers that the owner gave. A pending fix stays in Unresolved
  decisions.
- **Floor, waivers and finish notes**: each Floor item that applies, with
  its status (met, fixed, open); each Reflex waiver, with the item and the
  owner's reason; each Finish note.
- **NOT in scope**: the design decisions that were considered and deferred,
  with one line of reason each.
- **What already exists**: DESIGN.md, and the patterns and components that
  the plan reuses (`file:line`).
- **Deferred design work** (missing accessibility, open responsive
  behaviour, deferred empty states): for each, what, why, pros, cons, the
  context for someone who picks it up in three months, what it depends on,
  and the observation that would reopen it.
- **Tasks**: the build and check work that each accepted decision adds, one
  line each, with its decision id and how to check it (a test, or a look at
  the screen). Invent no task for a finding that has none.
- **Unresolved decisions**: each finding not yet asked, each unanswered
  question, each open Floor item. Never default one silently.
- **Completion summary**:

```
DESIGN REVIEW: COMPLETION SUMMARY
Audit                 DESIGN.md <yes | no>; UI <screens>; seen <yes | no>
Step 0                <n>/10; modes <list>; focus <areas | all>
1 Information arch    <n>/10 -> <n>/10
2 States              <n>/10 -> <n>/10
3 Journey             <n>/10 -> <n>/10
4 Slop risk           <n>/10 -> <n>/10; Floor <n> open, Reflex <n> waived
5 Design system       <n>/10 -> <n>/10
6 Responsive, a11y    <n>/10 -> <n>/10
7 Decisions           <n> resolved, <n> deferred
NOT in scope          <n> items
What already exists   written
Decisions made        <n> added to the plan
Unresolved decisions  <n>
Overall               <n>/10 -> <n>/10
```

Overall is the lowest of the six pass scores, before and after the fixes.
Step 0 keeps its own row. Count in "Decisions made" only the answers that
the owner gave to a fix; a focus or next-step answer counts zero.
