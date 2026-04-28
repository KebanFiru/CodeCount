import * as path from 'path';
import * as vscode from 'vscode';
import { LineCounter } from './services/LineCounter';
import { GitignoreService } from './services/GitignoreService';
import { WorkspaceLineCounter } from './services/WorkspaceLineCounter';
import { LineCounterByFileFormat } from './services/LineCounterByFileFormat';
import { StatsTreeProvider } from './views/StatsTreeProvider';
import { StatsService } from './services/StatsService';

export function activate(context: vscode.ExtensionContext) {
	const lineCounter = new LineCounter();
	const gitignoreService = new GitignoreService();
	const workspaceLineCounter = new WorkspaceLineCounter(lineCounter, gitignoreService);
	const lineCounterByFileFormat = new LineCounterByFileFormat(workspaceLineCounter);
	const statsService = new StatsService(lineCounter, gitignoreService);
	const statsProvider = new StatsTreeProvider(statsService);

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

	const refreshStats = vscode.commands.registerCommand('codecount.refreshStats', () => {
		statsProvider.refresh();
	});

	const gitRepoMissing = vscode.commands.registerCommand('codecount.gitRepoMissing', () => {
		vscode.window.showWarningMessage('Git repo hasn’t been defined.');
	});

	const openContributorFile = vscode.commands.registerCommand(
		'codecount.openContributorFile',
		async (args?: { author?: string; filePath?: string }) => {
			const author = args?.author;
			const filePath = args?.filePath;
			if (!author || !filePath) {
				return;
			}
			const rootPath = await statsService.getGitRootPath();
			if (!rootPath) {
				vscode.window.showWarningMessage('Git repository not found.');
				return;
			}

			const absolutePath = vscode.Uri.file(path.join(rootPath, filePath));
			try {
				await vscode.workspace.fs.stat(absolutePath);
				const document = await vscode.workspace.openTextDocument(absolutePath);
				await vscode.window.showTextDocument(document, { preview: false });
			} catch {
				vscode.window.showWarningMessage('File not found in workspace.');
				return;
			}

			const history = await statsService.getContributorFileHistory(author, filePath);
			if (!history.available) {
				vscode.window.showWarningMessage('Git repository not found.');
				return;
			}
			if (history.entries.length === 0) {
				vscode.window.showInformationMessage('No history found for this contributor.');
				return;
			}

			const pick = await vscode.window.showQuickPick(
				history.entries.map((entry) => ({
					label: `${entry.date}  ${entry.hash}`,
					hash: entry.hash
				})),
				{
					placeHolder: 'Select a commit to view changes'
				}
			);
			if (!pick) {
				return;
			}

			const gitPath = path.isAbsolute(filePath) ? filePath : path.join(rootPath, filePath);
			const fileUri = vscode.Uri.file(gitPath);
			const encode = (ref: string) =>
				fileUri.with({
					scheme: 'git',
					query: JSON.stringify({ path: fileUri.fsPath, ref })
				});

			const left = encode(`${pick.hash}^`);
			const right = encode(pick.hash);
			await vscode.commands.executeCommand(
				'vscode.diff',
				left,
				right,
				`Changes by ${author}: ${filePath} (${pick.hash})`
			);
		}
	);

	context.subscriptions.push(fileline);
	context.subscriptions.push(fileslines);
	context.subscriptions.push(fileslinesByExtension);
	context.subscriptions.push(refreshStats);
	context.subscriptions.push(gitRepoMissing);
	context.subscriptions.push(openContributorFile);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider('codecount.stats', statsProvider)
	);
}

export function deactivate() {}
