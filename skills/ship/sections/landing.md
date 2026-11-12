<!-- Lilystack. Rewritten from superpowers skills/finishing-a-development-branch/SKILL.md at 22f0b46 (MIT, Copyright (c) 2025 Jesse Vincent). -->

# Landing

Read when the landing question of `/lilystack:ship` Step 8 is answered with
a local merge or with keep, or when the owner asks to discard the work.

## Merge locally

1. The base is the one from Step 1. If the branch may have forked from
   another branch, ask before merging: a merge into the wrong base is
   expensive to undo.
2. ASK, showing the commands: `git switch <base>`, `git pull --ff-only`
   (a network call; skipped with no remote), `git merge <branch>`.
3. Run Step 3's exact commands again on the merged result. A green run
   proves only the tree it ran on.
4. Red on the merged result: stop. Leave the branch and any worktree in
   place and report the failure. Nothing was pushed, so the merge is local
   and the owner can undo it. Do not call the failure flaky without proof.
5. Green: offer `git branch -d <branch>` as its own ASK. `-d` refuses a
   branch that is not merged; never use `-D` here.
6. A push of `<base>` is a separate ASK, never part of the merge.

## Keep the branch

Change nothing. Report the branch, its HEAD and the worktree path.

## Discard

Never offer this. It exists only when the owner asks, in so many words, to
throw the work away.

1. Show what would go: the branch, its commits (`git log <base>..HEAD
   --oneline`), the uncommitted and untracked files, and the worktree path.
2. Ask the owner to type `discard`. "Yes" or "get rid of it" is not that
   word: ask again.
3. Move, do not delete. Move uncommitted and untracked files to
   `~/to-delete/<date>/<repo>/<original path>`. Save the commits with
   `git bundle create ~/to-delete/<date>/<repo>/<branch>.bundle <base>..<branch>`
   and check it with `git bundle verify`. Only then `git branch -D <branch>`.

## Worktrees

- Remove only a worktree that this session created (the scratch worktree of
  Step 3 or of the mutation probe), with `git worktree remove <path>`, after
  an ASK. Any other worktree belongs to the owner or the host: leave it.
- Never `--force`. A refusal means the worktree holds files that exist
  nowhere else. Show `git -C <path> status --porcelain -uall` and ask:
  commit them, move them into the main checkout, or move them to
  `~/to-delete/`.
- After a PR, the worktree stays: review feedback is fixed there.
