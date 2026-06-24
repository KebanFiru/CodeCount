export const componentStyles = `
	@keyframes grow-bar {
		from { width: 0%; }
	}

	/* Utilities */
	.muted {
		color: var(--muted);
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
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--card) 60%, var(--bg) 40%);
		min-width: 0;
	}

	.metric-title {
		font-size: 11px;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 600;
		letter-spacing: 0.4px;
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
		font-size: 12px;
	}

	.files-table > * {
		min-width: 0;
	}

	.file-path {
		overflow: hidden;
		text-overflow: ellipsis;
		overflow-wrap: anywhere;
		word-break: break-word;
		color: var(--fg);
		font-size: 12px;
		max-width: 100%;
	}

	/* Ignored Files Section */
	.ignored-section {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		padding: 16px;
		margin-top: 16px;
	}

	.ignored-section h4 {
		margin: 0 0 10px;
		font-size: 12px;
		font-weight: 600;
	}

	.ignored-count {
		font-size: 22px;
		font-weight: 700;
		margin: 8px 0;
	}

	.ignored-note {
		font-size: 11px;
		color: var(--muted);
	}

	/* Empty State */
	.empty-state {
		padding: 32px 16px;
		text-align: center;
		color: var(--muted);
		font-size: 12px;
	}

	/* Link button style */
	.link {
		background: none;
		border: none;
		color: rgba(255,255,255,0.7);
		cursor: pointer;
		font-size: 12px;
		padding: 4px 0;
		text-decoration: none;
		font-weight: 500;
		border-bottom: 1px solid rgba(255,255,255,0.3);
		transition: color var(--transition), border-color var(--transition);
	}

	.link:hover {
		color: #ffffff;
		border-bottom-color: #ffffff;
	}

	/* Animated progress bar */
	.bar > span {
		animation: grow-bar 0.5s ease-out both;
	}
`;
