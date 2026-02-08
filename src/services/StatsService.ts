import * as path from 'path';
import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { LineCounter } from './LineCounter';
import { GitignoreService } from './GitignoreService';
import type {
	ContributorFileHistoryEntry,
	ContributorFileStat,
	ContributorLanguageStat,
	ContributorStat,
	ContributorStatsResult,
	LanguageStat,
	LanguageStatsResult
} from '../views/stats';

const GIT_AUTHOR_PREFIX = '--AUTHOR--';

export class StatsService {
	constructor(
		private readonly lineCounter: LineCounter,
		private readonly gitignoreService: GitignoreService
	) {}

	async getLanguageStats(): Promise<LanguageStatsResult> {
		if (!vscode.workspace.workspaceFolders?.length) {
			return { hasWorkspace: false, totalFiles: 0, filteredFiles: 0, stats: [] };
		}

		const files = await vscode.workspace.findFiles(
			'**/*',
			'**/{node_modules,out,dist,.git}/**'
		);
		if (files.length === 0) {
			return { hasWorkspace: true, totalFiles: 0, filteredFiles: 0, stats: [] };
		}

		const filtered = await this.filterIgnoredFiles(files);
		if (filtered.length === 0) {
			return { hasWorkspace: true, totalFiles: files.length, filteredFiles: 0, stats: [] };
		}

		const stats = new Map<string, number>();
		for (const uri of filtered) {
			const document = await vscode.workspace.openTextDocument(uri);
			const languageId = document.languageId || 'unknown';
			const codeLines = this.lineCounter.countDocumentLines(document);
			stats.set(languageId, (stats.get(languageId) ?? 0) + codeLines);
		}

		const entries = Array.from(stats.entries())
			.map(([languageId, lines]) => ({ languageId, lines }))
			.sort((a, b) => b.lines - a.lines);

		return {
			hasWorkspace: true,
			totalFiles: files.length,
			filteredFiles: filtered.length,
			stats: entries
		};
	}

