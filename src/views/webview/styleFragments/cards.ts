export const cardStyles = `
	.card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 12px;
		min-width: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-self: start;
		align-items: stretch;
		min-height: 220px;
		color: #ffffff;
	}
	
	.card h2 {
		margin: 0 0 16px;
		font-size: 14px;
		font-weight: 600;
	}

	.card h3 {
		margin: 16px 0 12px;
		font-size: 13px;
		font-weight: 600;
	}

	/* Force white text inside cards for better readability as requested */
	.card, .card *, .stat-card, .stat-card * {
		color: #ffffff !important;
	}

	.card a,
	.card a:hover,
	.card a:visited,
	.card button,
	.card button:hover {
		color: #ffffff !important;
	}
`;
