---
title: "Team Git Workflow"
tags:
  - ai-instructions
  - engineering
  - git
date: 2026-10-31
---

# Team Git Workflow

This is the agreed workflow for collaborating on Toguz with multiple developers. Apply it to every feature task.

1. **Use a separate branch.** Start from the latest `main` and create a descriptive `feature/<name>` or `fix/<name>` branch. Keep unrelated local changes out of the task's commits.
2. **Finish before asking to push.** Implement the requested work, run the relevant checks, and prepare focused commits. Summarize the changes and verification, then ask the user whether to push. Do not push without their approval.
3. **Sync after approval.** Fetch the latest `origin/main` to check for teammates' updates, and merge it into the feature branch. Resolve conflicts while preserving both contributors' intended behavior, and rerun relevant checks. If intent is unclear, ask the user before choosing a resolution.
4. **Push promptly.** Once synchronization and checks succeed, push the feature branch immediately without asking for the same approval again. If the remote branch has advanced, integrate its changes and verify again; do not overwrite teammates' work with a force push.
5. **Keep merging into main explicit.** Approval to push a feature branch does not authorize merging it into `main`. Merge into or push directly to `main` only when the user explicitly requests it. An explicit request to push already provides push approval for that work.
6. **Clean up merged branches.** After verifying that the feature has been merged into `main`, delete its branch both locally and on GitHub (`origin`). Switch away from the branch before deleting it, and verify that both copies are gone. Keep unmerged branches so work is not lost. Never delete `main`.

When the user explicitly requests a direct update to `main`, synchronize with the latest `origin/main` before pushing and include only the authorized changes.
