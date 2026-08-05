import * as path from 'path';
import * as vscode from 'vscode';
import { LineCounter } from './LineCounter';
import { GitignoreService } from './GitignoreService';
import { runGit, isDefaultBranch, resolveMergeBase, normalizeGitPath } from './GitCli';
import type {
	FileHistoryEntry,
	ContributorFileStat,
	ContributorLanguageStat,
	ContributorStat,
	ContributorStatsResult,
	LanguageStat,
	LanguageFileStat,
	LanguageStatsResult,
	RepoAnalyticsResult,
	RepoCommitTuple
} from '../types';

const GIT_AUTHOR_PREFIX = '--AUTHOR--';
const GIT_COMMIT_PREFIX = '--COMMIT--';
const FILE_LOG_PREFIX = '--LOG--';

type BranchScope = {
	branch?: string;
	files?: Set<string>;
	range?: string;
	mergeBase?: string;
	hasCommits: boolean;
	ahead: number;
	behind: number;
};

export class StatsService {
	private branchScopeCache?: Promise<BranchScope>;

	constructor(
		private readonly lineCounter: LineCounter,
		private readonly gitignoreService: GitignoreService
	) {}

	clearCache(): void {
		this.branchScopeCache = undefined;
	}

	private emptyBranchScope(): BranchScope {
		return { hasCommits: false, ahead: 0, behind: 0 };
	}

	private getBranchScope(rootPath: string): Promise<BranchScope> {
		if (!this.branchScopeCache) {
			this.branchScopeCache = this.computeBranchScope(rootPath);
		}
		return this.branchScopeCache;
	}

	private async computeBranchScope(rootPath: string): Promise<BranchScope> {
		try {
			const currentBranch = (await this.execGit(['rev-parse', '--abbrev-ref', 'HEAD'], rootPath)).trim();
			if (isDefaultBranch(currentBranch)) {
				return this.emptyBranchScope();
			}

			const mergeBase = await resolveMergeBase(rootPath);
			if (!mergeBase) {
				return this.emptyBranchScope();
			}

			const [countOutput, diffOutput, untrackedOutput] = await Promise.all([
				this.execGit(['rev-list', '--count', '--left-right', `${mergeBase}...HEAD`], rootPath),
				this.execGit(['diff', '--name-only', mergeBase], rootPath),
				this.execGit(['ls-files', '--others', '--exclude-standard'], rootPath)
			]);

			const [behindStr, aheadStr] = countOutput.trim().split(/\s+/);
			const behind = parseInt(behindStr, 10) || 0;
			const ahead = parseInt(aheadStr, 10) || 0;

			const files = new Set(
				[...diffOutput.split(/\r?\n/), ...untrackedOutput.split(/\r?\n/)]
					.map(line => line.trim())
					.filter(line => line.length > 0)
			);

			if (ahead === 0 && files.size === 0) {
				return this.emptyBranchScope();
			}

			return {
				branch: currentBranch,
				files,
				range: ahead > 0 ? `${mergeBase}..HEAD` : undefined,
				mergeBase,
				hasCommits: ahead > 0,
				ahead,
				behind
			};
		} catch {
			return this.emptyBranchScope();
		}
	}

	private emptyRepoAnalytics(available: boolean): RepoAnalyticsResult {
		return {
			available,
			totalCommits: 0,
			activeDays: 0,
			totalAdded: 0,
			totalDeleted: 0,
			avgLinesChangedPerCommit: 0,
			commitsByDate: [],
			commitsByMonth: [],
			commitsByAuthor: [],
			topChangedFiles: [],
			authors: [],
			commits: []
		};
	}

