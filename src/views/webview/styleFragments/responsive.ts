export const responsiveStyles = `
	/* Responsive */
	@media (max-width: 1200px) {
		.main-grid {
			grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		}
	}

	@media (max-width: 768px) {
		body {
			padding: 12px;
		}
		
		.header {
			padding: 12px;
			margin-bottom: 12px;
			flex-direction: column;
			align-items: flex-start;
		}
		
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
			margin-bottom: 12px;
		}
		
		.main-grid {
			gap: 10px;
			margin-bottom: 12px;
		}
		
		.chart-container {
			height: 200px;
		}
	}

	@media (max-width: 480px) {
		body {
			padding: 8px;
		}
		
		.header {
			padding: 12px;
			margin-bottom: 12px;
		}
		
		.stats-grid {
			grid-template-columns: 1fr;
			gap: 10px;
		}
		
		.stat-card, .card {
			padding: 12px;
		}
		
		.chart-container {
			height: 180px;
		}
	}
`;
