export function createPreviewState() {
    let lastKnownGood;
    let diagnostics = [];
    return {
        acceptGoodSpec(spec) {
            lastKnownGood = spec;
            diagnostics = [];
        },
        acceptRenderError(error) {
            diagnostics = [error];
        },
        getLastKnownGood() {
            return lastKnownGood;
        },
        getDiagnostics() {
            return diagnostics;
        }
    };
}
