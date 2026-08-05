import type { ContributorStatsResult, LanguageStatsResult, RepoAnalyticsResult } from '../../../types';
import {
	WEEKDAY_LABELS,
	SIZE_BUCKETS,
	buildConcentration,
	buildPunchCard,
	buildSizeHistogram,
} from '../analytics';
import { barWidth, escapeHtml, formatNumber } from '../utils';
import { renderBranchChip, renderBranchNotice, renderCardHead, renderPath } from './shared';

export const renderStatsOverview = (
	language: LanguageStatsResult,
	analytics: RepoAnalyticsResult,
	contributors: ContributorStatsResult,
	totalLines: number
): string => {
	if (!language.hasWorkspace) {
		return `<div class="empty-state">Open a workspace to begin analyzing code metrics</div>`;
	}
	if (language.totalFiles === 0) {
		return `<div class="empty-state">No files found in workspace</div>`;
	}

	const activeContributors = analytics.commitsByAuthor.filter(a => a.commits > 0);
	const concentration = buildConcentration(analytics.commitsByAuthor);

	const scopeNote = language.branch
		? `${formatNumber(language.filteredFiles)} on branch · ${formatNumber(language.ignoredFiles)} ignored`
		: `${formatNumber(language.ignoredFiles)} ignored by .gitignore`;

	const filesValue = language.branch
		? `${formatNumber(language.filteredFiles)} / ${formatNumber(language.totalFiles)}`
		: formatNumber(language.filteredFiles);

	const busFactorNote = concentration.busFactor > 0
		? `bus factor ${concentration.busFactor}`
		: 'no commit data';

	return `
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-label">Code Lines</div>
				<div class="stat-value">${formatNumber(totalLines)}</div>
				<div class="stat-sub">${language.stats.length} language${language.stats.length === 1 ? '' : 's'}</div>
			</div>
			<div class="stat-card">
				<div class="stat-label">${language.branch ? 'Files Scoped' : 'Analyzed Files'}</div>
				<div class="stat-value">${filesValue}</div>
				<div class="stat-sub">${escapeHtml(scopeNote)}</div>
			</div>
			<div class="stat-card">
				<div class="stat-label">Commits</div>
				<div class="stat-value">${formatNumber(analytics.totalCommits)}</div>
				<div class="stat-sub">${formatNumber(analytics.activeDays)} active days</div>
			</div>
			<div class="stat-card">
				<div class="stat-label">Contributors</div>
				<div class="stat-value">${formatNumber(activeContributors.length || contributors.stats.length)}</div>
				<div class="stat-sub">${escapeHtml(busFactorNote)}</div>
			</div>
		</div>
	`;
};

const renderPunchCardSection = (analytics: RepoAnalyticsResult): string => {
	const punch = buildPunchCard(analytics.commits);
	if (punch.max === 0) {
		return '';
	}

	const hourHeader = Array.from({ length: 24 }, (_, hour) => {
		const major = hour % 6 === 0;
		return `<div class="punch-hour" data-major="${major ? 1 : 0}" aria-hidden="true">${major ? `${hour}h` : ''}</div>`;
	}).join('');

	const rows = punch.grid.map((row, dayIdx) => {
		const cells = row.map((count, hour) => {
			const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / punch.max) * 4));
			const label = `${WEEKDAY_LABELS[dayIdx]} ${String(hour).padStart(2, '0')}:00 — ${count} commit${count === 1 ? '' : 's'}`;
			return `<div class="punch-cell" data-level="${level}" title="${escapeHtml(label)}"></div>`;
		}).join('');
		return `<div class="punch-day">${WEEKDAY_LABELS[dayIdx]}</div>${cells}`;
	}).join('');

	const peak = punch.peak
		? `peak: ${WEEKDAY_LABELS[punch.peak.weekday]} ${String(punch.peak.hour).padStart(2, '0')}:00 · ${punch.peak.commits} commit${punch.peak.commits === 1 ? '' : 's'}`
		: '';

	return `
		<div class="card">
			${renderCardHead('When work happens')}
			<div class="punch">
				<div></div>
				${hourHeader}
				${rows}
			</div>
			<div class="tiny muted">${escapeHtml(peak)}</div>
		</div>
	`;
};

