/** Two stat tiles: total code lines and scoped file count. */
export function renderStatTiles(totalLines: number, totalFiles: number): string {
	return `
		<div class="stat-tiles">
			<div class="stat-tile">
				<div class="stat-value">${totalLines.toLocaleString()}</div>
				<div class="stat-label">Lines</div>
			</div>
			<div class="stat-tile">
				<div class="stat-value">${totalFiles.toLocaleString()}</div>
				<div class="stat-label">Files</div>
			</div>
		</div>
	`;
}
