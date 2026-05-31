import type { SpecBifrostDocument } from "../core/types.js";
import type { RenderDiagnostic } from "./state.js";
export interface RenderPrototypeInput {
    spec: SpecBifrostDocument;
    diagnostics: RenderDiagnostic[];
}
export declare function renderPrototypeHtml(input: RenderPrototypeInput): string;
