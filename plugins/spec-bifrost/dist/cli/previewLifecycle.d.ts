export interface ClosablePreviewServer {
    close: () => Promise<void>;
}
export interface PreviewProcess {
    on: (signal: NodeJS.Signals, listener: () => void) => unknown;
    off: (signal: NodeJS.Signals, listener: () => void) => unknown;
    exit: (code?: number) => never | void;
}
export declare function installPreviewShutdownHandlers(previewServer: ClosablePreviewServer, previewProcess?: PreviewProcess): () => void;
