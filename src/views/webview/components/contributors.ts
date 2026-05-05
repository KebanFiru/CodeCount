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
                    <div class="chart-container compact">
                        <canvas id="contributorsAuthorBar" height="260"></canvas>
                    </div>
                </div>
            </div>
            <script>
                const labels = ${JSON.stringify(barLabels)};
                const data = ${JSON.stringify(barData)};
                const ctx = document.getElementById('contributorsAuthorBar');
                if (ctx) {
                    new Chart(ctx, {
                        type: 'bar',
                        data: { labels, datasets: [{ label: 'Lines Changed', data, backgroundColor: ${JSON.stringify(colors.slice(0, 10))} }] },
                        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: 'var(--fg)' } }, y: { ticks: { color: 'var(--fg)' }, beginAtZero: true } } }
                    });
                }

                // Use delegated click handling and guard for DOM readiness
                document.addEventListener('click', (ev) => {
                    const target = ev.target;
                    if (!(target instanceof HTMLElement)) return;
                    if (target.id !== 'contributors-toggle') return;

                    const allEl = document.getElementById('contributors-all');
                    const listEl = document.getElementById('contributors-list');
                    if (!allEl || !listEl) return;

                    if (allEl.style.display === 'none' || getComputedStyle(allEl).display === 'none') {
                        listEl.style.display = 'none';
                        allEl.style.display = 'block';
                        target.textContent = 'Show fewer contributors';
                    } else {
                        listEl.style.display = 'block';
                        allEl.style.display = 'none';
                        target.textContent = 'Show all contributors';
                    }

                    window.__codecountRequestLayout?.();
                });
            </script>
        </div>
    `;
};
