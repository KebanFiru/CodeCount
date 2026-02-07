export type GitignoreRule = {
	negate: boolean;
	regex: RegExp;
	isDirectory: boolean;
};

export type GitignoreMatcher = {
	ignores: (relativePath: string) => boolean;
};
