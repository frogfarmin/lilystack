<!-- Lilystack. Rewritten from anthropics-skills skills/frontend-design/SKILL.md at ca45fc4 (Apache-2.0, Copyright 2026 Anthropic, PBC; changed); and hallmark skills/hallmark/SKILL.md at 407fa68 (MIT, Copyright (c) 2026 Hallmark contributors). -->

# The build rules

Read this before the first line of style, together with `floor.md` in this
skill's directory. The plan in chat comes first; these rules carry it out.

## Open with the subject

On a page, the first screen opens with the most characteristic thing in the
subject's world. Give it its best form: a headline, an image, a live demo or
an interactive moment. A big number with a small label, supporting stats and
a gradient accent is the default hero. Use it only when it is truly the best
choice.

- The hero holds a headline of seven words or fewer, one sentence of twelve
  words or fewer, and one or two actions.
- Build the sections from what real sites of this kind contain: the menu,
  the line-up, the issues, the record. Do not build them from the default
  run of a feature grid, three steps and an email band.
- Fullness comes from scale and pictures, not from more words.

On an app screen, the work comes first: the data, the controls and their
states. There is no hero. A component fits the screen that it goes in.

## Type

- Use one family or two. If two, make them clearly different.
- Choose each face for this brief, not the family that you use on any
  project. Name its source, and give a fallback stack in the token.
- Set a clear scale with deliberate weights, widths and spacing, as *The
  Elements of Typographic Style* teaches.
- In a headline, the type is an active part of the design, not only a
  carrier for the words. A heading has one weight and one colour.
- Keep lines of running text under 80 characters (about `65ch`). Give serif
  body text a little more line height than sans-serif body text.
- Body text is 16px or more.
- Labels, captions and table heads use the body face, one step smaller, in
  sentence case. Use mono only for code, figures and measurements, or when
  mono is the material of the design.

## Structure is information

A border, a rule, a number, a label or a divider tells something about the
content. It is not decoration.

- Use numbered markers (01, 02, 03) only when the content is a sequence,
  such as steps or a timeline.
- Keep one primary button style and one container width.
- Keep one column gap below the hero, and one radius for each level of
  nesting.

## Motion

Motion that the person did not start is rare. It has one purpose: to draw
attention.

- One orchestrated moment (one load sequence or one reveal) is better than
  scattered effects.
- A fade-and-slide-up on each section and a hover transition on each card
  are the default. They read as AI-made.
- Motion that answers an action (open, expand, confirm) is good when it
  shows what changed.
- Animate only `transform` and `opacity`. Content is visible before any
  reveal runs.

## Pictures

Show the thing; do not describe it. Use the owner's pictures, screenshots of
the real product, or the product itself built in the page.

- A picture that nobody gave is a slot: an element at its real size, marked
  with what belongs there. The owner's file replaces it later.
- Never hotlink a stock image or a URL that you guessed.

## Restraint

Spend your boldness in one place: the signature. Keep all the rest quiet and
disciplined. Cut each decoration that does not serve the brief.

## Words

Words are in an interface for one reason: to make it easier to understand
and use.

- Before you write, decide what the screen must say.
- Write from the user's side, in plain words. A user manages notifications,
  not webhook config.
- Say what a thing is or does; do not sell it. Specific is better than
  clever.
- Use the active voice. A button says what happens: "Save changes", not
  "Submit".
- An action keeps one name through the flow. The "Publish" button gives a
  "Published" toast.
- An error says what went wrong and how to fix it, in the voice of the
  interface. It does not apologize, and it is never vague.
- An empty screen tells the person what to do first.
- Use sentence case, plain verbs and no filler. Each piece of text does one
  job.
- The owner's own copy stays word for word. With no copy in the brief, write
  copy for this subject. Never lorem ipsum, and never an invented fact.

## CSS

Watch the selector specificity. It is easy to write classes that cancel each
other. For example, a section class (`.section`) and a component class
(`.cta`) can both set the space between sections. Give each space one owner.
In an existing stylesheet, add rules. Do not rewrite rules that other parts
use.
