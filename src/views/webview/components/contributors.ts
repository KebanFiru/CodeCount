import type { ContributorStatsResult, RepoAnalyticsResult } from '../../../types';
import { buildConcentration } from '../analytics';
import { barWidth, escapeHtml, formatNumber, generateColors } from '../utils';
import { renderBranchChip, renderBranchNotice, renderCardHead } from './shared';

const renderTeamCard = (
	effective: ContributorStatsResult['stats'],
	colors: string[],
	totalChanges: number
): string => {
	const concentration = buildConcentration(effective);
	const segments = effective.map((stat, idx) => {
		const total = stat.added + stat.deleted;
		const percent = totalChanges > 0 ? (total / totalChanges) * 100 : 0;
		const label = `${stat.name} — ${formatNumber(total)} changes (${percent.toFixed(1)}%)`;
		return `<span style="flex:${total};background:${colors[idx]};" title="${escapeHtml(label)}"></span>`;
	}).join('');

	const legend = effective.slice(0, 6).map((stat, idx) => {
		const total = stat.added + stat.deleted;
		const percent = totalChanges > 0 ? Math.round((total / totalChanges) * 100) : 0;
		return `<span><span class="swatch" style="background:${colors[idx]}"></span>${escapeHtml(stat.name)} ${percent}%</span>`;
	}).join('');

	const summary = [
		`${effective.length} contributor${effective.length === 1 ? '' : 's'}`,
		`bus factor ${concentration.busFactor}`,
		`top author owns ${Math.round(concentration.topShare)}% of churn`,
	].join(' · ');

	return `
		<div class="card">
			${renderCardHead('Team')}
			<div class="tiny muted">${escapeHtml(summary)}</div>
			<div class="ratio-strip" aria-hidden="true">${segments}</div>
			<div class="ratio-legend">${legend}</div>
		</div>
	`;
};

export const renderContributorsChart = (
	result: ContributorStatsResult,
	analytics: RepoAnalyticsResult,
	nonce: string
): string => {
	if (!result.available) {
		return `<div class="card">${renderCardHead('Contributors')}<p class="muted">Git repository not found.</p></div>`;
	}

	if (result.branchHasCommits === false) {
		return renderBranchNotice(result.branch, 0);
	}

	const effective = result.stats.filter(s => (s.added + s.deleted) > 0);
	if (effective.length === 0) {
		return `<div class="card">${renderCardHead('Contributors')}<p class="muted">No contributors with code changes found.</p></div>`;
	}

	const colors = generateColors(effective.length);
	const totalAdded = effective.reduce((sum, s) => sum + s.added, 0);
	const totalDeleted = effective.reduce((sum, s) => sum + s.deleted, 0);
	const totalChanges = totalAdded + totalDeleted;
	const maxChanges = effective.reduce((acc, s) => Math.max(acc, s.added + s.deleted), 0);

	const commitsByName = new Map<string, number>();
	for (const author of analytics.commitsByAuthor) {
		const name = author.author.replace(/\s*<[^>]*>\s*$/, '').trim();
		commitsByName.set(name, (commitsByName.get(name) ?? 0) + author.commits);
	}

	const rows = effective.map((stat, idx) => {
		const total = stat.added + stat.deleted;
		const percent = totalChanges > 0 ? Math.round((total / totalChanges) * 100) : 0;
		const commits = commitsByName.get(stat.name);
		const meta = [
			commits !== undefined ? `${formatNumber(commits)} commit${commits === 1 ? '' : 's'}` : undefined,
			`${formatNumber(total)} changes`,
			`${percent}% of churn`,
		].filter(Boolean).join(' · ');

		return `
			<div class="row">
				<div class="row-head">
					<div class="row-name">
						<span class="dot" style="background:${colors[idx]}"></span>
						<span>${escapeHtml(stat.name)}</span>
					</div>
					<div class="row-value">
						<span class="added">+${formatNumber(stat.added)}</span>
						<span class="deleted">−${formatNumber(stat.deleted)}</span>
					</div>
				</div>
				<div class="bar"><span style="width:${barWidth(total, maxChanges)}%;background:${colors[idx]}"></span></div>
				<div class="row-meta">${escapeHtml(meta)}</div>
			</div>
		`;
	}).join('');

	const showToggle = effective.length > 5;
	const top = effective.slice(0, 10);
	const chartHeight = Math.max(200, top.length * 34 + 60);

	return `
		${renderTeamCard(effective, colors, totalChanges)}

		<div class="metric-grid">
			<div class="metric-card">
				<div class="metric-title">Lines added</div>
				<div class="metric-value added">+${formatNumber(totalAdded)}</div>
			</div>
			<div class="metric-card">
				<div class="metric-title">Lines removed</div>
				<div class="metric-value deleted">−${formatNumber(totalDeleted)}</div>
			</div>
			<div class="metric-card">
				<div class="metric-title">Net change</div>
				<div class="metric-value ${totalAdded - totalDeleted >= 0 ? 'added' : 'deleted'}">
					${totalAdded - totalDeleted >= 0 ? '+' : ''}${formatNumber(totalAdded - totalDeleted)}
				</div>
			</div>
			<div class="metric-card">
				<div class="metric-title">Avg per contributor</div>
				<div class="metric-value">${formatNumber(Math.round(totalChanges / effective.length))}</div>
				<div class="metric-note">added + removed</div>
			</div>
		</div>

		<div class="split-grid">
			<div class="card">
				${renderCardHead('Who changed what', renderBranchChip(result.branch))}
				<div class="table collapsible${showToggle ? ' is-collapsed' : ''}" id="contributor-rows">${rows}</div>
				${showToggle
					? `<div><button id="contributors-toggle" class="link" type="button" aria-expanded="false" aria-controls="contributor-rows">Show all ${effective.length} contributors</button></div>`
					: ''}
			</div>
			<div class="card">
				${renderCardHead(`Lines changed — top ${top.length}`)}
				<div class="chart-container" style="height:${chartHeight}px;"><canvas id="contributorsBar"></canvas></div>
			</div>
		</div>

		<script nonce="${nonce}">
		(function() {
			var canvas = document.getElementById('contributorsBar');
			if (canvas && typeof Chart !== 'undefined') {
				var T = window.CCTheme;
				new Chart(canvas, {
					type: 'bar',
					data: {
						labels: ${JSON.stringify(top.map(s => s.name))},
						datasets: [
							{ label: 'Added', data: ${JSON.stringify(top.map(s => s.added))}, backgroundColor: T.rgba(T.added, 0.75), stack: 'changes' },
							{ label: 'Removed', data: ${JSON.stringify(top.map(s => s.deleted))}, backgroundColor: T.rgba(T.deleted, 0.75), stack: 'changes' }
						]
					},
					options: {
						indexAxis: 'y',
						responsive: true,
						interaction: { mode: 'index', intersect: false },
						scales: {
							x: { stacked: true, beginAtZero: true, grid: { color: T.grid } },
							y: { stacked: true, ticks: { autoSkip: false }, grid: { display: false } }
						}
					}
				});
			}

			var toggle = document.getElementById('contributors-toggle');
			var list = document.getElementById('contributor-rows');
			if (toggle && list) {
				toggle.addEventListener('click', function() {
					var collapsed = list.classList.toggle('is-collapsed');
					toggle.setAttribute('aria-expanded', String(!collapsed));
					toggle.textContent = collapsed
						? 'Show all ${effective.length} contributors'
						: 'Show fewer contributors';
				});
			}
		})();
		</script>
	`;
};

