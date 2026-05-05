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
`;
