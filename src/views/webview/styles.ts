export const getStyles = (): string => {
	return `
		:root {
			color-scheme: light dark;
			--bg: var(--vscode-editor-background);
			--fg: var(--vscode-editor-foreground);
			--muted: var(--vscode-descriptionForeground);
			--border: var(--vscode-panel-border);
			--accent: var(--vscode-button-background);
			--accent-hover: var(--vscode-button-hoverBackground);
			--card: var(--vscode-sideBar-background);
			--input-bg: var(--vscode-input-background);
			--surface-2: color-mix(in srgb, var(--card) 85%, var(--bg) 15%);
		}
		
		* {
			box-sizing: border-box;
		}
		
		body {
			font-family: var(--vscode-font-family), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
			color: var(--fg);
			background: var(--bg);
			margin: 0;
			padding: 12px;
			font-size: 14px;
			line-height: 1.45;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
			overflow-x: hidden;
		}

		/* Centering container to avoid content stretching across very wide viewports */
		.container {
			max-width: 1000px;
			margin: 0 auto;
			display: grid;
			gap: 14px;
		}
		
		/* Header - Dashboard Title */
		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			margin-bottom: 16px;
			padding: 12px 14px;
			border-radius: 8px;
			background: var(--surface-2);
		}
		
		.header h1 {
			margin: 0;
			font-size: 20px;
			font-weight: 600;
		}
		
		.header .subtitle {
			font-size: 12px;
			color: var(--muted);
			font-weight: 400;
			margin-top: 4px;
		}
		
		/* Stats Overview - Key Metrics */
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
			gap: 12px;
			margin-bottom: 16px;
		}
		
		.stat-card {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 12px;
			text-align: center;
			min-width: 0;
		}
		
		.stat-value {
			font-size: 24px;
			font-weight: 600;
			color: var(--accent);
			margin: 8px 0;
			word-break: break-word;
		}
		
		.stat-label {
			font-size: 11px;
			color: var(--muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			font-weight: 500;
		}
		
		/* Main Grid - Chart Panels */
		.main-grid {
			display: grid;
			/* tighter column control to avoid extreme wide gaps */
			grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
			gap: 12px;
			margin-bottom: 16px;
			align-items: start;
			/* use a small baseline row height; JS will compute spans to pack items tightly */
			grid-auto-rows: 8px;
			grid-auto-flow: dense;
			align-content: start;
		}

		/* Two column layout for wide analytics sections */
		.two-col-grid {
			display: grid;
			/* left column occupies roughly half the available width, right column takes remaining space */
			grid-template-columns: 50% 1fr;
			gap: 14px;
			align-items: start;
			grid-auto-rows: 8px;
			grid-auto-flow: dense;
		}

		.right-stack {
			display: flex;
			flex-direction: column;
			gap: 14px;
		}

		.large-card {
			/* make the left large chart take more vertical space but cap it */
			min-height: 360px;
			max-height: 720px;
			overflow: hidden;
		}

		/* collapse two-column layout on narrow screens */
		@media (max-width: 1100px) {
			.two-col-grid {
				grid-template-columns: 1fr;
			}
		}

		.card h2 {
			font-size: 15px;
			margin-bottom: 12px;
		}
		
		.card {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 12px;
			min-width: 0;
			overflow: hidden;
			display: flex;
			flex-direction: column;
			align-self: start;
			align-items: stretch;
			min-height: 220px;
		}
		
		.card h2 {
			margin: 0 0 16px;
			font-size: 14px;
			font-weight: 600;
		}
		
		.card h3 {
			margin: 16px 0 12px;
			font-size: 13px;
			font-weight: 600;
		}
		
		/* Section Grid */
		.section-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 14px;
		}
		
		/* Utilities */
		.muted {
			color: var(--muted);
		}
		
		/* Chart Container */
		.chart-container {
			position: relative;
			height: auto;
			margin-bottom: 10px;
			min-width: 0;
			/* ensure chart container does not stretch grid rows unexpectedly */
			flex: 0 0 auto;
			max-height: none;
			width: 100%;
			display: block;
		}

		/* Ensure canvas fits its container to avoid visual overlap */
		canvas {
			display: block !important;
			width: 100% !important;
			height: auto !important;
		}
		
		.chart-container.compact {
			height: 200px;
		}
		
		/* Table Styles */
		.table {
			display: flex;
			flex-direction: column;
			gap: 8px;
			font-size: 13px;
			min-width: 0;
		}
		
		.bar {
			height: 6px;
			background: rgba(128, 128, 128, 0.15);
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
			padding: 10px;
			border-radius: 6px;
			background: color-mix(in srgb, var(--card) 60%, var(--bg) 40%);
			border-left: 2px solid transparent;
		}
		
		.row:hover {
			background: color-mix(in srgb, var(--card) 85%, var(--bg) 15%);
			border-left-color: var(--accent);
		}
		
		.lang-label {
			display: flex;
			align-items: flex-start;
			gap: 8px;
			font-weight: 500;
			min-width: 0;
		}
		
		.lang-icon {
			width: 14px;
			height: 14px;
			border-radius: 3px;
			flex-shrink: 0;
			margin-top: 1px;
		}
		
		.lang-info {
			font-size: 12px;
			color: var(--muted);
			margin-top: 4px;
			line-height: 1.45;
			word-break: break-word;
		}
		
		/* Metric Grid */
		.metric-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
			gap: 10px;
		}
		
		.metric-card {
			padding: 12px;
			border: 1px solid var(--border);
			border-radius: 6px;
			background: color-mix(in srgb, var(--card) 60%, var(--bg) 40%);
			min-width: 0;
		}
		
		.metric-title {
			font-size: 12px;
			text-transform: uppercase;
			color: var(--muted);
			font-weight: 600;
		}
		
		.metric-value {
			font-size: 18px;
			font-weight: 700;
			margin-top: 4px;
			word-break: break-word;
		}
		
		.metric-note {
			font-size: 11px;
			color: var(--muted);
			margin-top: 2px;
		}
		
		/* Files Table */
		.files-table {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto auto;
			gap: 8px 12px;
			align-items: center;
			font-size: 13px;
		}
		
		.files-table > * {
			min-width: 0;
		}

		.file-path {
			overflow: hidden;
			text-overflow: ellipsis;
			/* allow wrapping long file paths instead of forcing a single long line */
			overflow-wrap: anywhere;
			word-break: break-word;
			color: var(--fg);
			font-size: 13px;
			max-width: 100%;
		}
		
		/* Ignored Files Section */
		.ignored-section {
			background: var(--surface-2);
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 16px;
			margin-top: 16px;
		}
		
		.ignored-section h4 {
			margin: 0 0 10px;
			font-size: 13px;
			font-weight: 600;
		}
		
		.ignored-count {
			font-size: 24px;
			font-weight: 600;
			margin: 8px 0;
		}
		
		.ignored-note {
			font-size: 12px;
			color: var(--muted);
		}
		
		/* Empty State */
		.empty-state {
			padding: 32px 16px;
			text-align: center;
			color: var(--muted);
		}

		/* Responsive */
		@media (max-width: 1200px) {
			.main-grid {
				grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
			}
		}

		@media (max-width: 768px) {
			body {
				padding: 12px;
			}
			
			.header {
				padding: 12px;
				margin-bottom: 12px;
				flex-direction: column;
				align-items: flex-start;
			}
			
			.stats-grid {
				grid-template-columns: repeat(2, 1fr);
				gap: 10px;
				margin-bottom: 12px;
			}
			
			.main-grid {
				gap: 10px;
				margin-bottom: 12px;
			}
			
			.chart-container {
				height: 200px;
			}
		}

		@media (max-width: 480px) {
			body {
				padding: 8px;
			}
			
			.header {
				padding: 12px;
				margin-bottom: 12px;
			}
			
			.stats-grid {
				grid-template-columns: 1fr;
				gap: 10px;
			}
			
			.stat-card, .card {
				padding: 12px;
			}
			
			.chart-container {
				height: 180px;
			}
		}
	`;
};
