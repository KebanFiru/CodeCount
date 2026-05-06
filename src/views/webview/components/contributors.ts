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
    const topPreview = result.stats.slice(0, 3);
    const maxChanges = Math.max(1, ...topPreview.map(s => s.added + s.deleted));
    const showToggle = result.stats.length > 3;

    const previewRows = topPreview.map((stat, idx) => {
        const total = stat.added + stat.deleted;
        const displayName = escapeHtml(stat.name);
        const percent = Math.max(1, Math.round((total / maxChanges) * 100));
        return `
            <div class="row">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                    <strong>${displayName}</strong>
                    <span style="color: ${colors[idx]}; font-weight:600; font-size:14px;">+${stat.added.toLocaleString()} -${stat.deleted.toLocaleString()}</span>
                </div>
                <div class="bar"><span style="width:${percent}%; background-color: ${colors[idx]}"></span></div>
                <div class="muted">${total.toLocaleString()} total changes</div>
            </div>
        `;
    }).join('');

    const allRows = result.stats.map((stat, idx) => {
        const total = stat.added + stat.deleted;
        const displayName = escapeHtml(stat.name);
        return `
            <div class="row">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                    <strong>${displayName}</strong>
                    <span style="color: ${colors[idx]}; font-weight:600; font-size:13px;">+${stat.added.toLocaleString()} -${stat.deleted.toLocaleString()}</span>
                </div>
                <div class="muted">${total.toLocaleString()} total changes</div>
            </div>
        `;
    }).join('');

    const barLabels = result.stats.slice(0, 10).map(s => escapeHtml(s.name));
    const barData = result.stats.slice(0, 10).map(s => s.added + s.deleted);
    const axisColor = '#ffffff';

    const branchLabel = result.branch && result.branch !== 'all' ? `<div class="muted" style="font-size:12px;margin-top:4px;">Branch: ${escapeHtml(result.branch)}</div>` : '';

    return `
        <div class="card">
            <h2>Contributors</h2>
            ${branchLabel}
            <div class="section-grid">
                <div>
                    <div id="contributors-list">
                        ${previewRows}
                    </div>
                    ${showToggle ? `<div id="contributors-all" style="display:none;">
                        ${allRows}
                    </div>
                    <div style="margin-top:4px;">
                        <button id="contributors-toggle" class="link" type="button">Show all contributors</button>
                    </div>` : ''}
                </div>
                <div>
                    <div class="chart-container" style="height:320px;">
                        <canvas id="contributorsAuthorBar"></canvas>
                    </div>
                </div>
            </div>
            <script>
                const contributorsAxisColor = '#ffffff';
                const contributorsGridColor = 'rgba(255,255,255,0.12)';
                const labels = ${JSON.stringify(barLabels)};
                const data = ${JSON.stringify(barData)};
                const ctx = document.getElementById('contributorsAuthorBar');
                if (ctx) {
                    try {
                        new Chart(ctx, {
                            type: 'bar',
                            data: { labels, datasets: [{ label: 'Lines Changed', data, backgroundColor: ${JSON.stringify(colors.slice(0, 10))} }] },
                            options: {
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                interaction: { mode: 'nearest', intersect: true },
                                layout: { padding: { left: 10, right: 10, top: 8, bottom: 8 } },
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        enabled: true,
                                        titleColor: contributorsAxisColor,
                                        bodyColor: contributorsAxisColor
                                    }
                                },
                                onHover: (_, activeElements, chart) => {
                                    chart.canvas.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                                },
                                scales: {
                                    x: {
                                        beginAtZero: true,
                                        ticks: { color: contributorsAxisColor, font: { size: 11 } },
                                        grid: { color: contributorsGridColor }
                                    },
                                    y: {
                                        ticks: { color: contributorsAxisColor, font: { size: 11 }, autoSkip: false },
                                        grid: { display: false }
                                    }
                                }
                            }
                        });
                    } catch {
                        // Keep toggle interaction available even if chart initialization fails.
                    }
                }

                const contributorsToggleBtn = document.getElementById('contributors-toggle');
                const contributorsPreview = document.getElementById('contributors-list');
                const contributorsAll = document.getElementById('contributors-all');
                if (contributorsToggleBtn && contributorsPreview && contributorsAll) {
                    contributorsToggleBtn.addEventListener('click', () => {
                        if (contributorsAll.style.display === 'none' || getComputedStyle(contributorsAll).display === 'none') {
                            contributorsPreview.style.display = 'none';
                            contributorsAll.style.display = 'block';
                            contributorsToggleBtn.textContent = 'Show less contributors';
                        } else {
                            contributorsPreview.style.display = 'block';
                            contributorsAll.style.display = 'none';
                            contributorsToggleBtn.textContent = 'Show all contributors';
                        }

                        window.__codecountRequestLayout?.();
                    });
                }
            </script>
        </div>
    `;
};
