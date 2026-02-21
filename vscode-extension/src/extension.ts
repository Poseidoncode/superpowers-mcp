import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext): void {
    const skillsPath = context.asAbsolutePath("skills");
    const serverScript = context.asAbsolutePath("out/server.js");

    const didChangeEmitter = new vscode.EventEmitter<void>();

    const provider: vscode.McpServerDefinitionProvider = {
        onDidChangeMcpServerDefinitions: didChangeEmitter.event,

        provideMcpServerDefinitions: async (): Promise<vscode.McpServerDefinition[]> => {
            return [
                new vscode.McpStdioServerDefinition({
                    label: "Superpowers Skills",
                    command: process.execPath, // node binary that runs VSCode
                    args: [serverScript],
                    env: {
                        SKILLS_PATH: skillsPath,
                    },
                    version: "4.3.0",
                }),
            ];
        },

        resolveMcpServerDefinition: async (
            server: vscode.McpServerDefinition
        ): Promise<vscode.McpServerDefinition> => {
            // No user interaction needed — return as-is
            return server;
        },
    };

    context.subscriptions.push(
        vscode.lm.registerMcpServerDefinitionProvider("superpowersMcp", provider),
        didChangeEmitter
    );
}

export function deactivate(): void {
    // Nothing to clean up — VSCode handles MCP server process lifecycle
}
