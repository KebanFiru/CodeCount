import type { LanguageFileStat, LanguageStat } from '../../../../types';
import { basename, chartColorVar, clampPercent, escapeHtml, getLanguageFullName } from '../utils';

/** Top-level Languages accordion: one collapsed row per language, files load lazily on expand. */
export function renderLanguageList(stats: LanguageStat[], totalLines: number): string {
	const visible = stats.filter(s => s.languageId !== 'ignore');
	if (visible.length === 0) {
		return `<div class="list-empty">No code lines found.</div>`;
	}

	return visible
		.map((entry, index) => {
			const percent = totalLines > 0 ? Math.round((entry.lines / totalLines) * 100) : 0;
			const width = clampPercent(totalLines > 0 ? (entry.lines / totalLines) * 100 : 0);
			const key = `lang:${entry.languageId}`;
			const name = getLanguageFullName(entry.languageId);
			return `
				<div class="acc-item" data-row-key="${escapeHtml(key)}">
					<button type="button" class="acc-header" aria-expanded="false"
						data-action="expand" data-section="language" data-key="${escapeHtml(key)}"
						data-lang="${escapeHtml(entry.languageId)}" data-filter-text="${escapeHtml(name.toLowerCase())}">
						<span class="acc-chevron" aria-hidden="true">&#9656;</span>
						<span class="acc-name">${escapeHtml(name)}</span>
						<span class="acc-value">${entry.lines.toLocaleString()}</span>
					</button>
					<div class="acc-bar-row">
						<div class="acc-bar-track" aria-hidden="true">
							<div class="acc-bar-fill" style="width:${width}%;background:${chartColorVar(index)};"></div>
						</div>
						<span class="acc-percent">${percent}%</span>
					</div>
					<div class="acc-children" data-children-for="${escapeHtml(key)}" hidden></div>
				</div>
			`;
		})
		.join('');
}

export function renderLanguageFiles(files: LanguageFileStat[]): string {
	if (files.length === 0) {
		return `<div class="list-empty list-empty--nested">No files found for this language.</div>`;
	}

	return files
		.map(file => {
			const name = basename(file.filePath);
			return `
				<button type="button" class="file-row" data-action="openFileHistory"
					data-file-path="${escapeHtml(file.filePath)}" data-absolute-path="${escapeHtml(file.absolutePath)}"
					title="${escapeHtml(file.filePath)}">
					<span class="file-name" dir="rtl">${escapeHtml(name)}</span>
					<span class="file-value">${file.lines.toLocaleString()}</span>
				</button>
			`;
		})
		.join('');
}
