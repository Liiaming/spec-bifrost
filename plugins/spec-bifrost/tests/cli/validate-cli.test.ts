import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("validate command passes for valid spec", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-cli-"));
  try {
    await writeFile(
      join(dir, "spec-bifrost.json"),
      JSON.stringify({
        schemaVersion: "1.0",
        project: { name: "采购申请", description: "测试", actors: ["申请人"] },
        pages: [{ id: "list", title: "列表", purpose: "查看", route: "/list", type: "list", sections: [] }]
      })
    );

    const result = spawnSync("node", ["plugins/spec-bifrost/src/cli/index.ts", "validate", "--cwd", dir], {
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "--import tsx" }
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Spec Bifrost validation passed/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("validate command fails with facts only", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-cli-"));
  try {
    await writeFile(join(dir, "spec-bifrost.json"), "{bad-json}");

    const result = spawnSync("node", ["plugins/spec-bifrost/src/cli/index.ts", "validate", "--cwd", dir], {
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "--import tsx" }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Spec Bifrost validation failed/);
    assert.doesNotMatch(result.stderr, /suggestion/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("diagnostics command reports validation facts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-cli-"));
  try {
    await writeFile(join(dir, "spec-bifrost.json"), "{bad-json}");

    const result = spawnSync("node", ["plugins/spec-bifrost/src/cli/index.ts", "diagnostics", "--cwd", dir], {
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "--import tsx" }
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Spec Bifrost diagnostics found issues/);
    assert.match(result.stdout, /json_syntax_error/);
    assert.doesNotMatch(result.stdout, /available after renderer/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("refresh command validates current spec and reports automatic reload", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-cli-"));
  try {
    await writeFile(
      join(dir, "spec-bifrost.json"),
      JSON.stringify({
        schemaVersion: "1.0",
        project: { name: "采购申请", description: "测试", actors: ["申请人"] },
        pages: [{ id: "list", title: "列表", purpose: "查看", route: "/list", type: "list", sections: [] }]
      })
    );

    const result = spawnSync("node", ["plugins/spec-bifrost/src/cli/index.ts", "refresh", "--cwd", dir], {
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "--import tsx" }
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Spec Bifrost refresh requested/);
    assert.match(result.stdout, /file watcher/);
    assert.doesNotMatch(result.stdout, /available after renderer/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
