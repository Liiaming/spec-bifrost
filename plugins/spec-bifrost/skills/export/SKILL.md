---
name: export
description: Export frontend and backend Markdown requirement documents from spec-bifrost.json.
---

# Spec Bifrost Export

1. Run `spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR}"`.
2. If validation passes, read `${CLAUDE_PROJECT_DIR}/spec-bifrost.json`.
3. Generate:
   - `docs/spec-bifrost/frontend-requirements.md`
   - `docs/spec-bifrost/backend-requirements.md`
4. Keep both files as requirement documents.
5. Do not include API definitions, database tables, technical architecture, code structure, task breakdowns, entity models, or implementation advice.
