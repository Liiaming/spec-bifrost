import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runPostToolUseValidation } from "../../src/hooks/postToolUseValidate.ts";

test("hook ignores non spec files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-hook-"));
  try {
    const result = await runPostToolUseValidation({
      cwd: dir,
      toolName: "Write",
      filePath: join(dir, "README.md")
    });
    assert.equal(result.decision, "approve");
    assert.equal(result.message, "");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("hook ignores nested spec files outside the project root entry", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-hook-"));
  try {
    const result = await runPostToolUseValidation({
      cwd: dir,
      toolName: "Write",
      filePath: join(dir, "nested", "spec-bifrost.json")
    });
    assert.equal(result.decision, "approve");
    assert.equal(result.message, "");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("hook blocks invalid spec facts only", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-hook-"));
  try {
    await writeFile(join(dir, "spec-bifrost.json"), "{bad-json}");
    const result = await runPostToolUseValidation({
      cwd: dir,
      toolName: "Write",
      filePath: join(dir, "spec-bifrost.json")
    });
    assert.equal(result.decision, "block");
    assert.match(result.message, /Spec Bifrost validation failed/);
    assert.doesNotMatch(result.message, /suggestion/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