	async getLanguageStats(): Promise<LanguageStatsResult> {
		if (!vscode.workspace.workspaceFolders?.length) {
			return { hasWorkspace: false, totalFiles: 0, filteredFiles: 0, ignoredFiles: 0, stats: [] };
		}

		const rootPath = await this.getGitRoot();
		const scope = rootPath ? await this.getBranchScope(rootPath) : this.emptyBranchScope();

		const files = await vscode.workspace.findFiles(
			'**/*',
			'**/{node_modules,out,dist,.git}/**'
		);
		if (files.length === 0) {
			return { hasWorkspace: true, totalFiles: 0, filteredFiles: 0, ignoredFiles: 0, stats: [] };
		}

		const filtered = await this.filterIgnoredFiles(files);
		// Count of .gitignore exclusions, measured before any branch scoping is applied.
		const ignoredFiles = files.length - filtered.length;
		if (filtered.length === 0) {
			return { hasWorkspace: true, totalFiles: files.length, filteredFiles: 0, ignoredFiles, stats: [] };
		}

		let filesToCount = filtered;
		if (rootPath && scope.files && scope.files.size > 0) {
			const branchFiles = scope.files;
			filesToCount = filtered.filter(uri => {
				const relativePath = path.relative(rootPath, uri.fsPath).replace(/\\/g, '/');
				return branchFiles.has(relativePath);
			});
		}

		const stats = new Map<string, number>();
		for (const uri of filesToCount) {
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
			filteredFiles: scope.files && scope.files.size > 0 ? filesToCount.length : filtered.length,
			ignoredFiles,
			stats: entries,
			branch: scope.branch,
			ahead: scope.branch ? scope.ahead : undefined,
			behind: scope.branch ? scope.behind : undefined
		};
	}

	async getFileStats(): Promise<{ available: boolean; stats: LanguageFileStat[]; branch?: string }> {
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

		let filtered = await this.filterIgnoredFiles(files);
		if (filtered.length === 0) {
			return { available: true, stats: [] };
		}

		const rootPath = await this.getGitRoot();
		const scope = rootPath ? await this.getBranchScope(rootPath) : this.emptyBranchScope();
		if (rootPath && scope.files && scope.files.size > 0) {
			const branchFiles = scope.files;
			filtered = filtered.filter(uri => {
				const relativePath = path.relative(rootPath, uri.fsPath).replace(/\\/g, '/');
				return branchFiles.has(relativePath);
			});
		}

		const stats: LanguageFileStat[] = [];
		for (const uri of filtered) {
			try {
				const document = await vscode.workspace.openTextDocument(uri);
				const lines = this.lineCounter.countDocumentLines(document);
				const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
				const fileRoot = workspaceFolder?.uri.fsPath;
				const relativePath = fileRoot
					? path.relative(fileRoot, uri.fsPath).replace(/\\/g, '/')
					: uri.fsPath;
				stats.push({
					filePath: relativePath,
					absolutePath: uri.fsPath,
					lines,
					languageId: document.languageId || 'unknown'
				});
			} catch {
				continue;
			}
		}

		return {
			available: true,
			stats: stats.sort((a, b) => b.lines - a.lines),
			branch: scope.branch
		};
	}

	async getLanguageFileStats(languageId: string): Promise<{ available: boolean; stats: LanguageFileStat[]; branch?: string }> {
		const result = await this.getFileStats();
		return {
			...result,
			stats: result.stats.filter(stat => stat.languageId === languageId)
		};
	}

