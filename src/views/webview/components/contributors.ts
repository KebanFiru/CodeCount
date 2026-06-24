import type { ContributorStat } from '../../../types';
import { escapeHtml, generateColors } from '../utils';

export const renderContributorsChart = (
    result: { available: boolean; stats: ContributorStat[]; branch?: string }
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
    const effectiveStats = result.stats.filter(s => (s.added + s.deleted) > 0);
    const totalAdded = effectiveStats.reduce((sum, s) => sum + s.added, 0);
    const totalDeleted = effectiveStats.reduce((sum, s) => sum + s.deleted, 0);
    const netChange = totalAdded - totalDeleted;
    const topContributor = effectiveStats[0];
    const avgLines = effectiveStats.length > 0
        ? Math.round((totalAdded + totalDeleted) / effectiveStats.length)
        : 0;

    const showToggle = effectiveStats.length > 5;
    const maxChanges = effectiveStats.length > 0 ? Math.max(1, effectiveStats[0].added + effectiveStats[0].deleted) : 1;

    const renderRow = (stat: ContributorStat, idx: number) => {
        const total = stat.added + stat.deleted;
        const displayName = escapeHtml(stat.name);
        const barPercent = Math.max(1, Math.round((total / maxChanges) * 100));
        const addedPct = total > 0 ? Math.round((stat.added / total) * 100) : 0;
        return `
            <div class="row">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:10px;height:10px;border-radius:50%;background:${colors[idx]};flex-shrink:0;"></div>
                        <strong style="font-size:13px;">${displayName}</strong>
                    </div>
                    <div style="display:flex;gap:12px;font-size:12px;">
                        <span style="color:#37b24d;font-weight:600;">+${stat.added.toLocaleString()}</span>
                        <span style="color:#f03e3e;font-weight:600;">−${stat.deleted.toLocaleString()}</span>
                    </div>
                </div>
                <div class="bar" style="margin:6px 0;"><span style="width:${barPercent}%;background:${colors[idx]};"></span></div>
                <div style="display:flex;gap:16px;font-size:11px;color:rgba(255,255,255,0.5);">
                    <span>${total.toLocaleString()} total changes</span>
                    <span>${addedPct}% additions</span>
                </div>
            </div>
        `;
    };

    const previewRows = effectiveStats.slice(0, 5).map((s, i) => renderRow(s, i)).join('');
    const allRows = effectiveStats.map((s, i) => renderRow(s, i)).join('');

    const barLabels = effectiveStats.slice(0, 10).map(s => escapeHtml(s.name));
    const addedData = effectiveStats.slice(0, 10).map(s => s.added);
    const deletedData = effectiveStats.slice(0, 10).map(s => s.deleted);
    const axisColor = 'rgba(255,255,255,0.85)';
    const gridColor = 'rgba(255,255,255,0.1)';

    const branchBadge = result.branch && result.branch !== 'all'
        ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:rgba(64,152,255,0.15);border:1px solid rgba(64,152,255,0.3);font-size:11px;font-weight:600;color:#4098ff;">
               <span style="font-size:13px;">⎇</span> ${escapeHtml(result.branch)}
           </span>`
        : `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);font-size:11px;color:rgba(255,255,255,0.5);">
               <span style="font-size:13px;">⎇</span> all branches
           </span>`;

    return `
        <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
                <h2 style="margin:0;">Contributors</h2>
                ${branchBadge}
            </div>

            <div class="metric-grid" style="margin-bottom:20px;">
                <div class="metric-card">
                    <div class="metric-title">Contributors</div>
                    <div class="metric-value">${effectiveStats.length.toLocaleString()}</div>
                    <div class="metric-note">with code changes</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Lines Added</div>
                    <div class="metric-value" style="color:#37b24d;">+${totalAdded.toLocaleString()}</div>
                    <div class="metric-note">across all commits</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Lines Removed</div>
                    <div class="metric-value" style="color:#f03e3e;">−${totalDeleted.toLocaleString()}</div>
                    <div class="metric-note">across all commits</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Net Change</div>
                    <div class="metric-value" style="color:${netChange >= 0 ? '#37b24d' : '#f03e3e'};">${netChange >= 0 ? '+' : ''}${netChange.toLocaleString()}</div>
                    <div class="metric-note">added minus removed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Top Contributor</div>
                    <div class="metric-value" style="font-size:15px;word-break:break-word;">${topContributor ? escapeHtml(topContributor.name) : '—'}</div>
                    <div class="metric-note">${topContributor ? `${(topContributor.added + topContributor.deleted).toLocaleString()} changes` : ''}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Avg Lines / Contributor</div>
                    <div class="metric-value">${avgLines.toLocaleString()}</div>
                    <div class="metric-note">added + removed</div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;">
                <div>
                    <div id="contributors-list">
                        ${previewRows}
                    </div>
                    ${showToggle ? `
                    <div id="contributors-all" style="display:none;">
                        ${allRows}
                    </div>
                    <div style="margin-top:8px;">
                        <button id="contributors-toggle" class="link" type="button" data-count="${effectiveStats.length}">Show all ${effectiveStats.length} contributors</button>
                    </div>` : ''}
                </div>
                <div>
                    <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:8px;">Lines Changed — Top ${Math.min(effectiveStats.length, 10)}</div>
                    <div class="chart-container" style="height:${Math.max(200, Math.min(effectiveStats.length, 10) * 36 + 40)}px;">
                        <canvas id="contributorsAuthorBar"></canvas>
                    </div>
                </div>
            </div>
        </div>
        <script>
            (function() {
                const axisColor = ${JSON.stringify(axisColor)};
                const gridColor = ${JSON.stringify(gridColor)};
                const barColors = ${JSON.stringify(colors.slice(0, 10))};
                const ctx = document.getElementById('contributorsAuthorBar');
                if (ctx) {
                    try {
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: ${JSON.stringify(barLabels)},
                                datasets: [
                                    { label: 'Lines Added', data: ${JSON.stringify(addedData)}, backgroundColor: 'rgba(55,178,77,0.7)', stack: 'changes' },
                                    { label: 'Lines Removed', data: ${JSON.stringify(deletedData)}, backgroundColor: 'rgba(240,62,62,0.7)', stack: 'changes' }
                                ]
                            },
                            options: {
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                interaction: { mode: 'index', intersect: false },
                                layout: { padding: { left: 10, right: 12, top: 4, bottom: 4 } },
                                plugins: {
                                    legend: { labels: { color: axisColor, font: { size: 11 }, boxWidth: 12, padding: 12 } },
                                    tooltip: { enabled: true }
                                },
                                scales: {
                                    x: { stacked: true, beginAtZero: true, ticks: { color: axisColor, font: { size: 11 } }, grid: { color: gridColor } },
                                    y: { stacked: true, ticks: { color: axisColor, font: { size: 11 }, autoSkip: false }, grid: { display: false } }
                                }
                            }
                        });
                    } catch (e) { /* keep toggle usable if chart fails */ }
                }

                const toggleBtn = document.getElementById('contributors-toggle');
                const preview = document.getElementById('contributors-list');
                const all = document.getElementById('contributors-all');
                if (toggleBtn && preview && all) {
                    toggleBtn.addEventListener('click', function() {
                        const isHidden = all.style.display === 'none' || getComputedStyle(all).display === 'none';
                        preview.style.display = isHidden ? 'none' : 'block';
                        all.style.display = isHidden ? 'block' : 'none';
                        toggleBtn.textContent = isHidden
                            ? 'Show fewer contributors'
                            : 'Show all ' + (toggleBtn.dataset.count || '') + ' contributors';
                    });
                }
            })();
        </script>
    `;
};