	async getContributorStats(): Promise<ContributorStatsResult> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return { available: false, stats: [] };
		}

		let stats: Array<{ name: string; linesAdded: number }> = [];
		try {
			stats = await this.getContributorStatsFromGit(rootPath);
		} catch {
			return { available: true, stats: [] };
		}

		return { available: true, stats };
	}

	async getContributorLanguageStats(authorName: string): Promise<{ available: boolean; stats: ContributorLanguageStat[] }> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return { available: false, stats: [] };
		}

		let stats: ContributorLanguageStat[] = [];
		try {
			stats = await this.getContributorLanguageStatsFromGit(rootPath, authorName);
		} catch {
			return { available: true, stats: [] };
		}

		return { available: true, stats };
	}

	async getContributorLanguageFileStats(
		authorName: string,
		languageId: string
	): Promise<{ available: boolean; stats: ContributorFileStat[] }> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return { available: false, stats: [] };
		}

		let stats: ContributorFileStat[] = [];
		try {
			stats = await this.getContributorLanguageFileStatsFromGit(rootPath, authorName, languageId);
		} catch {
			return { available: true, stats: [] };
		}

		return { available: true, stats };
	}

	async getContributorFileHistory(
		authorName: string,
		filePath: string
	): Promise<{ available: boolean; entries: ContributorFileHistoryEntry[] }> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return { available: false, entries: [] };
		}

		try {
			const output = await this.execGit(
				[
					'log',
					`--author=${authorName}`,
					'--date=short',
					'--pretty=%h %ad',
					'--',
					filePath
				],
				rootPath
			);
			const entries = output
				.split(/\r?\n/)
				.map((line) => line.trim())
				.filter((line) => line.length > 0)
				.map((line) => {
					const [hash, date] = line.split(' ');
					return { hash, date };
				});
			return { available: true, entries };
		} catch {
			return { available: true, entries: [] };
		}
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

	private async getGitRoot(): Promise<string | undefined> {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return;
		}

		const gitUri = vscode.Uri.joinPath(workspaceFolder.uri, '.git');
		try {
			await vscode.workspace.fs.stat(gitUri);
			return workspaceFolder.uri.fsPath;
		} catch {
			return;
		}
	}

	async getGitRootPath(): Promise<string | undefined> {
		return this.getGitRoot();
	}

	private async getContributorStatsFromGit(rootPath: string): Promise<ContributorStat[]> {
		const output = await this.execGit(
			['log', '--numstat', `--pretty=${GIT_AUTHOR_PREFIX}%an`],
			rootPath
		);

		const stats = new Map<string, number>();
		let currentAuthor = 'Unknown';
		const lines = output.split(/\r?\n/);
		for (const line of lines) {
			if (line.startsWith(GIT_AUTHOR_PREFIX)) {
				currentAuthor = line.slice(GIT_AUTHOR_PREFIX.length).trim() || 'Unknown';
				if (!stats.has(currentAuthor)) {
					stats.set(currentAuthor, 0);
				}
				continue;
			}

			if (!line.trim()) {
				continue;
			}

			const [addedText] = line.split('\t');
			if (!addedText || addedText === '-') {
				continue;
			}

			const added = Number(addedText);
			if (Number.isNaN(added)) {
				continue;
			}

			stats.set(currentAuthor, (stats.get(currentAuthor) ?? 0) + added);
		}

		return Array.from(stats.entries())
			.map(([name, linesAdded]) => ({ name, linesAdded }))
			.sort((a, b) => b.linesAdded - a.linesAdded);
	}

	private async getContributorLanguageStatsFromGit(
		rootPath: string,
		authorName: string
	): Promise<ContributorLanguageStat[]> {
		const output = await this.execGit(
			['log', '--numstat', `--pretty=${GIT_AUTHOR_PREFIX}%an`],
			rootPath
		);

		const languageTotals = new Map<string, number>();
		const languageByPath = new Map<string, string>();
		let currentAuthor = 'Unknown';
		const lines = output.split(/\r?\n/);
		for (const line of lines) {
			if (line.startsWith(GIT_AUTHOR_PREFIX)) {
				currentAuthor = line.slice(GIT_AUTHOR_PREFIX.length).trim() || 'Unknown';
				continue;
			}

			if (!line.trim()) {
				continue;
			}

			if (currentAuthor !== authorName) {
				continue;
			}

			const [addedText, , filePath] = line.split('\t');
			if (!addedText || addedText === '-' || !filePath) {
				continue;
			}

			const added = Number(addedText);
			if (Number.isNaN(added)) {
				continue;
			}

			const normalizedPath = this.normalizeGitPath(filePath);
			const languageId = await this.getLanguageForPath(rootPath, normalizedPath, languageByPath);
			languageTotals.set(languageId, (languageTotals.get(languageId) ?? 0) + added);
		}

		return Array.from(languageTotals.entries())
			.map(([languageId, linesAdded]) => ({ languageId, linesAdded }))
			.sort((a, b) => b.linesAdded - a.linesAdded);
	}

	private async getContributorLanguageFileStatsFromGit(
		rootPath: string,
		authorName: string,
		languageId: string
	): Promise<ContributorFileStat[]> {
		const output = await this.execGit(
			['log', '--numstat', `--pretty=${GIT_AUTHOR_PREFIX}%an`],
			rootPath
		);

		const fileTotals = new Map<string, { added: number; deleted: number }>();
		const languageByPath = new Map<string, string>();
		let currentAuthor = 'Unknown';
		const lines = output.split(/\r?\n/);
		for (const line of lines) {
			if (line.startsWith(GIT_AUTHOR_PREFIX)) {
				currentAuthor = line.slice(GIT_AUTHOR_PREFIX.length).trim() || 'Unknown';
				continue;
			}

			if (!line.trim()) {
				continue;
			}

			if (currentAuthor !== authorName) {
				continue;
			}

			const [addedText, deletedText, filePath] = line.split('\t');
			if (!addedText || !deletedText || !filePath) {
				continue;
			}
			if (addedText === '-' || deletedText === '-') {
				continue;
			}

			const added = Number(addedText);
			const deleted = Number(deletedText);
			if (Number.isNaN(added) || Number.isNaN(deleted)) {
				continue;
			}

			const normalizedPath = this.normalizeGitPath(filePath);
			const fileLanguageId = await this.getLanguageForPath(rootPath, normalizedPath, languageByPath);
			if (fileLanguageId !== languageId) {
				continue;
			}

			const current = fileTotals.get(normalizedPath) ?? { added: 0, deleted: 0 };
			current.added += added;
			current.deleted += deleted;
			fileTotals.set(normalizedPath, current);
		}

		return Array.from(fileTotals.entries())
			.map(([filePath, totals]) => ({ filePath, added: totals.added, deleted: totals.deleted }))
			.sort((a, b) => (b.added + b.deleted) - (a.added + a.deleted));
	}

	private normalizeGitPath(filePath: string): string {
		const trimmed = filePath.trim();
		const renameMatch = trimmed.split('=>');
		if (renameMatch.length > 1) {
			return renameMatch[renameMatch.length - 1].replace(/[{}]/g, '').trim();
		}
		return trimmed;
	}

	private async getLanguageForPath(
		rootPath: string,
		filePath: string,
		cache: Map<string, string>
	): Promise<string> {
		if (cache.has(filePath)) {
			return cache.get(filePath) ?? 'unknown';
		}

		const absolutePath = path.isAbsolute(filePath)
			? filePath
			: path.join(rootPath, filePath);
		let languageId = 'unknown';
		try {
			const document = await vscode.workspace.openTextDocument(vscode.Uri.file(absolutePath));
			languageId = document.languageId || 'unknown';
		} catch {
			languageId = this.languageFromExtension(filePath);
		}

		cache.set(filePath, languageId);
		return languageId;
	}

	private languageFromExtension(filePath: string): string {
		const ext = path.extname(filePath).toLowerCase();
		if (!ext) {
			return 'unknown';
		}
		return ext.replace(/^\./, '') || 'unknown';
	}

	private execGit(args: string[], cwd: string): Promise<string> {
		return new Promise((resolve, reject) => {
			execFile('git', args, { cwd }, (error, stdout) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(stdout.toString());
			});
		});
	}
}