	async getContributorStats(): Promise<ContributorStatsResult> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return { available: false, stats: [] };
		}

		const scope = await this.getBranchScope(rootPath);
		const range = scope.range ?? 'HEAD';

		let stats: ContributorStat[] = [];
		try {
			stats = await this.getContributorStatsFromGit(rootPath, range);
		} catch {
			return { available: true, stats: [] };
		}

		return {
			available: true,
			stats,
			branch: scope.branch,
			branchHasCommits: scope.branch ? scope.hasCommits : undefined
		};
	}

	private parseContributorLog(output: string): ContributorStat[] {
		const stats = new Map<string, { name: string; added: number; deleted: number }>();
		let currentKey = 'unknown';
		let currentName = 'Unknown';
		const lines = output.split(/\r?\n/);
		for (const line of lines) {
			if (line.startsWith(GIT_AUTHOR_PREFIX)) {
				const payload = line.slice(GIT_AUTHOR_PREFIX.length).trim();
				const sep = payload.lastIndexOf('|');
				currentName = (sep >= 0 ? payload.slice(0, sep) : payload).trim() || 'Unknown';
				const email = (sep >= 0 ? payload.slice(sep + 1) : '').trim();
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
			.map(([key, v]) => ({ name: v.name, email: key && key.includes('@') ? key : undefined, added: v.added, deleted: v.deleted }))
			.filter(item => (item.added + item.deleted) > 0)
			.sort((a, b) => (b.added + b.deleted) - (a.added + a.deleted));
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


	private async readFileLog(
		rootPath: string,
		filePath: string,
		author?: string,
		limit = 200
	): Promise<FileHistoryEntry[]> {
		const args = [
			'log',
			'--follow',
			'--date=short',
			'-n',
			String(limit),
			`--pretty=${FILE_LOG_PREFIX}%h|%ad|%an|%s`
		];
		if (author) {
			args.push(`--author=${author}`);
		}
		args.push('--', filePath);

		const output = await this.execGit(args, rootPath);
		const entries: FileHistoryEntry[] = [];
		for (const rawLine of output.split(/\r?\n/)) {
			if (!rawLine.startsWith(FILE_LOG_PREFIX)) {
				continue;
			}
			const line = rawLine.slice(FILE_LOG_PREFIX.length);
			const firstPipe = line.indexOf('|');
			const secondPipe = firstPipe >= 0 ? line.indexOf('|', firstPipe + 1) : -1;
			const thirdPipe = secondPipe >= 0 ? line.indexOf('|', secondPipe + 1) : -1;
			if (firstPipe < 0 || secondPipe < 0 || thirdPipe < 0) {
				continue;
			}

			const hash = line.slice(0, firstPipe).trim();
			const date = line.slice(firstPipe + 1, secondPipe).trim();
			const entryAuthor = line.slice(secondPipe + 1, thirdPipe).trim();
			const subject = line.slice(thirdPipe + 1).trim();
			if (!hash) {
				continue;
			}
			entries.push({ hash, date, author: entryAuthor, subject });
		}
		return entries;
	}

	async getFileHistory(filePath: string): Promise<{ available: boolean; entries: FileHistoryEntry[] }> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return { available: false, entries: [] };
		}

		try {
			const entries = await this.readFileLog(rootPath, filePath);
			return { available: true, entries };
		} catch {
			return { available: true, entries: [] };
		}
	}

	async getContributorFileHistory(
		authorName: string,
		filePath: string
	): Promise<{ available: boolean; entries: FileHistoryEntry[] }> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return { available: false, entries: [] };
		}

		try {
			const entries = await this.readFileLog(rootPath, filePath, authorName);
			return { available: true, entries };
		} catch {
			return { available: true, entries: [] };
		}
	}

	async getRepoAnalytics(): Promise<RepoAnalyticsResult> {
		const rootPath = await this.getGitRoot();
		if (!rootPath) {
			return this.emptyRepoAnalytics(false);
		}

		try {
			const scope = await this.getBranchScope(rootPath);
			const branch = scope.branch;
			const logRange = scope.range ?? 'HEAD';

			const output = await this.execGit(
				['log', logRange, '--first-parent', '--date=iso-strict', `--pretty=${GIT_COMMIT_PREFIX}%aI|%aE|%an`, '--numstat'],
				rootPath
			);

			const byDate = new Map<string, { commits: number; added: number; deleted: number }>();
			const byMonth = new Map<string, { commits: number; added: number; deleted: number }>();
			const byAuthor = new Map<string, { name: string; email?: string; commits: number; added: number; deleted: number }>();
			const byFile = new Map<string, { added: number; deleted: number }>();
			const authorIndex = new Map<string, number>();
			const authors: string[] = [];
			const commits: RepoCommitTuple[] = [];
			let totalCommits = 0;
			let totalAdded = 0;
			let totalDeleted = 0;
			let currentDateKey: string | undefined;
			let currentMonthKey: string | undefined;
			let currentAuthor: string | undefined;
			let firstCommitDate: string | undefined;
			let lastCommitDate: string | undefined;
			let pending: { epochDay: number; hour: number; authorIdx: number; added: number; deleted: number } | undefined;

			const flushPending = () => {
				if (pending) {
					commits.push([pending.epochDay, pending.hour, pending.added, pending.deleted, pending.authorIdx]);
					pending = undefined;
				}
			};

			const lines = output.split(/\r?\n/);
			for (const line of lines) {
				if (line.startsWith(GIT_COMMIT_PREFIX)) {
					flushPending();
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

					const [y, mo, d] = dateKey.split('-').map(Number);
					const epochDay = Math.floor(Date.UTC(y, mo - 1, d) / 86_400_000);
					const hourMatch = dateTime.match(/T(\d{2}):/);
					const parsedHour = hourMatch ? Number(hourMatch[1]) : date.getHours();
					const hour = (parsedHour >= 0 && parsedHour < 24) ? parsedHour : 0;

					totalCommits += 1;
					currentDateKey = dateKey;
					currentMonthKey = monthKey;
					currentAuthor = author;

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
					currentAuthor = key;

					let authorIdx = authorIndex.get(key);
					if (authorIdx === undefined) {
						authorIdx = authors.length;
						authorIndex.set(key, authorIdx);
						authors.push(authorBucket.name);
					}
					pending = { epochDay, hour, authorIdx, added: 0, deleted: 0 };
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

				if (pending) {
					pending.added += added;
					pending.deleted += deleted;
				}

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

				const normalizedPath = normalizeGitPath(filePath);
				const fileBucket = byFile.get(normalizedPath) ?? { added: 0, deleted: 0 };
				fileBucket.added += added;
				fileBucket.deleted += deleted;
				byFile.set(normalizedPath, fileBucket);
			}
			flushPending();

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
				branch,
				branchHasCommits: branch ? scope.hasCommits : undefined,
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
				topChangedFiles,
				authors,
				commits
			};
		} catch {
			return this.emptyRepoAnalytics(true);
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

	private async getContributorStatsFromGit(rootPath: string, range: string): Promise<ContributorStat[]> {
		const output = await this.execGit(
			['log', range, '--numstat', `--pretty=${GIT_AUTHOR_PREFIX}%an|%aE`],
			rootPath
		);
		return this.parseContributorLog(output);
	}

	private async getContributorLanguageStatsFromGit(
		rootPath: string,
		authorName: string
	): Promise<ContributorLanguageStat[]> {
		const output = await this.execGit(
			['log', 'HEAD', '--numstat', `--pretty=${GIT_AUTHOR_PREFIX}%an|%aE`],
			rootPath
		);

		const languageTotals = new Map<string, number>();
		const languageByPath = new Map<string, string>();
		const existsCache = new Map<string, boolean>();
		let currentAuthorName = 'Unknown';
		let currentAuthorEmail = '';
		const lines = output.split(/\r?\n/);
		for (const line of lines) {
			if (line.startsWith(GIT_AUTHOR_PREFIX)) {
				const payload = line.slice(GIT_AUTHOR_PREFIX.length).trim();
				const sep = payload.lastIndexOf('|');
				currentAuthorName = (sep >= 0 ? payload.slice(0, sep) : payload).trim() || 'Unknown';
				currentAuthorEmail = (sep >= 0 ? payload.slice(sep + 1) : '').trim();
				continue;
			}

			if (!line.trim()) {
				continue;
			}

			if (authorName.includes('@')) {
				if (currentAuthorEmail !== authorName) { continue; }
			} else {
				if (currentAuthorName !== authorName) { continue; }
			}

			const [addedText, , filePath] = line.split('\t');
			if (!addedText || addedText === '-' || !filePath) {
				continue;
			}

			const added = Number(addedText);
			if (Number.isNaN(added)) {
				continue;
			}

			const normalizedPath = normalizeGitPath(filePath);
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
			['log', 'HEAD', '--numstat', `--pretty=${GIT_AUTHOR_PREFIX}%an|%aE`],
			rootPath
		);

		const fileTotals = new Map<string, { added: number; deleted: number }>();
		const languageByPath = new Map<string, string>();
		const existsCache = new Map<string, boolean>();
		let currentAuthorName = 'Unknown';
		let currentAuthorEmail = '';
		const lines = output.split(/\r?\n/);
		for (const line of lines) {
			if (line.startsWith(GIT_AUTHOR_PREFIX)) {
				const payload = line.slice(GIT_AUTHOR_PREFIX.length).trim();
				const sep = payload.lastIndexOf('|');
				currentAuthorName = (sep >= 0 ? payload.slice(0, sep) : payload).trim() || 'Unknown';
				currentAuthorEmail = (sep >= 0 ? payload.slice(sep + 1) : '').trim();
				continue;
			}

			if (!line.trim()) {
				continue;
			}

			if (authorName.includes('@')) {
				if (currentAuthorEmail !== authorName) { continue; }
			} else {
				if (currentAuthorName !== authorName) { continue; }
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

			const normalizedPath = normalizeGitPath(filePath);
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
		return runGit(args, cwd);
	}
}