export const renderContributorTimeline = (analytics: RepoAnalyticsResult, nonce: string): string => {
	if (analytics.commits.length === 0 || analytics.authors.length === 0) {
		return '';
	}

	return `
		<div class="card">
			${renderCardHead('Activity over time', '<span class="chip chip-muted">commits by month</span>')}
			<div class="chart-container" style="height:280px;"><canvas id="contributorTimeline"></canvas></div>
			<script nonce="${nonce}">
			(function() {
				var canvas = document.getElementById('contributorTimeline');
				if (!canvas || typeof Chart === 'undefined' || !window.CCAgg) { return; }
				var T = window.CCTheme;
				var authors = ${JSON.stringify(analytics.authors)};
				var agg = window.CCAgg.byAuthorMonth(${JSON.stringify(analytics.commits)}, authors);
				// Cap the legend: past ~8 series a stacked area becomes unreadable.
				var totals = agg.series.map(function(s, i) {
					return { i: i, total: s.reduce(function(a, b) { return a + b; }, 0) };
				}).sort(function(a, b) { return b.total - a.total; });
				var keep = totals.slice(0, 8).map(function(t) { return t.i; });
				var datasets = keep.map(function(idx, order) {
					return {
						label: authors[idx],
						data: agg.series[idx],
						backgroundColor: T.rgba(T.series(order), 0.75),
						borderWidth: 0,
						stack: 'authors'
					};
				});
				if (totals.length > keep.length) {
					var others = agg.months.map(function(_, m) {
						return totals.slice(8).reduce(function(sum, t) { return sum + agg.series[t.i][m]; }, 0);
					});
					datasets.push({ label: 'Others', data: others, backgroundColor: T.rgba(T.muted, 0.5), borderWidth: 0, stack: 'authors' });
				}
				new Chart(canvas, {
					type: 'bar',
					data: { labels: agg.months, datasets: datasets },
					options: {
						responsive: true,
						interaction: { mode: 'index', intersect: false },
						scales: {
							x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, maxTicksLimit: 14 } },
							y: { stacked: true, beginAtZero: true, grid: { color: T.grid }, ticks: { precision: 0 } }
						}
					}
				});
			})();
			</script>
		</div>
	`;
};
