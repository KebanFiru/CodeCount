import type { LanguageFileStat, LanguageStatsResult } from '../../../types';
import { barWidth, escapeHtml, formatNumber, generateColors, getLanguageFullName } from '../utils';
import { renderBranchChip, renderCardHead, renderPath } from './shared';

type LanguageView = LanguageStatsResult;

const renderRatioStrip = (result: LanguageView, colors: string[], totalLines: number): string => {
	if (totalLines <= 0) {
		return '';
	}

	const segments = result.stats.map((stat, idx) => {
		const percent = (stat.lines / totalLines) * 100;
		const label = `${getLanguageFullName(stat.languageId)} — ${formatNumber(stat.lines)} lines (${percent.toFixed(1)}%)`;
		return `<span style="flex:${stat.lines};background:${colors[idx]};" title="${escapeHtml(label)}"></span>`;
	}).join('');

	const legend = result.stats.slice(0, 6).map((stat, idx) => {
		const percent = Math.round((stat.lines / totalLines) * 100);
		return `<span><span class="swatch" style="background:${colors[idx]}"></span>${escapeHtml(getLanguageFullName(stat.languageId))} ${percent}%</span>`;
	}).join('');

	return `
		<div class="card">
			${renderCardHead('Composition', renderBranchChip(result.branch))}
			<div class="ratio-strip" aria-hidden="true">${segments}</div>
			<div class="ratio-legend">${legend}</div>
		</div>
	`;
};

export const renderLanguageCharts = (result: LanguageView, nonce: string): string => {
	if (!result.hasWorkspace || result.filteredFiles === 0 || result.stats.length === 0) {
		return '';
	}

	const labels = result.stats.map(s => getLanguageFullName(s.languageId));
	const data = result.stats.map(s => s.lines);
	const height = Math.max(200, result.stats.length * 32 + 60);

	return `
		<div class="card">
			${renderCardHead('Lines by language')}
			<div class="chart-container" style="height:${height}px;"><canvas id="languageBarChart"></canvas></div>
			<script nonce="${nonce}">
			(function() {
				var canvas = document.getElementById('languageBarChart');
				if (!canvas || typeof Chart === 'undefined') { return; }
				var T = window.CCTheme;
				new Chart(canvas, {
					type: 'bar',
					data: {
						labels: ${JSON.stringify(labels)},
						datasets: [{
							label: 'Lines of code',
							data: ${JSON.stringify(data)},
							backgroundColor: T.seriesList(${result.stats.length}),
							borderWidth: 0
						}]
					},
					options: {
						indexAxis: 'y',
						responsive: true,
						plugins: { legend: { display: false } },
						scales: {
							x: { beginAtZero: true, grid: { color: T.grid } },
							y: { ticks: { autoSkip: false }, grid: { display: false } }
						}
					}
				});
			})();
			</script>
		</div>
	`;
};

export const renderLanguageTable = (result: LanguageView, fileCounts: Map<string, number>): string => {
	if (!result.hasWorkspace || result.filteredFiles === 0 || result.stats.length === 0) {
		return '';
	}

	const totalLines = result.stats.reduce((sum, s) => sum + s.lines, 0);
	const max = result.stats.reduce((acc, s) => Math.max(acc, s.lines), 0);
	const colors = generateColors(result.stats.length);

	const rows = result.stats.map((stat, idx) => {
		const percent = totalLines > 0 ? Math.round((stat.lines / totalLines) * 100) : 0;
		const files = fileCounts.get(stat.languageId);
		return `
			<div class="td"><span class="swatch" style="background:${colors[idx]}"></span></div>
			<div class="td">${escapeHtml(getLanguageFullName(stat.languageId))}</div>
			<div class="td num muted">${files === undefined ? '—' : formatNumber(files)}</div>
			<div class="td"><div class="bar"><span style="width:${barWidth(stat.lines, max)}%;background:${colors[idx]}"></span></div></div>
			<div class="td num">${formatNumber(stat.lines)}</div>
			<div class="td num muted">${percent}%</div>
		`;
	}).join('');

	return `
		<div class="card">
			${renderCardHead('Breakdown', renderBranchChip(result.branch))}
			<div class="grid-table" style="grid-template-columns:auto minmax(0,1fr) auto minmax(50px,1fr) auto auto;">
				<div class="th"></div>
				<div class="th">Language</div>
				<div class="th num">Files</div>
				<div class="th"></div>
				<div class="th num">Lines</div>
				<div class="th num">%</div>
				${rows}
			</div>
		</div>
	`;
};

export const renderLargestFiles = (files: LanguageFileStat[], languageOf: Map<string, string>): string => {
	if (files.length === 0) {
		return '';
	}

	const max = files.reduce((acc, f) => Math.max(acc, f.lines), 0);
	const rows = files.slice(0, 12).map(file => {
		const languageId = languageOf.get(file.filePath) ?? '';
		return `
			<div class="td">${renderPath(file.filePath)}</div>
			<div class="td tiny muted">${escapeHtml(getLanguageFullName(languageId))}</div>
			<div class="td"><div class="bar"><span style="width:${barWidth(file.lines, max)}%"></span></div></div>
			<div class="td num">${formatNumber(file.lines)}</div>
		`;
	}).join('');

	return `
		<div class="card">
			${renderCardHead('Largest files')}
			<div class="grid-table" style="grid-template-columns:minmax(0,2fr) auto minmax(60px,1fr) auto;">
				${rows}
			</div>
		</div>
	`;
};
