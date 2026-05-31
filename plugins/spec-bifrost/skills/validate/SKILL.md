---
name: validate
description: Manually validate spec-bifrost.json for JSON syntax, schema, and reference integrity.
---

# Spec Bifrost Validate

Run:

```bash
spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR:-$PWD}"
```

If validation fails, read the error facts and repair `spec-bifrost.json` using `/spec-bifrost:spec`. The validator only reports facts.
