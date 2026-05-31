export interface ClosablePreviewServer {
  close: () => Promise<void>;
}

export interface PreviewProcess {
  on: (signal: NodeJS.Signals, listener: () => void) => unknown;
  off: (signal: NodeJS.Signals, listener: () => void) => unknown;
  exit: (code?: number) => never | void;
}

const PREVIEW_SHUTDOWN_SIGNALS: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"];

export function installPreviewShutdownHandlers(
  previewServer: ClosablePreviewServer,
  previewProcess: PreviewProcess = process
): () => void {
  let closing = false;

  const removeHandlers = () => {
    for (const signal of PREVIEW_SHUTDOWN_SIGNALS) {
      previewProcess.off(signal, shutdown);
    }
  };

  const shutdown = () => {
    if (closing) return;
    closing = true;
    removeHandlers();
    void previewServer.close().then(
      () => {
        previewProcess.exit(0);
      },
      (error: unknown) => {
        console.error(error instanceof Error ? error.message : "Spec Bifrost preview failed to stop.");
        previewProcess.exit(1);
      }
    );
  };

  for (const signal of PREVIEW_SHUTDOWN_SIGNALS) {
    previewProcess.on(signal, shutdown);
  }

  return removeHandlers;
}
