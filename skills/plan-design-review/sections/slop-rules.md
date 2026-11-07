<!-- Lilystack. Rewritten from gstack the generated plan-design-review/sections/review-sections.md, scripts/resolvers/design.ts and scripts/resolvers/constants.ts at 466689b (MIT, Copyright (c) 2026 Garry Tan); and anthropics-skills skills/frontend-design/SKILL.md at ca45fc4 (Apache-2.0, Copyright 2026 Anthropic, PBC; changed); and hallmark skills/hallmark/SKILL.md at 407fa68 (MIT, Copyright (c) 2026 Hallmark contributors); the surface modes, the craft reflexes and the three-looks calibration derive from impeccable (Apache-2.0, Copyright Paul Bakaus; changed), as gstack's NOTICE records. -->

# The slop rules

Pass 4 applies these to the plan, the design that it names and each screen
seen in the audit; Pass 6 applies the access items of the Floor. Where a
rendered screen exists, check its real values. Otherwise judge what the
plan specifies, and name each gap.

## Three tiers

Each finding has a tier. The tier says whether the owner can waive it.

- **Floor**: correctness, access and honesty. Always a finding, never
  waived. Until the plan fixes it, its pass scores 7 or less and the plan is
  not design-complete. If the owner declines the fix, record it as an open
  Floor item under Unresolved decisions.
- **Reflex**: a default that a model falls into. A finding, but the owner
  can waive it with a real reason about this product (the brief asks for
  this look; the look is the brand). Record the item and the reason in the
  block. A reason that names nothing about this product ("it looks clean")
  is not a waiver. A waived Reflex item does not lower the score. An open
  one keeps Pass 4 at 7 or less.
- **Finish**: craft detail. Note it in the block. It never lowers a score
  and needs no question.

The owner's brief wins over each Reflex item, also when the brief asks for
one of the default looks. Nothing wins over the Floor. hallmark puts some
style items (eyebrows, tracked capitals, the word budget) in its floor;
here they are Reflex items, so that a brief can ask for them.

## The Floor

The plan states these, or it does not break them. Pass 6 owns items 1 to 6;
Pass 4 owns the rest.

1. The layout works down to phone width, with no lost content.
2. Every interactive element has a visible keyboard focus
   (`:focus-visible`) that shows at once.
3. Every animation has a `prefers-reduced-motion: reduce` fallback. On the
   web, the content is visible with scripting off.
4. Body text is 16px or more, with a contrast ratio of 4.5:1 or more.
5. A form field has a visible label. A placeholder is never the only label.
6. Links in running text show visited and unvisited states differently.
7. Every colour and every font goes through a named token (`:root`
   variables, a theme block, or DESIGN.md). No literal colour or font
   family in a component spec.
8. No invented proof: no metric, testimonial, logo wall or case-study count
   that the owner did not supply.
9. Motion uses `transform` and `opacity`. Never `transition: all`; never an
   animated `width`, `height`, `top` or `left`.
10. No horizontal page scroll: `overflow-x: clip` on `html` and `body`
    (never `hidden`, never `100vw`). Image grid tracks use
    `minmax(0, 1fr)`. Display headings can wrap (`overflow-wrap:
    break-word; min-width: 0`).
11. A heading sits closer to the section that it starts than to the section
    before it: more space above it than below it.
12. On a Persuade surface, the hero's headline, one sentence and the primary
    action show at 1280 x 800 without a scroll.
13. The container has a maximum width and is centred. At 1920 wide, the
    gutters grow; the measure and the grids do not.

## Reflex: the five default looks

AI-built screens land in these looks whatever the subject. Each one is
right for some briefs. If the brief left the look open and the plan lands in
one, that is a Reflex finding.

