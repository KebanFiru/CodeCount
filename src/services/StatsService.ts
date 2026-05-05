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
	LanguageFileStat,
	LanguageStatsResult,
	RepoAnalyticsResult
} from '../types';

const GIT_AUTHOR_PREFIX = '--AUTHOR--';
const GIT_COMMIT_PREFIX = '--COMMIT--';

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
			try {
				const document = await vscode.workspace.openTextDocument(uri);
				const languageId = document.languageId || 'unknown';
				const codeLines = this.lineCounter.countDocumentLines(document);
				stats.set(languageId, (stats.get(languageId) ?? 0) + codeLines);
			} catch {
				continue;
			}
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

	async getLanguageFileStats(languageId: string): Promise<{ available: boolean; stats: LanguageFileStat[] }> {
		if (!vscode.workspace.workspaceFolders?.length) {
			return { available: false, stats: [] };
		}

		const files = await vscode.workspace.findFiles(
			'**/*',
			'**/{node_modules,out,dist,.git}/**'
		);
		if (files.length === 0) {
			return { available: true, stats: [] };
		}

		const filtered = await this.filterIgnoredFiles(files);
		if (filtered.length === 0) {
			return { available: true, stats: [] };
		}

		const stats: LanguageFileStat[] = [];
		for (const uri of filtered) {
			try {
				const document = await vscode.workspace.openTextDocument(uri);
				if (document.languageId !== languageId) {
					continue;
				}
				const lines = this.lineCounter.countDocumentLines(document);
				const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
				const rootPath = workspaceFolder?.uri.fsPath;
				const relativePath = rootPath
					? path.relative(rootPath, uri.fsPath).replace(/\\/g, '/')
					: uri.fsPath;
				stats.push({ filePath: relativePath, absolutePath: uri.fsPath, lines });
			} catch {
				continue;
			}
		}

		return {
			available: true,
			stats: stats.sort((a, b) => b.lines - a.lines)
		};
	}

	async getContributorStats(): Promise<ContributorStatsResult> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return { available: false, stats: [] };
		}

		let stats: ContributorStat[] = [];
		try {
			stats = await this.getContributorStatsFromGit(rootPath);
		} catch {
			return { available: true, stats: [] };
		}

		return { available: true, stats };
	}

	async getContributorStatsAll(): Promise<ContributorStatsResult> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return { available: false, stats: [] };
		}

		let stats: ContributorStat[] = [];
		try {
			stats = await this.getContributorStatsFromGitAll(rootPath);
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

	async getRepoAnalytics(): Promise<RepoAnalyticsResult> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return {
				available: false,
				totalCommits: 0,
				activeDays: 0,
				totalAdded: 0,
				totalDeleted: 0,
				avgLinesChangedPerCommit: 0,
				commitsByDate: [],
				commitsByMonth: [],
				commitsByAuthor: [],
				commitsByWeekday: Array.from({ length: 7 }, () => 0),
				commitsByHour: Array.from({ length: 24 }, () => 0),
				topChangedFiles: []
			};
		}

		try {
			// Limit log to the current branch (HEAD) and follow first-parent
			// so repository metrics (total contributors, commits, etc.) are
			// computed relative to the current branch only.
			// Include author email in the pretty format so we can aggregate by email
			const output = await this.execGit(
				['log', 'HEAD', '--first-parent', '--date=iso-strict', `--pretty=${GIT_COMMIT_PREFIX}%aI|%aE|%an`, '--numstat'],
				rootPath
			);

			const byDate = new Map<string, { commits: number; added: number; deleted: number }>();
			const byMonth = new Map<string, { commits: number; added: number; deleted: number }>();
			const byAuthor = new Map<string, { name: string; email?: string; commits: number; added: number; deleted: number }>();
			const byFile = new Map<string, { added: number; deleted: number }>();
			const commitsByWeekday = Array.from({ length: 7 }, () => 0);
			const commitsByHour = Array.from({ length: 24 }, () => 0);
			let totalCommits = 0;
			let totalAdded = 0;
			let totalDeleted = 0;
			let currentDateKey: string | undefined;
			let currentMonthKey: string | undefined;
			let currentAuthor: string | undefined;
			let firstCommitDate: string | undefined;
			let lastCommitDate: string | undefined;

			const lines = output.split(/\r?\n/);
			for (const line of lines) {
				if (line.startsWith(GIT_COMMIT_PREFIX)) {
					const payload = line.slice(GIT_COMMIT_PREFIX.length).trim();
					const parts = payload.split('|');
					const dateTime = parts[0];
					const authorEmail = (parts[1] ?? '').trim();
					const authorName = (parts[2] ?? '').trim();
					if (!dateTime) {
						currentDateKey = undefined;
						currentMonthKey = undefined;
						currentAuthor = undefined;
						continue;
					}

					const dateKey = dateTime.slice(0, 10);
					const monthKey = dateTime.slice(0, 7);
					const author = (authorName ?? '').trim() || (authorEmail || 'Unknown');
					const date = new Date(dateTime);
					if (Number.isNaN(date.getTime())) {
						currentDateKey = undefined;
						currentMonthKey = undefined;
						currentAuthor = undefined;
						continue;
					}

					const weekday = date.getDay();
					const hourMatch = dateTime.match(/T(\d{2}):/);
					const hour = hourMatch ? Number(hourMatch[1]) : date.getHours();

					totalCommits += 1;
					currentDateKey = dateKey;
					currentMonthKey = monthKey;
					currentAuthor = author;
					commitsByWeekday[weekday] += 1;
					if (hour >= 0 && hour < 24) {
						commitsByHour[hour] += 1;
					}

					if (!lastCommitDate) {
						lastCommitDate = dateKey;
					}
					firstCommitDate = dateKey;

					const dateBucket = byDate.get(dateKey) ?? { commits: 0, added: 0, deleted: 0 };
					dateBucket.commits += 1;
					byDate.set(dateKey, dateBucket);

					const monthBucket = byMonth.get(monthKey) ?? { commits: 0, added: 0, deleted: 0 };
					monthBucket.commits += 1;
					byMonth.set(monthKey, monthBucket);

					const key = authorEmail || author;
					const authorBucket = byAuthor.get(key) ?? { name: authorName || author, email: authorEmail || undefined, commits: 0, added: 0, deleted: 0 };
					authorBucket.commits += 1;
					byAuthor.set(key, authorBucket);
					// store the aggregation key so following numstat lines map correctly
					currentAuthor = key;
					continue;
				}

				if (!currentDateKey || !currentMonthKey || !currentAuthor || !line.trim()) {
					continue;
				}

				const [addedText, deletedText, filePath] = line.split('\t');
				if (!addedText || !deletedText || !filePath || addedText === '-' || deletedText === '-') {
					continue;
				}

				const added = Number(addedText);
				const deleted = Number(deletedText);
				if (Number.isNaN(added) || Number.isNaN(deleted)) {
					continue;
				}

				totalAdded += added;
				totalDeleted += deleted;

				const dateBucket = byDate.get(currentDateKey);
				if (dateBucket) {
					dateBucket.added += added;
					dateBucket.deleted += deleted;
					byDate.set(currentDateKey, dateBucket);
				}

				const monthBucket = byMonth.get(currentMonthKey);
				if (monthBucket) {
					monthBucket.added += added;
					monthBucket.deleted += deleted;
					byMonth.set(currentMonthKey, monthBucket);
				}

				const authorBucket = currentAuthor ? byAuthor.get(currentAuthor) : undefined;
				if (authorBucket) {
					authorBucket.added += added;
					authorBucket.deleted += deleted;
					byAuthor.set(currentAuthor, authorBucket);
				}

				const normalizedPath = this.normalizeGitPath(filePath);
				const fileBucket = byFile.get(normalizedPath) ?? { added: 0, deleted: 0 };
				fileBucket.added += added;
				fileBucket.deleted += deleted;
				byFile.set(normalizedPath, fileBucket);
			}

			const commitsByDate = Array.from(byDate.entries())
				.map(([date, value]) => ({
					date,
					commits: value.commits,
					added: value.added,
					deleted: value.deleted
				}))
				.sort((a, b) => a.date.localeCompare(b.date));

			const commitsByMonth = Array.from(byMonth.entries())
				.map(([month, value]) => ({
					month,
					commits: value.commits,
					added: value.added,
					deleted: value.deleted
				}))
				.sort((a, b) => a.month.localeCompare(b.month));

			const commitsByAuthor = Array.from(byAuthor.entries())
				.map(([key, value]) => {
					const display = value.email ? `${value.name} <${value.email}>` : value.name;
					return {
						author: display,
						commits: value.commits,
						added: value.added,
						deleted: value.deleted
					};
				})
				.sort((a, b) => b.commits - a.commits);

			const topChangedFiles = Array.from(byFile.entries())
				.map(([filePath, totals]) => ({
					filePath,
					changes: totals.added + totals.deleted,
					added: totals.added,
					deleted: totals.deleted
				}))
				.sort((a, b) => b.changes - a.changes)
				.slice(0, 12);

			let busiestDay: { date: string; commits: number } | undefined;
			let mostChangedDay: { date: string; changes: number } | undefined;
			for (const item of commitsByDate) {
				if (!busiestDay || item.commits > busiestDay.commits) {
					busiestDay = { date: item.date, commits: item.commits };
				}
				const changes = item.added + item.deleted;
				if (!mostChangedDay || changes > mostChangedDay.changes) {
					mostChangedDay = { date: item.date, changes };
				}
			}

			const avgLinesChangedPerCommit = totalCommits > 0
				? Math.round((totalAdded + totalDeleted) / totalCommits)
				: 0;

			return {
				available: true,
				totalCommits,
				activeDays: commitsByDate.length,
				firstCommitDate,
				lastCommitDate,
				totalAdded,
				totalDeleted,
				avgLinesChangedPerCommit,
				busiestDay,
				mostChangedDay,
				commitsByDate,
				commitsByMonth,
				commitsByAuthor,
				commitsByWeekday,
				commitsByHour,
				topChangedFiles
			};
		} catch {
			return {
				available: true,
				totalCommits: 0,
				activeDays: 0,
				totalAdded: 0,
				totalDeleted: 0,
				avgLinesChangedPerCommit: 0,
				commitsByDate: [],
				commitsByMonth: [],
				commitsByAuthor: [],
				commitsByWeekday: Array.from({ length: 7 }, () => 0),
				commitsByHour: Array.from({ length: 24 }, () => 0),
				topChangedFiles: []
			};
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

	async getGitDirPath(): Promise<string | undefined> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return;
		}

		try {
			const gitDir = (await this.execGit(['rev-parse', '--git-dir'], rootPath)).trim();
			if (!gitDir) {
				return;
			}
			return path.isAbsolute(gitDir) ? gitDir : path.resolve(rootPath, gitDir);
		} catch {
			return;
		}
	}

	private async getContributorStatsFromGit(rootPath: string): Promise<ContributorStat[]> {
		// Use author email as the aggregation key to avoid duplicate names
		const output = await this.execGit(
			['log', 'HEAD', '--first-parent', '--numstat', `--pretty=${GIT_AUTHOR_PREFIX}%an|%aE`],
			rootPath
		);

		const stats = new Map<string, { name: string; added: number; deleted: number }>();
		const existsCache = new Map<string, boolean>();
		let currentKey = 'unknown';
		let currentName = 'Unknown';
		const lines = output.split(/\r?\n/);
		for (const line of lines) {
			if (line.startsWith(GIT_AUTHOR_PREFIX)) {
				const payload = line.slice(GIT_AUTHOR_PREFIX.length).trim();
				const [namePart, emailPart] = payload.split('|');
				currentName = (namePart ?? 'Unknown').trim() || 'Unknown';
				const email = (emailPart ?? '').trim();
				currentKey = email || currentName;
				if (!stats.has(currentKey)) {
					stats.set(currentKey, { name: currentName, added: 0, deleted: 0 });
				}
				continue;
			}

			if (!line.trim()) {
				continue;
			}

			const parts = line.split('\t');
			const addedText = parts[0];
			const deletedText = parts[1];
			const filePath = parts[2];
			if (!addedText || addedText === '-' || !filePath) {
				continue;
			}

			const normalizedPath = this.normalizeGitPath(filePath);
			const exists = await this.fileExists(rootPath, normalizedPath, existsCache);
			if (!exists) {
				continue;
			}

			const added = Number(addedText);
			const deleted = Number(deletedText ?? 0);
			if (Number.isNaN(added) || Number.isNaN(deleted)) {
				continue;
			}

			const current = stats.get(currentKey) ?? { name: currentName, added: 0, deleted: 0 };
			current.added += added;
			current.deleted += deleted;
			stats.set(currentKey, current);
		}

		return Array.from(stats.entries())
			.map(([key, v]) => ({ name: v.name, added: v.added, deleted: v.deleted }))
			// Filter out authors with no recorded changes (added + deleted === 0)
			.filter(item => (item.added + item.deleted) > 0)
			.sort((a, b) => (b.added + b.deleted) - (a.added + a.deleted));
	}

	private async getContributorStatsFromGitAll(rootPath: string): Promise<ContributorStat[]> {
		// For "all" contributors we want to consider the entire repository
		// history across all refs/branches. Use --all to include all refs.
		// Aggregate by email to avoid duplicates across name variations.
		const output = await this.execGit(
			['log', '--all', '--numstat', `--pretty=${GIT_AUTHOR_PREFIX}%an|%aE`],
			rootPath
		);

		const stats = new Map<string, { name: string; added: number; deleted: number }>();
		let currentKey = 'unknown';
		let currentName = 'Unknown';
		const lines = output.split(/\r?\n/);
		for (const line of lines) {
			if (line.startsWith(GIT_AUTHOR_PREFIX)) {
				const payload = line.slice(GIT_AUTHOR_PREFIX.length).trim();
				const [namePart, emailPart] = payload.split('|');
				currentName = (namePart ?? 'Unknown').trim() || 'Unknown';
				const email = (emailPart ?? '').trim();
				currentKey = email || currentName;
				if (!stats.has(currentKey)) {
					stats.set(currentKey, { name: currentName, added: 0, deleted: 0 });
				}
				continue;
			}

			if (!line.trim()) {
				continue;
			}

			const parts = line.split('\t');
			const addedText = parts[0];
			const deletedText = parts[1];
			if (!addedText || addedText === '-') {
				continue;
			}

			const added = Number(addedText);
			const deleted = Number(deletedText ?? 0);
			if (Number.isNaN(added) || Number.isNaN(deleted)) {
				continue;
			}

			const current = stats.get(currentKey) ?? { name: currentName, added: 0, deleted: 0 };
			current.added += added;
			current.deleted += deleted;
			stats.set(currentKey, current);
		}

		return Array.from(stats.entries())
			.map(([key, v]) => ({ name: v.name, added: v.added, deleted: v.deleted }))
			// Exclude authors with zero total changes when aggregating across all refs
			.filter(item => (item.added + item.deleted) > 0)
			.sort((a, b) => (b.added + b.deleted) - (a.added + a.deleted));
	}

	private async getContributorLanguageStatsFromGit(
		rootPath: string,
		authorName: string
	): Promise<ContributorLanguageStat[]> {
		const output = await this.execGit(
			['log', 'HEAD', '--first-parent', '--numstat', `--pretty=${GIT_AUTHOR_PREFIX}%an`],
			rootPath
		);

		const languageTotals = new Map<string, number>();
		const languageByPath = new Map<string, string>();
		const existsCache = new Map<string, boolean>();
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
			const exists = await this.fileExists(rootPath, normalizedPath, existsCache);
			if (!exists) {
				continue;
			}
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
			['log', 'HEAD', '--first-parent', '--numstat', `--pretty=${GIT_AUTHOR_PREFIX}%an`],
			rootPath
		);

		const fileTotals = new Map<string, { added: number; deleted: number }>();
		const languageByPath = new Map<string, string>();
		const existsCache = new Map<string, boolean>();
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
			const exists = await this.fileExists(rootPath, normalizedPath, existsCache);
			if (!exists) {
				continue;
			}
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

	private async fileExists(
		rootPath: string,
		filePath: string,
		cache: Map<string, boolean>
	): Promise<boolean> {
		if (cache.has(filePath)) {
			return cache.get(filePath) ?? false;
		}
		const absolutePath = path.isAbsolute(filePath)
			? filePath
			: path.join(rootPath, filePath);
		try {
			await vscode.workspace.fs.stat(vscode.Uri.file(absolutePath));
			cache.set(filePath, true);
			return true;
		} catch {
			cache.set(filePath, false);
			return false;
		}
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
