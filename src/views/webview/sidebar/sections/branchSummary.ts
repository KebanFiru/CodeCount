import { escapeHtml } from '../utils';

export type BranchSummaryData = {
	branch?: string;
	ahead?: number;
	behind?: number;
	branchHasCommits?: boolean;
	workingTreeFileCount?: number;
};

export function renderBranchSummary(data: BranchSummaryData): string {
	if (!data.branch) {
		return '';
	}

	const aheadBehind = (data.ahead !== undefined && data.behind !== undefined)
		? `<div class="branch-aheadbehind">${data.ahead} ahead &middot; ${data.behind} behind main</div>`
		: '';

	return `
		<div class="branch-summary">
			<span class="branch-icon" aria-hidden="true">&#9143;</span>
			<span class="branch-name">${escapeHtml(data.branch)}</span>
		</div>
		${aheadBehind}
	`;
}


export function renderNoCommitsBanner(data: BranchSummaryData): string {
	if (!data.branch || data.branchHasCommits !== false) {
		return '';
	}

	const count = data.workingTreeFileCount ?? 0;
	return `
		<div class="branch-banner" role="status">
			Branch view: <strong>${escapeHtml(data.branch)}</strong> &mdash; no commits yet,
			${count} file${count === 1 ? '' : 's'} changed in working tree
		</div>
	`;
}
