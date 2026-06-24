export const baseStyles = `
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
		--radius-card: 12px;
		--radius-sm: 6px;
		--shadow-card: 0 2px 8px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12);
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

	code {
		font-family: var(--vscode-editor-font-family, monospace);
		font-size: 11px;
		background: rgba(128,128,128,0.15);
		padding: 1px 4px;
		border-radius: 3px;
	}
`;
