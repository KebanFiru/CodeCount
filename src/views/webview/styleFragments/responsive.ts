export const responsiveStyles = `
	/*
	 * The dashboard shares the editor area, so it can be dragged down to roughly a
	 * third of the window. Wide content (charts, tables) must reflow rather than
	 * force the page to scroll sideways.
	 */
	@media (max-width: 900px) {
		.split-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: flex-start;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		/* Hour labels stop fitting long before the cells do. */
		.punch-hour {
			font-size: 0;
		}

		.punch-hour[data-major="1"] {
			font-size: 9px;
		}
	}

	@media (max-width: 520px) {
		body {
			padding: 8px;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-card, .card {
			padding: 12px;
		}

		.metric-grid {
			grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		}

		.tab {
			padding: 8px 10px;
		}
	}
`;
