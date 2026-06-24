import type { RepoAnalyticsResult } from '../../../types';
import { escapeHtml, generateColors } from '../utils';

export const renderRepoAnalytics = (result: RepoAnalyticsResult): string => {
    if (!result.available) {
        return `<div class="card"><h2>Repository Analytics</h2><p class="muted">Git repository not found.</p></div>`;
    }
    if (result.totalCommits === 0) {
        return `<div class="card"><h2>Repository Analytics</h2><p class="muted">No commit data found in current repository.</p></div>`;
    }

    const effectiveAuthors = result.commitsByAuthor.filter(a => (a.added + a.deleted) > 0);
    const axisColor = 'rgba(255,255,255,0.85)';
    const gridColor = 'rgba(255,255,255,0.1)';

    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const avgLinesByWeekday = result.commitsByWeekday.map((c, i) =>
        c > 0 ? Math.round(result.linesByWeekday[i] / c) : 0
    );
    const avgLinesByHour = result.commitsByHour.map((c, i) =>
        c > 0 ? Math.round(result.linesByHour[i] / c) : 0
    );

    const minDate = result.commitsByDate.length > 0 ? result.commitsByDate[0].date : '';
    const maxDate = result.commitsByDate.length > 0 ? result.commitsByDate[result.commitsByDate.length - 1].date : '';

    return `
        <div class="card">
            <h2>Repository Analytics</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-title">Total Contributors</div>
                    <div class="metric-value">${effectiveAuthors.length.toLocaleString()}</div>
                    <div class="metric-note">${result.totalAdded.toLocaleString()} added, ${result.totalDeleted.toLocaleString()} deleted</div>
                </div>
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
                    <div class="metric-title">Avg Change / Commit</div>
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
            <div class="muted" style="margin-top:10px;">Commit range: ${result.firstCommitDate ?? '-'} to ${result.lastCommitDate ?? '-'}</div>
        </div>

        <div class="card">
            <!-- Header row: title + date range -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
                <div>
                    <h2 style="margin:0 0 4px;">Commit Activity</h2>
                    <div id="granLabel" style="font-size:11px;color:rgba(255,255,255,0.45);">Daily view · all time</div>
                </div>
                <div id="dateRangeRow" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <div style="display:flex;align-items:center;gap:6px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:4px 10px;">
                        <span style="font-size:11px;color:rgba(255,255,255,0.5);">From</span>
                        <input type="datetime-local" id="startDatetime"
                            value="${minDate ? minDate + 'T00:00' : ''}"
                            style="background:none;border:none;color:rgba(255,255,255,0.85);font-size:12px;font-family:inherit;cursor:pointer;outline:none;min-width:0;">
                    </div>
                    <span style="color:rgba(255,255,255,0.3);font-size:14px;">→</span>
                    <div style="display:flex;align-items:center;gap:6px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:4px 10px;">
                        <span style="font-size:11px;color:rgba(255,255,255,0.5);">To</span>
                        <input type="datetime-local" id="endDatetime"
                            value="${maxDate ? maxDate + 'T23:59' : ''}"
                            style="background:none;border:none;color:rgba(255,255,255,0.85);font-size:12px;font-family:inherit;cursor:pointer;outline:none;min-width:0;">
                    </div>
                </div>
            </div>

            <!-- Granularity selector -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                <div class="time-filter" id="granFilter">
                    <button class="time-btn active" data-gran="daily">Daily</button>
                    <button class="time-btn" data-gran="weekly">Weekly</button>
                    <button class="time-btn" data-gran="monthly">Monthly</button>
                    <button class="time-btn" data-gran="yearly">Yearly</button>
                    <button class="time-btn" data-gran="weekday">By Days of the Week</button>
                    <button class="time-btn" data-gran="hourly">By Hour</button>
                </div>
                <div id="allTimeNote" style="display:none;font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);">All time data</div>
            </div>

            <!-- Chart -->
            <div class="chart-container" style="height:400px;">
                <canvas id="unifiedChart"></canvas>
            </div>
        </div>

        <script>
        (function() {
            var AC = ${JSON.stringify(axisColor)};
            var GC = ${JSON.stringify(gridColor)};

            // --- Raw data ---
            var dailyLabels   = ${JSON.stringify(result.commitsByDate.map(d => d.date))};
            var dailyCommits  = ${JSON.stringify(result.commitsByDate.map(d => d.commits))};
            var dailyAdded    = ${JSON.stringify(result.commitsByDate.map(d => d.added))};
            var dailyDeleted  = ${JSON.stringify(result.commitsByDate.map(d => d.deleted))};

            var monthlyLabels  = ${JSON.stringify(result.commitsByMonth.map(m => m.month))};
            var monthlyCommits = ${JSON.stringify(result.commitsByMonth.map(m => m.commits))};
            var monthlyAdded   = ${JSON.stringify(result.commitsByMonth.map(m => m.added))};
            var monthlyDeleted = ${JSON.stringify(result.commitsByMonth.map(m => m.deleted))};

            var weekdayLabels   = ${JSON.stringify(weekdayLabels)};
            var weekdayCommits  = ${JSON.stringify(result.commitsByWeekday)};
            var weekdayAvgLines = ${JSON.stringify(avgLinesByWeekday)};

            var hourLabels   = ${JSON.stringify(hourLabels)};
            var hourCommits  = ${JSON.stringify(result.commitsByHour)};
            var hourAvgLines = ${JSON.stringify(avgLinesByHour)};

            // --- State ---
            var currentGran = 'daily';

            // --- Helpers ---
            function getRange() {
                var s = (document.getElementById('startDatetime').value || '').slice(0, 10);
                var e = (document.getElementById('endDatetime').value || '').slice(0, 10);
                return { start: s, end: e };
            }

            function filterDaily() {
                var r = getRange();
                var out = { labels: [], commits: [], added: [], deleted: [] };
                for (var i = 0; i < dailyLabels.length; i++) {
                    var d = dailyLabels[i];
                    if (r.start && d < r.start) continue;
                    if (r.end && d > r.end) continue;
                    out.labels.push(d); out.commits.push(dailyCommits[i]);
                    out.added.push(dailyAdded[i]); out.deleted.push(dailyDeleted[i]);
                }
                return out;
            }

            function filterMonthly() {
                var r = getRange();
                var rs = r.start ? r.start.slice(0, 7) : '';
                var re = r.end ? r.end.slice(0, 7) : '';
                var out = { labels: [], commits: [], added: [], deleted: [] };
                for (var i = 0; i < monthlyLabels.length; i++) {
                    var m = monthlyLabels[i];
                    if (rs && m < rs) continue;
                    if (re && m > re) continue;
                    out.labels.push(m); out.commits.push(monthlyCommits[i]);
                    out.added.push(monthlyAdded[i]); out.deleted.push(monthlyDeleted[i]);
                }
                return out;
            }

            function aggregateWeekly(src) {
                var weeks = {};
                for (var i = 0; i < src.labels.length; i++) {
                    var date = new Date(src.labels[i] + 'T00:00:00');
                    var day = date.getDay();
                    var diff = (day === 0 ? -6 : 1) - day;
                    var mon = new Date(date); mon.setDate(date.getDate() + diff);
                    var key = mon.toISOString().slice(0, 10);
                    if (!weeks[key]) weeks[key] = { commits: 0, added: 0, deleted: 0 };
                    weeks[key].commits += src.commits[i];
                    weeks[key].added += src.added[i];
                    weeks[key].deleted += src.deleted[i];
                }
                var keys = Object.keys(weeks).sort();
                return {
                    labels: keys,
                    commits: keys.map(function(k) { return weeks[k].commits; }),
                    added: keys.map(function(k) { return weeks[k].added; }),
                    deleted: keys.map(function(k) { return weeks[k].deleted; })
                };
            }

            function aggregateYearly(src) {
                var years = {};
                for (var i = 0; i < src.labels.length; i++) {
                    var yr = src.labels[i].slice(0, 4);
                    if (!years[yr]) years[yr] = { commits: 0, added: 0, deleted: 0 };
                    years[yr].commits += src.commits[i];
                    years[yr].added += src.added[i];
                    years[yr].deleted += src.deleted[i];
                }
                var keys = Object.keys(years).sort();
                return {
                    labels: keys,
                    commits: keys.map(function(k) { return years[k].commits; }),
                    added: keys.map(function(k) { return years[k].added; }),
                    deleted: keys.map(function(k) { return years[k].deleted; })
                };
            }

            // Aggregate daily (range-filtered) data into 7-bucket weekday totals
            function aggregateByWeekday(src) {
                var buckets = Array.from({ length: 7 }, function() { return { commits: 0, added: 0, deleted: 0 }; });
                for (var i = 0; i < src.labels.length; i++) {
                    var dow = new Date(src.labels[i] + 'T00:00:00').getDay();
                    buckets[dow].commits += src.commits[i];
                    buckets[dow].added   += src.added[i];
                    buckets[dow].deleted += src.deleted[i];
                }
                return {
                    labels:  weekdayLabels,
                    commits: buckets.map(function(b) { return b.commits; }),
                    added:   buckets.map(function(b) { return b.added; }),
                    deleted: buckets.map(function(b) { return b.deleted; }),
                    avgLines: buckets.map(function(b) { return b.commits > 0 ? Math.round(b.added / b.commits) : 0; })
                };
            }

            // Aggregate daily (range-filtered) data into 24-bucket hour totals
            // Hour data comes from the pre-computed commitsByHour / linesByHour arrays
            // which are indexed the same way as dailyLabels → we recompute from daily
            // Note: daily data does not carry hour breakdown, so for hourly view we
            // fall back to the full commitsByHour / linesByHour arrays but respect
            // the date filter by re-deriving from the raw server data where available.
            // Since the server only gives us per-day aggregates (not per-day-per-hour),
            // we use the global hourly arrays filtered proportionally by the ratio of
            // filtered commits to total commits.
            function aggregateByHour(src) {
                // Compute the fraction of total commits covered by the date filter
                var filteredTotal = src.commits.reduce(function(a, b) { return a + b; }, 0);
                var globalTotal   = hourCommits.reduce(function(a, b) { return a + b; }, 0);
                var scale = (globalTotal > 0 && filteredTotal < globalTotal) ? filteredTotal / globalTotal : 1;
                return {
                    labels:   hourLabels,
                    commits:  hourCommits.map(function(c) { return Math.round(c * scale); }),
                    added:    hourAvgLines.map(function(avg, i) {
                                  var sc = Math.round(hourCommits[i] * scale);
                                  return sc > 0 ? Math.round(avg * sc) : 0;
                              }),
                    deleted:  Array(24).fill(0),
                    avgLines: hourAvgLines.map(function(avg, i) { return Math.round(avg * scale); })
                };
            }

            // --- Chart init ---
            var ctx = document.getElementById('unifiedChart');
            var chart = new Chart(ctx, {
                type: 'bar',
                data: { labels: [], datasets: [] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    layout: { padding: { left: 4, right: 8, top: 4, bottom: 4 } },
                    plugins: {
                        legend: { labels: { color: AC, font: { size: 12 }, boxWidth: 12, padding: 16 } },
                        tooltip: { titleFont: { size: 12 }, bodyFont: { size: 12 } }
                    },
                    scales: {
                        x: { ticks: { color: AC, font: { size: 11 }, maxRotation: 45, minRotation: 0, maxTicksLimit: 24 }, grid: { color: GC } },
                        y:  { type: 'linear', position: 'left',  ticks: { color: AC, font: { size: 11 } }, beginAtZero: true, grid: { color: GC },        title: { display: true, text: 'Commits',   color: AC,       font: { size: 11 } } },
                        y1: { type: 'linear', position: 'right', ticks: { color: AC, font: { size: 11 } }, beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: 'Lines',     color: AC,       font: { size: 11 } } }
                    }
                }
            });

            // --- Update ---
            function update() {
                var gran = currentGran;

                // All granularities now use the date range picker
                document.getElementById('dateRangeRow').style.display = '';
                document.getElementById('allTimeNote').style.display = 'none';

                var labels, datasets;
                var src = filterDaily();

                if (gran === 'weekday') {
                    var wd = aggregateByWeekday(src);
                    labels = wd.labels;
                    datasets = [
                        { label: 'Commits', type: 'bar', data: wd.commits, backgroundColor: 'rgba(76,110,245,0.7)', yAxisID: 'y' },
                        { label: 'Avg Lines/Commit', type: 'line', data: wd.avgLines, borderColor: '#f59f00', backgroundColor: 'rgba(245,159,0,0.1)', tension: 0.3, pointRadius: 5, fill: false, borderWidth: 2, yAxisID: 'y1' }
                    ];
                    chart.options.scales.y.title.text = 'Commits';
                    chart.options.scales.y1.title.text = 'Avg Lines';
                    chart.options.scales.y1.ticks.color = '#f59f00';
                    chart.options.scales.y1.title.color = '#f59f00';
                    chart.options.scales.x.ticks.maxTicksLimit = 7;

                } else if (gran === 'hourly') {
                    var hr = aggregateByHour(src);
                    labels = hr.labels;
                    datasets = [
                        { label: 'Commits', type: 'bar', data: hr.commits, backgroundColor: 'rgba(16,152,173,0.7)', yAxisID: 'y' },
                        { label: 'Avg Lines/Commit', type: 'line', data: hr.avgLines, borderColor: '#f59f00', backgroundColor: 'rgba(245,159,0,0.08)', tension: 0.3, fill: false, pointRadius: 2, borderDash: [4, 3], yAxisID: 'y1' }
                    ];
                    chart.options.scales.y.title.text = 'Commits';
                    chart.options.scales.y1.title.text = 'Avg Lines';
                    chart.options.scales.y1.ticks.color = '#f59f00';
                    chart.options.scales.y1.title.color = '#f59f00';
                    chart.options.scales.x.ticks.maxTicksLimit = 24;

                } else {
                    var tsrc;
                    if (gran === 'daily') {
                        tsrc = src;
                    } else if (gran === 'weekly') {
                        tsrc = aggregateWeekly(src);
                    } else if (gran === 'monthly') {
                        tsrc = filterMonthly();
                    } else {
                        tsrc = aggregateYearly(filterMonthly());
                    }
                    labels = tsrc.labels;
                    datasets = [
                        { label: 'Commits', type: 'bar', data: tsrc.commits, backgroundColor: 'rgba(64,152,255,0.75)', borderColor: 'rgba(64,152,255,0.9)', borderWidth: 1, yAxisID: 'y' },
                        { label: 'Lines Added', type: 'bar', data: tsrc.added, backgroundColor: 'rgba(55,178,77,0.45)', yAxisID: 'y1' },
                        { label: 'Lines Deleted', type: 'bar', data: tsrc.deleted, backgroundColor: 'rgba(240,62,62,0.4)', yAxisID: 'y1' }
                    ];
                    chart.options.scales.y.title.text = 'Commits';
                    chart.options.scales.y1.title.text = 'Lines';
                    chart.options.scales.y1.ticks.color = AC;
                    chart.options.scales.y1.title.color = AC;
                    chart.options.scales.x.ticks.maxTicksLimit = gran === 'daily' ? 20 : (gran === 'weekly' ? 26 : 24);
                }

                // Update gran label
                var labels_map = { daily:'Daily view', weekly:'Weekly view', monthly:'Monthly view', yearly:'Yearly view', weekday:'By Days of the Week', hourly:'By hour of day' };
                var r = getRange();
                var suffix = (r.start || r.end) ? ' · ' + (r.start || '…') + ' → ' + (r.end || '…') : ' · all time';
                document.getElementById('granLabel').textContent = (labels_map[gran] || gran) + suffix;

                chart.data.labels = labels;
                chart.data.datasets = datasets;
                chart.update();
            }

            // --- Events ---
            document.getElementById('granFilter').addEventListener('click', function(e) {
                var btn = e.target.closest('[data-gran]');
                if (!btn) return;
                currentGran = btn.getAttribute('data-gran');
                document.querySelectorAll('#granFilter .time-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                update();
            });

            document.getElementById('startDatetime').addEventListener('change', update);
            document.getElementById('endDatetime').addEventListener('change', update);

            update();
        })();
        </script>
    `;
};
