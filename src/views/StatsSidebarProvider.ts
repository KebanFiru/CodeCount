import * as vscode from 'vscode';
import { StatsService } from '../services/StatsService';
import { getSidebarHtml } from './webview/sidebar/layout';
import { renderBranchSummary, renderNoCommitsBanner } from './webview/sidebar/sections/branchSummary';
import { renderStatTiles } from './webview/sidebar/sections/statTiles';
import { renderLanguageFiles, renderLanguageList } from './webview/sidebar/sections/languages';
import {
	renderContributorFiles,
	renderContributorLanguages,
	renderContributorList
} from './webview/sidebar/sections/contributors';
import {
	renderAllIgnored,
	renderContributorsNeedGit,
	renderNoFiles,
	renderNoGitRepo,
	renderNoWorkspace
} from './webview/sidebar/sections/emptyState';

type InboundMessage =
	| { type: 'ready' }
	| { type: 'setTab'; tab: 'languages' | 'contributors' }
	| { type: 'expand'; section: 'language' | 'contributor' | 'contributorLanguage'; key: string; languageId?: string; author?: string }
	| { type: 'openFileHistory'; filePath?: string; absolutePath?: string }
	| { type: 'openContributorFile'; author?: string; filePath?: string }
	| { type: 'openDashboard' }
	| { type: 'initRepo' };

export class StatsSidebarProvider implements vscode.WebviewViewProvider {
	private view?: vscode.WebviewView;

	constructor(private readonly statsService: StatsService) {}

	resolveWebviewView(webviewView: vscode.WebviewView): void {
		this.view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: []
		};
		webviewView.webview.html = getSidebarHtml(webviewView.webview);

		webviewView.webview.onDidReceiveMessage((message: InboundMessage) => {
			void this.handleMessage(message);
		});

		webviewView.onDidChangeVisibility(() => {
			if (webviewView.visible) {
				void this.pushData();
			}
		});

		webviewView.onDidDispose(() => {
			if (this.view === webviewView) {
				this.view = undefined;
			}
		});
	}

	refresh(): void {
		void this.pushData();
	}

	private async handleMessage(message: InboundMessage): Promise<void> {
		switch (message.type) {
			case 'ready':
				await this.pushData();
				return;

			case 'expand':
				await this.handleExpand(message);
				return;

			case 'openFileHistory':
				if (message.filePath) {
					await vscode.commands.executeCommand('codecount.openFileHistory', {
						filePath: message.filePath,
						absolutePath: message.absolutePath
					});
				}
				return;

			case 'openContributorFile':
				if (message.author && message.filePath) {
					await vscode.commands.executeCommand('codecount.openContributorFile', {
						author: message.author,
						filePath: message.filePath
					});
				}
				return;

			case 'openDashboard':
				await vscode.commands.executeCommand('codecount.openAnalytics');
				return;

			case 'initRepo':
				await this.handleInitRepo();
				return;

			case 'setTab':
				return;

			default:
				return;
		}
	}

	private async handleExpand(message: Extract<InboundMessage, { type: 'expand' }>): Promise<void> {
		const { section, key } = message;
		this.postMessage({ type: 'loading', key });

		try {
			if (section === 'language') {
				const languageId = message.languageId ?? '';
				const result = await this.statsService.getLanguageFileStats(languageId);
				if (!result.available) {
					this.postMessage({ type: 'error', key, message: 'Git repository not found.' });
					return;
				}
				this.postMessage({ type: 'children', key, html: renderLanguageFiles(result.stats) });
				return;
			}

			if (section === 'contributor') {
				const author = message.author ?? '';
				const result = await this.statsService.getContributorLanguageStats(author);
				if (!result.available) {
					this.postMessage({ type: 'error', key, message: 'Git repository not found.' });
					return;
				}
				this.postMessage({ type: 'children', key, html: renderContributorLanguages(author, result.stats) });
				return;
			}

			if (section === 'contributorLanguage') {
				const author = message.author ?? '';
				const languageId = message.languageId ?? '';
				const result = await this.statsService.getContributorLanguageFileStats(author, languageId);
				if (!result.available) {
					this.postMessage({ type: 'error', key, message: 'Git repository not found.' });
					return;
				}
				this.postMessage({ type: 'children', key, html: renderContributorFiles(author, result.stats) });
				return;
			}
		} catch {
			this.postMessage({ type: 'error', key, message: 'Failed to load data.' });
		}
	}

	private async handleInitRepo(): Promise<void> {
		try {
			await vscode.commands.executeCommand('git.init');
		} catch {
			vscode.window.showWarningMessage('Could not initialize a Git repository. Is the built-in Git extension enabled?');
			return;
		}
		this.statsService.clearCache();
		await this.pushData();
	}

	private async pushData(): Promise<void> {
		if (!this.view) {
			return;
		}

		const [languageResult, contributorResult] = await Promise.all([
			this.statsService.getLanguageStats(),
			this.statsService.getContributorStats()
		]);

		const hasWorkspace = languageResult.hasWorkspace;
		const hasGitRepo = contributorResult.available;
		const visibleStats = languageResult.stats.filter(s => s.languageId !== 'ignore');
		const totalLines = visibleStats.reduce((sum, s) => sum + s.lines, 0);
		const totalFiles = languageResult.filteredFiles;

		let emptyStateHtml = '';
		let showTabs = true;
		if (!hasWorkspace) {
			emptyStateHtml = renderNoWorkspace();
			showTabs = false;
		} else if (languageResult.totalFiles === 0) {
			emptyStateHtml = renderNoFiles();
		} else if (languageResult.filteredFiles === 0) {
			emptyStateHtml = renderAllIgnored();
		} else if (!hasGitRepo) {
			emptyStateHtml = renderNoGitRepo();
		}

		const branchSummaryHtml = hasWorkspace
			? renderBranchSummary({
				branch: languageResult.branch,
				ahead: languageResult.ahead,
				behind: languageResult.behind
			})
			: '';

		const noCommitsBannerHtml = hasWorkspace
			? renderNoCommitsBanner({
				branch: languageResult.branch,
				branchHasCommits: contributorResult.branchHasCommits,
				workingTreeFileCount: totalFiles
			})
			: '';

		const statTilesHtml = hasWorkspace ? renderStatTiles(totalLines, totalFiles) : '';
		const languagesHtml = hasWorkspace ? renderLanguageList(languageResult.stats, totalLines) : '';
		const contributorsHtml = !hasWorkspace
			? ''
			: !hasGitRepo
				? renderContributorsNeedGit()
				: renderContributorList(contributorResult.stats);

		this.postMessage({
			type: 'data',
			payload: {
				branchSummaryHtml,
				noCommitsBannerHtml,
				statTilesHtml,
				emptyStateHtml,
				languagesHtml,
				contributorsHtml,
				showTabs
			}
		});
	}

	private postMessage(message: unknown): void {
		void this.view?.webview.postMessage(message);
	}
}
