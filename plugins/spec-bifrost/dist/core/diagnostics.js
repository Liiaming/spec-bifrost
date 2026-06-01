export function formatDiagnostics(title, errors) {
    const lines = [`${title}.`, ""];
    for (const diagnostic of errors) {
        lines.push(`- path: ${diagnostic.path}`);
        lines.push(`  type: ${diagnostic.type}`);
        if (diagnostic.context !== undefined) {
            lines.push(`  context: ${diagnostic.context}`);
        }
        lines.push(`  message: ${diagnostic.message}`);
        if ("value" in diagnostic) {
            lines.push(`  value: ${JSON.stringify(diagnostic.value)}`);
        }
        lines.push("");
    }
    return lines.join("\n").trimEnd();
}
