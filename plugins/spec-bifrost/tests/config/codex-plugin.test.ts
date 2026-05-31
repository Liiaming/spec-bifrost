import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function assertRecord(value: unknown, path: string): asserts value is Record<string, unknown> {
  assert.equal(typeof value, "object", `${path} should be an object`);
  assert.notEqual(value, null, `${path} should not be null`);
  assert.equal(Array.isArray(value), false, `${path} should not be an array`);
}

test("Codex plugin manifest exposes skills and desktop interface metadata", async () => {
  const manifestPath = "plugins/spec-bifrost/.codex-plugin/plugin.json";
  const manifest = await readJson(manifestPath);

  assertRecord(manifest, manifestPath);
  assert.equal(manifest.name, "spec-bifrost");
  assert.match(String(manifest.version), /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.hooks, undefined);
  assert.equal(manifest.apps, undefined);
  assert.equal(manifest.mcpServers, undefined);

  const interfaceConfig = manifest.interface;
  assertRecord(interfaceConfig, `${manifestPath}.interface`);
  assert.equal(interfaceConfig.displayName, "Spec Bifrost");
  assert.equal(interfaceConfig.developerName, "Spec Bifrost");
  assert.equal(interfaceConfig.category, "Productivity");
  assert.deepEqual(interfaceConfig.capabilities, ["Interactive", "Read", "Write"]);
  assert.ok(String(interfaceConfig.shortDescription).includes("requirements"));
  assert.ok(String(interfaceConfig.longDescription).includes("spec-bifrost.json"));
  assert.equal(/^#[0-9A-Fa-f]{6}$/.test(String(interfaceConfig.brandColor)), true);

  await access(join("plugins/spec-bifrost", String(manifest.skills), "spec", "SKILL.md"));
});

test("Codex marketplace catalog points at the Spec Bifrost plugin", async () => {
  const marketplacePath = ".agents/plugins/marketplace.json";
  const marketplace = await readJson(marketplacePath);

  assertRecord(marketplace, marketplacePath);
  assert.equal(marketplace.name, "spec-bifrost-marketplace");

  const plugins = marketplace.plugins;
  assert.equal(Array.isArray(plugins), true);
  assert.equal((plugins as unknown[]).length, 1);

  const [entry] = plugins as unknown[];
  assertRecord(entry, `${marketplacePath}.plugins[0]`);
  assert.equal(entry.name, "spec-bifrost");
  assert.equal(entry.category, "Productivity");

  const source = entry.source;
  assertRecord(source, `${marketplacePath}.plugins[0].source`);
  assert.equal(source.source, "local");
  assert.equal(source.path, "./plugins/spec-bifrost");

  const policy = entry.policy;
  assertRecord(policy, `${marketplacePath}.plugins[0].policy`);
  assert.equal(policy.installation, "AVAILABLE");
  assert.equal(policy.authentication, "ON_INSTALL");
});

test("shared skills use a portable project cwd for Claude Code and Codex", async () => {
  const skillPaths = [
    "plugins/spec-bifrost/skills/export/SKILL.md",
    "plugins/spec-bifrost/skills/preview/SKILL.md",
    "plugins/spec-bifrost/skills/refresh/SKILL.md",
    "plugins/spec-bifrost/skills/spec/SKILL.md",
    "plugins/spec-bifrost/skills/validate/SKILL.md"
  ];

  for (const skillPath of skillPaths) {
    const text = await readFile(skillPath, "utf8");
    assert.ok(text.includes("${CLAUDE_PROJECT_DIR:-$PWD}"), `${skillPath} should support Codex cwd fallback`);
  }
});

test("Codex hook config loads from plugin root without Claude-only paths", async () => {
  const hookPath = "plugins/spec-bifrost/hooks.json";
  const hookConfig = await readJson(hookPath);

  assertRecord(hookConfig, hookPath);
  const hooks = hookConfig.hooks;
  assertRecord(hooks, `${hookPath}.hooks`);
  const postToolUse = hooks.PostToolUse;
  assert.equal(Array.isArray(postToolUse), true);

  const [entry] = postToolUse as unknown[];
  assertRecord(entry, `${hookPath}.hooks.PostToolUse[0]`);
  assert.equal(entry.matcher, "Write|Edit|MultiEdit");

  const hookEntries = entry.hooks;
  assert.equal(Array.isArray(hookEntries), true);
  const [commandEntry] = hookEntries as unknown[];
  assertRecord(commandEntry, `${hookPath}.hooks.PostToolUse[0].hooks[0]`);
  assert.equal(commandEntry.type, "command");
  assert.equal(commandEntry.command, "node ./dist/hooks/postToolUseValidate.js");
});

test("stop skill documents manual preview port cleanup", async () => {
  const skillPath = "plugins/spec-bifrost/skills/stop/SKILL.md";
  const text = await readFile(skillPath, "utf8");

  assert.match(text, /name: stop/);
  assert.match(text, /3737/);
  assert.match(text, /lsof/);
  assert.match(text, /kill/);
});
