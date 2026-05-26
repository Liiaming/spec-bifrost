import { readFile } from "node:fs/promises";
import type { ValidationResult } from "./diagnostics.js";
import { validateSpec } from "./validate.js";

export async function readSpecFile(path: string | URL): Promise<ValidationResult> {
  try {
    const raw = await readText(path);
    const parsed = JSON.parse(raw) as unknown;
    return validateSpec(parsed);
  } catch (error) {
    return {
      ok: false,
      errors: [
        {
          path: "",
          type: "json_syntax_error",
          message: error instanceof Error ? error.message : "Unable to parse JSON.",
          value: String(path)
        }
      ]
    };
  }
}

async function readText(path: string | URL): Promise<string> {
  if (path instanceof URL && path.protocol === "data:") {
    return decodeURIComponent(path.pathname);
  }
  return readFile(path, "utf8");
}
