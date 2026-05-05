import type { LanguageStat } from '../../../types';
import { getLanguageFullName } from '../utils';

export const renderStatsOverview = (
    result: { hasWorkspace: boolean; totalFiles: number; filteredFiles: number; stats: LanguageStat[] },
    ignoredCount: number,
    totalLines: number
): string => {
    if (!result.hasWorkspace) {
        return `<div class="empty-state"><p class="muted">Open a workspace to begin analyzing code metrics</p></div>`;
    }
    if (result.totalFiles === 0) {
        return `<div class="empty-state"><p class="muted">No files found in workspace</p></div>`;
    }
    if (result.filteredFiles === 0) {
        return `<div class="empty-state"><p class="muted">All files are ignored by .gitignore</p></div>`;
    }

    return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Files</div>
                <div class="stat-value">${result.totalFiles.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Analyzed Files</div>
                <div class="stat-value">${result.filteredFiles.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Lines</div>
                <div class="stat-value">${totalLines.toLocaleString()}</div>
            </div>
            <div class="stat-card" title="Files excluded by .gitignore and default settings">
                <div class="stat-label">Excluded Files</div>
                <div class="stat-value">${ignoredCount.toLocaleString()}</div>
            </div>
        </div>
    `;
};
