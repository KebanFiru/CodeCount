export const chartStyles = `
	/* Chart Container */
	.chart-container {
		position: relative;
		height: auto;
		margin-bottom: 10px;
		min-width: 0;
		flex: 0 0 auto;
		max-height: none;
		width: 100%;
		display: block;
	}

	/* Ensure canvas fits its container to avoid visual overlap */
	canvas {
		display: block !important;
		width: 100% !important;
		height: auto !important;
	}
	
	.chart-container.compact {
		height: 200px;
	}
`;
