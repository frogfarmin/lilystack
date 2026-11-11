---
name: frontend-design
description: Build a web page, component or app screen that looks designed for its subject, not like a generic AI default, and passes a floor for tokens, focus, motion and honest content; use when asked to design, build or restyle a user interface
argument-hint: "[what to build] [target path]"
---
<!-- Lilystack. Rewritten from anthropics-skills skills/frontend-design/SKILL.md at ca45fc4 (Apache-2.0, Copyright 2026 Anthropic, PBC; changed); and hallmark skills/hallmark/SKILL.md at 407fa68 (MIT, Copyright (c) 2026 Hallmark contributors). -->

# Frontend design: plan, check, build, look

Use this when you build a user interface: a page, a component or an app
screen. The aim is a result that belongs to its subject and is correct. It
must not read as the default that any model makes for any brief. Plan the
tokens and check the plan against the default looks. Build to a floor. Look
at the result in a browser when one exists, and report in chat. Never
commit, push or open a PR; that is `/lilystack:ship`, on request.

**The owner's words win.** The owner's brief beats every rule in this skill,
the floor too. When the brief asks for one of the default looks, or for a
thing that a rule forbids, build it as asked. List it in the report as "by
request". One limit stays: an invented fact (a number, a quote, a logo, a
customer) is never shown as real. In a mock-up that the owner asks for, mark
each one as a placeholder, in the code and in the report.

## Step 1: scope and the project

Name the scope first:

- **Component:** one element, or "just the X": a button, an input, a card, a
  modal, a nav, a footer, a tab strip.
- **App screen:** a screen that a person works in: a dashboard, an admin
  page, settings, a tool.
- **Page:** a page that a visitor reads: a landing page, a product page, a
  site.

Read the project before you ask anything:

- a `DESIGN.md` or `design.md` at the root, or a design-system folder. It is
  locked, and it beats everything below;
- the tokens and the theme: `:root` custom properties, the Tailwind config,
  theme files, font links and font files;
- the framework, the components that exist, and the file or route where the
  new part goes;
- the project's docs, `CLAUDE.md` and `AGENTS.md`, for the product and the
  owner's taste.

In a project that has a system, a new part uses its tokens, fonts,
components and names. Add a new token beside the others. Do not change an
existing rule or token to make the new part fit. Only the axes that the
system leaves open are free.

Before the first edit, name the files you will touch. Never remove a route,
a component or a file without a file-level plan that the owner approved.
When the owner asks you to restyle a screen, keep its content, routes and
wiring, and change the look only. If the brief names a real brand, use only
the logo, colours and fonts that the owner gives or the project holds. Never
rebuild a brand from memory.

## Step 2: the subject and the material

Distinctive choices come from the subject: its trade, its materials, its
objects and its words. A toy for children aged 8 to 11 and a dashboard for
financial analysts must not look alike. Use the real content of the brief
throughout.

Write down five lines:

- **Subject:** what the product or the topic is.
- **Audience:** who uses it, and what they care about.
- **Job:** the one action that the page or screen must drive (book, buy,
  sign up, find a record, change a setting).
- **Tone:** one clear direction, for example editorial, brutalist, soft,
  utilitarian, luxury, playful, technical or austere. "Clean and modern" is
  not a tone.
