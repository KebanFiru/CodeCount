import type { ContributorStat, LanguageStat, RepoAnalyticsResult } from '../../types';
import { escapeHtml, generateColors, getLanguageDescription, getLanguageFullName } from './utils';

export const getLogoSvg = (): string => {
	return `<svg class="logo" viewBox="0 0 24 24" aria-hidden="true">
		<path fill="currentColor" d="M8.7 6.3 4 12l4.7 5.7 1.6-1.4L6.4 12l3.9-4.3-1.6-1.4Zm6.6 0-1.6 1.4L17.6 12l-3.9 4.3 1.6 1.4L20 12l-4.7-5.7ZM10.4 19h2.2l4-14h-2.2l-4 14Z"/>
	</svg>`;
};

export const renderStatsOverview = (
	result: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[] },
	ignoredCount: number,
	totalLines: number
): string => {
	if (!result.hasWorkspace) {
		return `<div class="empty-state"><p class="muted">Open a workspace to begin analyzing code metrics</p></div>`;
	}
	if (result.totalFiles === 0) {
		return `<div class="empty-state"><p class="muted">No files found in workspace</p></div>`;
	}
	if (result.filteredFiles === 0) {
		return `<div class="empty-state"><p class="muted">All files are ignored by .gitignore</p></div>`;
	}

	return `
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-label">Total Files</div>
				<div class="stat-value">${result.totalFiles.toLocaleString()}</div>
			</div>
			<div class="stat-card">
				<div class="stat-label">Analyzed Files</div>
				<div class="stat-value">${result.filteredFiles.toLocaleString()}</div>
			</div>
			<div class="stat-card">
				<div class="stat-label">Total Lines</div>
				<div class="stat-value">${totalLines.toLocaleString()}</div>
			</div>
			<div class="stat-card" title="Files excluded by .gitignore and default settings">
				<div class="stat-label">Excluded Files</div>
				<div class="stat-value">${ignoredCount.toLocaleString()}</div>
			</div>
		</div>
	`;
};

export const renderLanguageCharts = (
	result: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[] }
): string => {
	if (!result.hasWorkspace || result.filteredFiles === 0 || result.stats.length === 0) {
		return '';
	}

	const colors = generateColors(result.stats.length);
	const pieData = {
		labels: result.stats.map(s => getLanguageFullName(s.languageId)),
		datasets: [{
			data: result.stats.map(s => s.lines),
			backgroundColor: colors,
			borderColor: 'var(--border)',
			borderWidth: 1
		}]
	};

	const barData = {
		labels: result.stats.map(s => getLanguageFullName(s.languageId)),
		datasets: [{
			label: 'Lines of Code',
			data: result.stats.map(s => s.lines),
			backgroundColor: colors,
			borderColor: 'var(--border)',
			borderWidth: 1
		}]
	};

	return `
		<div class="card">
			<h2>Distribution by Lines</h2>
			<div class="chart-container">
				<canvas id="languagePieChart" height="300"></canvas>
			</div>
			<script>
				const pieCtx = document.getElementById('languagePieChart');
				if (pieCtx) {
					new Chart(pieCtx, {
						type: 'doughnut',
						data: ${JSON.stringify(pieData)},
						options: {
							responsive: true,
							maintainAspectRatio: true,
							plugins: {
								legend: {
									position: 'bottom',
									labels: {
										font: { size: 11 },
										color: 'var(--fg)',
										padding: 10
									}
								}
							}
						}
					});
				}
			</script>
		</div>

		<div class="card">
			<h2>Line Count by Language</h2>
			<div class="chart-container">
				<canvas id="languageBarChart" height="300"></canvas>
			</div>
			<script>
				const barCtx = document.getElementById('languageBarChart');
				if (barCtx) {
					new Chart(barCtx, {
						type: 'bar',
						data: ${JSON.stringify(barData)},
						options: {
							indexAxis: 'y',
							responsive: true,
							maintainAspectRatio: true,
							plugins: {
								legend: {
									display: false
								}
							},
							scales: {
								x: {
									ticks: { color: 'var(--fg)', font: { size: 11 } },
									grid: { color: 'rgba(128, 128, 128, 0.1)' }
								},
								y: {
									ticks: { color: 'var(--fg)', font: { size: 11 } },
									grid: { display: false }
								}
							}
						}
					});
				}
			</script>
		</div>
	`;
};

