export interface RenderDiagnostic {
  pageId?: string;
  componentId?: string;
  type: "component_render_error" | "data_format_error" | "reference_render_error";
  jsonPath: string;
  message: string;
}

export interface PreviewState {
  acceptGoodSpec(spec: unknown): void;
  acceptRenderError(error: RenderDiagnostic): void;
  getLastKnownGood(): unknown | undefined;
  getDiagnostics(): RenderDiagnostic[];
}

export function createPreviewState(): PreviewState {
  let lastKnownGood: unknown | undefined;
  let diagnostics: RenderDiagnostic[] = [];

  return {
    acceptGoodSpec(spec: unknown): void {
      lastKnownGood = spec;
      diagnostics = [];
    },
    acceptRenderError(error: RenderDiagnostic): void {
      diagnostics = [error];
    },
    getLastKnownGood(): unknown | undefined {
      return lastKnownGood;
    },
    getDiagnostics(): RenderDiagnostic[] {
      return diagnostics;
    }
  };
}