const renderCommitSizeSection = (analytics: RepoAnalyticsResult): string => {
	const histogram = buildSizeHistogram(analytics.commits);
	if (analytics.commits.length === 0) {
		return '';
	}

	const rows = SIZE_BUCKETS.map((bucket, idx) => {
		const count = histogram.counts[idx];
		return `
			<div class="h-label">${escapeHtml(bucket.label)}</div>
			<div class="h-note">${escapeHtml(bucket.note)}</div>
			<div class="bar"><span style="width:${barWidth(count, histogram.max)}%"></span></div>
			<div class="h-count">${formatNumber(count)}</div>
		`;
	}).join('');

	return `
		<div class="card">
			${renderCardHead('Commit size')}
			<div class="histogram">${rows}</div>
			<div class="tiny muted">
				median ${formatNumber(histogram.median)} lines · p90 ${formatNumber(histogram.p90)} lines
			</div>
		</div>
	`;
};

const renderTopChangedFiles = (analytics: RepoAnalyticsResult): string => {
	if (analytics.topChangedFiles.length === 0) {
		return '';
	}

	const max = analytics.topChangedFiles[0].changes || 1;
	const rows = analytics.topChangedFiles.slice(0, 10).map(file => `
		<div class="td">${renderPath(file.filePath)}</div>
		<div class="td"><div class="bar"><span style="width:${barWidth(file.changes, max)}%"></span></div></div>
		<div class="td num added">+${formatNumber(file.added)}</div>
		<div class="td num deleted">−${formatNumber(file.deleted)}</div>
	`).join('');

	return `
		<div class="card">
			${renderCardHead('Most changed files', renderBranchChip(analytics.branch))}
			<div class="grid-table" style="grid-template-columns:minmax(0,2fr) minmax(60px,1fr) auto auto;">
				${rows}
			</div>
		</div>
	`;
};

export const renderOverviewTab = (
	analytics: RepoAnalyticsResult,
	language: LanguageStatsResult,
	nonce: string
): string => {
	if (!analytics.available) {
		return `<div class="card">${renderCardHead('Repository activity')}<p class="muted">Git repository not found.</p></div>`;
	}

	if (analytics.branchHasCommits === false) {
		const changed = language.filteredFiles;
		return renderBranchNotice(analytics.branch, changed);
	}

	if (analytics.totalCommits === 0) {
		return `<div class="card">${renderCardHead('Repository activity')}<p class="muted">No commit history found.</p></div>`;
	}

	const recent = analytics.commitsByDate.slice(-90);
	const labels = recent.map(d => d.date);
	const commits = recent.map(d => d.commits);
	const net = recent.map(d => d.added - d.deleted);

	return `
		<div class="card">
			${renderCardHead('Commit activity', `<span class="chip chip-muted">last ${recent.length} active days</span>`)}
			<div class="chart-container" style="height:280px;"><canvas id="overviewTrend"></canvas></div>
			<div class="chart-legend">
				<span><span class="legend-key" style="background:var(--accent);height:8px;"></span> commits (left axis)</span>
				<span><span class="legend-key" style="background:var(--added);"></span> net lines (right axis)</span>
			</div>
		</div>

		<div class="split-grid">
			${renderPunchCardSection(analytics)}
			${renderCommitSizeSection(analytics)}
		</div>

		${renderTopChangedFiles(analytics)}

		<script nonce="${nonce}">
		(function() {
			var canvas = document.getElementById('overviewTrend');
			if (!canvas || typeof Chart === 'undefined') { return; }
			var T = window.CCTheme;
			new Chart(canvas, {
				data: {
					labels: ${JSON.stringify(labels)},
					datasets: [
						{
							type: 'bar',
							label: 'Commits',
							data: ${JSON.stringify(commits)},
							backgroundColor: T.rgba(T.accent, 0.65),
							yAxisID: 'y',
							order: 2
						},
						{
							type: 'line',
							label: 'Net lines',
							data: ${JSON.stringify(net)},
							borderColor: T.added,
							backgroundColor: T.rgba(T.added, 0.1),
							borderWidth: 2,
							pointRadius: 0,
							tension: 0.3,
							yAxisID: 'y1',
							order: 1
						}
					]
				},
				options: {
					responsive: true,
					interaction: { mode: 'index', intersect: false },
					plugins: { legend: { display: false } },
					scales: {
						x: { ticks: { maxTicksLimit: 12, maxRotation: 0 }, grid: { display: false } },
						y: { beginAtZero: true, position: 'left', grid: { color: T.grid }, ticks: { precision: 0 } },
						y1: { position: 'right', grid: { drawOnChartArea: false } }
					}
				}
			});
		})();
		</script>
	`;
};
