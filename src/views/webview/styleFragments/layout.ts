export const layoutStyles = `
	.container {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	/* Header - Dashboard Title */
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 4px;
		padding: 14px 16px;
		border-radius: var(--radius-card);
		background: var(--surface-2);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-card);
	}

	.header h1 {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.3px;
	}

	.header .subtitle {
		font-size: 11px;
		color: rgba(255,255,255,0.7);
		font-weight: 400;
		margin-top: 3px;
	}

	/* ── Tab Navigation ─────────────────────────────────── */
	.tab-bar {
		display: flex;
		gap: 4px;
		border-bottom: 1px solid var(--border);
		padding-bottom: 0;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.tab {
		padding: 8px 16px;
		font-size: 12px;
		font-weight: 500;
		color: rgba(255,255,255,0.6);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: color var(--transition), border-color var(--transition);
		border-radius: 4px 4px 0 0;
		white-space: nowrap;
	}

	.tab:hover {
		color: rgba(255,255,255,0.9);
		background: rgba(255,255,255,0.05);
	}

	.tab.active {
		color: #ffffff;
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

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 10px;
		margin-bottom: 14px;
	}

	.stat-card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		padding: 14px 12px;
		text-align: center;
		min-width: 0;
		box-shadow: var(--shadow-card);
		transition: transform var(--transition);
	}

	.stat-card:hover {
		transform: translateY(-1px);
	}

	.stat-value {
		font-size: 22px;
		font-weight: 700;
		color: #ffffff;
		margin: 6px 0 4px;
		word-break: break-word;
		line-height: 1.2;
	}

	.stat-label {
		font-size: 10px;
		color: rgba(255,255,255,0.75);
		text-transform: uppercase;
		letter-spacing: 0.6px;
		font-weight: 600;
	}

	.stat-sub {
		font-size: 10px;
		color: rgba(255,255,255,0.5);
		margin-top: 2px;
	}

	.main-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 14px;
		align-items: start;
	}

	.full-width {
		grid-column: 1 / -1;
	}

	.section-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 14px;
	}

	.time-filter {
		display: flex;
		gap: 4px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 3px;
	}

	.time-btn {
		padding: 4px 10px;
		font-size: 11px;
		font-weight: 500;
		color: rgba(255,255,255,0.55);
		background: none;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		transition: color var(--transition), background var(--transition);
		white-space: nowrap;
	}

	.time-btn:hover {
		color: rgba(255,255,255,0.85);
		background: rgba(255,255,255,0.07);
	}

	.time-btn.active {
		color: #ffffff;
		background: var(--accent);
		font-weight: 600;
	}

`;