export const renderLanguageTable = (
	result: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[] }
): string => {
	if (!result.hasWorkspace || result.filteredFiles === 0 || result.stats.length === 0) {
		return '';
	}

	const totalLines = result.stats.reduce((sum, s) => sum + s.lines, 0);
	const max = result.stats[0].lines || 1;
	const colors = generateColors(result.stats.length);

	const rows = result.stats
		.map((stat, idx) => {
			const percent = Math.max(1, Math.round((stat.lines / totalLines) * 100));
			const barPercent = Math.max(1, Math.round((stat.lines / max) * 100));
			const description = getLanguageDescription(stat.languageId);
			const fullName = getLanguageFullName(stat.languageId);
			return `
				<div class="row">
					<div class="lang-label" title="${description}">
						<div class="lang-icon" style="background-color: ${colors[idx]}"></div>
						<div>
							<div style="font-weight: 600;">${fullName}</div>
							<div class="lang-info">${description}</div>
						</div>
					</div>
					<div class="bar"><span style="width:${barPercent}%"></span></div>
					<div style="display: grid; grid-template-columns: auto auto; gap: 16px; font-size: 11px;">
						<div>
							<div class="muted">Lines</div>
							<div style="font-weight: 600; color: var(--accent);">${stat.lines.toLocaleString()}</div>
						</div>
						<div>
							<div class="muted">Percentage</div>
							<div style="font-weight: 600; color: var(--accent);">${percent}%</div>
						</div>
					</div>
				</div>
			`;
		})
		.join('');

	return `
		<div class="card">
			<h2>Detailed Language Breakdown</h2>
			<div class="table">
				${rows}
			</div>
		</div>
	`;
};

export const renderContributorsChart = (
	result: { available: boolean; stats: ContributorStat[] }
): string => {
	if (!result.available || result.stats.length === 0) {
		return `
			<div class="card">
				<h2>Contributors</h2>
				<p class="muted">${result.available ? 'No Git history available.' : 'Git repository not found.'}</p>
			</div>
		`;
	}

	const colors = generateColors(result.stats.length);
	const topContributors = result.stats.slice(0, 10);
	const max = topContributors[0]?.linesAdded || 1;

	const chartData = {
		labels: topContributors.map(s => escapeHtml(s.name)),
		datasets: [{
			label: 'Lines Added',
			data: topContributors.map(s => s.linesAdded),
			backgroundColor: colors.slice(0, topContributors.length),
			borderColor: 'var(--border)',
			borderWidth: 1
		}]
	};

	const rows = topContributors
		.map((stat, idx) => {
			const percent = Math.max(1, Math.round((stat.linesAdded / max) * 100));
			return `
				<div class="row">
					<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
						<strong>${escapeHtml(stat.name)}</strong>
						<span style="color: ${colors[idx]}; font-weight: 600; font-size: 16px;">${percent}%</span>
					</div>
					<div class="bar"><span style="width:${percent}%; background-color: ${colors[idx]}"></span></div>
					<div class="muted">${stat.linesAdded.toLocaleString()} lines added</div>
				</div>
			`;
		})
		.join('');

	return `
		<div class="card">
			<h2>Contributor Distribution</h2>
			<div class="section-grid">
				<div>
					<div class="chart-container compact">
						<canvas id="contributorsBarChart" height="220"></canvas>
					</div>
				</div>
				<div>
					<div class="chart-container compact">
						<canvas id="contributorsPieChart" height="220"></canvas>
					</div>
				</div>
			</div>
			<script>
				const contribCtx = document.getElementById('contributorsBarChart');
				if (contribCtx) {
					new Chart(contribCtx, {
						type: 'bar',
						data: ${JSON.stringify(chartData)},
						options: {
							indexAxis: 'y',
							responsive: true,
							maintainAspectRatio: true,
							plugins: {
								legend: {
									display: false
								}
							},
							scales: {
								x: {
									ticks: { color: 'var(--fg)', font: { size: 11 } },
									grid: { color: 'rgba(128, 128, 128, 0.1)' }
								},
								y: {
									ticks: { color: 'var(--fg)', font: { size: 11 } },
									grid: { display: false }
								}
							}
						}
					});
				}

				const contribPieCtx = document.getElementById('contributorsPieChart');
				if (contribPieCtx) {
					new Chart(contribPieCtx, {
						type: 'doughnut',
						data: {
							labels: ${JSON.stringify(topContributors.map(s => escapeHtml(s.name)))},
							datasets: [{
								data: ${JSON.stringify(topContributors.map(s => s.linesAdded))},
								backgroundColor: ${JSON.stringify(colors.slice(0, topContributors.length))},
								borderColor: 'var(--border)',
								borderWidth: 1
							}]
						},
						options: {
							responsive: true,
							maintainAspectRatio: true,
							plugins: {
								legend: {
									position: 'bottom',
									labels: {
										font: { size: 10 },
										color: 'var(--fg)',
										padding: 8
									}
								}
							}
						}
					});
				}
			</script>
		</div>
		<div class="card">
			<h2>Contributors Details</h2>
			<div class="table">
				${rows}
			</div>
			${result.stats.length > 10 ? `<p class="muted" style="margin-top: 12px;">... and ${result.stats.length - 10} more contributors</p>` : ''}
		</div>
	`;
};

