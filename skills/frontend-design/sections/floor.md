<!-- Lilystack. Rewritten from hallmark skills/hallmark/SKILL.md at 407fa68 (MIT, Copyright (c) 2026 Hallmark contributors); and anthropics-skills skills/frontend-design/SKILL.md at ca45fc4 (Apache-2.0, Copyright 2026 Anthropic, PBC; changed). -->

# The floor, the reflexes and the finish

Each item has a tier. The tier tells what you may do when the build breaks
the item.

| Tier | When the build breaks it |
|---|---|
| Floor | It fails. Fix it before you hand the build back. You cannot waive it |
| Reflex | It is a default that a model falls into. Fix it, or waive it with a reason about this page. The report lists each waiver |
| Finish | It is craft detail. Answer it: fixed, or why not. It never blocks |

The owner's words beat all three tiers. When the brief asks for an item,
build it and list it as "by request". An invented fact stays marked as a
placeholder.

A waiver reason names something in this page, for example "the terminal is
the product, so mono is its material". "It looks good" and "it fits the
style" are not reasons. If you cannot state the reason, fix the item.

## Floor

Correctness, access and honesty. The floor applies to each component,
screen and page.

1. **Tokens.** Each colour and each font family comes from a token. A token
   is a custom property in `:root` or in a theme block (a
   `prefers-color-scheme` media block, or `[data-theme]`). The project's own
   token system counts too. No literal colour and no `font-family` value
   after the token block.
2. **Colour scheme.** Declare `color-scheme` in `:root`. A dark theme
   redefines the same tokens. No component carries its own dark colours.
3. **Transitions.** Never `transition: all`. Never animate `width`,
   `height`, `top` or `left`. Animate `transform` and `opacity`.
4. **Reduced motion.** Each animation and each moving transition has a
   `prefers-reduced-motion: reduce` fallback. Content is visible with
   scripting off: a reveal never hides content until a script runs.
5. **Focus.** Each interactive element has a `:focus-visible` style that
   shows at once, with no transition on it.
6. **Overflow.** `overflow-x: clip` on both `html` and `body`. Never
   `hidden` there, and never a `100vw` width. A grid track that holds an
   image uses `minmax(0, 1fr)`. A display heading has
   `overflow-wrap: break-word` and `min-width: 0`. No sideways scroll from
   320px up.
7. **Access.** Text contrast is 4.5:1 or more in each scheme (3:1 for large
   text). A control is a real `button`, `a`, `input` or `select`, and each
   input has a label.
8. **Honest content.** Never an invented metric, testimonial, logo wall,
   customer count or case study. A fact that nobody gave is absent. In a
   mock-up that the owner asks for, mark each invented item as a
   placeholder.
9. **No eyebrows.** No eyebrow label above a heading. No label in tracked
   capitals or small caps. Labels, captions, table heads, tags and nav links
   use the body face, one step smaller, in sentence case or lower case, with
   no tracking.
10. **A capped container.** The content container has a maximum width and
    stays centred. At 1920px the gutters grow; the measure and the grids do
    not.

## Reflex

Defaults that a model falls into. Each one suits some brief. None may appear
by habit.

1. **A default look:** one of the five looks in Step 3 of `SKILL.md`, on an
   axis that the brief left free.
2. **The accented word:** one word or phrase in a headline set apart by
   italic, bold, a colour, a highlight or an underline.
3. **Template punctuation:** meta strings joined with middle dots, an arrow
   glued to link or button text, a decorative status dot, a
   "WORD — fragment" label.
4. **Template surfaces:** a purple-to-blue gradient, a card inside a card,
   an emoji as an icon, a hand-drawn browser or OS window.
5. **Near-black and mono costume:** a tinted near-black (`#0B0B0B`, `#111`)
   in place of the palette's ink; a monospace face on labels when the
   content is not code, a figure or a measurement.
6. **A false sequence:** numbered markers (01, 02, 03) on content that is
   not a sequence.
7. **Scattered motion:** a fade-and-slide-up on each section, a hover
   transition on each card, or more than one orchestrated moment.
8. **The stock hero:** a big number, a small label, supporting stats and a
   gradient accent.
9. **The stock face:** the family that you use on any project, chosen
   because nothing stopped it.
10. **Filler pictures:** an illustration that you drew to fill space, an
    empty gradient wash, or a row of decorative marks.
11. **The page budget** (page scope): the hero headline, its sentence and
    its primary action do not all fit in 1280 x 800 without a scroll; or
    one screen holds more than about 80 words.
12. **Default sections** (page scope): a feature grid, three steps and an
    email band, where the real sites of the category have other sections.

## Finish

Craft detail. Answer each item.

1. **Scale.** Each type size is a step of one scale. Weights and spacing are
   deliberate.
2. **Measure.** Running text stays under 80 characters a line. Serif body
   text has a little more line height than sans-serif body text.
3. **Invariants.** One primary button style, one container width, one column
   gap below the hero, one radius for each level of nesting. No more centred
   heading groups than left-aligned ones.
4. **States.** Each control has its states: default, hover, focus-visible,
   active and disabled, and loading, error or success where it has them.
5. **Specificity.** No two selectors fight over one property. Each space
   between sections has one owner.
6. **Harmony.** The palette holds together in each scheme, and the accent
   is rare.
7. **Words.** Each button names its action. One action keeps one name. Each
   error says how to fix it. Each empty screen gives the first action.
8. **One accessory less.** You removed one thing before you handed the build
   back, and you can name it.
