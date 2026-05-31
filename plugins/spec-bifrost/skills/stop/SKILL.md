---
name: stop
description: Manually stop a lingering Spec Bifrost preview process that is holding port 3737.
---

# Spec Bifrost Stop

Use this when the preview was started earlier and port `3737` is still occupied after closing Claude Code or Codex.

First inspect the listener:

```bash
lsof -nP -iTCP:3737 -sTCP:LISTEN
```

Only stop the process if the listener is the Spec Bifrost preview process or the `node` process that runs `spec-bifrost preview`.

```bash
kill <PID>
```

Then verify the port is free:

```bash
lsof -nP -iTCP:3737 -sTCP:LISTEN
```

If the process is still listening after a normal `kill`, ask the user before using `kill -9 <PID>`. Do not terminate unrelated processes that happen to use port `3737`.
