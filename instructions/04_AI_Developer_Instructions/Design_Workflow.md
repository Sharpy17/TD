---
title: "Design Workflow"
tags:
  - ai-instructions
  - design
date: 2026-11-05
---

# Design Workflow

Use this for every design-related task: new screens, redesigns, restyles and visual polish. Each tool has one job, and they run in this order.

| Step | Tool | Job | Do not use it for |
|---|---|---|---|
| 1. Direction | `taste` (skill name `design-taste-frontend`) | Set the initial design direction: palette, type pairing, radius, what to avoid | Reviewing finished work |
| 2. Review and quality | `impeccable` | Critique, audit, polish, hardening, visual anti-pattern detection, updating `DESIGN.md` | Choosing the initial direction |
| 3. Final anti-slop audit | `unslop` | Audit all user-facing copy, once, at the very end | Earlier steps or visual review |

## 1. Direction with taste

- Read `PRODUCT.md` and `DESIGN.md` first. Product facts and brand commitments win over anything a tool deals. Dark interface + orange is binding.
- Deal options with `start.mjs deal --page software`. If the dealt palettes ignore the brand, pick from `library/palettes.json` or set the brand colours yourself.
- Taste is built for marketing websites. On a marketing page, use all of it. On app screens (home, board, chats, settings), use only its palette, type pairing, radius and bans. Skip its hero deals, one-section-per-screen rule, photographs and page checkers, and do not copy its `assets/` folder into this repo.
- Show the user rendered options using real product data, and let them choose. A replacement direction is their call.

## 2. Review and quality with impeccable

- Build the chosen direction, then run impeccable on the rendered result, on desktop and mobile.
- Taste owns the direction, so skip impeccable's own direction round (`concept-seed`) on these tasks.
- Run `impeccable detect` on the changed files, fix what it finds, then run the finish review.
- When the visual system changes, update `DESIGN.md`, `.impeccable/design.json` and the surface brief so they describe what shipped.

## 3. Final audit with unslop

- Run this last, after all visual work is finished. Copy changes during review would otherwise go unaudited.
- Unslop works on prose only. Point it at user-facing text: labels, empty states, errors, onboarding and marketing copy.
- Visual AI tells belong to impeccable in step 2.

## Installing the skills

`impeccable` and `unslop` live in `~/.claude/skills`. Install taste the same way, from a reviewed commit:

```bash
git clone https://github.com/leonxlnx/taste-skill.git
cp -r taste-skill/skills/taste-skill ~/.claude/skills/design-taste-frontend
```

Reviewed commit: `9b4bf93` (2026-11-05). Read the `SKILL.md` of any newer version before installing it.

Follow the [Team Git Workflow](Team_Git_Workflow.md) for branches and pushes.
