export type LanguageStat = { languageId: string; lines: number };
export type LanguageFileStat = { filePath: string; absolutePath: string; lines: number; languageId: string };
export type ContributorStat = { name: string; email?: string; added: number; deleted: number };
export type ContributorLanguageStat = { languageId: string; linesAdded: number };
export type ContributorFileStat = { filePath: string; added: number; deleted: number };
export type FileHistoryEntry = { hash: string; date: string; author: string; subject: string };

export type LanguageStatsResult = {
	hasWorkspace: boolean;
	totalFiles: number;
	filteredFiles: number;

	ignoredFiles: number;
	stats: LanguageStat[];
	branch?: string;
	ahead?: number;
	behind?: number;
};

export type ContributorStatsResult = {
	available: boolean;
	stats: ContributorStat[];
	branch?: string;
	branchHasCommits?: boolean;
};

export type RepoCommitTrendStat = {
	date: string;
	commits: number;
	added: number;
	deleted: number;
};

export type RepoTopFileStat = {
	filePath: string;
	changes: number;
	added: number;
	deleted: number;
};

export type RepoAuthorStat = {
	author: string;
	commits: number;
	added: number;
	deleted: number;
};

export type RepoMonthStat = {
	month: string;
	commits: number;
	added: number;
	deleted: number;
};


export type RepoCommitTuple = [
	epochDay: number,
	hour: number,
	added: number,
	deleted: number,
	authorIdx: number
];

export type RepoAnalyticsResult = {
	available: boolean;
	branch?: string;
	branchHasCommits?: boolean;
	totalCommits: number;
	activeDays: number;
	firstCommitDate?: string;
	lastCommitDate?: string;
	totalAdded: number;
	totalDeleted: number;
	avgLinesChangedPerCommit: number;
	busiestDay?: { date: string; commits: number };
	mostChangedDay?: { date: string; changes: number };
	commitsByDate: RepoCommitTrendStat[];
	commitsByMonth: RepoMonthStat[];
	commitsByAuthor: RepoAuthorStat[];
	topChangedFiles: RepoTopFileStat[];
	authors: string[];
	commits: RepoCommitTuple[];
};
