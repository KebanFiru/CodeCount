import type { RepoAnalyticsResult } from '../../../types';
import { WEEKDAY_LABELS } from '../analytics';
import { renderBranchChip, renderBranchNotice, renderCardHead } from './shared';

/**
 * Activity replaces the old "unified chart".
 *
 * Three things were wrong with that chart and all three are fixed by deriving every
 * view from the same raw commit array:
 *  - the hourly view scaled global totals by a ratio and invented the line counts;
 *  - "Avg lines" meant added+deleted on the server and added-only on the client;
 *  - the monthly/yearly filter truncated the range to whole months, so switching
 *    granularity silently changed the totals.
 * Commits and line counts also no longer share a bar group across two axes — commits
 * are bars, lines are an overlaid series, so neither is squashed by the other's scale.
 */
export const renderActivityTab = (analytics: RepoAnalyticsResult, nonce: string): string => {
	if (!analytics.available) {
		return `<div class="card">${renderCardHead('Activity')}<p class="muted">Git repository not found.</p></div>`;
	}

	if (analytics.branchHasCommits === false) {
		return renderBranchNotice(analytics.branch, 0);
	}

	if (analytics.commits.length === 0) {
		return `<div class="card">${renderCardHead('Activity')}<p class="muted">No commit history found.</p></div>`;
	}

	const minDate = analytics.firstCommitDate ?? '';
	const maxDate = analytics.lastCommitDate ?? '';

	const hourHeader = Array.from({ length: 24 }, (_, hour) => {
		const major = hour % 4 === 0;
		return `<div class="punch-hour" data-major="${major ? 1 : 0}" aria-hidden="true">${major ? `${hour}h` : ''}</div>`;
	}).join('');

	const punchRows = WEEKDAY_LABELS.map((label, dayIdx) => {
		const cells = Array.from({ length: 24 }, (_, hour) =>
			`<div class="punch-cell" data-level="0" data-day="${dayIdx}" data-hour="${hour}"></div>`
		).join('');
		return `<div class="punch-day">${label}</div>${cells}`;
	}).join('');

	return `
		<div class="card">
			${renderCardHead('Commit activity', renderBranchChip(analytics.branch))}

			<div class="toolbar">
				<div class="date-field">
					<label for="rangeStart">From</label>
					<input type="date" id="rangeStart" value="${minDate}" min="${minDate}" max="${maxDate}">
				</div>
				<span class="muted" aria-hidden="true">→</span>
				<div class="date-field">
					<label for="rangeEnd">To</label>
					<input type="date" id="rangeEnd" value="${maxDate}" min="${minDate}" max="${maxDate}">
				</div>
				<div class="segmented" id="presetRange">
					<button class="seg-btn" type="button" data-days="7">7d</button>
					<button class="seg-btn" type="button" data-days="30">30d</button>
					<button class="seg-btn" type="button" data-days="90">90d</button>
					<button class="seg-btn" type="button" data-days="365">1y</button>
					<button class="seg-btn" type="button" data-days="0" aria-pressed="true">All</button>
				</div>
			</div>

			<div class="toolbar">
				<div class="segmented" id="granularity">
					<button class="seg-btn" type="button" data-gran="daily" aria-pressed="true">Daily</button>
					<button class="seg-btn" type="button" data-gran="weekly">Weekly</button>
					<button class="seg-btn" type="button" data-gran="monthly">Monthly</button>
					<button class="seg-btn" type="button" data-gran="yearly">Yearly</button>
					<button class="seg-btn" type="button" data-gran="weekday">Weekday</button>
					<button class="seg-btn" type="button" data-gran="hourly">Hour of day</button>
				</div>
				<div class="checkbox-row">
					<label><input type="checkbox" id="showCommits" checked> Commits</label>
					<label><input type="checkbox" id="showAdded" checked> Lines added</label>
					<label><input type="checkbox" id="showDeleted" checked> Lines deleted</label>
				</div>
			</div>

			<div id="activitySummary" class="tiny muted"></div>
			<div class="chart-container" style="height:340px;"><canvas id="activityChart"></canvas></div>
		</div>

		<div class="split-grid">
			<div class="card">
				${renderCardHead('Cadence')}
				<div class="kv-list" id="cadenceList"></div>
			</div>
			<div class="card">
				${renderCardHead('Punch card')}
				<div class="punch" id="activityPunch">
					<div></div>
					${hourHeader}
					${punchRows}
				</div>
				<div class="tiny muted" id="punchPeak"></div>
			</div>
		</div>

		<script nonce="${nonce}">
		(function() {
			var canvas = document.getElementById('activityChart');
			if (!canvas || typeof Chart === 'undefined' || !window.CCAgg) { return; }

			var T = window.CCTheme;
			var A = window.CCAgg;
			var ALL = ${JSON.stringify(analytics.commits)};
			var WEEKDAYS = ${JSON.stringify(WEEKDAY_LABELS)};
			var gran = 'daily';

			var startInput = document.getElementById('rangeStart');
			var endInput = document.getElementById('rangeEnd');
			var summary = document.getElementById('activitySummary');
			var punchCells = document.querySelectorAll('#activityPunch .punch-cell');
			var punchPeak = document.getElementById('punchPeak');
			var cadenceList = document.getElementById('cadenceList');

			var chart = new Chart(canvas, {
				data: { labels: [], datasets: [] },
				options: {
					responsive: true,
					interaction: { mode: 'index', intersect: false },
					plugins: { legend: { position: 'bottom' } },
					scales: {
						x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
						y: { beginAtZero: true, position: 'left', grid: { color: T.grid }, ticks: { precision: 0 }, title: { display: true, text: 'Commits' } },
						y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Lines' } }
					}
				}
			});

			function currentRange() {
				return {
					from: A.dateKeyToEpochDay(startInput.value),
					to: A.dateKeyToEpochDay(endInput.value)
				};
			}

			function hourLabels() {
				var out = [];
				for (var i = 0; i < 24; i++) { out.push((i < 10 ? '0' : '') + i + ':00'); }
				return out;
			}

			function buildSeries(rows) {
				var range = currentRange();
				var filtered = A.filter(rows, range.from, range.to);

				if (gran === 'weekday') {
					var wd = A.byWeekday(filtered);
					// byWeekday is Sunday-indexed; present it Monday-first.
					var order = [1, 2, 3, 4, 5, 6, 0];
					return {
						labels: WEEKDAYS,
						commits: order.map(function(i) { return wd[i].commits; }),
						added: order.map(function(i) { return wd[i].added; }),
						deleted: order.map(function(i) { return wd[i].deleted; }),
						filtered: filtered
					};
				}

				if (gran === 'hourly') {
					var hr = A.byHour(filtered);
					return {
						labels: hourLabels(),
						commits: hr.map(function(b) { return b.commits; }),
						added: hr.map(function(b) { return b.added; }),
						deleted: hr.map(function(b) { return b.deleted; }),
						filtered: filtered
					};
				}

				var bucketed = A.byBucket(filtered, gran);
				bucketed.filtered = filtered;
				return bucketed;
			}

			function updatePunch(filtered) {
				var grid = A.punchCard(filtered);
				var max = 0;
				var peak = null;
				for (var r = 0; r < 7; r++) {
					for (var h = 0; h < 24; h++) {
						if (grid[r][h] > max) { max = grid[r][h]; peak = { r: r, h: h, n: grid[r][h] }; }
					}
				}
				punchCells.forEach(function(cell) {
					var d = Number(cell.getAttribute('data-day'));
					var h = Number(cell.getAttribute('data-hour'));
					var count = grid[d][h];
					var level = (count === 0 || max === 0) ? 0 : Math.min(4, Math.ceil((count / max) * 4));
					cell.setAttribute('data-level', String(level));
					cell.title = WEEKDAYS[d] + ' ' + (h < 10 ? '0' : '') + h + ':00 — ' + count + (count === 1 ? ' commit' : ' commits');
				});
				punchPeak.textContent = peak
					? 'peak: ' + WEEKDAYS[peak.r] + ' ' + (peak.h < 10 ? '0' : '') + peak.h + ':00 · ' + peak.n + (peak.n === 1 ? ' commit' : ' commits')
					: 'No commits in this range.';
			}

			function updateCadence(filtered) {
				var c = A.cadence(filtered);
				var added = 0, deleted = 0;
				for (var i = 0; i < filtered.length; i++) { added += filtered[i][2]; deleted += filtered[i][3]; }
				var avgChange = filtered.length ? Math.round((added + deleted) / filtered.length) : 0;
				var rows = [
					['Commits', filtered.length.toLocaleString()],
					['Active days', c.activeDays.toLocaleString()],
					['Longest streak', c.longestStreak + (c.longestStreak === 1 ? ' day' : ' days')],
					['Current streak', c.currentStreak + (c.currentStreak === 1 ? ' day' : ' days')],
					['Avg gap', c.avgGapDays.toFixed(1) + ' days'],
					['Avg change / commit', avgChange.toLocaleString() + ' lines']
				];
				cadenceList.innerHTML = rows.map(function(r) {
					return '<div><span class="k">' + r[0] + '</span><span class="v">' + r[1] + '</span></div>';
				}).join('');
			}

			function update() {
				var series = buildSeries(ALL);
				var datasets = [];

				if (document.getElementById('showCommits').checked) {
					datasets.push({
						type: 'bar',
						label: 'Commits',
						data: series.commits,
						backgroundColor: T.rgba(T.accent, 0.6),
						yAxisID: 'y',
						order: 3
					});
				}
				// Lines ride on their own axis as thin overlaid series rather than
				// competing bars, so a 10-commit day is still visible next to a
				// 3,000-line day.
				if (document.getElementById('showAdded').checked) {
					datasets.push({
						type: 'line',
						label: 'Lines added',
						data: series.added,
						borderColor: T.added,
						backgroundColor: T.rgba(T.added, 0.12),
						borderWidth: 2, pointRadius: 0, tension: 0.25, fill: true,
						yAxisID: 'y1', order: 1
					});
				}
				if (document.getElementById('showDeleted').checked) {
					datasets.push({
						type: 'line',
						label: 'Lines deleted',
						data: series.deleted,
						borderColor: T.deleted,
						backgroundColor: T.rgba(T.deleted, 0.12),
						borderWidth: 2, pointRadius: 0, tension: 0.25, fill: true,
						borderDash: [4, 3],
						yAxisID: 'y1', order: 2
					});
				}

				chart.data.labels = series.labels;
				chart.data.datasets = datasets;
				chart.options.scales.x.ticks.maxTicksLimit =
					gran === 'hourly' ? 24 : (gran === 'weekday' ? 7 : 16);
				chart.update();

				var totalCommits = series.commits.reduce(function(a, b) { return a + b; }, 0);
				var totalAdded = series.added.reduce(function(a, b) { return a + b; }, 0);
				var totalDeleted = series.deleted.reduce(function(a, b) { return a + b; }, 0);
				var label = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', weekday: 'By weekday', hourly: 'By hour of day' }[gran];
				summary.textContent = label + ' · ' + totalCommits.toLocaleString() + ' commits · +'
					+ totalAdded.toLocaleString() + ' / −' + totalDeleted.toLocaleString() + ' lines'
					+ ' · ' + (startInput.value || 'start') + ' → ' + (endInput.value || 'end');

				updatePunch(series.filtered);
				updateCadence(series.filtered);
			}

			function selectIn(container, target) {
				container.querySelectorAll('.seg-btn').forEach(function(b) {
					b.setAttribute('aria-pressed', String(b === target));
				});
			}

			document.getElementById('granularity').addEventListener('click', function(e) {
				var btn = e.target.closest('[data-gran]');
				if (!btn) { return; }
				gran = btn.getAttribute('data-gran');
				selectIn(this, btn);
				update();
			});

			document.getElementById('presetRange').addEventListener('click', function(e) {
				var btn = e.target.closest('[data-days]');
				if (!btn) { return; }
				var days = Number(btn.getAttribute('data-days'));
				selectIn(this, btn);
				if (days === 0) {
					startInput.value = ${JSON.stringify(minDate)};
				} else {
					var lastDay = ALL.length ? Math.max.apply(null, ALL.map(function(c) { return c[0]; })) : null;
					startInput.value = lastDay === null ? '' : A.epochDayToKey(lastDay - days + 1);
				}
				endInput.value = ${JSON.stringify(maxDate)};
				update();
			});

			// Any manual date edit invalidates the active preset.
			function clearPresets() {
				document.querySelectorAll('#presetRange .seg-btn').forEach(function(b) {
					b.setAttribute('aria-pressed', 'false');
				});
			}
			startInput.addEventListener('change', function() { clearPresets(); update(); });
			endInput.addEventListener('change', function() { clearPresets(); update(); });
			['showCommits', 'showAdded', 'showDeleted'].forEach(function(id) {
				document.getElementById(id).addEventListener('change', update);
			});

			update();
		})();
		</script>
	`;
};
