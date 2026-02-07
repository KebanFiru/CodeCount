import * as path from 'path';
import * as vscode from 'vscode';
import { LineCounter } from './LineCounter';
import { GitignoreService } from './GitignoreService';
import type { LineCountResult } from '../types/lineCount';

export class WorkspaceLineCounter {
	constructor(
		private readonly lineCounter: LineCounter,
		private readonly gitignoreService: GitignoreService
	) {}

	async countWorkspaceLines(files: readonly vscode.Uri[]): Promise<LineCountResult> {
		const filteredFiles = await this.filterIgnoredFiles(files);
		if (filteredFiles.length === 0) {
			return { totalLines: 0, fileCount: 0, commentLines: 0 };
		}

		return this.lineCounter.countWorkspaceLines(filteredFiles, (uri) => vscode.workspace.openTextDocument(uri));
	}

	private async filterIgnoredFiles(files: readonly vscode.Uri[]): Promise<vscode.Uri[]> {
		const filteredFiles: vscode.Uri[] = [];
		for (const uri of files) {
			const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
			if (!workspaceFolder) {
				filteredFiles.push(uri);
				continue;
			}

			const rootPath = workspaceFolder.uri.fsPath;
			const matcher = await this.gitignoreService.getMatcher(rootPath);
			const relativePath = path.relative(rootPath, uri.fsPath).replace(/\\/g, '/');
			if (!matcher.ignores(relativePath)) {
				filteredFiles.push(uri);
			}
		}

		return filteredFiles;
	}
}
