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
			// Root level - simplified: dashboard and main data sections
			const nodes: StatsNode[] = [];

			const dashboardNode = new StatsNode(
				'dashboard',
				'Open Analytics Dashboard',
				vscode.TreeItemCollapsibleState.None
			);
			dashboardNode.command = {
				command: 'codecount.openAnalytics',
				title: 'Open Analytics Dashboard'
			};
			nodes.push(dashboardNode);

			// Data sections - clean and minimal
			nodes.push(
				new StatsNode('languages', 'Languages', vscode.TreeItemCollapsibleState.Collapsed),
				new StatsNode('contributors', 'Contributors', vscode.TreeItemCollapsibleState.Collapsed)
			);

			return nodes;
		}

		if (element.kind === 'languages') {
			return this.getLanguageNodes();
		}

		if (element.kind === 'contributors') {
			return this.getContributorNodes();
		}

		if (element.kind === 'language') {
			const languageId = element.meta?.languageId ?? element.value ?? '';
			return this.getLanguageFileNodes(languageId);
		}

		if (element.kind === 'contributor') {
			return this.getContributorLanguageNodes(element.value ?? String(element.label));
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

		const filteredStats = result.stats.filter(item => item.languageId !== 'ignore');
		const totalLines = filteredStats.reduce((sum, item) => sum + item.lines, 0);

		const totalNode = new StatsNode(
			'info',
			`Total code lines: ${totalLines.toLocaleString()}`,
			vscode.TreeItemCollapsibleState.None
		);
		totalNode.description = `${filteredStats.length} languages`;

		const languageNodes = filteredStats.map(({ languageId, lines }, index) => {
			const percent = totalLines > 0 ? Math.round((lines / totalLines) * 100) : 0;
			const description = `${lines.toLocaleString()} lines (${percent}%)`;
			const langName = this.getLanguageFullName(languageId);
			const node = new StatsNode(
				'language',
				`${langName}`,
				vscode.TreeItemCollapsibleState.Collapsed,
				undefined,
				{ languageId }
			);
			node.description = description;
			node.tooltip = `${lines.toLocaleString()} lines (${percent}%) in ${langName}`;
			return node;
		});

		return [totalNode, ...languageNodes];
	}

	private getLanguageFullName(languageId: string): string {
		const names: Record<string, string> = {
			typescript: 'TypeScript',
			typescriptreact: 'TypeScript React',
			javascript: 'JavaScript',
			javascriptreact: 'JavaScript React',
			python: 'Python',
			java: 'Java',
			csharp: 'C#',
			cpp: 'C++',
			c: 'C',
			rust: 'Rust',
			go: 'Go',
			kotlin: 'Kotlin',
			swift: 'Swift',
			objective_c: 'Objective-C',
			php: 'PHP',
			ruby: 'Ruby',
			perl: 'Perl',
			scala: 'Scala',
			r: 'R',
			sql: 'SQL',
			html: 'HTML',
			css: 'CSS',
			scss: 'SCSS',
			less: 'Less',
			sass: 'SASS',
			xml: 'XML',
			json: 'JSON',
			jsonc: 'JSON with Comments',
			yaml: 'YAML',
			yml: 'YAML',
			toml: 'TOML',
			markdown: 'Markdown',
			md: 'Markdown',
			plaintext: 'Plain Text',
			ignore: 'Ignore File',
		};
		return names[languageId.toLowerCase()] || this.formatLanguageLabel(languageId);
	}

	private async getContributorNodes(): Promise<StatsNode[]> {
		const result = await this.statsService.getContributorStats();
		if (!result.available) {
			return [this.createGitMissingNode()];
		}
		if (result.stats.length === 0) {
			return [new StatsNode('info', 'No Git history available', vscode.TreeItemCollapsibleState.None)];
		}

		// Only include contributors with at least one change
		const effectiveStats = result.stats.filter(s => (s.added + s.deleted) > 0);
		if (effectiveStats.length === 0) {
			return [new StatsNode('info', 'No contributors with changes found', vscode.TreeItemCollapsibleState.None)];
		}

		const totalChanges = effectiveStats.reduce((sum, s) => sum + (s.added + s.deleted), 0);
		const branchLabel = result.branch && result.branch !== 'all' ? ` (branch: ${result.branch})` : '';
		const totalNode = new StatsNode(
			'info',
			`Total contributors${branchLabel}: ${effectiveStats.length}`,
			vscode.TreeItemCollapsibleState.None
		);
		totalNode.description = `${totalChanges.toLocaleString()} total changes`;

		return [totalNode, ...effectiveStats.map((entry) => {
			const entryTotal = entry.added + entry.deleted;
			const percent = totalChanges > 0 ? Math.round((entryTotal / totalChanges) * 100) : 0;
			const description = `${entryTotal.toLocaleString()} changes (${percent}%)`;
			const displayName = entry.name;
			const node = new StatsNode('contributor', displayName, vscode.TreeItemCollapsibleState.Collapsed, entry.email ?? entry.name);
			node.description = description;
			node.tooltip = `+${entry.added.toLocaleString()} -${entry.deleted.toLocaleString()} by ${displayName}\nWorkspace changes`;
			return node;
		})];
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

	private async getLanguageFileNodes(languageId: string): Promise<StatsNode[]> {
		if (!languageId) {
			return [new StatsNode('info', 'No language selected', vscode.TreeItemCollapsibleState.None)];
		}

		const result = await this.statsService.getLanguageFileStats(languageId);
		if (!result.available) {
			return [new StatsNode('info', 'Open a workspace to see stats', vscode.TreeItemCollapsibleState.None)];
		}
		if (result.stats.length === 0) {
			return [new StatsNode('info', 'No files found for this language', vscode.TreeItemCollapsibleState.None)];
		}

		const infoNode = new StatsNode(
			'info',
			`Showing ${result.stats.length.toLocaleString()} files by lines`,
			vscode.TreeItemCollapsibleState.None
		);

		const fileNodes = result.stats.map((entry) => {
			const node = new StatsNode(
				'languageFile',
				path.basename(entry.filePath),
				vscode.TreeItemCollapsibleState.None,
				undefined,
				{ filePath: entry.filePath, absolutePath: entry.absolutePath }
			);
			node.description = `${entry.lines.toLocaleString()} lines`;
			node.tooltip = entry.filePath;
			node.resourceUri = vscode.Uri.file(entry.absolutePath);
			node.command = {
				command: 'vscode.open',
				title: 'Open File',
				arguments: [node.resourceUri]
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
		public readonly kind: 'dashboard' | 'languages' | 'contributors' | 'language' | 'languageFile' | 'contributor' | 'contributorLanguage' | 'contributorFile' | 'info',
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly value?: string,
		public readonly meta?: { author?: string; languageId?: string; filePath?: string; absolutePath?: string; added?: number; deleted?: number }
	) {
		super(label, collapsibleState);
		if (kind === 'dashboard') {
			this.iconPath = new vscode.ThemeIcon('open-preview');
		}
		if (kind === 'languages' || kind === 'contributors') {
			this.iconPath = new vscode.ThemeIcon('graph');
		}
		if (kind === 'info') {
			this.iconPath = new vscode.ThemeIcon('info');
		}
	}
}
