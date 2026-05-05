import * as path from 'path';
import * as vscode from 'vscode';
import type { GitignoreMatcher, GitignoreRule } from '../types/gitignore';

type GitignoreScope = {
	rootRelativeDir: string;
	rules: GitignoreRule[];
};

export class GitignoreService {
	private readonly cache = new Map<string, GitignoreMatcher>();

	clearCache(): void {
		this.cache.clear();
	}

	async getMatcher(rootPath: string): Promise<GitignoreMatcher> {
		const cached = this.cache.get(rootPath);
		if (cached) {
			return cached;
		}

		const matcher = await this.loadGitignore(rootPath);
		this.cache.set(rootPath, matcher);
		return matcher;
	}

	private async loadGitignore(rootPath: string): Promise<GitignoreMatcher> {
		const scopes = await this.loadGitignoreScopes(rootPath);
		return {
			ignores: (relativePath: string) => this.matchGitignore(scopes, relativePath)
		};
	}

	private async loadGitignoreScopes(rootPath: string): Promise<GitignoreScope[]> {
		const gitignoreFiles = await vscode.workspace.findFiles(
			'**/.gitignore',
			'**/{node_modules,out,dist,.git}/**'
		);

		const scopes: GitignoreScope[] = [];
		for (const uri of gitignoreFiles) {
			const relativePath = path.relative(rootPath, uri.fsPath);
			if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
				continue;
			}

			const relativeGitignorePath = relativePath.replace(/\\/g, '/');
			const rootRelativeDir = path.dirname(relativeGitignorePath).replace(/\\/g, '/');
			const content = await this.readGitignoreFile(uri);
			const rules = this.parseGitignore(content);
			scopes.push({ rootRelativeDir, rules });
		}

		scopes.sort((a, b) => a.rootRelativeDir.length - b.rootRelativeDir.length);
		return scopes;
	}

	private async readGitignoreFile(uri: vscode.Uri): Promise<string> {
		try {
			const data = await vscode.workspace.fs.readFile(uri);
			return Buffer.from(data).toString('utf8').replace(/^\uFEFF/, '');
		} catch {
			return '';
		}
	}

	private parseGitignore(content: string): GitignoreRule[] {

		const rules: GitignoreRule[] = [];
		const lines = content.split(/\r?\n/);

		for (const rawLine of lines) {
			if (!rawLine || rawLine.trim().length === 0) {
				continue;
			}

			let line = rawLine;
			let negate = false;

			if (line.startsWith('\\#')) {
				line = line.slice(1);
			} 
			else if (line.startsWith('#')) {
				continue;
			}

			if (line.startsWith('!')) {
				negate = true;
				line = line.slice(1);
			}

			if (line.trim().length === 0) {
				continue;
			}

			const isDirectory = line.endsWith('/');
			const pattern = isDirectory ? line.slice(0, -1) : line;
			const regex = this.gitignorePatternToRegex(pattern);
			rules.push({ negate, regex, isDirectory });
		}

		return rules;
	}

	private matchGitignore(scopes: GitignoreScope[], relativePath: string): boolean {

		const normalized = relativePath.replace(/\\/g, '/');
		let ignored = false;
		const pathSegments = normalized.split('/');

		for (const scope of scopes) {
			if (!this.scopeApplies(scope.rootRelativeDir, pathSegments)) {
				continue;
			}

			const scopedRelativePath = scope.rootRelativeDir === '.'
				? normalized
				: normalized.slice(scope.rootRelativeDir.length + 1);

			for (const rule of scope.rules) {
				const matches = rule.isDirectory
					? rule.regex.test(scopedRelativePath + '/')
					: rule.regex.test(scopedRelativePath);
				if (matches) {
					ignored = !rule.negate;
				}
			}
		}

		return ignored;
	}

	private scopeApplies(rootRelativeDir: string, pathSegments: string[]): boolean {
		if (rootRelativeDir === '.' || rootRelativeDir.length === 0) {
			return true;
		}

		const scopeSegments = rootRelativeDir.split('/').filter(Boolean);
		if (scopeSegments.length === 0 || scopeSegments.length > pathSegments.length) {
			return false;
		}

		return scopeSegments.every((segment, index) => pathSegments[index] === segment);
	}

	private gitignorePatternToRegex(pattern: string): RegExp {
		let pat = pattern.replace(/\\/g, '/');
		let anchored = false;
		if (pat.startsWith('/')) {
			anchored = true;
			pat = pat.slice(1);
		}

		const escaped = pat
			.split(/(\*\*|\*|\?)/g)
			.map((part) => {
				if (part === '**') {
					return '.*';
				}
				if (part === '*') {
					return '[^/]*';
				}
				if (part === '?') {
					return '[^/]';
				}
				return part.replace(/[.+^${}()|[\]\\]/g, '\\$&');
			})
			.join('');

		const prefix = anchored ? '^' : '(^|.*/)';
		return new RegExp(`${prefix}${escaped}(/|$)`);
	}
}
