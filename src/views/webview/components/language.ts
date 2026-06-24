import type { LanguageStat } from '../../../types';
import { escapeHtml, generateColors, getLanguageDescription, getLanguageFullName } from '../utils';

export const renderLanguageCharts = (
    result: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[]; branch?: string }
): string => {
    if (!result.hasWorkspace || result.filteredFiles === 0 || result.stats.length === 0) {
        return '';
    }

    const branchBadge = result.branch
        ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:rgba(64,152,255,0.15);border:1px solid rgba(64,152,255,0.3);font-size:11px;font-weight:600;color:#4098ff;">
               <span style="font-size:13px;">⎇</span> ${escapeHtml(result.branch)}
           </span>`
        : `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);font-size:11px;color:rgba(255,255,255,0.5);">
               <span style="font-size:13px;">⎇</span> all branches
           </span>`;

    const colors = generateColors(result.stats.length);
    const axisColor = '#ffffff';
    const gridColor = 'rgba(255,255,255,0.12)';

    const barData = {
        labels: result.stats.map(s => getLanguageFullName(s.languageId)),
        datasets: [{
            label: 'Lines of Code',
            data: result.stats.map(s => s.lines),
            backgroundColor: colors,
            borderColor: 'var(--border)',
            borderWidth: 1
        }]
    };

    return `
        <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
                <h2 style="margin:0;">Line Count by Language</h2>
                ${branchBadge}
            </div>
            <div class="chart-container" style="height:560px;">
                <canvas id="languageBarChart" height="560"></canvas>
            </div>
            <script>
                const barCtx = document.getElementById('languageBarChart');
                if (barCtx) {
                    new Chart(barCtx, {
                        type: 'bar',
                        data: ${JSON.stringify(barData)},
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            layout: { padding: { left: 18, right: 12, top: 8, bottom: 8 } },
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { ticks: { color: ${JSON.stringify(axisColor)}, font: { size: 11 } }, grid: { color: ${JSON.stringify(gridColor)} } },
                                y: { ticks: { color: ${JSON.stringify(axisColor)}, font: { size: 11 }, autoSkip: false, padding: 8 }, grid: { display: false } }
                            }
                        }
                    });
                }
            </script>
        </div>
    `;
};

export const renderLanguageTable = (
    result: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[]; branch?: string }
): string => {
    if (!result.hasWorkspace || result.filteredFiles === 0 || result.stats.length === 0) {
        return '';
    }

    const branchBadge = result.branch
        ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:rgba(64,152,255,0.15);border:1px solid rgba(64,152,255,0.3);font-size:11px;font-weight:600;color:#4098ff;">
               <span style="font-size:13px;">⎇</span> ${escapeHtml(result.branch)}
           </span>`
        : `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);font-size:11px;color:rgba(255,255,255,0.5);">
               <span style="font-size:13px;">⎇</span> all branches
           </span>`;

    const totalLines = result.stats.reduce((sum, s) => sum + s.lines, 0);
    const max = result.stats[0].lines || 1;
    const colors = generateColors(result.stats.length);

    const topPreview = result.stats.slice(0, 3);
    const allRows = result.stats;

    const renderRows = (stats: typeof result.stats) => {
        return stats.map((stat, idx) => {
            const percent = Math.max(1, Math.round((stat.lines / totalLines) * 100));
            const barPercent = Math.max(1, Math.round((stat.lines / max) * 100));
            const fullName = getLanguageFullName(stat.languageId);
            return `
                <div class="row">
                    <div class="lang-label">
                        <div class="lang-icon" style="background-color: ${colors[idx]}"></div>
                        <div>
                            <div style="font-weight: 600;">${fullName}</div>
                        </div>
                    </div>
                    <div class="bar"><span style="width:${barPercent}%"></span></div>
                    <div style="display: grid; grid-template-columns: auto auto; gap: 16px; font-size: 11px;">
                        <div>
                            <div class="muted">Lines</div>
                            <div style="font-weight: 600; color: var(--accent);">${stat.lines.toLocaleString()}</div>
                        </div>
                        <div>
                            <div class="muted">Percentage</div>
                            <div style="font-weight: 600; color: var(--accent);">${percent}%</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    const previewRows = renderRows(topPreview);
    const allRowsHtml = renderRows(allRows);
    const showToggle = result.stats.length > 3;

    return `
        <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
                <h2 style="margin:0;">Detailed Language Breakdown</h2>
                ${branchBadge}
            </div>
            <div class="table">
                ${showToggle ? `
                <div id="languages-preview">${previewRows}</div>
                <div id="languages-all" style="display:none;">${allRowsHtml}</div>
                ` : allRowsHtml}
            </div>
            ${showToggle ? `<div style="margin-top:8px;">
                <button id="languages-toggle" class="link">Show all languages</button>
            </div>
            <script>
                const toggleBtn = document.getElementById('languages-toggle');
                const preview = document.getElementById('languages-preview');
                const all = document.getElementById('languages-all');
                if (toggleBtn && preview && all) {
                    toggleBtn.addEventListener('click', () => {
                        if (all.style.display === 'none') {
                            preview.style.display = 'none';
                            all.style.display = '';
                            toggleBtn.textContent = 'Show fewer languages';
                        } else {
                            preview.style.display = '';
                            all.style.display = 'none';
                            toggleBtn.textContent = 'Show all languages';
                            window.scrollTo(0, 0);
                        }
                    });
                }
            </script>` : ''}
        </div>
    `;
};
