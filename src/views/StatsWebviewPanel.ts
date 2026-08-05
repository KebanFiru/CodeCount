import * as vscode from 'vscode';
import { StatsService } from '../services/StatsService';
import type {
	ContributorStatsResult,
	LanguageFileStat,
	LanguageStatsResult,
	RepoAnalyticsResult,
} from '../types';
import { getStyles } from './webview/styles';
import { escapeHtml } from './webview/utils';
import { chartThemeScript, commitAggregationScript } from './webview/chartTheme';
import {
	getLogoSvg,
	renderStatsOverview,
	renderOverviewTab,
	renderLanguageCharts,
	renderLanguageTable,
	renderLargestFiles,
	renderContributorsChart,
	renderContributorTimeline,
	renderActivityTab,
} from './webview/templates';

type PanelData = {
	language: LanguageStatsResult;
	contributors: ContributorStatsResult;
	analytics: RepoAnalyticsResult;
	files: LanguageFileStat[];
};

const TABS = [
	{ id: 'overview', label: 'Overview' },
	{ id: 'languages', label: 'Languages' },
	{ id: 'contributors', label: 'Contributors' },
	{ id: 'activity', label: 'Activity' },
] as const;

const createNonce = (): string => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let text = '';
	for (let i = 0; i < 32; i++) {
		text += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return text;
};

export class StatsWebviewPanel {
	private static currentPanel: StatsWebviewPanel | undefined;
	private readonly disposables: vscode.Disposable[] = [];

	static createOrShow(extensionUri: vscode.Uri, statsService: StatsService): void {
		const column = vscode.ViewColumn.One;
		if (StatsWebviewPanel.currentPanel) {
			StatsWebviewPanel.currentPanel.panel.reveal(column);
			void StatsWebviewPanel.currentPanel.render();
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'codecount.statsPanel',
			'CodeCount',
			column,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
			}
		);

		StatsWebviewPanel.currentPanel = new StatsWebviewPanel(panel, extensionUri, statsService);
		void StatsWebviewPanel.currentPanel.render();
	}

	static refreshIfOpen(): void {
		if (StatsWebviewPanel.currentPanel) {
			void StatsWebviewPanel.currentPanel.render();
		}
	}

	private constructor(
		private readonly panel: vscode.WebviewPanel,
		private readonly extensionUri: vscode.Uri,
		private readonly statsService: StatsService,
	) {
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
		this.disposables.push(
			vscode.window.onDidChangeActiveColorTheme(() => void this.render())
		);
	}

	private dispose(): void {
		StatsWebviewPanel.currentPanel = undefined;
		while (this.disposables.length) {
			this.disposables.pop()?.dispose();
		}
	}

	private async render(): Promise<void> {
		const [language, contributors, analytics, fileStats] = await Promise.all([
			this.statsService.getLanguageStats(),
			this.statsService.getContributorStats(),
			this.statsService.getRepoAnalytics(),
			this.statsService.getFileStats(),
		]);

		this.panel.webview.html = this.getHtml({
			language,
			contributors,
			analytics,
			files: fileStats.stats,
		});
	}

	private getHtml(data: PanelData): string {
		const { webview } = this.panel;
		const nonce = createNonce();
		const chartUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'chart.umd.js')
		);

		const stats = data.language.stats.filter(stat => stat.languageId !== 'ignore');
		const language: LanguageStatsResult = { ...data.language, stats };
		const totalLines = stats.reduce((sum, stat) => sum + stat.lines, 0);

		const fileCounts = new Map<string, number>();
		const languageOf = new Map<string, string>();
		for (const file of data.files) {
			fileCounts.set(file.languageId, (fileCounts.get(file.languageId) ?? 0) + 1);
			languageOf.set(file.filePath, file.languageId);
		}

		const tabBar = TABS.map((tab, index) => `
			<button class="tab" role="tab" id="tab-btn-${tab.id}" data-tab="${tab.id}"
				aria-selected="${index === 0}" aria-controls="tab-${tab.id}">${tab.label}</button>
		`).join('');

		const panes: Record<string, string> = {
			overview: renderOverviewTab(data.analytics, language, nonce),
			languages: [
				renderLanguageCharts(language, nonce),
				renderLanguageTable(language, fileCounts),
				renderLargestFiles(data.files, languageOf),
			].join(''),
			contributors: [
				renderContributorsChart(data.contributors, data.analytics, nonce),
				renderContributorTimeline(data.analytics, nonce),
			].join(''),
			activity: renderActivityTab(data.analytics, nonce),
		};

		const tabContents = TABS.map((tab, index) => `
			<div id="tab-${tab.id}" class="tab-content${index === 0 ? ' active' : ''}"
				role="tabpanel" aria-labelledby="tab-btn-${tab.id}">
				${panes[tab.id]}
			</div>
		`).join('');

		const branchSubtitle = language.branch
			? `${language.branch} · ${language.ahead ?? 0} ahead · ${language.behind ?? 0} behind`
			: 'Repository metrics and code insights';

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>CodeCount</title>
	<style>${getStyles()}</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<div>
				<h1>${getLogoSvg()} CodeCount</h1>
				<div class="subtitle">${escapeHtml(branchSubtitle)}</div>
			</div>
		</div>

		${renderStatsOverview(language, data.analytics, data.contributors, totalLines)}

		<nav class="tab-bar" role="tablist" aria-label="Dashboard sections">${tabBar}</nav>

		<script nonce="${nonce}" src="${chartUri}"></script>
		<script nonce="${nonce}">${chartThemeScript}</script>
		<script nonce="${nonce}">${commitAggregationScript}</script>

		${tabContents}
	</div>

	<script nonce="${nonce}">
	(function() {
		var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
		var panes = Array.prototype.slice.call(document.querySelectorAll('.tab-content'));

		function activate(id) {
			tabs.forEach(function(tab) {
				tab.setAttribute('aria-selected', String(tab.getAttribute('data-tab') === id));
			});
			panes.forEach(function(pane) {
				pane.classList.toggle('active', pane.id === 'tab-' + id);
			});
		}

		tabs.forEach(function(tab, index) {
			tab.addEventListener('click', function() {
				activate(tab.getAttribute('data-tab'));
			});
			// Arrow-key navigation, as expected of a tablist.
			tab.addEventListener('keydown', function(e) {
				var delta = e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowLeft' ? -1 : 0);
				if (!delta) { return; }
				e.preventDefault();
				var next = tabs[(index + delta + tabs.length) % tabs.length];
				next.focus();
				activate(next.getAttribute('data-tab'));
			});
		});
	})();
	</script>
</body>
</html>`;
	}
}
