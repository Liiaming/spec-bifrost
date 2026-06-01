export type DiagnosticType = "json_syntax_error" | "schema_error" | "reference_error" | "render_error";

export interface SpecDiagnostic {
  path: string;
  type: DiagnosticType;
  message: string;
  context?: string;
  value?: unknown;
}

export interface ValidationResult {
  ok: boolean;
  errors: SpecDiagnostic[];
}

export function formatDiagnostics(title: string, errors: SpecDiagnostic[]): string {
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