- **Material:** an inventory in three parts. *Real:* each concrete fact that
  the brief and the project give (names, claims, numbers, places, dates,
  images). *Pictures:* what the page can show, and where each comes from
  (the owner's files, real screenshots, the product built in the page).
  *Absent:* each proof that the page will not have (logos, quotes, metrics
  that nobody gave).

When the brief leaves a line open, ask one question. Show the five lines as
your proposal. Ask the owner to confirm them, correct a line, or add
material. Material matters most. Ask for screenshots, real numbers, a quote
with the name of its speaker, and logos that the owner may use. Use
AskUserQuestion where the tool exists; otherwise ask in plain text and end
the turn. Do not ask when the brief answers all five lines, or when no one
can answer (a headless run). If the owner says "go ahead", state your
inferences in one line and continue. A fact is never inferred. A number, a
quote or a logo that nobody gave is absent; a picture is a slot.

**Quick mode.** When the owner says quick or rough, do not ask.
Cut the plan to the colour, type and layout lines. The floor still holds.

## Step 3: plan, then check the plan

Write the plan in chat, in one block, before any code:

```
DESIGN PLAN: <the thing>
Scope:       component | app screen | page; system: <the project's | free>
Subject:     <subject>, for <audience>; job: <the one action>
Tone:        <tone>
Material:    real <...>; pictures <...>; absent <...>
Signature:   <the one element that a visitor will remember, on the first screen>
Colour:      <4 to 6 named hex values: <name> #RRGGBB, ...>
Type:        <display face: role>; <body face: role>; scale <steps in px>; source <files | service | system>
Layout:      <one sentence>; alignment <left | centre | justified, and where>
             <ASCII wireframe at phone width and at desktop width>
Motion:      <the one moment, or none>; reduced motion: <what replaces it>
Principles:  <two or three lines that make this design its own>
Default check: <part: from -> to, and why> | none
```

For a component or an app screen in a project system, the plan is short. It
names the tokens and components that it reuses, the new tokens, the states
and the layout. Signature and Principles can say "the project's".

**The signature** is one element that a visitor will remember: the
strongest real thing in the brief, shown at its best. Examples: the
photograph that is the place; the product doing its one job; a large price,
because the price is the offer; a control to try. Show it on the first
screen. A number drawn as decorative marks is not a signature.

**The default check.** Compare the plan with the five looks that AI-made
design falls into when nothing stops it:

1. Warm cream paper (near `#F4F1EA`), a high-contrast serif display, and a
   terracotta or clay accent (near `#D97757`). That accent is the accent of
   Claude's own interface, so on another brief it is a tell.
2. A near-black ground with one bright acid-green or vermilion accent.
3. A broadsheet layout: hairline rules, zero radius, dense newspaper columns.
4. The SaaS card kit: content cut into identical rounded cards, with one
   radius on everything at every level. The same soft grey shadow
   (`rgba(0,0,0,.1)`) sits under each card, and gradient washes decorate.
5. Template chrome on any subject: a tracked ALL-CAPS eyebrow above each
   heading; meta strings joined with middle dots ("A · B · C"); labels made
   as "WORD — fragment"; a tinted near-black (`#0B0B0B`, `#111`) in place of
   black; a monospace face for small data labels; a "→" added to link and
   button text.

Each look suits some brief. They are defaults, not choices, because they
appear whatever the subject is. Where the brief fixes a direction, follow it
exactly, also when it asks for one of these looks. Where the brief leaves an
axis free, do not spend that freedom on a default.

Then do the mirror test. Would a neighbouring brief in the same category get
the same plan? Work it through. Each part that comes out the same is a
default. Revise it, and write in Default check what changed and why. Start
the code only after the check, and follow the revised plan.

## Step 4: build

Before the first line of style, read `sections/build.md` and
`sections/floor.md` in this skill's directory. `build.md` holds the rules
for the hero, type, structure, motion, pictures, restraint, words and CSS.
`floor.md` holds the three tiers that Step 5 checks. A floor item always
fails. A reflex item stays only with a reason. A finish item never blocks.
Build the plan. If the code leaves the plan, say where and why in the report.

## Step 5: critique

Read the result against `sections/floor.md`, tier by tier:

- Fix each open floor item.
- Fix each reflex item, or waive it with a reason about this page. The
  report lists each waiver.
- Answer each finish item: fixed, or why not.

Then read the build against the plan. Does the signature lead? Does each
part still match the plan, or did a default come back? Before you hand it
back, remove one accessory, as Chanel advised: look in the mirror and take
one thing off.

## Step 6: look at it

When a browser exists, look at the result. A picture shows what the code
hides.

1. **Find a browser.** Use a browser tool in this session (the Playwright
   MCP, Claude in Chrome). Else use Playwright in the project
   (`node_modules/.bin/playwright`) or on the path (`command -v playwright`).
   Do not download a browser unless the owner asks.
2. **Keep it clean.** Open only the local page. Never import cookies, and
   never pass `--load-storage` or `--user-data-dir`. Never use a logged-in
   personal session. In Claude in Chrome, open a new tab for the page, and
   touch no other tab or site.
3. **Serve the page** with the project's own dev-server command, or open a
   static file by its `file://` URL. Show a component on the screen or story
   that holds it. Stop a server that you started when you finish.
4. **Take four views:** 390 x 844 and 1280 x 800, each in light and in dark
   (emulate `prefers-color-scheme`). Put the screenshots in a temporary
   folder, never in the project. With Playwright from the shell:

   ```sh
   shots=$(mktemp -d)
   pw=node_modules/.bin/playwright    # or: pw=$(command -v playwright)
   $pw screenshot --viewport-size=390,844 --color-scheme=dark --full-page "<url>" "$shots/phone-dark.png"
   ```

   The top 800px of a desktop shot is the first screen. If the tool cannot
   set the colour scheme, use the page's own theme switch, or report dark as
   not looked at.
5. **Look.** Open each image and read it. Look for: the signature on the
   first screen; the hierarchy; clipped or overflowing text; a sideways
   scroll at 390; the hero and its action inside 1280 x 800; the contrast in
   each scheme; colours that the dark theme forgot. Where the tool can press
   keys, press Tab once and look at the focus ring.
6. **Fix once, look once more.** Fix all that you saw in one batch. Take the
   views again, one time, and stop. Report what is still wrong.

With no browser, say "Not looked at: no browser in this session". Give the
owner the command to look: the dev-server command and the URL, or
`open <path>` for a static file. Name the two widths and dark mode to check.
Never report a view that you did not take.

## Step 7: report

```
FRONTEND: built | built, not looked at | blocked
Files:         <path> (new | changed)
Plan:          <scope>; signature <...>; colour <the names>; type <the faces>
Defaults revised: <part: from -> to> | none
Floor:         clear | open: <item>: <why>
Reflex:        <item> fixed | <item> waived: <reason> | <item> by request | none
Finish:        <item>: <answer> | none
Looked at:     <views, tool> | not looked at: <why>; to look: <command>
Fixed after looking: <list> | none
Slots:         <slot>: <size>, <what belongs there> | none
Placeholders:  <invented content, marked> | none
Next material: <the one thing that would most improve it>
```

`blocked` is a question that the owner has not answered, or a floor item
that you cannot fix without a choice from the owner. Then point on:
`/lilystack:verify` to run the repo's checks, and `/lilystack:review` before
the change lands.

## Rules

- The owner's words beat every rule here. Build what the brief asks, and
  list it as "by request".
- Plan and check before code. The plan goes in chat, not in a file.
- Never show an invented number, quote, logo or customer as real.
- In a project with a system, the system wins. Add to it; never rewrite it.
- Never report a check or a view that you did not run.
- No log and no state file. Never commit, push or open a PR.
