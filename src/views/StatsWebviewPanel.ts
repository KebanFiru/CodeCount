import * as vscode from 'vscode';
import { StatsService } from '../services/StatsService';
import type { ContributorStat, LanguageStat, RepoAnalyticsResult } from '../types';
import { getStyles } from './webview/styles';
import {
	renderStatsOverview,
	renderLanguageCharts,
	renderLanguageTable,
	renderContributorsChart,
	renderRepoAnalytics,
} from './webview/templates';

export class StatsWebviewPanel {
	private static currentPanel: StatsWebviewPanel | undefined;

	static createOrShow(
		extensionUri: vscode.Uri,
		statsService: StatsService,
	): void {
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
			{ enableScripts: true, retainContextWhenHidden: true }
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
		this.panel.onDidDispose(() => this.dispose());
	}

	private dispose(): void {
		StatsWebviewPanel.currentPanel = undefined;
	}

	private async render(): Promise<void> {
		const [languageResult, contributorResult, repoAnalytics] =
			await Promise.all([
				this.statsService.getLanguageStats(),
				this.statsService.getContributorStats(),
				this.statsService.getRepoAnalytics(),
			]);

		this.panel.webview.html = this.getHtml(
			languageResult,
			contributorResult,
			repoAnalytics,
		);
	}

	private getHtml(
		languageResult: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[] },
		contributorResult: { available: boolean; stats: ContributorStat[] },
		repoAnalytics: RepoAnalyticsResult,
	): string {
		const csp = this.panel.webview.cspSource;

		const validLanguageStats = languageResult.stats.filter(stat => stat.languageId !== 'ignore');
		const cleanLanguageResult = { ...languageResult, stats: validLanguageStats };
		const totalLines = validLanguageStats.reduce((sum, stat) => sum + stat.lines, 0);
		const ignoredCount = languageResult.totalFiles - languageResult.filteredFiles;

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp} https: data:; style-src ${csp} 'unsafe-inline'; script-src ${csp} https: 'unsafe-inline';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>CodeCount</title>
	<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
	<style>
		${getStyles()}
	</style>
</head>
<body>
	<div class="container">

		<div class="header">
			<div>
				<h1>CodeCount</h1>
				<div class="subtitle">Repository metrics and code insights</div>
			</div>
		</div>

		${renderStatsOverview(cleanLanguageResult, ignoredCount, totalLines)}

		<nav class="tab-bar" role="tablist">
			<button class="tab active" role="tab" data-tab="languages">Languages</button>
			<button class="tab" role="tab" data-tab="contributors">Contributors</button>
			<button class="tab" role="tab" data-tab="analytics">Repo Analytics</button>
		</nav>

		<div id="tab-languages" class="tab-content active">
			<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;">
				${renderLanguageCharts(cleanLanguageResult)}
				${renderLanguageTable(cleanLanguageResult)}
			</div>
		</div>

		<div id="tab-contributors" class="tab-content">
			${renderContributorsChart(contributorResult)}
		</div>

		<div id="tab-analytics" class="tab-content">
			${renderRepoAnalytics(repoAnalytics)}
		</div>

	</div>

	<script>
	(function() {
		// Tab switching
		const tabs = document.querySelectorAll('.tab');
		const contents = document.querySelectorAll('.tab-content');

		tabs.forEach(function(tab) {
			tab.addEventListener('click', function() {
				const target = tab.getAttribute('data-tab');
				tabs.forEach(function(t) { t.classList.remove('active'); });
				contents.forEach(function(c) { c.classList.remove('active'); });
				tab.classList.add('active');
				const content = document.getElementById('tab-' + target);
				if (content) { content.classList.add('active'); }
			});
		});
	})();
	</script>

</body>
</html>`;
	}
}
