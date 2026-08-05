/**
 * Runtime theme bridge for the dashboard.
 *
 * Chart.js paints to a canvas, so it cannot resolve CSS custom properties — passing
 * `var(--border)` to it silently yields an invalid colour. This script runs in the
 * webview, resolves the VS Code theme tokens once, and exposes them as concrete
 * colour strings under `window.CCTheme`, then applies them as Chart.js defaults.
 *
 * Everything here must degrade gracefully: if a token is missing (older VS Code,
 * unusual theme) the fallback keeps the chart readable rather than invisible.
 */
export const chartThemeScript = `
(function() {
	var cs = getComputedStyle(document.documentElement);
	function tok(name, fallback) {
		var value = (cs.getPropertyValue(name) || '').trim();
		return value || fallback;
	}

	// Normalise any CSS colour to rgb components by letting the canvas parse it.
	var probe = document.createElement('canvas').getContext('2d');
	function toRgb(color) {
		try {
			probe.fillStyle = '#000000';
			probe.fillStyle = color;
			var resolved = probe.fillStyle;
			if (resolved.charAt(0) === '#') {
				return [
					parseInt(resolved.substr(1, 2), 16),
					parseInt(resolved.substr(3, 2), 16),
					parseInt(resolved.substr(5, 2), 16)
				];
			}
			var nums = resolved.match(/[\\d.]+/g) || [];
			return [Number(nums[0]) || 0, Number(nums[1]) || 0, Number(nums[2]) || 0];
		} catch (e) {
			return [128, 128, 128];
		}
	}

	function rgba(color, alpha) {
		var c = toRgb(color);
		return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')';
	}

	// Blend toward white (amount > 0) or black (amount < 0) to extend the palette
	// past the six hues VS Code ships, while staying inside the theme's colour space.
	function shade(color, amount) {
		var c = toRgb(color);
		var out = c.map(function(x) {
			return Math.round(amount > 0 ? x + (255 - x) * amount : x * (1 + amount));
		});
		return 'rgb(' + out[0] + ',' + out[1] + ',' + out[2] + ')';
	}

	var fg = tok('--vscode-foreground', '#cccccc');
	var base = [
		tok('--vscode-charts-blue', '#4e8ed4'),
		tok('--vscode-charts-green', '#3d9a50'),
		tok('--vscode-charts-orange', '#d18616'),
		tok('--vscode-charts-purple', '#9d7bd8'),
		tok('--vscode-charts-yellow', '#cca700'),
		tok('--vscode-charts-red', '#e05252')
	];

	function series(i) {
		var color = base[i % base.length];
		var cycle = Math.floor(i / base.length);
		if (cycle === 0) { return color; }
		// Alternate lighter/darker so adjacent cycles stay distinguishable.
		var amount = (cycle % 2 === 1 ? 1 : -1) * Math.min(0.55, 0.22 * Math.ceil(cycle / 2));
		return shade(color, amount);
	}

	function seriesList(count) {
		var out = [];
		for (var i = 0; i < count; i++) { out.push(series(i)); }
		return out;
	}

	window.CCTheme = {
		fg: fg,
		muted: tok('--vscode-descriptionForeground', '#9d9d9d'),
		axis: rgba(fg, 0.75),
		grid: rgba(fg, 0.12),
		added: tok('--vscode-charts-green', '#3d9a50'),
		deleted: tok('--vscode-charts-red', '#e05252'),
		accent: tok('--vscode-charts-blue', '#4e8ed4'),
		tooltipBg: tok('--vscode-editorHoverWidget-background', '#252526'),
		tooltipFg: tok('--vscode-editorHoverWidget-foreground', '#cccccc'),
		tooltipBorder: tok('--vscode-editorHoverWidget-border', '#454545'),
		series: series,
		seriesList: seriesList,
		rgba: rgba
	};

	if (typeof Chart !== 'undefined') {
		Chart.defaults.color = window.CCTheme.axis;
		Chart.defaults.borderColor = window.CCTheme.grid;
		Chart.defaults.font.family = cs.getPropertyValue('--vscode-font-family') || 'sans-serif';
		Chart.defaults.font.size = 11;
		Chart.defaults.maintainAspectRatio = false;
		Chart.defaults.plugins.tooltip.backgroundColor = window.CCTheme.tooltipBg;
		Chart.defaults.plugins.tooltip.titleColor = window.CCTheme.tooltipFg;
		Chart.defaults.plugins.tooltip.bodyColor = window.CCTheme.tooltipFg;
		Chart.defaults.plugins.tooltip.borderColor = window.CCTheme.tooltipBorder;
		Chart.defaults.plugins.tooltip.borderWidth = 1;
		Chart.defaults.plugins.legend.labels.color = window.CCTheme.axis;
		Chart.defaults.plugins.legend.labels.boxWidth = 12;
		Chart.defaults.plugins.legend.labels.padding = 14;
	}
})();
`;

