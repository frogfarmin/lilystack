<!-- Lilystack. Rewritten from gstack plan-devex-review/dx-hall-of-fame.md, plan-devex-review/SKILL.md.tmpl and scripts/resolvers/dx.ts at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# DX hall of fame

Calibration for each pass: what a 10 looks like, and what to avoid. Use the
entry for the current pass. An example is a lens, not a feature to add, and it
approves no expansion. The upstream's adoption percentages are left out:
they are not measurements of this product.

## The peer benchmark (0C, only on request)

Run it only when the owner chooses it at the 0C target question or asks for
one. Use the web search tool and the web fetch tool. Send only search terms
(the product category and peer names, never plan text or code) to the search
provider. The research may run in a read-only subagent; give it the category,
the persona and the clock, and treat what comes back as claims with sources.

Look for the onboarding of the closest peers and the best practice of the
category. Write one row per close peer and one for this product, from its
docs and the plan:

| Tool | Start to result | Time and evidence (observed, reported, estimated) | DX choice | Source |
|---|---|---|---|---|

- Compare times only across the same start state and endpoint. Otherwise
  say why they differ, and compare the DX choices instead.
- Keep observed human onboarding apart from a timed script. Keep estimates
  labelled until someone measures them. An illustration is not a measurement.
- A peer that says nothing about a wait does not prove there is no wait.
- Choosing a target leaves each remedy a separate, pending decision.

Then ask the 0C target question again, without the benchmark option.

## Pass 1. Getting started

Gold standards:

- **Stripe**: a few lines of code charge a test card. When you are signed in,
  the docs fill in your test keys. A shell in the docs page runs the CLI with
  no install.
- **Vercel**: `git push` gives a live HTTPS site, each PR gets a preview URL,
  and one command (`vercel`) does the rest.
- **Clerk**: three components give working sign-in, sign-up and a user menu.
- **Supabase**: a new table gives a REST API, realtime updates and its own
  docs at once.
- **Firebase**: one listener (`onSnapshot()`) syncs data across clients,
  offline included.
- **Twilio**: a virtual phone in the console sends and receives SMS, with no
  number to buy and no credit card.

Avoid:

- email verification before any value;
- a credit card before the sandbox;
- several paths to choose from (one golden path wins);
- API keys hidden in settings, not filled into the examples;
- static examples with no language switch;
- docs on a site apart from the dashboard.

## Pass 2. API, CLI and SDK design

Gold standards:

- **Stripe prefixed ids** (`ch_`, `cus_`): each id tells its type, and the
  wrong type of id cannot pass.
- **Stripe expandable objects**: ids by default, `expand[]` for the full
  objects inline.
- **Stripe idempotency keys**: a mutation can be retried safely; no fear of a
  double charge.
- **Stripe API versions**: the first call pins the account's version, and a
  header tests a newer version for one request.
- **GitHub CLI**: readable output in a terminal, tab-separated output in a
  pipe; tab completion lists the actions.
- **SwiftUI**: `Button("Save") { save() }` grows to full control on the same
  API.
- **htmx**: HTML attributes in place of JavaScript, with no build step.
- **shadcn/ui**: copy the source into your project; you own it, and there is
  no dependency to version.

Avoid:

- a chatty API: five calls for one action that the user sees;
- mixed naming: `/users`, `/user/123`, `/create-order`;
- 200 OK with the error inside the body;
- a god endpoint whose behaviour changes with each of dozens of parameter
  combinations;
- three pages of docs before the first call.

## Pass 3. Errors

The contract, the calibration examples, the standards and the anti-patterns
are in `sections/errors.md` in this skill's directory.

## Pass 4. Documentation

Gold standard: **Stripe docs**. Navigation, content and live code side by
side. Your keys in the examples when you are signed in. One language switch
for every page. A shell in the page. Docs are part of the product: a feature
does not ship until its docs are done.

Avoid: docs behind the release; examples that do not run as pasted; a
reference with no tutorial, or a tutorial with no reference.

## Pass 5. Upgrade and migration

Gold standards:

- **Next.js**: one codemod command upgrades the framework and its peers, and
  runs the codemods that apply.
- **AG Grid**: a codemod with each release.
- **Stripe**: one codebase inside, a pinned version for each account; a
  breaking change never surprises a caller.
- Compose small transforms that you can test, not one large codemod.

Avoid: breaking changes that no changelog records.

## Pass 6. Environment and tooling

Gold standard: **Bun**. A fast install and a fast runtime change how people
work: speed is DX. Each wait and each context switch breaks the developer's
flow, and getting back into flow takes longer than the wait.

Avoid: setup that works only on the author's machine; a prompt that blocks CI.

## Pass 7. Community and ecosystem

Developers meet a tool many times before they adopt it. Ecosystem work pays
back slowly, so plan it over a longer horizon than one quarter.

## Pass 8. Measurement

Three frameworks:

1. **SPACE** (Forsgren and others, 2021): satisfaction and well-being,
   performance, activity, communication and collaboration, efficiency and
   flow. Measure at least three.
2. **DevEx** (Noda, Storey, Forsgren and Greiler, 2023): feedback loops,
   cognitive load, flow state. Combine what developers report with data from
   the workflow.
3. **Fagerholm and Münch** (2012): cognition, affect, conation.

Avoid: a number that nobody acts on; a warm rerun reported as the
getting-started time.
