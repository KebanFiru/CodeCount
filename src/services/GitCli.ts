import { execFile } from 'child_process';

export function runGit(args: string[], cwd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile('git', args, { cwd }, (error, stdout) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(stdout.toString());
		});
	});
}

export function isDefaultBranch(branch: string): boolean {
	return branch === 'main' || branch === 'master' || branch === 'origin/main' || branch === 'origin/master';
}

export async function resolveMergeBase(rootPath: string): Promise<string | undefined> {
	const candidates = ['main', 'master', 'origin/main', 'origin/master'];
	for (const candidate of candidates) {
		try {
			const result = (await runGit(['merge-base', 'HEAD', candidate], rootPath)).trim();
			if (result) {
				return result;
			}
		} catch {
		}
	}
	return undefined;
}

export function normalizeGitPath(filePath: string): string {
	const trimmed = filePath.trim();
	const renameMatch = trimmed.split('=>');
	if (renameMatch.length > 1) {
		return renameMatch[renameMatch.length - 1].replace(/[{}]/g, '').trim();
	}
	return trimmed;
}
