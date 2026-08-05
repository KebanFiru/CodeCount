import type { RepoCommitTuple } from '../../types';

/**
 * Server-side derivations over the compact commit array.
 *
 * The Overview tab is static (all-time, no filters), so its breakdowns are computed
 * here in TypeScript and shipped as plain HTML. The Activity tab recomputes the same
 * shapes in the browser (see `commitAggregationScript`) because its filters change
 * the input set. Both read the identical `RepoCommitTuple[]`, so they cannot disagree.
 */

const DAY_MS = 86_400_000;

const epochDayToUtc = (day: number): Date => new Date(day * DAY_MS);

/** Weekday index with Monday first, matching how the punch card reads. */
const mondayFirstWeekday = (day: number): number => (epochDayToUtc(day).getUTCDay() + 6) % 7;

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type PunchCard = {
	/** 7 rows (Mon–Sun) x 24 hours of commit counts. */
	grid: number[][];
	max: number;
	peak?: { weekday: number; hour: number; commits: number };
};

export const buildPunchCard = (commits: RepoCommitTuple[]): PunchCard => {
	const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
	let max = 0;
	let peak: PunchCard['peak'];

	for (const [epochDay, hour] of commits) {
		const row = mondayFirstWeekday(epochDay);
		const value = ++grid[row][hour];
		if (value > max) {
			max = value;
			peak = { weekday: row, hour, commits: value };
		}
	}

	return { grid, max, peak };
};

export type SizeBucket = { label: string; note: string; max: number };

export const SIZE_BUCKETS: SizeBucket[] = [
	{ label: 'XS', note: '< 10', max: 10 },
	{ label: 'S', note: '10–49', max: 50 },
	{ label: 'M', note: '50–199', max: 200 },
	{ label: 'L', note: '200–999', max: 1000 },
	{ label: 'XL', note: '1000+', max: Number.POSITIVE_INFINITY },
];

export type SizeHistogram = {
	counts: number[];
	max: number;
	median: number;
	p90: number;
};

export const buildSizeHistogram = (commits: RepoCommitTuple[]): SizeHistogram => {
	const counts = SIZE_BUCKETS.map(() => 0);
	const sizes: number[] = [];

	for (const [, , added, deleted] of commits) {
		const total = added + deleted;
		sizes.push(total);
		const bucket = SIZE_BUCKETS.findIndex(b => total < b.max);
		counts[bucket >= 0 ? bucket : SIZE_BUCKETS.length - 1] += 1;
	}

	sizes.sort((a, b) => a - b);
	const percentile = (p: number): number => {
		if (sizes.length === 0) {
			return 0;
		}
		return sizes[Math.min(sizes.length - 1, Math.floor(sizes.length * p))];
	};

	return {
		counts,
		max: counts.reduce((acc, value) => Math.max(acc, value), 0),
		median: percentile(0.5),
		p90: percentile(0.9),
	};
};

export type Cadence = {
	activeDays: number;
	longestStreak: number;
	currentStreak: number;
	avgGapDays: number;
};

export const buildCadence = (commits: RepoCommitTuple[]): Cadence => {
	const days = Array.from(new Set(commits.map(c => c[0]))).sort((a, b) => a - b);
	if (days.length === 0) {
		return { activeDays: 0, longestStreak: 0, currentStreak: 0, avgGapDays: 0 };
	}

	let longestStreak = 0;
	let run = 0;
	for (let i = 0; i < days.length; i++) {
		run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
		longestStreak = Math.max(longestStreak, run);
	}

	// Count back from the most recent active day.
	let currentStreak = 0;
	for (let i = days.length - 1; i >= 0; i--) {
		if (i === days.length - 1 || days[i] === days[i + 1] - 1) {
			currentStreak += 1;
		} else {
			break;
		}
	}

	const span = days[days.length - 1] - days[0] + 1;
	return {
		activeDays: days.length,
		longestStreak,
		currentStreak,
		avgGapDays: days.length > 1 ? (span - 1) / (days.length - 1) : 0,
	};
};

/**
 * Share of total churn held by the top N contributors, plus the bus factor:
 * how few people it takes to account for more than half the churn.
 */
export type Concentration = {
	busFactor: number;
	topShare: number;
	shares: number[];
};

export const buildConcentration = (
	authors: Array<{ added: number; deleted: number }>
): Concentration => {
	const totals = authors
		.map(a => a.added + a.deleted)
		.filter(value => value > 0)
		.sort((a, b) => b - a);
	const sum = totals.reduce((acc, value) => acc + value, 0);

	if (sum === 0) {
		return { busFactor: 0, topShare: 0, shares: [] };
	}

	const shares = totals.map(value => (value / sum) * 100);
	let running = 0;
	let busFactor = totals.length;
	for (let i = 0; i < shares.length; i++) {
		running += shares[i];
		if (running > 50) {
			busFactor = i + 1;
			break;
		}
	}

	return { busFactor, topShare: shares[0] ?? 0, shares };
};
