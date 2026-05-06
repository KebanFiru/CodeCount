export const chartStyles = `
	/* Chart Container */
	.chart-container {
		position: relative;
		/* Let the container size with content but provide a sensible max to avoid
		   being clipped inside the webview on macOS where the webview may be
		   constrained by the editor area. */
		height: auto;
		max-height: 680px;
		margin-bottom: 10px;
		min-width: 0;
		flex: 0 0 auto;
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
		height: 220px;
		max-height: 320px;
	}
`;
