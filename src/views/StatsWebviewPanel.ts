import * as vscode from 'vscode';
import { StatsService } from '../services/StatsService';
import type { ContributorStat, LanguageStat, RepoAnalyticsResult } from '../types';
import { getStyles } from './webview/styles';
import {
	renderStatsOverview,
	renderLanguageCharts,
	renderLanguageTable,
	renderContributorsChart,
	renderIgnoredFilesSection,
	renderRepoAnalytics
} from './webview/templates';

export class StatsWebviewPanel {
	private static currentPanel: StatsWebviewPanel | undefined;

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
		private readonly statsService: StatsService
	) {
		this.panel.onDidDispose(() => this.dispose());
	}

	private dispose(): void {
		StatsWebviewPanel.currentPanel = undefined;
	}

	private async render(): Promise<void> {
		const languageResult = await this.statsService.getLanguageStats();
		const contributorResult = await this.statsService.getContributorStats();
		const repoAnalytics = await this.statsService.getRepoAnalytics();

		this.panel.webview.html = this.getHtml(languageResult, contributorResult, repoAnalytics);
	}

	private getHtml(
		languageResult: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[] },
		contributorResult: { available: boolean; stats: ContributorStat[] },
		repoAnalytics: RepoAnalyticsResult
	): string {
		const csp = this.panel.webview.cspSource;
		
		// Filter out ignored files from main language stats
		const validLanguageStats = languageResult.stats.filter(stat => stat.languageId !== 'ignore');
		const cleanLanguageResult = {
			...languageResult,
			stats: validLanguageStats
		};

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

		<div class="main-grid">
			${renderLanguageCharts(cleanLanguageResult)}
			${renderLanguageTable(cleanLanguageResult)}
			${renderContributorsChart(contributorResult)}
			${renderRepoAnalytics(repoAnalytics)}
		</div>

		${renderIgnoredFilesSection(languageResult)}
	</div>

	<script>
	(function(){
		function packGrid(selector) {
			const grid = document.querySelector(selector);
			if (!grid) return;
			const style = getComputedStyle(grid);
			const rowHeight = parseInt(style.getPropertyValue('grid-auto-rows')) || 8;
			const rowGap = parseInt(style.rowGap) || parseInt(style.getPropertyValue('gap')) || 12;
			Array.from(grid.children).forEach((item) => {
				const h = Math.ceil((item.getBoundingClientRect().height + rowGap) / (rowHeight + rowGap));
				item.style.gridRowEnd = 'span ' + Math.max(1, h);
			});
		}

		function runPack() {
			packGrid('.main-grid');
			packGrid('.two-col-grid');
		}

		window.__codecountRequestLayout = () => {
			setTimeout(runPack, 120);
		};

		window.addEventListener('load', () => { window.__codecountRequestLayout?.(); });
		window.addEventListener('resize', () => { window.__codecountRequestLayout?.(); });

		const mo = new MutationObserver(() => { window.__codecountRequestLayout?.(); });
		mo.observe(document.body, { childList: true, subtree: true, attributes: true });
	})();
	</script>

	</body>
	</html>`;
	}
}
