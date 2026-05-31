import { readFile } from "node:fs/promises";
import { validateSpec } from "./validate.js";
export async function readSpecFile(path) {
    try {
        const raw = await readText(path);
        const parsed = JSON.parse(raw);
        return validateSpec(parsed);
    }
    catch (error) {
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
async function readText(path) {
    if (path instanceof URL && path.protocol === "data:") {
        return decodeURIComponent(path.pathname);
    }
    return readFile(path, "utf8");
}
