export const tableStyles = `
	/* Table Styles */
	.table {
		display: flex;
		flex-direction: column;
		gap: 4px;
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
		gap: 4px;
		padding: 8px;
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
`;
