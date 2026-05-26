---
name: preview
description: Start the local Spec Bifrost preview service for spec-bifrost.json.
---

# Spec Bifrost Preview

Run:

```bash
spec-bifrost preview --cwd "${CLAUDE_PROJECT_DIR}" --host 127.0.0.1 --port 3737
```

Open `http://127.0.0.1:3737` in the browser after the service starts.

The preview service does not write `spec-bifrost.json`. It keeps last known good output and reports render error facts.

Preview field input stays in browser memory. Conditional display, conditional required fields, conditional enabled state, and conditional action navigation are evaluated from the current page values.
