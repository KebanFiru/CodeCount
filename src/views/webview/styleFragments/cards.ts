export const cardStyles = `
	.card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		padding: 16px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 12px;
		color: var(--fg);
		box-shadow: var(--shadow-card);
	}

	.card > * {
		min-width: 0;
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
	}

	.card h2 {
		margin: 0;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.7px;
		text-transform: uppercase;
		color: var(--muted);
	}

	.card h3 {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
		color: var(--fg);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 600;
		white-space: nowrap;
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
		color: var(--accent);
	}

	.chip.chip-muted {
		background: color-mix(in srgb, var(--fg) 8%, transparent);
		border-color: var(--border);
		color: var(--muted);
		font-weight: 500;
	}

	.notice {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		font-size: 12px;
		line-height: 1.5;
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
		color: var(--fg);
	}

	.notice-icon {
		flex-shrink: 0;
		opacity: 0.8;
	}
`;
