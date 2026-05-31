import { type FSWatcher } from "node:fs";
import { type PreviewState } from "./state.js";
export interface PreviewServerOptions {
    cwd: string;
    port: number;
    host: string;
}
export declare function loadPreviewStateFromSpecPath(specPath: string, state: PreviewState): Promise<void>;
export declare function startPreviewServer(options: PreviewServerOptions): Promise<{
    url: string;
    close: () => Promise<void>;
}>;
export declare function startSpecWatcher(cwd: string, load: () => void, state: PreviewState): FSWatcher | undefined;
