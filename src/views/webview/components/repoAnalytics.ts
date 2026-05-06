import type { RepoAnalyticsResult } from '../../../types';
import { escapeHtml, generateColors } from '../utils';

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
    const effectiveAuthors = result.commitsByAuthor.filter(a => (a.added + a.deleted) > 0);
    const topAuthors = effectiveAuthors.slice(0, 8);
    const authorColors = generateColors(topAuthors.length);
    const authorLabels = topAuthors.map(item => escapeHtml(item.author));
    const authorCommitData = topAuthors.map(item => item.commits);
    const authorChangeData = topAuthors.map(item => item.added + item.deleted);
    const axisColor = '#ffffff';
    const gridColor = 'rgba(255,255,255,0.12)';

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
            <div class="muted" style="margin-top: 10px;">Commit range: ${result.firstCommitDate ?? '-'} to ${result.lastCommitDate ?? '-'}</div>
        </div>

        <div class="card full-width">
            <h2>Commit Trend by Date</h2>
            <div class="chart-container">
                <canvas id="repoTrendChart" height="380"></canvas>
            </div>
            <script>
                const repoTrendCtx = document.getElementById('repoTrendChart');
                if (repoTrendCtx) {
                    new Chart(repoTrendCtx, {
                        type: 'line',
                        data: {
                            labels: ${JSON.stringify(trendLabels)},
                            datasets: [
                                { label: 'Commits', data: ${JSON.stringify(trendCommitData)}, borderColor: '#4098ff', backgroundColor: 'rgba(64,152,255,0.2)', yAxisID: 'y', tension: 0.25, fill: true },
                                { label: 'Added Lines', data: ${JSON.stringify(trendAddedData)}, borderColor: '#37b24d', backgroundColor: 'rgba(55,178,77,0.16)', yAxisID: 'y1', tension: 0.25 },
                                { label: 'Deleted Lines', data: ${JSON.stringify(trendDeletedData)}, borderColor: '#f03e3e', backgroundColor: 'rgba(240,62,62,0.16)', yAxisID: 'y1', tension: 0.25 }
                            ]
                        },
                        options: { responsive: true, maintainAspectRatio: true, interaction: { mode: 'index', intersect: false }, layout: { padding: { left: 8, right: 12, top: 8, bottom: 8 } }, plugins: { legend: { labels: { color: ${JSON.stringify(axisColor)}, font: { size: 12 } } }, tooltip: { titleFont: { size: 12 }, bodyFont: { size: 12 } } }, scales: { x: { ticks: { color: ${JSON.stringify(axisColor)}, maxRotation: 45, minRotation: 45, font: { size: 11 } }, grid: { color: ${JSON.stringify(gridColor)} } }, y: { type: 'linear', position: 'left', ticks: { color: ${JSON.stringify(axisColor)}, font: { size: 11 } }, grid: { color: ${JSON.stringify(gridColor)} } }, y1: { type: 'linear', position: 'right', ticks: { color: ${JSON.stringify(axisColor)}, font: { size: 11 } }, grid: { drawOnChartArea: false } } } }
                    });
                }
            </script>
        </div>

        <div class="card full-width">
            <h2>Monthly Activity</h2>
            <div class="chart-container">
                <canvas id="repoMonthChart" height="300"></canvas>
            </div>
            <script>
                const repoMonthCtx = document.getElementById('repoMonthChart');
                if (repoMonthCtx) {
                    new Chart(repoMonthCtx, {
                        type: 'bar',
                        data: { labels: ${JSON.stringify(monthLabels)}, datasets: [ { label: 'Commits', data: ${JSON.stringify(monthCommitData)}, backgroundColor: 'rgba(64,152,255,0.4)', yAxisID: 'y' }, { label: 'Lines Changed', data: ${JSON.stringify(monthChangeData)}, backgroundColor: 'rgba(16,152,173,0.35)', yAxisID: 'y1' } ] },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            interaction: { mode: 'index', intersect: false },
                            layout: { padding: { left: 8, right: 12, top: 8, bottom: 8 } },
                            plugins: {
                                legend: { labels: { color: ${JSON.stringify(axisColor)} } },
                                tooltip: { enabled: true }
                            },
                            onHover: (_, activeElements, chart) => {
                                chart.canvas.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                            },
                            scales: {
                                x: { ticks: { color: ${JSON.stringify(axisColor)}, maxRotation: 45, minRotation: 45 }, grid: { color: ${JSON.stringify(gridColor)} } },
                                y: { type: 'linear', position: 'left', ticks: { color: ${JSON.stringify(axisColor)} }, beginAtZero: true, grid: { color: ${JSON.stringify(gridColor)} } },
                                y1: { type: 'linear', position: 'right', ticks: { color: ${JSON.stringify(axisColor)} }, grid: { drawOnChartArea: false } }
                            }
                        }
                    });
                }
            </script>
        </div>

        <div class="card full-width">
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
                        data: { labels: ${JSON.stringify(weekdayLabels)}, datasets: [{ label: 'Commits by Weekday', data: ${JSON.stringify(result.commitsByWeekday)}, backgroundColor: '#4c6ef5' }] },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            interaction: { mode: 'index', intersect: false },
                            plugins: { legend: { display: false }, tooltip: { enabled: true } },
                            onHover: (_, activeElements, chart) => {
                                chart.canvas.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                            },
                            scales: {
                                x: { ticks: { color: ${JSON.stringify(axisColor)} }, grid: { color: ${JSON.stringify(gridColor)} } },
                                y: { ticks: { color: ${JSON.stringify(axisColor)} }, beginAtZero: true, grid: { color: ${JSON.stringify(gridColor)} } }
                            }
                        }
                    });
                }

                const repoHourCtx = document.getElementById('repoHourChart');
                if (repoHourCtx) {
                    new Chart(repoHourCtx, {
                        type: 'line',
                        data: { labels: ${JSON.stringify(hourLabels)}, datasets: [{ label: 'Commits by Hour', data: ${JSON.stringify(result.commitsByHour)}, borderColor: '#1098ad', backgroundColor: 'rgba(16,152,173,0.2)', tension: 0.3, fill: true }] },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            interaction: { mode: 'index', intersect: false },
                            plugins: { legend: { display: false }, tooltip: { enabled: true } },
                            onHover: (_, activeElements, chart) => {
                                chart.canvas.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                            },
                            scales: {
                                x: { ticks: { color: ${JSON.stringify(axisColor)}, maxTicksLimit: 12 }, grid: { color: ${JSON.stringify(gridColor)} } },
                                y: { ticks: { color: ${JSON.stringify(axisColor)} }, beginAtZero: true, grid: { color: ${JSON.stringify(gridColor)} } }
                            }
                        }
                    });
                }
            </script>
        </div>
    `;
};
