<!-- Lilystack. Rewritten from humanizer SKILL.md at 0ef9fe5 (MIT, Copyright (c) 2025 Siqi Chen). -->

# The other tells

Read in step 1 of `/lilystack:prose`; the five strongest tells are in
SKILL.md. Each group below is one kind of default choice. A tell marked *weak
alone* needs company from other tells in the same passage before you act. A
watch list gives samples, not every form: an equivalent phrase counts the
same. humanizer builds these patterns on Wikipedia's "Signs of AI writing"
guide (WikiProject AI Cleanup).

## Rhythm by rule

Shapes and punctuation used everywhere, whether or not the meaning asks.

**Forced triads.** Ideas arrive in threes to sound complete: a list
("innovation, inspiration, and insights"), three parallel examples, or three
short facts and a lesson. Keep three only when each item adds a distinct
idea. Otherwise merge them, develop the strongest one, or change the shape.

- "The release brings speed, stability, and peace of mind." becomes "The
  release is faster and crashes less."

**Repeated openings.** Several sentences in a row start with the same
subject. Merge them, change the subject, or start with the action. Do not ban
the word, and keep a repeat made for rhythm ("She came. She saw. She
conquered.").

- "She noted the door. She noted the lock on it. She filed both away."
  becomes "She noted the door and its lock, then filed both away."

**Dashes.** The final text has no em dash (—), no en dash (–) and no spaced
double hyphen used as a dash, unless the writer's sample uses them; then
match its rate. Use a period, comma, colon or parentheses, or rewrite the
sentence; "10–20" becomes "10 to 20". Leave dashes in code, commands, paths
and URLs. A dash lets the writer skip the choice of how two clauses relate.
As a sign that a text is generated, one dash is *weak alone* and a text full
of them is not; the rule for the final text holds either way.

**Stacked qualifiers.** "Could potentially", "might arguably", "it's also
possible", "in some cases it may": one qualifier after another, often to
repair an earlier overstatement. Keep a qualifier that the source supports
and the meaning needs, and each scope statement, legal or safety notice and
real correction. Plain hedges ("perhaps", "tends to") are human. *Weak alone.*

- "It could potentially be argued that the change might have some effect on
  build time." becomes "The change may affect build time."

**Hyphenated pairs after the noun.** "High-quality", "well-documented",
"long-term" keep the hyphen before a noun ("a high-quality report") and drop
it after one ("the report is high quality"). A word the dictionary always
hyphenates (third-party) keeps it. *Weak alone.*

**Passive voice and missing subjects.** The text hides who acts, or drops the
subject ("No configuration file needed."). Use the active voice where it
makes the actor and the action clear. *Weak alone.*

## Inflation and borrowed authority

The fact underneath is usually sound. Keep it and remove the dressing.

**Stock AI words.** These are tells wherever they appear, more so in groups:
actually, additionally, align with, bolstered, crucial, deep dive, delve,
enduring, enhance, garner, gate or gating (figurative), highlight (verb),
interplay, intricate, key (adjective), landscape (abstract), meticulous,
pivotal, quietly, robust (figurative), showcase, tapestry, testament,
underscore (verb), valuable, vibrant. Keep the technical sense ("a CI gate",
"a robust estimator"). A formal word outside this list is not a tell alone.

**Inflated significance.** "Stands as a testament", "a pivotal moment",
"plays a key role", "setting the stage for", "the evolving landscape",
"despite these challenges... continues to thrive", "the future looks
bright". An ordinary detail is said to mark a change, prove a legacy or
promise a future. It comes as a phrase, as a stock "challenges and outlook"
section, or as a send-off paragraph. Keep the fact. End on the last concrete
fact, and give plans only where the source states them.

- "The migration landed in March, marking a pivotal moment in the evolution
  of the platform." becomes "The migration landed in March."

**Vague association.** "Associated with", "linked to", "tied to", "in
connection with": two things are connected, and the text does not say how.
Name the relationship that the source gives. If the source does not say,
keep the vague wording; do not invent a role.

**Shallow -ing riders.** "Highlighting", "underscoring", "reflecting",
"symbolizing", "fostering", "showcasing", "ensuring", "contributing to": an
-ing phrase bolted onto a plain fact to make it sound deeper. A named source
in front ("the author highlighted") does not make it true. Keep the rider
only when the source supports what it claims.

- "The team moved the docs into the repo, reflecting a deeper commitment to
  transparency." becomes "The team moved the docs into the repo."

**Sales language.** "Nestled", "in the heart of", "breathtaking", "renowned",
"stunning", "must-visit", "diverse array", "commitment to", and "rich" or
"groundbreaking" used figuratively. The text reads like an advertisement.
Say what the thing is.

- "Nestled at the heart of the build, the cache offers a rich, seamless
  experience." becomes "The build uses a cache."

**Borrowed authority.** "Experts argue", "observers have cited", "industry
reports", "some critics"; a list of outlets that cited or profiled someone; a
follower count. A name, or an authority with no name, stands in for what was
said. Where the source names who said what, use that; otherwise cut the
claim or the list. A missing citation alone is not a tell; most writing has
none.

**Avoiding is, are and has.** "Serves as", "stands as", "functions as",
"represents", "boasts", "features", "offers", "maintains": a long phrase in
place of a simple verb. Use "is", "are" and "has".

- "The `hooks/` folder serves as the home of the scripts and boasts a rules
  file for each." becomes "The `hooks/` folder holds the scripts and has a
  rules file for each."

## Formatting by rule

Editors also make clean formatting; the tell is decoration on every item.

**Bold as decoration.** Bold with no reason, or a vertical list in which
every item has a bold label and a colon. Remove the bold. Turn a labeled list
into prose when the labels carry no information of their own. Keep a label
that names a distinct thing the reader looks for, as in this file.

- "**Speed:** Speed improved with a new cache. **Safety:** Safety improved
  with a fail-closed hook." as two list items becomes "A new cache makes it
  faster, and a fail-closed hook makes it safer."

**Decorative headings.** Title Case on every main word; emojis or arrows (→)
in headings and list items; a horizontal rule between every section; a top
heading that repeats the title; a heading written for effect ("The decision,
on one screen"). Use sentence case and remove the decoration and the rules.
Name what the section holds ("How the six options compare"), and let the
title stand once.

**Curly quotation marks.** Curly quotes (“ ”) where the writer or the format
uses straight quotes. Editors curl quotes on their own, so this is *weak alone*.

## Leftovers from the chat and the draft

Remove these outright. They need no rewrite.

**Chatbot residue.** "I hope this helps", "Certainly!", "Great question!",
"You're absolutely right", "Would you like...", "Want me to...?", "let me
know", "Here is a...". A greeting, praise, offer or sign-off from a chat
stays in text that must stand alone. It is the surest tell in this file, and
the easiest to miss when it wraps real content. Remove the wrapper and keep
the content.

**Knowledge-limit disclaimers and guesses.** "As of my last update", "while
specific details are limited", "not publicly available", "maintains a low
profile", "likely grew up", "it is believed that". The text says where the
model's knowledge ends, or admits that it found no source and fills the gap
with a guess. State what the source does not show, or cut the sentence.

**A heading repeated in the first sentence.** A heading, then a one-line
paragraph that says it again ("## Performance", then "Speed matters."). Cut
the repeat.

**Writing about the document instead of its subject.** What the text
replaced ("was added to replace"); how it was made ("compiled from",
"anything unconfirmed is flagged rather than guessed"); a layout the reader
can see ("the table below compares"). Mention a previous version only in a
document about change: a changelog, release notes, a migration guide, a PR
body or a commit message. Keep a source credit the reader can follow, and a
caveat that changes what the reader does; cut the account of how you worked.
State a convention once, and only when the reader cannot infer it. One
description of the page is *weak alone*.

- "This function was added to replace the old loop over every item, which
  was O(n²)." becomes "This function avoids an O(n²) loop over every item."

## Writing for the wrong reader

A model writes for a reader who shares no context. A reply in a thread has a
reader who already knows the background. Act on this only when you can see
the conversation around the text, or the text is plainly a reply. If you
cannot tell, ask, or leave the text alone.

**Re-explaining what the reader knows.** A short reply restates the problem,
walks through the diagnosis and lays out the evidence before it reaches the
decision; a query, command or set of numbers proves the plan will work; the
answer sits in the last line. Each sentence reads well alone, so this
survives an edit sentence by sentence. Lead with the decision. Keep only the
reasoning that would change whether the reader agrees: usually one fact they
lack and a link they need to act. The diagnosis and the proof belong in the
ticket or document that follows.

- "You're right, this works around the bug. The real fix is in
  `MergeService`, which should update `pipeline_id` with `parent_id`. I
  checked QA: 6 of 123 merged rows are wrong. Since `MergeService` is shared,
  I'd rather open a separate ticket than widen this PR." becomes "Agreed,
  this is a workaround. `MergeService` is shared code, so I'd rather fix it,
  and the 6 bad rows, in a separate ticket than widen this PR."
