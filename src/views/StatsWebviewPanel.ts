import * as vscode from 'vscode';
import { StatsService } from '../services/StatsService';
import type { ContributorStat, LanguageStat } from './stats';

export class StatsWebviewPanel {
	private static currentPanel: StatsWebviewPanel | undefined;

	static createOrShow(extensionUri: vscode.Uri, statsService: StatsService): void {
		const column = vscode.ViewColumn.Beside;
		if (StatsWebviewPanel.currentPanel) {
			StatsWebviewPanel.currentPanel.panel.reveal(column);
			void StatsWebviewPanel.currentPanel.render();
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'codecount.statsPanel',
			'CodeCount',
			column,
			{ enableScripts: false, retainContextWhenHidden: true }
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

		this.panel.webview.html = this.getHtml(languageResult, contributorResult);
	}

	private getHtml(
		languageResult: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[] },
		contributorResult: { available: boolean; stats: ContributorStat[] }
	): string {
		const languageSection = this.renderLanguageSection(languageResult);
		const contributorSection = this.renderContributorSection(contributorResult);
		const csp = this.panel.webview.cspSource;

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp} https:; style-src ${csp} 'unsafe-inline';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>CodeCount</title>
	<style>
		:root {
			color-scheme: light dark;
			--bg: var(--vscode-editor-background);
			--fg: var(--vscode-editor-foreground);
			--muted: var(--vscode-descriptionForeground);
			--border: var(--vscode-panel-border);
			--accent: var(--vscode-button-background);
			--accent-hover: var(--vscode-button-hoverBackground);
			--card: var(--vscode-sideBar-background);
		}
		body {
			font-family: var(--vscode-font-family);
			color: var(--fg);
			background: var(--bg);
			margin: 0;
			padding: 24px;
		}
		.header {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 16px;
		}
		.logo {
			width: 28px;
			height: 28px;
		}
		.grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: 16px;
		}
		.card {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 16px;
		}
		.card h2 {
			margin: 0 0 12px;
			font-size: 16px;
		}
		.muted {
			color: var(--muted);
		}
		.table {
			display: grid;
			grid-template-columns: 1fr auto;
			gap: 8px 12px;
			font-size: 13px;
		}
		.bar {
			height: 8px;
			background: rgba(128, 128, 128, 0.25);
			border-radius: 999px;
			overflow: hidden;
		}
		.bar > span {
			display: block;
			height: 100%;
			background: var(--accent);
		}
		.row {
			display: flex;
			flex-direction: column;
			gap: 6px;
			margin-bottom: 12px;
		}
	</style>
</head>
<body>
	<div class="header">
		<svg class="logo" viewBox="0 0 24 24" aria-hidden="true">
			<path fill="currentColor" d="M8.7 6.3 4 12l4.7 5.7 1.6-1.4L6.4 12l3.9-4.3-1.6-1.4Zm6.6 0-1.6 1.4L17.6 12l-3.9 4.3 1.6 1.4L20 12l-4.7-5.7ZM10.4 19h2.2l4-14h-2.2l-4 14Z"/>
		</svg>
		<h1>CodeCount</h1>
	</div>
	<div class="grid">
		<div class="card">
			<h2>Languages</h2>
			${languageSection}
		</div>
		<div class="card">
			<h2>Contributors</h2>
			${contributorSection}
		</div>
	</div>
</body>
</html>`;
	}

	private renderLanguageSection(result: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[] }): string {
		if (!result.hasWorkspace) {
			return `<p class="muted">Open a workspace to see stats.</p>`;
		}
		if (result.totalFiles === 0) {
			return `<p class="muted">No files found in workspace.</p>`;
		}
		if (result.filteredFiles === 0) {
			return `<p class="muted">All files are ignored by .gitignore.</p>`;
		}
		if (result.stats.length === 0) {
			return `<p class="muted">No code lines found.</p>`;
		}

		const max = result.stats[0].lines || 1;
		return `<div class="table">${result.stats
			.map((stat) => {
				const percent = Math.max(1, Math.round((stat.lines / max) * 100));
				return `<div class="row">
					<strong>${this.formatLanguageLabel(stat.languageId)}</strong>
					<div class="bar"><span style="width:${percent}%"></span></div>
					<span class="muted">${stat.lines} lines</span>
				</div>`;
			})
			.join('')}</div>`;
	}

	private renderContributorSection(result: { available: boolean; stats: ContributorStat[] }): string {
		if (!result.available) {
			return `<p class="muted">Git repository not found.</p>`;
		}
		if (result.stats.length === 0) {
			return `<p class="muted">No Git history available.</p>`;
		}

		const max = result.stats[0].linesAdded || 1;
		return `<div class="table">${result.stats
			.map((stat) => {
				const percent = Math.max(1, Math.round((stat.linesAdded / max) * 100));
				return `<div class="row">
					<strong>${this.escapeHtml(stat.name)}</strong>
					<div class="bar"><span style="width:${percent}%"></span></div>
					<span class="muted">${stat.linesAdded} lines added</span>
				</div>`;
			})
			.join('')}</div>`;
	}

	private formatLanguageLabel(languageId: string): string {
		if (!languageId) {
			return 'Unknown';
		}
		return languageId
			.split(/[-_]/g)
			.map((part) => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
			.join(' ');
	}

	private escapeHtml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
}
