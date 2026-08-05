export const baseStyles = `

	:root {
		color-scheme: light dark;
		--bg: var(--vscode-editor-background);
		--fg: var(--vscode-editor-foreground, var(--vscode-foreground));
		--muted: var(--vscode-descriptionForeground);
		--border: var(--vscode-panel-border, var(--vscode-widget-border));
		/* A colour meant to be read as text/graphics, not a button fill. */
		--accent: var(--vscode-textLink-foreground, var(--vscode-charts-blue));
		--added: var(--vscode-charts-green);
		--deleted: var(--vscode-charts-red);
		--card: var(--vscode-sideBar-background, var(--vscode-editorWidget-background));
		--surface-2: color-mix(in srgb, var(--card) 85%, var(--bg) 15%);
		--hover: var(--vscode-list-hoverBackground);
		--focus: var(--vscode-focusBorder);
		--btn-bg: var(--vscode-button-background);
		--btn-fg: var(--vscode-button-foreground);
		--btn-hover: var(--vscode-button-hoverBackground);
		--radius-card: 12px;
		--radius-sm: 6px;
		--shadow-card: none;
		--transition: 150ms ease;
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
		font-size: 13px;
		line-height: 1.5;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		overflow-x: hidden;
	}

	code, .mono {
		font-family: var(--vscode-editor-font-family, monospace);
		font-size: 11px;
	}

	code {
		background: color-mix(in srgb, var(--fg) 12%, transparent);
		padding: 1px 4px;
		border-radius: 3px;
	}

	.num {
		font-variant-numeric: tabular-nums;
	}
`;
