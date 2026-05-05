export const layoutStyles = `
	/* Centering container to avoid content stretching across very wide viewports */
	.container {
		max-width: 1000px;
		margin: 0 auto;
		display: grid;
		gap: 14px;
	}
	
	/* Header - Dashboard Title */
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 16px;
		padding: 12px 14px;
		border-radius: 8px;
		background: var(--surface-2);
	}
	
	.header h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: #ffffff;
	}
	
	.header .subtitle {
		font-size: 12px;
		color: #ffffff;
		font-weight: 400;
		margin-top: 4px;
	}

	/* Stats Overview - Key Metrics */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
		margin-bottom: 16px;
	}
	
	.stat-card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 12px;
		text-align: center;
		min-width: 0;
	}
	
	.stat-value {
		font-size: 24px;
		font-weight: 600;
		color: #ffffff;
		margin: 8px 0;
		word-break: break-word;
	}
	
	.stat-label {
		font-size: 11px;
		color: #ffffff;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 500;
	}
	
	/* Main Grid - Chart Panels */
	.main-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 12px;
		margin-bottom: 16px;
		align-items: start;
		grid-auto-rows: 8px;
		grid-auto-flow: dense;
		align-content: start;
	}

	/* Full-width card spanning entire grid */
	.full-width {
		grid-column: 1 / -1;
	}

	/* Section Grid */
	.section-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 14px;
	}
`;

