export type LanguageStat = { languageId: string; lines: number };
export type ContributorStat = { name: string; linesAdded: number };
export type ContributorLanguageStat = { languageId: string; linesAdded: number };
export type ContributorFileStat = { filePath: string; added: number; deleted: number };
export type ContributorFileHistoryEntry = { hash: string; date: string };

export type LanguageStatsResult = {
	hasWorkspace: boolean;
	totalFiles: number;
	filteredFiles: number;
	stats: LanguageStat[];
};

export type ContributorStatsResult = {
	available: boolean;
	stats: ContributorStat[];
};
