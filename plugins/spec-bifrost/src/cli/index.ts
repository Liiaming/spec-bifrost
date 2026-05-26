#!/usr/bin/env node
import { resolve } from "node:path";
import { SPEC_FILE_NAME } from "../core/constants.js";
import { formatDiagnostics } from "../core/diagnostics.js";
import { readSpecFile } from "../core/readSpec.js";

const args = process.argv.slice(2);
const command = args[0];

if (command === "validate") {
  const result = await readCurrentSpec(args);
  if (result.ok) {
    console.log("Spec Bifrost validation passed.");
    process.exit(0);
  }
  console.error(formatDiagnostics("Spec Bifrost validation failed", result.errors));
  process.exit(1);
}

if (command === "preview") {
  const cwd = readFlag(args, "--cwd") ?? process.env["CLAUDE_PROJECT_DIR"] ?? process.cwd();
  const port = Number(readFlag(args, "--port") ?? "3737");
  const host = readFlag(args, "--host") ?? "127.0.0.1";
  const { startPreviewServer } = await import("../renderer/server.js");
  const server = await startPreviewServer({ cwd, port, host });
  console.log(`Spec Bifrost preview running at ${server.url}`);
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
  await new Promise<never>(() => undefined);
}

if (command === "refresh") {
  const result = await readCurrentSpec(args);
  if (result.ok) {
    console.log("Spec Bifrost refresh requested. The running preview file watcher will reload spec-bifrost.json automatically.");
    process.exit(0);
  }
  console.error(formatDiagnostics("Spec Bifrost refresh failed", result.errors));
  process.exit(1);
}

if (command === "diagnostics") {
  const result = await readCurrentSpec(args);
  if (result.ok) {
    console.log("Spec Bifrost diagnostics passed.");
    process.exit(0);
  }
  console.log(formatDiagnostics("Spec Bifrost diagnostics found issues", result.errors));
  process.exit(1);
}

console.error("Usage: spec-bifrost <validate|preview|refresh|diagnostics> [--cwd <path>]");
process.exit(1);

function readFlag(values: string[], name: string): string | undefined {
  const index = values.indexOf(name);
  if (index === -1) return undefined;
  return values[index + 1];
}

async function readCurrentSpec(values: string[]) {
  const cwd = readFlag(values, "--cwd") ?? process.env["CLAUDE_PROJECT_DIR"] ?? process.cwd();
  const specPath = resolve(cwd, SPEC_FILE_NAME);
  return readSpecFile(specPath);
}
