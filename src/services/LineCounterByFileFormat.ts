import * as vscode from 'vscode';
import type { LineCountResult } from '../types/lineCount';
import { WorkspaceLineCounter } from './WorkspaceLineCounter';

export class LineCounterByFileFormat {

    constructor(private readonly workspaceLineCounter: WorkspaceLineCounter) {}

    async countByExtension(): Promise<LineCountResult | undefined> {
        const extensionInput = await vscode.window.showInputBox({
            prompt: 'Enter file extension (e.g., .py or py)',
            placeHolder: '.py'
        });
        if (!extensionInput) {
            return;
        }

        const normalized = extensionInput.startsWith('.')
            ? extensionInput
            : '.' + extensionInput;
        const extension = normalized.trim();
        if (extension === '.') {
            vscode.window.showWarningMessage('Invalid file extension.');
            return;
        }

        const files = await vscode.workspace.findFiles(
            '**/*' + extension,
            '**/{node_modules,out,dist,.git}/**'
        );
        if (files.length === 0) {
            vscode.window.showInformationMessage('No files found for ' + extension + '.');
            return;
        }

        return this.workspaceLineCounter.countWorkspaceLines(files);
    }
}