import { renderStatsOverview, renderOverviewTab } from './components/overview';
import { renderLanguageCharts, renderLanguageTable, renderLargestFiles } from './components/language';
import { renderContributorsChart, renderContributorTimeline } from './components/contributors';
import { renderActivityTab } from './components/activity';

export const getLogoSvg = (): string => {
	return `<svg class="logo" viewBox="0 0 24 24" aria-hidden="true">
		<path fill="currentColor" d="M8.7 6.3 4 12l4.7 5.7 1.6-1.4L6.4 12l3.9-4.3-1.6-1.4Zm6.6 0-1.6 1.4L17.6 12l-3.9 4.3 1.6 1.4L20 12l-4.7-5.7ZM10.4 19h2.2l4-14h-2.2l-4 14Z"/>
	</svg>`;
};

// Re-export component functions for a clean import surface.
export {
	renderStatsOverview,
	renderOverviewTab,
	renderLanguageCharts,
	renderLanguageTable,
	renderLargestFiles,
	renderContributorsChart,
	renderContributorTimeline,
	renderActivityTab,
};
