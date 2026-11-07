<!-- Lilystack. Rewritten from gstack autoplan/sections/phase-close.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# Close a phase

Read this file again at the end of each phase, even if you read it before. Do
the steps in order. A step that you did not do keeps the phase open.

1. **Finish.** The phase skill ran each section that applies. Each finding
   has a decision. No User Challenge waits for an answer. If a step of the
   phase skill is not done, do it now.
2. **Read back.** Read the whole plan file again, from start to end, not only
   the new block. Make sure that:
   - the phase block is between its own markers, and nothing outside the
     markers changed;
   - the block holds each output that the Outputs section of the phase skill
     lists, in its shapes;
   - each decision of this phase is in the block, with the answer that was
     taken; each Taste answer has its gate mark; each User Challenge answer
     is as the owner gave it;
   - no accepted requirement, guarantee or test of the source plan or of an
     earlier phase was lost or weakened;
   - each "No issues found" has one or two sentences on what was examined.

   Fix an omission in the phase block, then read the block again. After two
   failed repairs, mark the phase DONE_WITH_CONCERNS and name each missing
   item.
3. **Record.** Make sure that each decision of this phase has its row in the
   audit trail of the autoplan block. Set the row of the phase in the phases
   table: status, findings, decisions by class.
4. **Report.** Send this in chat:

```
Phase <n> complete: <skill>  <DONE | DONE_WITH_CONCERNS>
Findings: <count> (<count> critical). Top: <the most severe, one line>
Decisions: <m> Mechanical, <t> Taste (to the gate), <u> User Challenges (answered)
DX score: <n>/10. Time to hello world: <now> min -> <target> min.   (DX phase only)
Next: <the next phase that applies | the pre-gate check and the taste gate>
```

5. **Go on.** The report is a progress note, not a question. Do not end the
   turn, and do not wait for "continue". Send the skip line of each phase
   that does not apply, then start the next phase in the same turn. After
   Phase 4, start the pre-gate check.

**After a compaction.** Read the plan file and the autoplan block again. A
phase whose block is complete but whose row is still `pending` resumes at
step 2. A phase with a partial block resumes in its skill, at the first
incomplete section. The report is sent only after step 3; a block in the
file does not replace it.
