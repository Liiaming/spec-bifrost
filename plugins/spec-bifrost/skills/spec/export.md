# Spec Bifrost Export Rules

Markdown exports are requirement documents, not design documents and not implementation plans.

Default output files:

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

## Frontend Requirement Document

Include:

- system overview and page list
- page purpose
- page structure and major regions
- fields, field meaning, defaults, options, required state, and validation rules
- visible user actions such as buttons, links, modals, and drawers
- navigation, conditional display, conditional enablement, conditional required state, and conditional routing
- empty states, prompt copy, error copy, and status display
- product notes from pages, sections, components, fields, actions, and buttons

Do not include:

- component library choice
- CSS or animation implementation
- frontend code structure
- API call design
- state management design
- task breakdowns

## Backend Requirement Document

Include:

- system overview and business flow
- business concepts, field meanings, and source pages
- field validation rules, ranges, and required conditions
- status semantics, conditional branches, and transition conditions
- business rules, boundaries, and exceptional scenarios
- prompt or error semantics that backend engineers need to understand
- product notes relevant to business semantics

Do not include:

- page layout, component structure, or visual style
- entity models
- domain object design
- API definitions
- database table design
- service decomposition or technical architecture
- code structure
- task breakdowns
- implementation advice

If the JSON does not contain enough information, write `当前需求未说明` instead of inventing implementation details.
