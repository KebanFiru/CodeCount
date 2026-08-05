export const componentStyles = `
	.muted { color: var(--muted); }
	.tiny { font-size: 11px; }

	/* ── Metric grid ────────────────────────────────────── */
	.metric-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 10px;
	}

	.metric-card {
		padding: 12px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface-2);
		min-width: 0;
	}

	.metric-title {
		font-size: 10px;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 600;
		letter-spacing: 0.6px;
	}

	.metric-value {
		font-size: 18px;
		font-weight: 700;
		margin-top: 4px;
		overflow-wrap: anywhere;
		font-variant-numeric: tabular-nums;
	}

	.metric-note {
		font-size: 11px;
		color: var(--muted);
		margin-top: 2px;
	}

	/* ── Key/value stat list (cadence card) ─────────────── */
	.kv-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		font-size: 12px;
	}

	.kv-list > div {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		padding: 7px 0;
		border-bottom: 1px solid var(--border);
	}

	.kv-list > div:last-child { border-bottom: none; }
	.kv-list dt, .kv-list .k { color: var(--muted); }
	.kv-list dd, .kv-list .v {
		margin: 0;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	/* ── Language ratio strip ───────────────────────────── */
	.ratio-strip {
		display: flex;
		height: 10px;
		border-radius: 999px;
		overflow: hidden;
		gap: 2px;
		background: color-mix(in srgb, var(--fg) 10%, transparent);
	}

	.ratio-strip > span {
		display: block;
		height: 100%;
		min-width: 2px;
	}

	.ratio-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		font-size: 11px;
		color: var(--muted);
	}

	.ratio-legend > span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	/* ── Punch card (weekday x hour) ────────────────────── */
	.punch {
		display: grid;
		grid-template-columns: auto repeat(24, minmax(0, 1fr));
		gap: 3px;
		align-items: center;
		min-width: 0;
	}

	.punch-day {
		font-size: 10px;
		color: var(--muted);
		padding-right: 6px;
		white-space: nowrap;
	}

	.punch-hour {
		font-size: 9px;
		color: var(--muted);
		text-align: center;
		overflow: hidden;
	}

	.punch-cell {
		aspect-ratio: 1;
		border-radius: 2px;
		background: color-mix(in srgb, var(--fg) 7%, transparent);
		min-width: 0;
	}

	.punch-cell[data-level="1"] { background: color-mix(in srgb, var(--accent) 28%, transparent); }
	.punch-cell[data-level="2"] { background: color-mix(in srgb, var(--accent) 50%, transparent); }
	.punch-cell[data-level="3"] { background: color-mix(in srgb, var(--accent) 72%, transparent); }
	.punch-cell[data-level="4"] { background: var(--accent); }

	/* ── Histogram (commit size) ────────────────────────── */
	.histogram {
		display: grid;
		grid-template-columns: auto auto minmax(0, 1fr) auto;
		gap: 6px 10px;
		align-items: center;
		font-size: 11px;
	}

	.histogram .h-label { font-weight: 600; }
	.histogram .h-note { color: var(--muted); white-space: nowrap; }
	.histogram .h-count {
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}

	/* ── Buttons & links ────────────────────────────────── */
	.link {
		background: none;
		border: none;
		color: var(--accent);
		cursor: pointer;
		font-size: 12px;
		font-family: inherit;
		padding: 4px 0;
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.link:hover { color: var(--fg); }
	.link:focus-visible { outline: 1px solid var(--focus); outline-offset: 2px; }

	/* Collapsed lists reveal their tail without duplicating markup. */
	.collapsible.is-collapsed > *:nth-child(n + 6) { display: none; }

	/* ── States ─────────────────────────────────────────── */
	.empty-state {
		padding: 32px 16px;
		text-align: center;
		color: var(--muted);
		font-size: 12px;
	}

	.chart-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
		font-size: 11px;
		color: var(--muted);
	}

	.chart-legend > span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.legend-key {
		width: 12px;
		height: 3px;
		border-radius: 999px;
		flex-shrink: 0;
	}
`;
