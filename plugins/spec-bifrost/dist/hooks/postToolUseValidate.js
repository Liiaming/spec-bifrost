import { resolve } from "node:path";
import { SPEC_FILE_NAME } from "../core/constants.js";
import { formatDiagnostics } from "../core/diagnostics.js";
import { readSpecFile } from "../core/readSpec.js";
export async function runPostToolUseValidation(input) {
    if (!["Write", "Edit", "MultiEdit"].includes(input.toolName)) {
        return { decision: "approve", message: "" };
    }
    const specPath = resolve(input.cwd, SPEC_FILE_NAME);
    if (input.filePath === undefined || resolve(input.cwd, input.filePath) !== specPath) {
        return { decision: "approve", message: "" };
    }
    const result = await readSpecFile(specPath);
    if (result.ok) {
        return { decision: "approve", message: "" };
    }
    return {
        decision: "block",
        message: formatDiagnostics("Spec Bifrost validation failed", result.errors)
    };
}
if (process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`) {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    const parsed = raw.length > 0 ? JSON.parse(raw) : {};
    const record = isRecord(parsed) ? parsed : {};
    const toolInput = isRecord(record["tool_input"]) ? record["tool_input"] : {};
    const cwdValue = typeof record["cwd"] === "string"
        ? record["cwd"]
        : process.env["CLAUDE_PROJECT_DIR"] ?? process.env["CODEX_PROJECT_DIR"] ?? process.cwd();
    const toolNameValue = typeof record["tool_name"] === "string" ? record["tool_name"] : typeof record["toolName"] === "string" ? record["toolName"] : "";
    const filePathValue = typeof toolInput["file_path"] === "string" ? toolInput["file_path"] : typeof record["filePath"] === "string" ? record["filePath"] : undefined;
    const hookInput = {
        cwd: cwdValue,
        toolName: toolNameValue
    };
    if (filePathValue !== undefined) {
        hookInput.filePath = filePathValue;
    }
    const result = await runPostToolUseValidation(hookInput);
    if (result.decision === "block") {
        console.error(result.message);
        process.exit(2);
    }
    process.exit(0);
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
