export type DiagnosticType = "json_syntax_error" | "schema_error" | "reference_error" | "render_error";
export interface SpecDiagnostic {
    path: string;
    type: DiagnosticType;
    message: string;
    value?: unknown;
}
export interface ValidationResult {
    ok: boolean;
    errors: SpecDiagnostic[];
}
export declare function formatDiagnostics(title: string, errors: SpecDiagnostic[]): string;
