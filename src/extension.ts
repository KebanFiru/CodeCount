import * as vscode from 'vscode';
import { LineCounter } from './services/LineCounter';
import { GitignoreService } from './services/GitignoreService';
import { WorkspaceLineCounter } from './services/WorkspaceLineCounter';
import { LineCounterByFileFormat } from './services/LineCounterByFileFormat';

export function activate(context: vscode.ExtensionContext) {
	const lineCounter = new LineCounter();
	const gitignoreService = new GitignoreService();
	const workspaceLineCounter = new WorkspaceLineCounter(lineCounter, gitignoreService);
	const lineCounterByFileFormat = new LineCounterByFileFormat(workspaceLineCounter);

	const fileline = vscode.commands.registerCommand('codecount.countLines', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage('No active editor found.');
			return;
		}

		const lineCount = lineCounter.countDocumentLines(editor.document);
		const fileName = editor.document.fileName.split(/[/\\]/).pop() ?? 'Untitled';
		vscode.window.showInformationMessage(`Total lines in ${fileName}: ${lineCount}`);
	});

	const fileslines = vscode.commands.registerCommand('codecount.countFilesLines', async () => {
		if (!vscode.workspace.workspaceFolders?.length) {
			vscode.window.showWarningMessage('No workspace folder found.');
			return;
		}

		const files = await vscode.workspace.findFiles(
			'**/*',
			'**/{node_modules,out,dist,.git}/**'
		);
		if (files.length === 0) {
			vscode.window.showInformationMessage('No files found in workspace.');
			return;
		}
		const result = await workspaceLineCounter.countWorkspaceLines(files);
		if (result.fileCount === 0) {
			vscode.window.showInformationMessage('All files are ignored by .gitignore.');
			return;
		}
		vscode.window.showInformationMessage(
			`Total lines in workspace (${result.fileCount} files): ${result.totalLines}. Comment lines: ${result.commentLines}`
		);
	});

	const fileslinesByExtension = vscode.commands.registerCommand('codecount.countLinesByExtension', async () => {
		if (!vscode.workspace.workspaceFolders?.length) {
			vscode.window.showWarningMessage('No workspace folder found.');
			return;
		}

		const result = await lineCounterByFileFormat.countByExtension();
		if (!result) {
			return;
		}
		if (result.fileCount === 0) {
			vscode.window.showInformationMessage('All files are ignored by .gitignore.');
			return;
		}

		vscode.window.showInformationMessage(
			`Total lines in matched files (${result.fileCount} files): ${result.totalLines}. Comment lines: ${result.commentLines}`
		);
	});

	context.subscriptions.push(fileline);
	context.subscriptions.push(fileslines);
	context.subscriptions.push(fileslinesByExtension);
}

// This method is called when your extension is deactivated
export function deactivate() {}
