export function renderNoWorkspace(): string {
	return `
		<div class="empty-state">
			<div class="empty-icon" aria-hidden="true">&#128193;</div>
			<div class="empty-title">No workspace open</div>
			<div class="empty-body">Open a folder to see language and contributor stats.</div>
		</div>
	`;
}

export function renderNoGitRepo(): string {
	return `
		<div class="empty-state">
			<div class="empty-icon" aria-hidden="true">&#9143;</div>
			<div class="empty-title">No Git repository here</div>
			<div class="empty-body">CodeCount needs a repo for branch and contributor insights.</div>
			<button type="button" class="empty-action" data-action="initRepo">Initialize repository</button>
			<div class="empty-footnote">Language line counts still work below.</div>
		</div>
	`;
}

export function renderAllIgnored(): string {
	return `
		<div class="empty-state">
			<div class="empty-icon" aria-hidden="true">&#128683;</div>
			<div class="empty-title">All files are ignored</div>
			<div class="empty-body">Every file in this workspace matches a .gitignore rule.</div>
		</div>
	`;
}

export function renderNoFiles(): string {
	return `
		<div class="empty-state">
			<div class="empty-icon" aria-hidden="true">&#128196;</div>
			<div class="empty-title">No files found</div>
			<div class="empty-body">This workspace doesn't contain any files yet.</div>
		</div>
	`;
}

export function renderNoContributors(): string {
	return `
		<div class="empty-state">
			<div class="empty-icon" aria-hidden="true">&#128101;</div>
			<div class="empty-title">No contributors yet</div>
			<div class="empty-body">No Git history is available for this branch.</div>
		</div>
	`;
}

export function renderContributorsNeedGit(): string {
	return `
		<div class="empty-state empty-state--nested">
			<div class="empty-body">Contributors need a Git repository. Initialize one above to see this data.</div>
		</div>
	`;
}
