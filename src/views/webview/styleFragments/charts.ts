export const chartStyles = `
	/* Chart Container — height is set per-instance via inline style */
	.chart-container {
		position: relative;
		width: 100%;
		min-width: 0;
		display: block;
	}

	/* Let Chart.js own the canvas dimensions entirely */
	canvas {
		display: block !important;
		width: 100% !important;
	}
`;
