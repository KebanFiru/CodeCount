export type LanguageStat = { languageId: string; lines: number };
export type LanguageFileStat = { filePath: string; absolutePath: string; lines: number };
export type ContributorStat = { name: string; email?: string; added: number; deleted: number };
export type ContributorLanguageStat = { languageId: string; linesAdded: number };
export type ContributorFileStat = { filePath: string; added: number; deleted: number };
export type ContributorFileHistoryEntry = { hash: string; date: string };

export type LanguageStatsResult = {
	hasWorkspace: boolean;
	totalFiles: number;
	filteredFiles: number;
	stats: LanguageStat[];
	branch?: string;
};

export type ContributorStatsResult = {
	available: boolean;
	stats: ContributorStat[];
	branch?: string;
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

export type RepoAnalyticsResult = {
	available: boolean;
	branch?: string;
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
	commitsByWeekday: number[];
	commitsByHour: number[];
	linesByWeekday: number[];
	linesByHour: number[];
	topChangedFiles: RepoTopFileStat[];
};
