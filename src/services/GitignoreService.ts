import * as path from 'path';
import * as vscode from 'vscode';
import type { GitignoreMatcher, GitignoreRule } from '../types/gitignore';

export class GitignoreService {
	private readonly cache = new Map<string, GitignoreMatcher>();

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
		const gitignoreUri = vscode.Uri.file(path.join(rootPath, '.gitignore'));
		let content = '';
		try {
			const data = await vscode.workspace.fs.readFile(gitignoreUri);
			content = data.toString();
		} catch {
			// .gitignore not found or not readable; ignore silently
		}

		const rules = this.parseGitignore(content);
		return {
			ignores: (relativePath: string) => this.matchGitignore(rules, relativePath)
		};
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
			} else if (line.startsWith('#')) {
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

	private matchGitignore(rules: GitignoreRule[], relativePath: string): boolean {
		const normalized = relativePath.replace(/\\/g, '/');
		let ignored = false;
		for (const rule of rules) {
			const matches = rule.isDirectory
				? rule.regex.test(normalized + '/')
				: rule.regex.test(normalized);
			if (matches) {
				ignored = !rule.negate;
			}
		}

		return ignored;
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
