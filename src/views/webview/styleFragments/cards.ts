export const cardStyles = `
	.card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		padding: 16px;
		min-width: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		min-height: 200px;
		color: #ffffff;
		box-shadow: var(--shadow-card);
		transition: transform var(--transition), box-shadow var(--transition);
	}

	.card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 16px rgba(0,0,0,0.24), 0 1px 4px rgba(0,0,0,0.14);
	}

	.card h2 {
		margin: 0 0 14px;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.2px;
		color: #ffffff;
	}

	.card h3 {
		margin: 14px 0 10px;
		font-size: 12px;
		font-weight: 600;
		color: #ffffff;
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
