---
name: spec
description: Create, modify, and repair the local spec-bifrost.json requirement prototype for a multi-page B-end system.
---

# Spec Bifrost Spec Skill

Use this skill when the user asks to create or modify a Spec Bifrost prototype, describes product requirements, asks to update pages, fields, rules, notes, interactions, or asks to repair hook or renderer errors.

## Core Rules

- The single source of truth is `${CLAUDE_PROJECT_DIR:-$PWD}/spec-bifrost.json`.
- The user should work through chat. Do not ask the product manager to hand-write JSON.
- Keep the JSON page-driven.
- Support a multi-page B-end system, not a single-page flow.
- Use `notes` for product facts that are not stable enough to structure. `notes` may appear on pages, sections, components, fields, actions, and buttons.
- Do not generate production code.
- Do not create API definitions, database design, technical architecture, task breakdowns, or implementation advice.
- Hook and renderer diagnostics contain error facts only. Use this skill and `schema.md` to decide how to repair JSON.

## Supporting References

- Read `schema.md` before creating or repairing JSON.
- Read `export.md` before exporting requirement documents.
- Read `examples.md` when you need a concrete procurement system pattern.
