import type { LanguageStatsResult } from '../../../types';

export const renderIgnoredFilesSection = (result: LanguageStatsResult): string => {
	if (!result.hasWorkspace) {
		return '';
	}

	const ignoredCount = result.totalFiles - result.filteredFiles;
	const ignoredPercentage = result.totalFiles > 0 
		? Math.round((ignoredCount / result.totalFiles) * 100) 
		: 0;

	if (ignoredCount === 0) {
		return '';
	}

	return `
		<div class="ignored-section">
			<h4>Ignored Files (by .gitignore)</h4>
			<div class="ignored-count">${ignoredCount.toLocaleString()}</div>
			<div class="ignored-note">${ignoredPercentage}% of total files excluded</div>
		</div>
	`;
};
