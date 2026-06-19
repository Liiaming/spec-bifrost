# Product

## Register

product

## Users

Spec Bifrost serves product managers, independent developers, small teams, and open-source contributors who use Claude Code, Codex, or OpenCode to turn product ideas into local, reviewable requirement prototypes.

Users work inside a local development workspace. They need to inspect pages, fields, rules, notes, and flows quickly, then decide whether the structured `spec-bifrost.json` still matches the intended B-end product requirement.

## Product Purpose

Spec Bifrost captures requirements in a validatable local JSON layer, renders that structure as a multi-page B-end preview, and guides export into frontend and backend requirement documents.

Success means the preview is credible enough for requirement review, clear enough to expose drift in pages or rules, and constrained enough to avoid becoming a low-code platform, production UI generator, API designer, database designer, or task-planning tool.

## Brand Personality

Credible, restrained, workflow-focused.

The interface should feel like a reliable internal product review tool: quiet enough for dense requirement reading, precise enough for engineering handoff, and direct enough that users trust the JSON-backed prototype instead of seeing generic AI-generated UI decoration.

## Anti-references

Avoid obvious AI UI tells: decorative card grids, thick side accent borders, excessive soft shadows, glass effects, gradient text, oversized hero-style typography, warm generic SaaS palettes, and visual noise that makes requirement content harder to scan.

Avoid production-app cosplay. The renderer should communicate product requirements and interaction shape, not pretend to be a finished enterprise system.

## Design Principles

- Requirements first: every visual treatment should help users read pages, fields, rules, states, actions, or notes.
- Earned familiarity: use standard B-end navigation, tables, forms, tabs, and panels so users can focus on the requirement content.
- Low-noise hierarchy: distinguish page context, sections, components, metadata, and annotations without turning every block into a decorative card.
- Local trust: make validation, last-known-good preview, and non-persistence boundaries visible without alarming users.
- Broad expression, consistent grammar: many requirement component types can exist, but they should share spacing, typography, states, and semantic color meaning.

## Accessibility & Inclusion

Use WCAG AA contrast as the baseline. Preserve visible keyboard focus, semantic structure, clickable labels, reduced-motion behavior, mobile readability, and long-content handling across generated previews.