1. A warm cream ground (near `#F4F1EA`), a high-contrast serif display, and
   a terracotta or clay accent (near `#D97757`, Anthropic's own accent for
   Claude, so on a user's brief it is a tell).
2. A near-black ground with one bright accent (acid green, neon, vermilion)
   and glowing edges.
3. A broadsheet: hairline rules, zero radius, dense newspaper columns, an
   italic display serif, tiny tracked mono labels.
4. The SaaS-card kit: content cut into identical rounded cards, one radius
   on every element, the same soft grey shadow (`rgba(0,0,0,.1)`) under
   each, and gradient washes as decoration.
5. Template chrome on any subject: a tracked ALL-CAPS eyebrow above each
   heading; meta strings joined with middle dots ("A · B · C"); labels built
   as "WORD — fragment"; a tinted near-black (`#0B0B0B`, `#111`) in place
   of black; a mono face for small data labels; a "→" added to link and
   button text.

The test: could someone guess the look from the category alone, or from
"the category, but not the obvious choice"? If yes, the plan stopped
looking. "It is about books, so cream and a serif" fails: book cloth comes
in every saturated colour. Light or dark comes from the use scene (who,
where, under what light, in one sentence), never from the category.

## Reflex: hard rejections and the litmus checks

Hard rejections. Each one that the plan shows is a Reflex finding, and the
waiver reason must say why this product needs it.

1. A generic SaaS card grid as the first impression.
2. A beautiful image with a weak brand.
3. A strong headline with no clear action.
4. Busy imagery behind text.
5. Sections that repeat the same mood statement.
6. A carousel with no narrative purpose.
7. An app screen built from stacked cards, not from a layout.

Litmus checks: answer YES or NO, with evidence. They support findings; they
are not a score.

1. Is the brand or the product unmistakable on the first screen?
2. Is there one strong visual anchor?
3. Can a reader understand the page from its headings alone?
4. Does each section have one job?
5. Are the cards necessary?
6. Does the motion improve the hierarchy or the atmosphere?
7. Would the design feel premium with every decorative shadow removed?

gstack takes these two lists from OpenAI's "Designing Delightful Frontends
with GPT-5.4" (March 2026).

## Reflex: the catalog

Patterns that say "AI-generated". Each is a Reflex finding unless the brief
asks for it.

- **Colour and surface**: purple, violet or indigo gradients, or blue to
  purple; purple on white; gradient text; a gradient button; a radial halo,
  spotlight, stripe or grid-paper background; a dark-mode glow;
  glassmorphism; a zero-offset coloured halo as "depth".
- **Layout**: the three-column feature row (an icon in a coloured circle, a
  bold title, two lines of text, three times); icons in coloured circles as
  decoration; everything centred; one large radius on every element; a card
  inside a card; cards as the default component; grids of identical cards;
  a coloured left border on cards; decorative blobs, floating circles and
  wavy dividers (an empty section needs better content, not decoration);
  the cookie-cutter rhythm (hero, three features, testimonials, pricing,
  call to action, each the same height); a left-text, right-image hero; a
  hero row of metrics; a logo marquee; a modal by default.
- **Type**: `system-ui` or `-apple-system` as the main display or body face;
  an overused display face (see "Type, structure and motion"); a flat type
  hierarchy; an oversized h1; extreme negative tracking; one word in a roman
  headline set in italic, bold or another colour; labels in tracked capitals
  or small caps; monospace as a costume.
- **Chrome and copy**: an eyebrow chip or kicker above the heading; numbered
  section labels (01, 02, 03) on content that is not a sequence; middle-dot
  meta strings; arrows glued to link text; decorative or pulsing status
  dots; emoji as icons or bullets; a hand-drawn browser or OS window; an
  illustration built from shapes; a stock-photo hero; generic hero copy
  ("Welcome to X", "Unlock the power of", "Your all-in-one solution");
  marketing buzzwords and theatre phrases; many em dashes; an aphoristic
  cadence; generic button labels; stand-in content left in place; a generic
  testimonial section.
- **Motion**: bounce easing; a blinking cursor effect; the same fade-and-
  slide entrance on each section; a hover transition on every card; a zoom
  on image hover.
- **Volume**: more than about 80 words on one screen; a hero with more than
  its headline, one sentence and its actions.

## The rules of each mode

Step 0 named the mode of each surface. Apply its rules; a Hybrid page
applies them for each section. A break is a Reflex finding, unless the item
is in the Floor.

**Persuade** (they decide and act; the design is the product):

- The first viewport reads as one composition, not a dashboard and not a
  document.
- The hierarchy is brand, headline, body, action. The brand is the loudest
  text.
- The hero is full-bleed, not inset, tiled or rounded. Its budget: the
  brand, one headline, one sentence, one action group, one image. No cards
  in the hero.
- One job for each section: one purpose, one headline, one short sentence.
- Expressive type; display sizes stay under 6rem.
- No flat ground of one colour by default: texture from the brand or from a
  real asset.
- One accent colour by default, defined as a variable.
- One authored motion moment on the first viewport (an entrance or a
  scroll-linked reveal), with an ease-out from a visible default. Hover
  effects only where they carry information.
- The copy is product language, not design commentary.

**Operate** (they finish a task; the brand lives in the details):

- A calm surface hierarchy, strong type and few colours. Dense but readable,
  with little chrome.
- Organise into the main workspace, the navigation, the secondary context,
  and one accent.
- No mosaics of dashboard cards, thick borders, decorative gradients or
  ornamental icons.
- The copy is utility language: orientation, status, action. Not mood or
  aspiration.
- A section heading says what the area is or what the user can do
  ("Selected KPIs", "Plan status").
- Cards only when the card is the interaction.

**Read** (they understand something):

- A measure of 65 to 75 characters, in one reading column.
- Wayfinding is a feature: where am I, what is next, where do I search.
- A docs index is Read, not Persuade: no hero and no call-to-action theatre.

**Experience** (they are inside the work):

- The work fills the first viewport. The chrome earns each pixel.
- One authored transition, not a scroll-jacked tour.
- Never crop the work to fit a template.

**Every mode**: colour as variables; one job for each section; each card
earns its place; "if deleting 30% of the copy improves it, keep deleting".

## Type, structure and motion

- Use one type family or two; if two, make them clearly different. At most
  two text faces, plus a mono for data and code.
- Choose typefaces for this product, not the faces you would take for any
  project. Inter, Roboto, Arial and the system stack are never the display
  face. DM Sans, Instrument Sans and IBM Plex Sans are acceptable for body
  and UI text on an Operate or Read surface when the plan gives them that
  role.
- Set a clear type scale with deliberate weights, widths and spacing. A
  headline uses the type itself as part of the design.
- Keep lines shorter than 80 characters. Serif body text gets a little more
  line height than sans body text.
- Visual structure is information. Outlines, borders, numbers, dividers and
  labels tell something about the content; they do not decorate. Use
  numbered markers only for a real sequence (steps, a timeline).
- Motion that the user did not start is rare and deliberate: one page-load
  sequence or one reveal, not effects everywhere. Motion that answers an
  action (open, expand, confirm) is welcome when it shows what changed.
  Content never waits behind an animation.

## Restraint

Spend the boldness in one place. Let one element be the thing that people
remember, keep everything around it quiet, and cut each decoration that does
not serve the brief. Before you call a plan done, remove one accessory.

## Interface words

Words are design content, not decoration.

- Name things as the user knows them: a user manages notifications, not
  webhook config. Say what a thing is or does; do not sell it.
- A button says exactly what happens: "Save changes", not "Submit". An
  action keeps one name through the flow: "Publish" gives "Published".
- An error says what happened and how to fix it, in the voice of the
  interface. It does not apologize, and it is never vague.
- An empty screen is an invitation to act.
- Plain verbs, sentence case, no filler. Each written element does one job.

## Finish

Craft notes. They never block.

- Browser surfaces carry the design: the selection colour, the caret, the
  scrollbars, the focus rings, the underline offset and tabular numerals
  come from the palette, not from browser defaults.
- Depth has an offset: a shadow is an offset plus a soft blur.
- Secondary text on a coloured surface is tinted from that hue, never grey.
