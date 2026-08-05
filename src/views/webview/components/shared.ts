import { escapeHtml } from '../utils';

export const renderBranchChip = (branch?: string): string => {
	if (!branch) {
		return `<span class="chip chip-muted"><span aria-hidden="true">⎇</span> all branches</span>`;
	}
	return `<span class="chip"><span aria-hidden="true">⎇</span> ${escapeHtml(branch)}</span>`;
};

export const renderCardHead = (title: string, right = ''): string => `
	<div class="card-head">
		<h2>${escapeHtml(title)}</h2>
		${right}
	</div>
`;


export const renderBranchNotice = (branch: string | undefined, changedFiles: number): string => {
	if (!branch) {
		return '';
	}
	const files = changedFiles === 1 ? '1 file' : `${changedFiles.toLocaleString()} files`;
	return `
		<div class="notice">
			<span class="notice-icon" aria-hidden="true">⎇</span>
			<span>
				<strong>Branch view: ${escapeHtml(branch)}</strong> — no commits yet on this branch,
				so commit-based metrics are empty. ${files} changed in the working tree.
			</span>
		</div>
	`;
};

export const renderEmptyCard = (title: string, message: string): string => `
	<div class="card">
		${renderCardHead(title)}
		<p class="muted">${escapeHtml(message)}</p>
	</div>
`;

export const renderPath = (filePath: string): string =>
	`<div class="path" title="${escapeHtml(filePath)}"><bdi>${escapeHtml(filePath)}</bdi></div>`;