export const renderRepoAnalytics = (result: RepoAnalyticsResult): string => {
	if (!result.available) {
		return `
			<div class="card">
				<h2>Repository Analytics</h2>
				<p class="muted">Git repository not found.</p>
			</div>
		`;
	}

	if (result.totalCommits === 0) {
		return `
			<div class="card">
				<h2>Repository Analytics</h2>
				<p class="muted">No commit data found in current repository.</p>
			</div>
		`;
	}

	const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
	const trendLabels = result.commitsByDate.map(item => item.date);
	const trendCommitData = result.commitsByDate.map(item => item.commits);
	const trendAddedData = result.commitsByDate.map(item => item.added);
	const trendDeletedData = result.commitsByDate.map(item => item.deleted);
	const monthLabels = result.commitsByMonth.map(item => item.month);
	const monthCommitData = result.commitsByMonth.map(item => item.commits);
	const monthChangeData = result.commitsByMonth.map(item => item.added + item.deleted);
	const topAuthors = result.commitsByAuthor.slice(0, 8);
	const authorColors = generateColors(topAuthors.length);
	const authorLabels = topAuthors.map(item => escapeHtml(item.author));
	const authorCommitData = topAuthors.map(item => item.commits);
	const authorChangeData = topAuthors.map(item => item.added + item.deleted);

	return `
		<div class="card">
			<h2>Repository Analytics</h2>
			<div class="metric-grid">
				<div class="metric-card">
					<div class="metric-title">Total Commits</div>
					<div class="metric-value">${result.totalCommits.toLocaleString()}</div>
					<div class="metric-note">Across ${result.activeDays.toLocaleString()} active days</div>
				</div>
				<div class="metric-card">
					<div class="metric-title">Lines Added</div>
					<div class="metric-value">${result.totalAdded.toLocaleString()}</div>
					<div class="metric-note">Removed: ${result.totalDeleted.toLocaleString()}</div>
				</div>
				<div class="metric-card">
					<div class="metric-title">Avg Change Per Commit</div>
					<div class="metric-value">${result.avgLinesChangedPerCommit.toLocaleString()}</div>
					<div class="metric-note">Added + removed lines</div>
				</div>
				<div class="metric-card">
					<div class="metric-title">Most Active Day</div>
					<div class="metric-value">${result.busiestDay ? escapeHtml(result.busiestDay.date) : '-'}</div>
					<div class="metric-note">${result.busiestDay ? `${result.busiestDay.commits} commits` : 'No data'}</div>
				</div>
				<div class="metric-card">
					<div class="metric-title">Most Changed Day</div>
					<div class="metric-value">${result.mostChangedDay ? escapeHtml(result.mostChangedDay.date) : '-'}</div>
					<div class="metric-note">${result.mostChangedDay ? `${result.mostChangedDay.changes.toLocaleString()} lines changed` : 'No data'}</div>
				</div>
			</div>
			<div class="muted" style="margin-top: 10px;">
				Commit range: ${result.firstCommitDate ?? '-'} to ${result.lastCommitDate ?? '-'}
			</div>
		</div>

		<div class="two-col-grid">
			<div class="card large-card">
				<h2>Commit Trend by Date</h2>
				<div class="chart-container">
					<canvas id="repoTrendChart" height="420"></canvas>
				</div>
				<script>
					const repoTrendCtx = document.getElementById('repoTrendChart');
					if (repoTrendCtx) {
						new Chart(repoTrendCtx, {
							type: 'line',
							data: {
								labels: ${JSON.stringify(trendLabels)},
								datasets: [
									{
										label: 'Commits',
										data: ${JSON.stringify(trendCommitData)},
										borderColor: '#4098ff',
										backgroundColor: 'rgba(64, 152, 255, 0.2)',
										yAxisID: 'y',
										tension: 0.25,
										fill: true
									},
									{
										label: 'Added Lines',
										data: ${JSON.stringify(trendAddedData)},
										borderColor: '#37b24d',
										backgroundColor: 'rgba(55, 178, 77, 0.16)',
										yAxisID: 'y1',
										tension: 0.25
									},
									{
										label: 'Deleted Lines',
										data: ${JSON.stringify(trendDeletedData)},
										borderColor: '#f03e3e',
										backgroundColor: 'rgba(240, 62, 62, 0.16)',
										yAxisID: 'y1',
										tension: 0.25
									}
								]
							},
								options: {
									responsive: true,
									maintainAspectRatio: true,
									interaction: { mode: 'index', intersect: false },
									plugins: {
										legend: { labels: { color: 'var(--fg)', font: { size: 12 } } },
										title: { display: false },
										tooltip: { titleFont: { size: 12 }, bodyFont: { size: 12 } }
									},
									scales: {
										x: { ticks: { color: 'var(--fg)', maxRotation: 45, minRotation: 45, font: { size: 11 } } },
										y: { type: 'linear', position: 'left', ticks: { color: 'var(--fg)', font: { size: 11 } } },
										y1: {
											type: 'linear',
											position: 'right',
											ticks: { color: 'var(--fg)', font: { size: 11 } },
											grid: { drawOnChartArea: false }
										}
									}
								}
						});
					}
				</script>
			</div>
			<div class="right-stack">
				<div class="card">
					<h2>Monthly Activity</h2>
					<div class="chart-container">
						<canvas id="repoMonthChart" height="320"></canvas>
					</div>
					<script>
						const repoMonthCtx = document.getElementById('repoMonthChart');
						if (repoMonthCtx) {
							new Chart(repoMonthCtx, {
								type: 'bar',
								data: {
									labels: ${JSON.stringify(monthLabels)},
									datasets: [
										{
											label: 'Commits',
											data: ${JSON.stringify(monthCommitData)},
											backgroundColor: 'rgba(64, 152, 255, 0.4)',
											yAxisID: 'y'
										},
										{
											label: 'Lines Changed',
											data: ${JSON.stringify(monthChangeData)},
											backgroundColor: 'rgba(16, 152, 173, 0.35)',
											yAxisID: 'y1'
										}
									]
								},
								options: {
									responsive: true,
									maintainAspectRatio: true,
									interaction: { mode: 'index', intersect: false },
									plugins: { legend: { labels: { color: 'var(--fg)' } } },
									scales: {
										x: { ticks: { color: 'var(--fg)', maxRotation: 45, minRotation: 45 } },
										y: { type: 'linear', position: 'left', ticks: { color: 'var(--fg)' }, beginAtZero: true },
										y1: {
											type: 'linear',
											position: 'right',
											ticks: { color: 'var(--fg)' },
											grid: { drawOnChartArea: false }
										}
									}
								}
								});
							}
						</script>
					</div>
					<div class="card">
						<h2>Work Pattern</h2>
						<div class="section-grid">
							<div>
								<div class="chart-container compact">
									<canvas id="repoWeekdayChart" height="220"></canvas>
								</div>
							</div>
							<div>
								<div class="chart-container compact">
									<canvas id="repoHourChart" height="220"></canvas>
								</div>
							</div>
						</div>
						<script>
							const repoWeekdayCtx = document.getElementById('repoWeekdayChart');
							if (repoWeekdayCtx) {
								new Chart(repoWeekdayCtx, {
									type: 'bar',
									data: {
										labels: ${JSON.stringify(weekdayLabels)},
										datasets: [{
											label: 'Commits by Weekday',
											data: ${JSON.stringify(result.commitsByWeekday)},
											backgroundColor: '#4c6ef5'
										}]
									},
									options: {
										responsive: true,
										maintainAspectRatio: true,
										plugins: { legend: { display: false } },
										scales: {
											x: { ticks: { color: 'var(--fg)' } },
											y: { ticks: { color: 'var(--fg)' }, beginAtZero: true }
										}
									}
								});
							}

							const repoHourCtx = document.getElementById('repoHourChart');
							if (repoHourCtx) {
								new Chart(repoHourCtx, {
									type: 'line',
									data: {
										labels: ${JSON.stringify(hourLabels)},
										datasets: [{
											label: 'Commits by Hour',
											data: ${JSON.stringify(result.commitsByHour)},
											borderColor: '#1098ad',
											backgroundColor: 'rgba(16, 152, 173, 0.2)',
											tension: 0.3,
											fill: true
										}]
									},
									options: {
										responsive: true,
										maintainAspectRatio: true,
										plugins: { legend: { display: false } },
										scales: {
											x: { ticks: { color: 'var(--fg)', maxTicksLimit: 12 } },
											y: { ticks: { color: 'var(--fg)' }, beginAtZero: true }
										}
									}
									});
							}
						</script>
					</div>
				</div>
			</div>

		<div class="card">
			<h2>Author Contributions</h2>
			${topAuthors.length === 0 ? '<p class="muted">No author data available.</p>' : `
				<div class="section-grid">
					<div>
						<div class="chart-container compact">
							<canvas id="repoAuthorPieChart" height="220"></canvas>
						</div>
					</div>
					<div>
						<div class="chart-container compact">
							<canvas id="repoAuthorBarChart" height="220"></canvas>
						</div>
					</div>
				</div>
				<script>
					const repoAuthorPieCtx = document.getElementById('repoAuthorPieChart');
					if (repoAuthorPieCtx) {
						new Chart(repoAuthorPieCtx, {
							type: 'doughnut',
							data: {
								labels: ${JSON.stringify(authorLabels)},
								datasets: [{
									data: ${JSON.stringify(authorCommitData)},
									backgroundColor: ${JSON.stringify(authorColors)},
									borderColor: 'var(--border)',
									borderWidth: 1
								}]
							},
							options: {
								responsive: true,
								maintainAspectRatio: true,
								plugins: {
									legend: {
										position: 'bottom',
										labels: { font: { size: 10 }, color: 'var(--fg)', padding: 8 }
									}
								}
							}
						});
					}

					const repoAuthorBarCtx = document.getElementById('repoAuthorBarChart');
					if (repoAuthorBarCtx) {
						new Chart(repoAuthorBarCtx, {
							type: 'bar',
							data: {
								labels: ${JSON.stringify(authorLabels)},
								datasets: [{
									label: 'Lines Changed',
									data: ${JSON.stringify(authorChangeData)},
									backgroundColor: ${JSON.stringify(authorColors)}
								}]
							},
							options: {
								responsive: true,
								maintainAspectRatio: true,
								plugins: { legend: { display: false } },
								scales: {
									x: { ticks: { color: 'var(--fg)' } },
									y: { ticks: { color: 'var(--fg)' }, beginAtZero: true }
								}
							}
						});
					}
				</script>
			`}
		</div>

		<div class="card">
			<h2>Most Changed Files</h2>
			<div class="files-table">
				${result.topChangedFiles.map((file) => `
					<div class="file-path" title="${escapeHtml(file.filePath)}">${escapeHtml(file.filePath)}</div>
					<div class="muted">+${file.added.toLocaleString()} -${file.deleted.toLocaleString()}</div>
					<div style="font-weight: 600; color: var(--accent);">${file.changes.toLocaleString()}</div>
				`).join('')}
			</div>
		</div>
	`;
};

export const renderIgnoredFilesSection = (
	result: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[] }
): string => {
	if (!result.hasWorkspace || result.totalFiles === 0) {
		return '';
	}

	const ignoredCount = result.totalFiles - result.filteredFiles;
	if (ignoredCount === 0) {
		return '';
	}

	const ignoredPercent = Math.round((ignoredCount / result.totalFiles) * 100);

	return `
		<div class="card">
			<div class="ignored-section">
				<h4>Ignored Files</h4>
				<div class="ignored-count">${ignoredCount}</div>
				<div class="ignored-note">
					<strong>${ignoredPercent}%</strong> of total files are ignored by .gitignore or default patterns (node_modules, .git, dist, out).
				</div>
			</div>
		</div>
	`;
};
