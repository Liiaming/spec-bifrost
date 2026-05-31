const PREVIEW_SHUTDOWN_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"];
export function installPreviewShutdownHandlers(previewServer, previewProcess = process) {
    let closing = false;
    const removeHandlers = () => {
        for (const signal of PREVIEW_SHUTDOWN_SIGNALS) {
            previewProcess.off(signal, shutdown);
        }
    };
    const shutdown = () => {
        if (closing)
            return;
        closing = true;
        removeHandlers();
        void previewServer.close().then(() => {
            previewProcess.exit(0);
        }, (error) => {
            console.error(error instanceof Error ? error.message : "Spec Bifrost preview failed to stop.");
            previewProcess.exit(1);
        });
    };
    for (const signal of PREVIEW_SHUTDOWN_SIGNALS) {
        previewProcess.on(signal, shutdown);
    }
    return removeHandlers;
}
