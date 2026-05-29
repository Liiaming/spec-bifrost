import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createPreviewState } from "../../src/renderer/state.ts";

test("preview state keeps last known good after render error", () => {
  const state = createPreviewState();
  const goodSpec = {
    schemaVersion: "1.0",
    project: { name: "采购申请", description: "测试", actors: ["申请人"] },
    pages: [{ id: "list", title: "列表", purpose: "查看", route: "/list", type: "list", sections: [] }]
  };

  state.acceptGoodSpec(goodSpec);
  state.acceptRenderError({
    pageId: "detail",
    componentId: "timeline",
    type: "component_render_error",
    jsonPath: "pages[1].sections[0].components[0]",
    message: "timeline component cannot render without items or emptyState."
  });

  assert.equal(state.getLastKnownGood(), goodSpec);
  assert.equal(state.getDiagnostics()[0]?.type, "component_render_error");
});

test("preview server can be imported", async () => {
  const module = await import("../../src/renderer/server.ts");
  assert.equal(typeof module.startPreviewServer, "function");
});

test("preview watcher tolerates missing spec file", async () => {
  const { startSpecWatcher } = await import("../../src/renderer/server.ts");
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-preview-"));
  try {
    const state = createPreviewState();
    const watcher = startSpecWatcher(dir, () => undefined, state);
    watcher?.close();
    assert.ok(watcher === undefined || typeof watcher.close === "function");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("preview loader keeps last known good after invalid spec", async () => {
  const { loadPreviewStateFromSpecPath } = await import("../../src/renderer/server.ts");
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-preview-"));
  const specPath = join(dir, "spec-bifrost.json");
  const state = createPreviewState();
  try {
    const goodSpec = {
      schemaVersion: "1.0",
      project: { name: "采购申请", description: "测试", actors: ["申请人"] },
      pages: [{ id: "list", title: "列表", purpose: "查看", route: "/list", type: "list", sections: [] }]
    };
    await writeFile(specPath, JSON.stringify(goodSpec));
    await loadPreviewStateFromSpecPath(specPath, state);

    await writeFile(
      specPath,
      JSON.stringify({
        schemaVersion: "1.0",
        project: { name: "采购申请", description: "测试", actors: ["申请人"] },
        pages: [
          {
            id: "list",
            title: "列表",
            purpose: "查看",
            route: "/list",
            type: "list",
            sections: [
              {
                id: "progress",
                components: [{ id: "approvalSteps", type: "steps", items: { title: "不是数组" } }]
              }
            ]
          }
        ]
      })
    );
    await loadPreviewStateFromSpecPath(specPath, state);

    assert.deepEqual(state.getLastKnownGood(), goodSpec);
    assert.equal(state.getDiagnostics()[0]?.type, "data_format_error");
    assert.equal(state.getDiagnostics()[0]?.jsonPath, "pages[0].sections[0].components[0].items");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