/**
 * Shared client-side aggregation over the compact `RepoCommitTuple[]` payload.
 * Every breakdown the dashboard draws is derived here from the same raw commits,
 * so granularities can never disagree with one another.
 */
export const commitAggregationScript = `
(function() {
	var DAY_MS = 86400000;

	function epochDayToDate(day) { return new Date(day * DAY_MS); }
	function epochDayToKey(day) { return epochDayToDate(day).toISOString().slice(0, 10); }
	function dateKeyToEpochDay(key) {
		if (!key) { return null; }
		var p = key.split('-');
		if (p.length < 3) { return null; }
		var t = Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
		return Number.isNaN(t) ? null : Math.floor(t / DAY_MS);
	}

	// A single day-precision filter shared by every granularity, so switching
	// between Daily and Monthly can never change the totals.
	function inRange(commit, from, to) {
		if (from !== null && commit[0] < from) { return false; }
		if (to !== null && commit[0] > to) { return false; }
		return true;
	}

	function filter(commits, from, to) {
		return commits.filter(function(c) { return inRange(c, from, to); });
	}

	function bucketKey(day, gran) {
		var d = epochDayToDate(day);
		if (gran === 'daily') { return epochDayToKey(day); }
		if (gran === 'weekly') {
			// ISO-style week start (Monday)
			var dow = d.getUTCDay();
			var shift = (dow === 0 ? -6 : 1) - dow;
			return epochDayToKey(day + shift);
		}
		if (gran === 'monthly') { return epochDayToKey(day).slice(0, 7); }
		return epochDayToKey(day).slice(0, 4);
	}

	function byBucket(commits, gran) {
		var map = new Map();
		for (var i = 0; i < commits.length; i++) {
			var c = commits[i];
			var key = bucketKey(c[0], gran);
			var b = map.get(key);
			if (!b) { b = { commits: 0, added: 0, deleted: 0 }; map.set(key, b); }
			b.commits += 1; b.added += c[2]; b.deleted += c[3];
		}
		var keys = Array.from(map.keys()).sort();
		return {
			labels: keys,
			commits: keys.map(function(k) { return map.get(k).commits; }),
			added: keys.map(function(k) { return map.get(k).added; }),
			deleted: keys.map(function(k) { return map.get(k).deleted; }),
			net: keys.map(function(k) { return map.get(k).added - map.get(k).deleted; })
		};
	}

	function byWeekday(commits) {
		var out = [];
		for (var i = 0; i < 7; i++) { out.push({ commits: 0, added: 0, deleted: 0 }); }
		for (var j = 0; j < commits.length; j++) {
			var c = commits[j];
			var dow = epochDayToDate(c[0]).getUTCDay();
			out[dow].commits += 1; out[dow].added += c[2]; out[dow].deleted += c[3];
		}
		return out;
	}

	function byHour(commits) {
		var out = [];
		for (var i = 0; i < 24; i++) { out.push({ commits: 0, added: 0, deleted: 0 }); }
		for (var j = 0; j < commits.length; j++) {
			var c = commits[j];
			out[c[1]].commits += 1; out[c[1]].added += c[2]; out[c[1]].deleted += c[3];
		}
		return out;
	}

	// 7 x 24 matrix, Monday-first for readability.
	function punchCard(commits) {
		var grid = [];
		for (var r = 0; r < 7; r++) {
			var row = [];
			for (var h = 0; h < 24; h++) { row.push(0); }
			grid.push(row);
		}
		for (var i = 0; i < commits.length; i++) {
			var c = commits[i];
			var dow = epochDayToDate(c[0]).getUTCDay();
			var rowIdx = (dow + 6) % 7;
			grid[rowIdx][c[1]] += 1;
		}
		return grid;
	}

	var SIZE_BUCKETS = [
		{ label: 'XS', note: '< 10', max: 10 },
		{ label: 'S', note: '10–49', max: 50 },
		{ label: 'M', note: '50–199', max: 200 },
		{ label: 'L', note: '200–999', max: 1000 },
		{ label: 'XL', note: '1000+', max: Infinity }
	];

	function sizeHistogram(commits) {
		var counts = SIZE_BUCKETS.map(function() { return 0; });
		var sizes = [];
		for (var i = 0; i < commits.length; i++) {
			var total = commits[i][2] + commits[i][3];
			sizes.push(total);
			for (var b = 0; b < SIZE_BUCKETS.length; b++) {
				if (total < SIZE_BUCKETS[b].max) { counts[b] += 1; break; }
			}
		}
		sizes.sort(function(a, b) { return a - b; });
		function pct(p) {
			if (!sizes.length) { return 0; }
			var idx = Math.min(sizes.length - 1, Math.floor(sizes.length * p));
			return sizes[idx];
		}
		return {
			buckets: SIZE_BUCKETS,
			counts: counts,
			median: pct(0.5),
			p90: pct(0.9),
			max: sizes.length ? sizes[sizes.length - 1] : 0
		};
	}

	function cadence(commits) {
		var days = Array.from(new Set(commits.map(function(c) { return c[0]; }))).sort(function(a, b) { return a - b; });
		var longest = 0, run = 0, current = 0;
		for (var i = 0; i < days.length; i++) {
			run = (i > 0 && days[i] === days[i - 1] + 1) ? run + 1 : 1;
			if (run > longest) { longest = run; }
		}
		// Current streak counts back from the most recent active day.
		for (var j = days.length - 1; j >= 0; j--) {
			if (j === days.length - 1 || days[j] === days[j + 1] - 1) { current += 1; } else { break; }
		}
		var span = days.length ? (days[days.length - 1] - days[0] + 1) : 0;
		return {
			activeDays: days.length,
			longestStreak: longest,
			currentStreak: current,
			spanDays: span,
			avgGapDays: days.length > 1 ? (span - 1) / (days.length - 1) : 0,
			lastActiveDay: days.length ? days[days.length - 1] : null
		};
	}

	function byAuthorMonth(commits, authors) {
		var months = Array.from(new Set(commits.map(function(c) { return epochDayToKey(c[0]).slice(0, 7); }))).sort();
		var monthIdx = new Map();
		months.forEach(function(m, i) { monthIdx.set(m, i); });
		var series = authors.map(function() { return months.map(function() { return 0; }); });
		for (var i = 0; i < commits.length; i++) {
			var c = commits[i];
			var mi = monthIdx.get(epochDayToKey(c[0]).slice(0, 7));
			if (mi !== undefined && series[c[4]]) { series[c[4]][mi] += 1; }
		}
		return { months: months, series: series };
	}

	window.CCAgg = {
		DAY_MS: DAY_MS,
		epochDayToKey: epochDayToKey,
		dateKeyToEpochDay: dateKeyToEpochDay,
		filter: filter,
		byBucket: byBucket,
		byWeekday: byWeekday,
		byHour: byHour,
		punchCard: punchCard,
		sizeHistogram: sizeHistogram,
		cadence: cadence,
		byAuthorMonth: byAuthorMonth
	};
})();
`;
