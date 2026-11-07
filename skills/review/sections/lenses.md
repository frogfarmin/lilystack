<!-- Lilystack. Rewritten from claude-plugins-official plugins/pr-review-toolkit/agents/silent-failure-hunter.md, comment-analyzer.md, pr-test-analyzer.md, type-design-analyzer.md and commands/review-pr.md at a1ecfbc (Apache-2.0, Copyright Anthropic, PBC; changed). -->

# Four narrow lenses

Each lens reads and reports. It never edits code or comments. Run a lens only
when its trigger fires in the diff, and name the lenses that ran in the report
(`Lenses: silent failures, tests`). A lens that did not fire is not mentioned.

Findings join Step 4 under its rules: `file:line`, a confidence on the 1-10
anchors, the checklist's suppressions, and the validation pass for anything
CRITICAL. A lens run as a subagent gets the diff command, the rule text from
Step 2, the plan or spec, and the text of its lens below: the artifact and the
contract, never your conclusion.

| Lens | Trigger in the diff |
|---|---|
| Silent failures | a catch, rescue or except, an error callback, a fallback or default on failure, a retry, `?.`, `??`, `\|\| true` or `2>/dev/null`, added or changed |
| Comments | a comment, docstring or doc block added or changed |
| Tests | a test file changed, or new branching logic (validation, parsing, a state change) with no test change |
| Types | a type, class, struct, schema or interface added or changed |

## Silent failures

A failure that reaches no log and no user is a defect. A fallback is explicit
and justified, or it hides a problem. A catch names the errors it expects. A
mock, stub or fake belongs only in tests.

Find every error handler, error branch, fallback, default on failure and
log-and-continue in the changed code. These patterns hide errors:

- an empty catch;
- a catch that only logs and goes on;
- a null, empty or default value returned on error, with no log;
- optional chaining that skips a step that can fail;
- a fallback chain that tries several ways and gives no reason;
- a retry that runs out and tells no one;
- in shell, `|| true` or `2>/dev/null` on a command whose failure matters.

Ask of each handler:

- Which unexpected errors can this catch hide? List them by class.
- Does the log say what failed, for whom, with which ids? Would it let
  someone debug this in six months?
- Does the user learn what went wrong and what to do next?
- Did the request, the plan or the spec ask for this fallback? If not, it
  hides the failure.
- Is this a fallback to a mock, stub or fake outside test code?
- Should the error go up to a caller instead? Does catching here skip cleanup
  or leave a resource open?

Rating: CRITICAL when the handler hides a failure that breaks production or
loses data, or catches so broadly that unrelated errors vanish. A poor error
message, an unjustified fallback or a log without context is INFORMATIONAL.

```
[file:line] Silent failure: <what is hidden>
  Hidden errors: <the classes this can swallow>
  Impact: <what the user or the person debugging sees>
  Fix: <the specific change>
```

## Comments

Check every added or changed comment against the code:

- the signature matches the documented parameters and return value;
- the described behaviour is what the code does;
- the named types, functions and variables exist;
- the edge cases the comment names are handled;
- a complexity or performance claim holds.

Then judge its value. A comment that restates the code is a removal. A "why"
is worth more than a "what". A comment about a temporary state ("for now",
"until the migration") rots, and so does a TODO or FIXME the diff has already
done. A comment that leaves out a precondition or a side effect the reader
needs is an improvement.

Rating: a wrong comment is INFORMATIONAL and AUTO-FIX when the code is right.
When the comment states the intended behaviour and the code breaks it, the
finding is the code, rated on its own. Improvements and removals are ADVISORY.

```
Wrong:   [file:line] <the false claim> -> <the corrected comment>
Improve: [file:line] <what the reader lacks> -> <the line to add>
Remove:  [file:line] <why it adds nothing>
```

## Tests

Judge behavioural coverage, not line coverage. Look for:

- an error path with no test, which can hide a silent failure;
- a boundary with no case;
- a business branch no test reaches;
- validation with no negative case;
- concurrent or async behaviour with no test, where order matters.

A good test fails when the behaviour changes and passes when only the
implementation changes. Flag a test that pins implementation details, and one
that would not catch a real regression. Do not ask for tests of trivial
getters and setters. Name the integration test that already covers a case
instead of asking for a second one.

Rate each missing test for criticality (this is not confidence):

- 9-10: data loss, a security hole or a system failure;
- 7-8: business logic whose failure the user sees;
- 5-6: an edge case that confuses or causes a minor issue;
- 3-4 and below: nice to have; not reported.

Gaps rated 8-10 are INFORMATIONAL findings in the main list, and 5-7 are
ADVISORY. Writing the test is an ASK.

```
[file:line] Test gap (N/10): <behaviour not covered> -> <input, expected result, the regression it catches>
[test:line] Brittle: <the detail it pins> -> <how to test the behaviour instead>
```

## Types

For each type the diff adds or changes, list its invariants: data that must
agree, valid state transitions, rules between fields, pre- and postconditions.
Then rate four axes from 1 to 10:

- **Encapsulation**: are the internals hidden, or can outside code break an
  invariant?
- **Invariant expression**: does the structure state the invariants, at
  compile time where possible?
- **Invariant usefulness**: do they prevent real bugs, without being too
  strict or too loose?
- **Invariant enforcement**: is every invariant checked at construction and at
  every mutation, so an invalid instance cannot exist?

Make illegal states unrepresentable. Validate in the constructor. Prefer a
compile-time guarantee to a runtime check. Immutability makes invariants
simpler to keep. Flag mutable internals exposed to callers, invariants kept
only in documentation, no validation at construction, enforcement that differs
between mutation methods, and a type that relies on outside code to stay
valid. Count the complexity cost of every suggestion: sometimes a simpler type
with fewer guarantees is the better design.

Rating: always ADVISORY.

```
Type <Name> [file:line]
  Invariants: <one per line>
  Encapsulation N/10, Expression N/10, Usefulness N/10, Enforcement N/10
  Concern: <the specific issue> -> <the smallest change that fixes it>
```
