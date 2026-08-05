export function getSidebarStyles(): string {
	return `
		* { box-sizing: border-box; }

		html, body {
			margin: 0;
			padding: 0;
			height: 100%;
			overflow-x: hidden;
			background: var(--vscode-sideBar-background);
			color: var(--vscode-foreground);
			font-family: var(--vscode-font-family, sans-serif);
			font-size: var(--vscode-font-size, 13px);
		}

		.sidebar-root {
			display: flex;
			flex-direction: column;
			height: 100%;
			padding: 8px 10px 0 10px;
			overflow-x: hidden;
			container-type: inline-size;
		}

		#tab-view {
			display: flex;
			flex-direction: column;
			flex: 1 1 auto;
			min-height: 0;
		}

		.sidebar-scroll {
			flex: 1 1 auto;
			min-height: 0;
			overflow-y: auto;
			overflow-x: hidden;
			min-width: 0;
		}

		button {
			font-family: inherit;
			font-size: inherit;
			color: inherit;
		}

		/* -- Branch summary -- */

		.branch-summary {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 4px 2px 0 2px;
			min-width: 0;
		}
		.branch-icon { color: var(--vscode-descriptionForeground); flex: 0 0 auto; }
		.branch-name {
			font-weight: 600;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			min-width: 0;
		}
		.branch-aheadbehind {
			padding: 0 2px 4px 22px;
			color: var(--vscode-descriptionForeground);
			font-size: 0.92em;
		}
		.branch-banner {
			margin: 6px 0;
			padding: 6px 8px;
			border: 1px solid var(--vscode-widget-border);
			background: var(--vscode-editorWidget-background);
			border-radius: 4px;
			font-size: 0.92em;
			color: var(--vscode-foreground);
		}

		/* -- Stat tiles -- */

		.stat-tiles {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 6px;
			margin: 8px 0;
		}
		.stat-tile {
			border: 1px solid var(--vscode-widget-border);
			background: var(--vscode-editorWidget-background);
			border-radius: 4px;
			padding: 8px 6px;
			text-align: center;
			min-width: 0;
		}
		.stat-value {
			font-size: 1.25em;
			font-weight: 700;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.stat-label {
			margin-top: 2px;
			font-size: 0.78em;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			color: var(--vscode-descriptionForeground);
		}

		/* -- Segmented control (tabs) -- */

		.tablist {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 2px;
			border: 1px solid var(--vscode-widget-border);
			border-radius: 4px;
			padding: 2px;
			margin: 4px 0 8px 0;
		}
		.tab {
			border: none;
			background: transparent;
			padding: 5px 4px;
			border-radius: 3px;
			cursor: pointer;
			text-align: center;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.tab[aria-selected="true"] {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}
		.tab:hover:not([aria-selected="true"]) {
			background: var(--vscode-list-hoverBackground);
		}

		/* -- Filter -- */

		.filter-wrap {
			position: relative;
			margin-bottom: 6px;
		}
		.filter-input {
			width: 100%;
			padding: 4px 6px 4px 22px;
			border: 1px solid var(--vscode-widget-border);
			background: var(--vscode-editorWidget-background);
			color: var(--vscode-foreground);
			border-radius: 4px;
		}
		.filter-icon {
			position: absolute;
			left: 6px;
			top: 50%;
			transform: translateY(-50%);
			color: var(--vscode-descriptionForeground);
			pointer-events: none;
		}

		/* -- Accordion -- */

		.tab-panel { display: none; min-width: 0; }
		.tab-panel.active { display: block; }

		.acc-item { min-width: 0; }
		.acc-item.is-filtered-out { display: none; }

		.acc-header {
			display: flex;
			align-items: center;
			gap: 6px;
			width: 100%;
			border: none;
			background: transparent;
			padding: 4px 2px;
			border-radius: 3px;
			cursor: pointer;
			text-align: left;
			min-width: 0;
		}
		.acc-header:hover { background: var(--vscode-list-hoverBackground); }
		.acc-header:focus-visible, .file-row:focus-visible, .tab:focus-visible, .empty-action:focus-visible {
			outline: 1px solid var(--vscode-focusBorder);
			outline-offset: -1px;
		}

		.acc-chevron {
			flex: 0 0 auto;
			display: inline-block;
			font-size: 0.75em;
			color: var(--vscode-descriptionForeground);
			transition: transform 0.1s ease;
		}
		.acc-header[aria-expanded="true"] > .acc-chevron { transform: rotate(90deg); }

		.acc-name {
			flex: 1 1 auto;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.acc-value {
			flex: 0 0 auto;
			color: var(--vscode-descriptionForeground);
			font-variant-numeric: tabular-nums;
		}

		.acc-bar-row {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 0 2px 4px 22px;
		}
		.acc-bar-track {
			flex: 1 1 auto;
			height: 5px;
			border-radius: 3px;
			background: var(--vscode-widget-border);
			overflow: hidden;
			min-width: 0;
		}
		.acc-bar-fill { height: 100%; }
		.acc-percent {
			flex: 0 0 auto;
			font-size: 0.85em;
			color: var(--vscode-descriptionForeground);
			font-variant-numeric: tabular-nums;
		}

		.acc-children {
			padding-left: 20px;
			border-left: 1px solid var(--vscode-widget-border);
			margin: 2px 0 4px 8px;
		}

		.acc-item--nested .acc-header { padding-left: 0; }

		.contrib-dot {
			flex: 0 0 auto;
			width: 8px;
			height: 8px;
			border-radius: 50%;
		}
		.contrib-stats-row {
			display: flex;
			gap: 8px;
			align-items: center;
			padding: 0 2px 2px 22px;
			font-size: 0.9em;
			font-variant-numeric: tabular-nums;
		}
		.contrib-added { color: var(--vscode-charts-green); }
		.contrib-deleted { color: var(--vscode-charts-red); }
		.contrib-stats-row .acc-percent { margin-left: auto; }

		.file-row {
			display: flex;
			align-items: center;
			gap: 6px;
			width: 100%;
			border: none;
			background: transparent;
			padding: 3px 2px;
			border-radius: 3px;
			cursor: pointer;
			text-align: left;
			min-width: 0;
		}
		.file-row:hover { background: var(--vscode-list-hoverBackground); }
		.file-name {
			flex: 1 1 auto;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			unicode-bidi: plaintext;
		}
		.file-value {
			flex: 0 0 auto;
			color: var(--vscode-descriptionForeground);
			font-size: 0.9em;
			font-variant-numeric: tabular-nums;
		}

		.list-empty {
			padding: 8px 4px;
			color: var(--vscode-descriptionForeground);
			font-size: 0.92em;
		}
		.list-empty--nested { padding: 4px 2px; }

		.loading-row, .error-row {
			padding: 4px 2px;
			color: var(--vscode-descriptionForeground);
			font-size: 0.9em;
		}
		.error-row { color: var(--vscode-errorForeground, var(--vscode-descriptionForeground)); }

		/* -- Empty states -- */

		.empty-state {
			text-align: center;
			padding: 22px 10px;
			color: var(--vscode-foreground);
		}
		.empty-state--nested { padding: 10px 4px; }
		.empty-icon { font-size: 1.8em; opacity: 0.7; }
		.empty-title { margin-top: 8px; font-weight: 600; }
		.empty-body {
			margin-top: 4px;
			color: var(--vscode-descriptionForeground);
			font-size: 0.92em;
		}
		.empty-action {
			margin-top: 10px;
			padding: 5px 12px;
			border: none;
			border-radius: 3px;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			cursor: pointer;
		}
		.empty-action:hover { opacity: 0.9; }
		.empty-footnote {
			margin-top: 10px;
			padding-top: 8px;
			border-top: 1px solid var(--vscode-widget-border);
			color: var(--vscode-descriptionForeground);
			font-size: 0.85em;
		}

		/* -- Footer -- */

		.sidebar-footer {
			flex: 0 0 auto;
			background: var(--vscode-sideBar-background);
			border-top: 1px solid var(--vscode-widget-border);
			padding: 8px 0;
			margin-top: 8px;
		}
		.footer-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			width: 100%;
			padding: 6px 8px;
			border: 1px solid var(--vscode-widget-border);
			border-radius: 4px;
			background: transparent;
			cursor: pointer;
		}
		.footer-btn:hover { background: var(--vscode-list-hoverBackground); }

		/* -- Narrow width (<220px): stack tiles, hide percentages -- */

		@container (max-width: 219px) {
			.stat-tiles { grid-template-columns: 1fr; }
			.acc-percent { display: none; }
		}

		/* Fallback for hosts without container query support: same breakpoint via body width is not
		   observable in CSS alone, so JS also toggles .is-narrow on the root (see script.ts). */
		.sidebar-root.is-narrow .stat-tiles { grid-template-columns: 1fr; }
		.sidebar-root.is-narrow .acc-percent { display: none; }
	`;
}
