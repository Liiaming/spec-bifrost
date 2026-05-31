export interface HookInput {
    cwd: string;
    toolName: string;
    filePath?: string;
}
export interface HookResult {
    decision: "approve" | "block";
    message: string;
}
export declare function runPostToolUseValidation(input: HookInput): Promise<HookResult>;
