import { watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { SPEC_FILE_NAME } from "../core/constants.js";
import type { SpecBifrostDocument } from "../core/types.js";
import { validateSpec } from "../core/validate.js";
import { renderPrototypeHtml } from "./renderHtml.js";
import { createPreviewState, type PreviewState } from "./state.js";

export interface PreviewServerOptions {
  cwd: string;
  port: number;
  host: string;
}

export async function loadPreviewStateFromSpecPath(specPath: string, state: PreviewState): Promise<void> {
  let raw: string;
  try {
    raw = await readFile(specPath, "utf8");
  } catch (error) {
    state.acceptRenderError({
      type: "data_format_error",
      jsonPath: "",
      message: error instanceof Error ? error.message : "Unable to read spec file."
    });
    return;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = validateSpec(parsed);
    if (!result.ok) {
      state.acceptRenderError({
        type: "data_format_error",
        jsonPath: result.errors[0]?.path ?? "",
        message: result.errors[0]?.message ?? "Spec validation failed."
      });
      return;
    }
    renderPrototypeHtml({ spec: parsed as SpecBifrostDocument, diagnostics: [] });
    state.acceptGoodSpec(parsed);
  } catch (error) {
    state.acceptRenderError({
      type: error instanceof SyntaxError ? "data_format_error" : "component_render_error",
      jsonPath: "",
      message: `Spec render failed: ${error instanceof Error ? error.message : "Unknown render error."}`
    });
  }
}

export async function startPreviewServer(options: PreviewServerOptions): Promise<{ url: string; close: () => Promise<void> }> {
  const state = createPreviewState();
  const specPath = resolve(options.cwd, SPEC_FILE_NAME);

  function load(): void {
    void loadPreviewStateFromSpecPath(specPath, state);
  }

  load();
  const watcher = watch(specPath, { persistent: false }, load);

  const server = createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    const spec = state.getLastKnownGood() as SpecBifrostDocument | undefined;
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    if (!spec) {
      response.end("<!doctype html><html><body><h1>Spec Bifrost</h1><p>当前没有可预览的有效 JSON。</p></body></html>");
      return;
    }
    response.end(renderPrototypeHtml({ spec, diagnostics: state.getDiagnostics() }));
  });

  await new Promise<void>((resolveStart) => server.listen(options.port, options.host, resolveStart));
  return {
    url: `http://${options.host}:${options.port}`,
    close: async () => {
      watcher.close();
      await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
    }
  };
}
