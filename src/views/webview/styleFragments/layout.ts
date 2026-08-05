export const layoutStyles = `
	.container {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	/* ── Header ─────────────────────────────────────────── */
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
		padding: 14px 16px;
		border-radius: var(--radius-card);
		background: var(--surface-2);
		border: 1px solid var(--border);
	}

	.header h1 {
		margin: 0;
		font-size: 17px;
		font-weight: 700;
		color: var(--fg);
		letter-spacing: -0.3px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.header .subtitle {
		font-size: 11px;
		color: var(--muted);
		margin-top: 3px;
	}

	.logo {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		color: var(--accent);
	}

	/* ── Tabs ───────────────────────────────────────────── */
	.tab-bar {
		display: flex;
		gap: 2px;
		border-bottom: 1px solid var(--border);
		flex-wrap: wrap;
	}

	.tab {
		padding: 8px 16px;
		font-size: 12px;
		font-weight: 500;
		font-family: inherit;
		color: var(--muted);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: color var(--transition), border-color var(--transition), background var(--transition);
		border-radius: 4px 4px 0 0;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--fg);
		background: var(--hover);
	}

	.tab:focus-visible {
		outline: 1px solid var(--focus);
		outline-offset: -2px;
	}

	.tab[aria-selected="true"] {
		color: var(--fg);
		border-bottom-color: var(--accent);
		font-weight: 600;
	}

	.tab-content {
		display: none;
	}

	.tab-content.active {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	/* ── Top-level stat tiles ───────────────────────────── */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 10px;
	}

	.stat-card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		padding: 14px;
		min-width: 0;
	}

	.stat-value {
		font-size: 22px;
		font-weight: 700;
		color: var(--fg);
		margin: 4px 0 3px;
		line-height: 1.15;
		overflow-wrap: anywhere;
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		font-size: 10px;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.7px;
		font-weight: 600;
	}

	.stat-sub {
		font-size: 11px;
		color: var(--muted);
	}

	/* ── Generic grids ──────────────────────────────────── */
	.split-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 14px;
		align-items: start;
	}

	.full-width {
		grid-column: 1 / -1;
	}

	/* ── Controls ───────────────────────────────────────── */
	.toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.segmented {
		display: flex;
		gap: 2px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 3px;
		flex-wrap: wrap;
	}

	.seg-btn {
		padding: 4px 10px;
		font-size: 11px;
		font-weight: 500;
		font-family: inherit;
		color: var(--muted);
		background: none;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		transition: color var(--transition), background var(--transition);
		white-space: nowrap;
	}

	.seg-btn:hover {
		color: var(--fg);
		background: var(--hover);
	}

	.seg-btn:focus-visible {
		outline: 1px solid var(--focus);
		outline-offset: -1px;
	}

	.seg-btn[aria-pressed="true"] {
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 20%, transparent);
		font-weight: 600;
	}

	.date-field {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 4px 10px;
	}

	.date-field label {
		font-size: 11px;
		color: var(--muted);
	}

	.date-field input {
		background: none;
		border: none;
		color: var(--fg);
		font-size: 12px;
		font-family: inherit;
		cursor: pointer;
		outline: none;
		min-width: 0;
	}

	.date-field input:focus-visible {
		outline: 1px solid var(--focus);
	}

	.checkbox-row {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
		font-size: 11px;
		color: var(--muted);
	}

	.checkbox-row label {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		cursor: pointer;
	}

	.checkbox-row input {
		accent-color: var(--accent);
		margin: 0;
	}
`;
