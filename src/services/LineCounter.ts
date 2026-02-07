import * as vscode from 'vscode';
import type { LineCountResult } from '../types/lineCount';

export class LineCounter {
	countDocumentLines(document: { lineCount: number }): number {
		let totalLines = 0;
		for (let i = 0; i < document.lineCount; i += 1) {
			const lineText = (document as vscode.TextDocument).lineAt(i).text;
			if (this.isCodeLine(lineText)) {
				totalLines += 1;
			}
		}

		return totalLines;
	}

	async countWorkspaceLines(
		uris: readonly vscode.Uri[],
		getDocument: (uri: vscode.Uri) => Thenable<vscode.TextDocument>
	): Promise<LineCountResult> {
		let totalLines = 0;
        let commentLines = 0;
		for (const uri of uris) {
			const document = await getDocument(uri);
			for (let i = 0; i < document.lineCount; i += 1) {
				const lineText = document.lineAt(i).text;
				if (this.isCodeLine(lineText)) {
					totalLines += 1;
				}
				else if (this.isCommentLine(lineText)) {
                    commentLines += 1;
                }
			}   
		}

		return { totalLines, fileCount: uris.length, commentLines };
	}

	private isCommentLine(lineText: string): boolean {
		const trimmed = lineText.trim();
		return trimmed.startsWith('//') || trimmed.startsWith('#');
	}

	private isCodeLine(lineText: string): boolean {
		const trimmed = lineText.trim();
		return trimmed.length > 0 && !this.isCommentLine(trimmed);
	}

}
