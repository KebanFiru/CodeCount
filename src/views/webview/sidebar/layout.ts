import type * as vscode from 'vscode';
import { getSidebarStyles } from './styles';
import { getSidebarScript } from './script';

export function getNonce(): string {
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let text = '';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}


export function getSidebarHtml(webview: vscode.Webview): string {
	const csp = webview.cspSource;
	const nonce = getNonce();

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${csp} 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>CodeCount</title>
	<style>${getSidebarStyles()}</style>
</head>
<body>
	<div class="sidebar-root" id="root">
		<div id="branch-summary"></div>
		<div id="no-commits-banner"></div>
		<div id="stat-tiles"></div>
		<div id="empty-state"></div>

		<div id="tab-view">
			<div class="tablist" role="tablist" aria-label="Stats view">
				<button type="button" class="tab" role="tab" id="tab-languages" aria-selected="true"
					aria-controls="panel-languages" data-tab="languages">Languages</button>
				<button type="button" class="tab" role="tab" id="tab-contributors" aria-selected="false"
					aria-controls="panel-contributors" data-tab="contributors" tabindex="-1">Contributors</button>
			</div>

			<div class="filter-wrap">
				<span class="filter-icon" aria-hidden="true">&#8981;</span>
				<input class="filter-input" id="filter-input" type="text" placeholder="filter…" aria-label="Filter rows" />
			</div>

			<div class="sidebar-scroll">
				<div class="tab-panel active" id="panel-languages" role="tabpanel" aria-labelledby="tab-languages"></div>
				<div class="tab-panel" id="panel-contributors" role="tabpanel" aria-labelledby="tab-contributors"></div>
			</div>
		</div>

		<div class="sidebar-footer">
			<button type="button" class="footer-btn" data-action="openDashboard">
				<span aria-hidden="true">&#10530;</span> Open Analytics Dashboard
			</button>
		</div>
	</div>

	<script nonce="${nonce}">${getSidebarScript()}</script>
</body>
</html>`;
}
