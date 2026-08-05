export const tableStyles = `
	.table {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 13px;
		min-width: 0;
	}

	/* ── Progress bars ──────────────────────────────────── */
	.bar {
		height: 6px;
		background: color-mix(in srgb, var(--fg) 12%, transparent);
		border-radius: 999px;
		overflow: hidden;
	}

	.bar > span {
		display: block;
		height: 100%;
		background: var(--accent);
		border-radius: inherit;
	}

	/* ── Data rows ──────────────────────────────────────── */
	.row {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 8px 10px;
		border-radius: var(--radius-sm);
		border-left: 2px solid transparent;
		transition: background var(--transition), border-color var(--transition);
	}

	.row:hover {
		background: var(--hover);
		border-left-color: var(--accent);
	}

	.row-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		min-width: 0;
	}

	.row-name {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		font-weight: 600;
		font-size: 12px;
	}

	.row-name > span:last-child {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-meta {
		display: flex;
		gap: 12px;
		font-size: 11px;
		color: var(--muted);
		flex-wrap: wrap;
	}

	.row-value {
		font-size: 12px;
		font-weight: 600;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.swatch {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.added { color: var(--added); }
	.deleted { color: var(--deleted); }

	/* ── Compact data table ─────────────────────────────── */
	.grid-table {
		display: grid;
		gap: 2px 12px;
		font-size: 12px;
		align-items: center;
		min-width: 0;
	}

	.grid-table > * {
		min-width: 0;
	}

	.grid-table .th {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.6px;
		color: var(--muted);
		font-weight: 600;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--border);
	}

	.grid-table .td {
		padding: 6px 0;
	}

	.grid-table .num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	/* Truncate long paths from the left so the filename stays visible. */
	.path {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		direction: rtl;
		text-align: left;
		font-family: var(--vscode-editor-font-family, monospace);
		font-size: 11px;
	}

	.path > bdi {
		direction: ltr;
	}
`;
