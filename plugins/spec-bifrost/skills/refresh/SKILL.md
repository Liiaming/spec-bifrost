---
name: refresh
description: Refresh the Spec Bifrost preview after spec-bifrost.json changes.
---

# Spec Bifrost Refresh

Use this when the preview service is already running and the user wants a manual refresh.

Run:

```bash
spec-bifrost refresh --cwd "${CLAUDE_PROJECT_DIR:-$PWD}"
```

The command validates the current `spec-bifrost.json`. A running preview service also watches the file and reloads automatically after the JSON changes.
