import * as path from 'path';
import * as vscode from 'vscode';
import { StatsService } from '../services/StatsService';

export class StatsTreeProvider implements vscode.TreeDataProvider<StatsNode> {
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<StatsNode | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(private readonly statsService: StatsService) {}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: StatsNode): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: StatsNode): Promise<StatsNode[]> {
		if (!vscode.workspace.workspaceFolders?.length) {
			return [
				new StatsNode('info', 'Open a workspace to see stats', vscode.TreeItemCollapsibleState.None)
			];
		}

		if (!element) {
			return [
				new StatsNode('languages', 'Languages', vscode.TreeItemCollapsibleState.Collapsed),
				new StatsNode('contributors', 'Contributors (Workspace)', vscode.TreeItemCollapsibleState.Collapsed),
				new StatsNode('contributorsAll', 'Contributors (All)', vscode.TreeItemCollapsibleState.Collapsed)
			];
		}

		if (element.kind === 'languages') {
			return this.getLanguageNodes();
		}

		if (element.kind === 'contributors') {
			return this.getContributorNodes();
		}

		if (element.kind === 'contributorsAll') {
			return this.getContributorAllNodes();
		}

		if (element.kind === 'contributor') {
			return this.getContributorLanguageNodes(element.value ?? String(element.label));
		}
		if (element.kind === 'contributorAll') {
			return [];
		}

		if (element.kind === 'contributorLanguage') {
			const author = element.meta?.author ?? '';
			const languageId = element.meta?.languageId ?? '';
			return this.getContributorLanguageFileNodes(author, languageId);
		}

		return [];
	}

	private async getLanguageNodes(): Promise<StatsNode[]> {
		const result = await this.statsService.getLanguageStats();
		if (!result.hasWorkspace) {
			return [
				new StatsNode('info', 'Open a workspace to see stats', vscode.TreeItemCollapsibleState.None)
			];
		}
		if (result.totalFiles === 0) {
			return [new StatsNode('info', 'No files found in workspace', vscode.TreeItemCollapsibleState.None)];
		}
		if (result.filteredFiles === 0) {
			return [
				new StatsNode('info', 'All files are ignored by .gitignore', vscode.TreeItemCollapsibleState.None)
			];
		}
		if (result.stats.length === 0) {
			return [new StatsNode('info', 'No code lines found', vscode.TreeItemCollapsibleState.None)];
		}

		const totalLines = result.stats.reduce((sum, item) => sum + item.lines, 0);
		const totalNode = new StatsNode(
			'info',
			`Total code lines: ${totalLines}`,
			vscode.TreeItemCollapsibleState.None
		);

		const languageNodes = result.stats.map(({ languageId, lines }) => {
			const description = `${lines} lines`;
			const node = new StatsNode('language', this.formatLanguageLabel(languageId), vscode.TreeItemCollapsibleState.None);
			node.description = description;
			node.tooltip = `${lines} code lines in ${languageId}`;
			return node;
		});

		return [totalNode, ...languageNodes];
	}

	private async getContributorNodes(): Promise<StatsNode[]> {
		const result = await this.statsService.getContributorStats();
		if (!result.available) {
			return [this.createGitMissingNode()];
		}
		if (result.stats.length === 0) {
			return [new StatsNode('info', 'No Git history available', vscode.TreeItemCollapsibleState.None)];
		}

		return result.stats.map((entry) => {
			const description = `${entry.linesAdded} lines`;
			const node = new StatsNode('contributor', entry.name, vscode.TreeItemCollapsibleState.Collapsed, entry.name);
			node.description = description;
			node.tooltip = `${entry.linesAdded} lines added by ${entry.name}`;
			return node;
		});
	}

	private async getContributorAllNodes(): Promise<StatsNode[]> {
		const result = await this.statsService.getContributorStatsAll();
		if (!result.available) {
			return [this.createGitMissingNode()];
		}
		if (result.stats.length === 0) {
			return [new StatsNode('info', 'No Git history available', vscode.TreeItemCollapsibleState.None)];
		}

		return result.stats.map((entry) => {
			const description = `${entry.linesAdded} lines`;
			const node = new StatsNode('contributorAll', entry.name, vscode.TreeItemCollapsibleState.None);
			node.description = description;
			node.tooltip = `${entry.linesAdded} lines added by ${entry.name}`;
			return node;
		});
	}

	private createGitMissingNode(): StatsNode {
		const node = new StatsNode('info', 'Git repo hasn’t been defined', vscode.TreeItemCollapsibleState.None);
		node.description = 'Git repo required';
		node.tooltip = 'Git repo hasn’t been defined';
		node.command = {
			command: 'codecount.gitRepoMissing',
			title: 'Git repo hasn’t been defined'
		};
		return node;
	}

	private async getContributorLanguageNodes(authorName: string): Promise<StatsNode[]> {
		const result = await this.statsService.getContributorLanguageStats(authorName);
		if (!result.available) {
			return [new StatsNode('info', 'Git repository not found', vscode.TreeItemCollapsibleState.None)];
		}
		if (result.stats.length === 0) {
			return [new StatsNode('info', 'No language stats available', vscode.TreeItemCollapsibleState.None)];
		}

		return result.stats.map((entry) => {
			const description = `${entry.linesAdded} lines`;
			const node = new StatsNode(
				'contributorLanguage',
				this.formatLanguageLabel(entry.languageId),
				vscode.TreeItemCollapsibleState.Collapsed,
				undefined,
				{ author: authorName, languageId: entry.languageId }
			);
			node.description = description;
			node.tooltip = `${entry.linesAdded} lines added in ${entry.languageId}`;
			return node;
		});
	}

	private async getContributorLanguageFileNodes(authorName: string, languageId: string): Promise<StatsNode[]> {
		if (!authorName || !languageId) {
			return [new StatsNode('info', 'No data available', vscode.TreeItemCollapsibleState.None)];
		}

		const result = await this.statsService.getContributorLanguageFileStats(authorName, languageId);
		if (!result.available) {
			return [new StatsNode('info', 'Git repository not found', vscode.TreeItemCollapsibleState.None)];
		}
		if (result.stats.length === 0) {
			return [new StatsNode('info', 'No file stats available', vscode.TreeItemCollapsibleState.None)];
		}

		const rootPath = await this.statsService.getGitRootPath();
		if (!rootPath) {
			return [new StatsNode('info', 'Git repository not found', vscode.TreeItemCollapsibleState.None)];
		}

		const existingStats = await this.filterExistingFiles(rootPath, result.stats);
		if (existingStats.length === 0) {
			return [new StatsNode('info', 'No files found in workspace', vscode.TreeItemCollapsibleState.None)];
		}

		const infoNode = new StatsNode(
			'info',
			'Showing top 10 files by changes',
			vscode.TreeItemCollapsibleState.None
		);

		const fileNodes = existingStats.slice(0, 10).map((entry) => {
			const description = `+${entry.added} -${entry.deleted}`;
			const node = new StatsNode(
				'contributorFile',
				path.basename(entry.filePath),
				vscode.TreeItemCollapsibleState.None,
				undefined,
				{ author: authorName, languageId, filePath: entry.filePath, added: entry.added, deleted: entry.deleted }
			);
			node.description = description;
			node.tooltip = `${entry.filePath} • +${entry.added} -${entry.deleted}`;
			node.command = {
				command: 'codecount.openContributorFile',
				title: 'Open File',
				arguments: [{ author: authorName, filePath: entry.filePath }]
			};
			return node;
		});

		return [infoNode, ...fileNodes];
	}

	private async filterExistingFiles(
		rootPath: string,
		stats: Array<{ filePath: string; added: number; deleted: number }>
	): Promise<Array<{ filePath: string; added: number; deleted: number }>> {
		const checks = await Promise.all(
			stats.map(async (entry) => {
				const absolutePath = vscode.Uri.file(path.join(rootPath, entry.filePath));
				try {
					await vscode.workspace.fs.stat(absolutePath);
					return entry;
				} catch {
					return null;
				}
			})
		);

		return checks.filter(
			(entry): entry is { filePath: string; added: number; deleted: number } => entry !== null
		);
	}

	private formatLanguageLabel(languageId: string): string {
		if (!languageId) {
			return 'Unknown';
		}
		return languageId
			.split(/[-_]/g)
			.map((part) => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
			.join(' ');
	}

}

export class StatsNode extends vscode.TreeItem {
	constructor(
		public readonly kind: 'languages' | 'contributors' | 'contributorsAll' | 'language' | 'contributor' | 'contributorAll' | 'contributorLanguage' | 'contributorFile' | 'info',
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly value?: string,
		public readonly meta?: { author?: string; languageId?: string; filePath?: string; added?: number; deleted?: number }
	) {
		super(label, collapsibleState);
		if (kind === 'languages' || kind === 'contributors' || kind === 'contributorsAll') {
			this.iconPath = new vscode.ThemeIcon('graph');
		}
		if (kind === 'info') {
			this.iconPath = new vscode.ThemeIcon('info');
		}
	}
}
