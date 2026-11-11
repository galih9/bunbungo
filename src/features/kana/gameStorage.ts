import {
	DEFAULT_SELECTED_ROWS,
	KANA_ITEMS,
	KANA_ROW_GROUPS,
	type KanaItem,
	type KanaRowGroup,
	type KanaScript,
} from "./kanaData";

export type ScriptSelection = "hiragana" | "katakana" | "mixed";
export type GameMode = "sprint" | "time-attack" | "zen";
export type InputMode = "choice" | "typing";
export type PracticeFocusMode = "standard" | "weak-letters";
export type LetterPerformanceTier = "unseen" | "weak" | "learning" | "strong";
export type AchievementCategory = "streak" | "unlock" | "performance";

export interface CharacterMastery {
	readonly attempts: number;
	readonly correct: number;
	readonly streak: number;
	readonly wrong?: number;
	readonly bestStreak?: number;
	readonly totalResponseTimeMilliseconds?: number;
	readonly fastestResponseTimeMilliseconds?: number | null;
	readonly lastPracticedIso?: string | null;
	readonly hiraganaAttempts?: number;
	readonly hiraganaCorrect?: number;
	readonly katakanaAttempts?: number;
	readonly katakanaCorrect?: number;
	readonly confusedWith?: Record<string, number>;
	readonly wasWeak?: boolean;
}

export interface CharacterAttemptPayload {
	readonly kanaId: string;
	readonly script: KanaScript;
	readonly isCorrect: boolean;
	readonly chosenRomaji: string;
	readonly responseTimeMilliseconds: number;
	readonly timestampIso?: string;
}

export interface HighScoreRecord {
	readonly id: string;
	readonly gameMode: GameMode;
	readonly scriptMode: ScriptSelection;
	readonly score: number;
	readonly accuracy: number;
	readonly cardsCleared: number;
	readonly durationSeconds: number;
	readonly dateIso: string;
}

export interface StoredGameSettings {
	readonly scriptMode: ScriptSelection;
	readonly gameMode: GameMode;
	readonly inputMode: InputMode;
	readonly selectedRows: Array<string>;
	readonly soundEnabled: boolean;
	readonly voiceEnabled: boolean;
	readonly showTouchKeyboard: boolean;
	readonly sprintDeckSize: number;
}

export interface FlashcardChallenge {
	readonly cardId: string;
	readonly item: KanaItem;
	readonly script: KanaScript;
	readonly displayCharacter: string;
	readonly options: Array<string>;
}

export interface UserProgression {
	readonly xp: number;
	readonly level: number;
	readonly currentDailyStreak: number;
	readonly bestDailyStreak: number;
	readonly lastPracticeDate: string | null;
	readonly bestAnswerStreak: number;
	readonly totalSessionsCompleted: number;
	readonly totalCardsAnswered: number;
	readonly totalCorrectAnswers: number;
	readonly unlockedRowIds: Array<string>;
	readonly unlockAllRows: boolean;
	readonly unlockedAchievements: Record<string, string>;
}

export interface AchievementDefinition {
	readonly id: string;
	readonly title: string;
	readonly description: string;
	readonly category: AchievementCategory;
	readonly badgeSymbol: string;
	readonly targetValue: number;
	readonly xpReward: number;
}

export interface AchievementStatus extends AchievementDefinition {
	readonly currentValue: number;
	readonly progressPercent: number;
	readonly isUnlocked: boolean;
	readonly unlockedAtIso: string | null;
}

export interface RowMasterySummary {
	readonly rowId: string;
	readonly attemptedCount: number;
	readonly strongCount: number;
	readonly weakCount: number;
	readonly totalCount: number;
	readonly totalCorrectInRow: number;
	readonly accuracyPercent: number | null;
	readonly masteryPercent: number;
	readonly isMastered: boolean;
}

export interface KanaPerformanceAnalysis {
	readonly weakItems: Array<KanaItem>;
	readonly strongItems: Array<KanaItem>;
	readonly learningItems: Array<KanaItem>;
	readonly unseenItems: Array<KanaItem>;
	readonly overallAccuracy: number | null;
	readonly averageResponseMilliseconds: number | null;
	readonly totalAttempts: number;
	readonly totalCorrect: number;
	readonly redeemedCount: number;
	readonly fastStrongCount: number;
}

export interface SessionProgressionInput {
	readonly sessionScore: number;
	readonly sessionCorrect: number;
	readonly sessionAttempts: number;
	readonly sessionBestStreak: number;
	readonly durationSeconds: number;
	readonly masteryMap: Record<string, CharacterMastery>;
	readonly currentProgression: UserProgression;
	readonly nowDate?: Date;
}

export interface SessionProgressionResult {
	readonly updatedProgression: UserProgression;
	readonly xpEarned: number;
	readonly previousLevel: number;
	readonly newLevel: number;
	readonly newlyUnlockedRows: Array<KanaRowGroup>;
	readonly newlyUnlockedAchievements: Array<AchievementDefinition>;
}

const SETTINGS_STORAGE_KEY = "gokana_offline_settings_v1";
const MASTERY_STORAGE_KEY = "gokana_offline_mastery_v1";
const HIGHSCORES_STORAGE_KEY = "gokana_offline_highscores_v1";
const PROGRESSION_STORAGE_KEY = "gokana_offline_progression_v1";

export const DEFAULT_GAME_SETTINGS: StoredGameSettings = {
	scriptMode: "hiragana",
	gameMode: "sprint",
	inputMode: "choice",
	selectedRows: DEFAULT_SELECTED_ROWS,
	soundEnabled: true,
	voiceEnabled: true,
	showTouchKeyboard: true,
	sprintDeckSize: 20,
};

export const DEFAULT_USER_PROGRESSION: UserProgression = {
	xp: 0,
	level: 1,
	currentDailyStreak: 0,
	bestDailyStreak: 0,
	lastPracticeDate: null,
	bestAnswerStreak: 0,
	totalSessionsCompleted: 0,
	totalCardsAnswered: 0,
	totalCorrectAnswers: 0,
	unlockedRowIds: [...DEFAULT_SELECTED_ROWS],
	unlockAllRows: false,
	unlockedAchievements: {},
};

export const ACHIEVEMENT_DEFINITIONS: Array<AchievementDefinition> = [
	// Streak Achievements
	{
		id: "streak-5",
		title: "Spark of Focus",
		description: "Reach a 5x answer streak in any practice session.",
		category: "streak",
		badgeSymbol: "5x",
		targetValue: 5,
		xpReward: 50,
	},
	{
		id: "streak-15",
		title: "Flow State",
		description: "Reach a 15x answer streak in a single session.",
		category: "streak",
		badgeSymbol: "15x",
		targetValue: 15,
		xpReward: 120,
	},
	{
		id: "streak-30",
		title: "Kana Lightning",
		description: "Maintain an unstoppable 30x answer streak.",
		category: "streak",
		badgeSymbol: "30x",
		targetValue: 30,
		xpReward: 250,
	},
	{
		id: "daily-3",
		title: "Consistent Routine",
		description: "Practice Kana on 3 consecutive days.",
		category: "streak",
		badgeSymbol: "3d",
		targetValue: 3,
		xpReward: 150,
	},
	// Letter Unlocking Achievements
	{
		id: "unlock-row-4",
		title: "Expanding Horizons",
		description: "Unlock your 4th Kana row by mastering starter rows.",
		category: "unlock",
		badgeSymbol: "タ",
		targetValue: 4,
		xpReward: 80,
	},
	{
		id: "unlock-monographs",
		title: "Gojūon Explorer",
		description: "Unlock all 10 basic Monograph rows (46 Kana).",
		category: "unlock",
		badgeSymbol: "あ",
		targetValue: 10,
		xpReward: 200,
	},
	{
		id: "unlock-dakuten",
		title: "Voiced Harmony",
		description: "Unlock all 15 Monograph and Dakuten rows.",
		category: "unlock",
		badgeSymbol: "が",
		targetValue: 15,
		xpReward: 300,
	},
	{
		id: "unlock-all-rows",
		title: "Complete Syllabary",
		description: "Unlock all 20 Kana rows across all 104 characters.",
		category: "unlock",
		badgeSymbol: "全",
		targetValue: 20,
		xpReward: 500,
	},
	// Letter Performance & Mastery Achievements
	{
		id: "first-session",
		title: "First Steps",
		description: "Complete your first Kana study session.",
		category: "performance",
		badgeSymbol: "初",
		targetValue: 1,
		xpReward: 40,
	},
	{
		id: "strong-5",
		title: "Rising Scholar",
		description: "Reach Strong performance (85%+ accuracy, 2+ streak) on 5 letters.",
		category: "performance",
		badgeSymbol: "5字",
		targetValue: 5,
		xpReward: 100,
	},
	{
		id: "strong-15",
		title: "Starter Mastery",
		description: "Reach Strong performance on 15 different Kana letters.",
		category: "performance",
		badgeSymbol: "15字",
		targetValue: 15,
		xpReward: 200,
	},
	{
		id: "strong-46",
		title: "Kana Sensei",
		description: "Reach Strong performance on 46 different Kana letters.",
		category: "performance",
		badgeSymbol: "師",
		targetValue: 46,
		xpReward: 450,
	},
	{
		id: "weakness-redeemed",
		title: "Redemption Arc",
		description:
			"Turn a previously Weak letter into a Strong performing letter.",
		category: "performance",
		badgeSymbol: "克",
		targetValue: 1,
		xpReward: 150,
	},
	{
		id: "speed-reflex",
		title: "Reflex Master",
		description:
			"Reach Strong status with under 1.8s average response time on 5 letters.",
		category: "performance",
		badgeSymbol: "速",
		targetValue: 5,
		xpReward: 200,
	},
];

export const calculateLevelFromXp = (xp: number): number => {
	return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1);
};

export const getXpThresholdForLevel = (level: number): number => {
	if (level <= 1) {
		return 0;
	}
	return Math.pow(level - 1, 2) * 120;
};

export const getRankTitleForLevel = (level: number): string => {
	if (level >= 15) {
		return "Kana Grandmaster";
	}
	if (level >= 10) {
		return "Kana Sensei";
	}
	if (level >= 7) {
		return "Script Scholar";
	}
	if (level >= 4) {
		return "Fluent Reader";
	}
	if (level >= 2) {
		return "Kana Apprentice";
	}
	return "Novice Learner";
};

export const getCharacterAccuracy = (
	stats: CharacterMastery | undefined
): number | null => {
	if (!stats || stats.attempts <= 0) {
		return null;
	}
	return Math.round((stats.correct / stats.attempts) * 100);
};

export const getCharacterAverageResponseMilliseconds = (
	stats: CharacterMastery | undefined
): number | null => {
	if (
		!stats ||
		stats.attempts <= 0 ||
		stats.totalResponseTimeMilliseconds === undefined ||
		stats.totalResponseTimeMilliseconds <= 0
	) {
		return null;
	}
	return Math.round(stats.totalResponseTimeMilliseconds / stats.attempts);
};

export const getCharacterPerformanceTier = (
	stats: CharacterMastery | undefined
): LetterPerformanceTier => {
	if (!stats || stats.attempts <= 0) {
		return "unseen";
	}
	const accuracyRatio = stats.correct / stats.attempts;
	const averageMilliseconds = getCharacterAverageResponseMilliseconds(stats);

	if (
		accuracyRatio < 0.7 ||
		(stats.attempts >= 2 && stats.streak === 0 && accuracyRatio < 0.85) ||
		(stats.attempts >= 2 &&
			averageMilliseconds !== null &&
			averageMilliseconds > 4500 &&
			accuracyRatio < 0.9)
	) {
		return "weak";
	}

	if (stats.attempts >= 2 && accuracyRatio >= 0.8 && stats.streak >= 2) {
		return "strong";
	}

	return "learning";
};

export const getCharacterProficiencyScore = (
	stats: CharacterMastery | undefined
): number => {
	if (!stats || stats.attempts <= 0) {
		return 0;
	}
	const accuracyScore = (stats.correct / stats.attempts) * 70;
	const streakBonus = Math.min(20, stats.streak * 5);
	const averageMilliseconds = getCharacterAverageResponseMilliseconds(stats);
	let speedBonus = 5;
	if (averageMilliseconds !== null) {
		if (averageMilliseconds <= 1500) {
			speedBonus = 10;
		} else if (averageMilliseconds <= 2800) {
			speedBonus = 7;
		} else if (averageMilliseconds > 4500) {
			speedBonus = 2;
		}
	}
	return Math.round(Math.min(100, accuracyScore + streakBonus + speedBonus));
};

export const getTopConfusedRomaji = (
	stats: CharacterMastery | undefined
): Array<{ readonly romaji: string; readonly count: number }> => {
	if (!stats?.confusedWith) {
		return [];
	}
	return Object.entries(stats.confusedWith)
		.filter(([, count]) => count > 0)
		.map(([romaji, count]) => ({ romaji, count }))
		.sort((first, second) => second.count - first.count)
		.slice(0, 3);
};

export const analyzeKanaPerformance = (
	masteryMap: Record<string, CharacterMastery>
): KanaPerformanceAnalysis => {
	const weakItems: Array<KanaItem> = [];
	const strongItems: Array<KanaItem> = [];
	const learningItems: Array<KanaItem> = [];
	const unseenItems: Array<KanaItem> = [];

	let totalAttempts = 0;
	let totalCorrect = 0;
	let totalResponseTime = 0;
	let responseTimeAttempts = 0;
	let redeemedCount = 0;
	let fastStrongCount = 0;

	for (const item of KANA_ITEMS) {
		const stats = masteryMap[item.id];
		const tier = getCharacterPerformanceTier(stats);
		if (tier === "unseen") {
			unseenItems.push(item);
		} else if (tier === "weak") {
			weakItems.push(item);
		} else if (tier === "strong") {
			strongItems.push(item);
		} else {
			learningItems.push(item);
		}

		if (stats && stats.attempts > 0) {
			totalAttempts += stats.attempts;
			totalCorrect += stats.correct;
			if (
				stats.totalResponseTimeMilliseconds !== undefined &&
				stats.totalResponseTimeMilliseconds > 0
			) {
				totalResponseTime += stats.totalResponseTimeMilliseconds;
				responseTimeAttempts += stats.attempts;
			}
			if (tier === "strong" && stats.wasWeak === true) {
				redeemedCount += 1;
			}
			const averageMilliseconds = getCharacterAverageResponseMilliseconds(stats);
			if (
				tier === "strong" &&
				averageMilliseconds !== null &&
				averageMilliseconds <= 1800
			) {
				fastStrongCount += 1;
			}
		}
	}

	weakItems.sort((first, second) => {
		const firstScore = getCharacterProficiencyScore(masteryMap[first.id]);
		const secondScore = getCharacterProficiencyScore(masteryMap[second.id]);
		if (firstScore !== secondScore) {
			return firstScore - secondScore;
		}
		const firstWrong =
			(masteryMap[first.id]?.attempts ?? 0) -
			(masteryMap[first.id]?.correct ?? 0);
		const secondWrong =
			(masteryMap[second.id]?.attempts ?? 0) -
			(masteryMap[second.id]?.correct ?? 0);
		return secondWrong - firstWrong;
	});

	strongItems.sort((first, second) => {
		const firstScore = getCharacterProficiencyScore(masteryMap[first.id]);
		const secondScore = getCharacterProficiencyScore(masteryMap[second.id]);
		if (secondScore !== firstScore) {
			return secondScore - firstScore;
		}
		return (
			(masteryMap[second.id]?.attempts ?? 0) -
			(masteryMap[first.id]?.attempts ?? 0)
		);
	});

	learningItems.sort((first, second) => {
		const firstScore = getCharacterProficiencyScore(masteryMap[first.id]);
		const secondScore = getCharacterProficiencyScore(masteryMap[second.id]);
		return firstScore - secondScore;
	});

	const overallAccuracy =
		totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;
	const averageResponseMilliseconds =
		responseTimeAttempts > 0
			? Math.round(totalResponseTime / responseTimeAttempts)
			: null;

	return {
		weakItems,
		strongItems,
		learningItems,
		unseenItems,
		overallAccuracy,
		averageResponseMilliseconds,
		totalAttempts,
		totalCorrect,
		redeemedCount,
		fastStrongCount,
	};
};

export const getRowMasterySummary = (
	rowId: string,
	masteryMap: Record<string, CharacterMastery>
): RowMasterySummary => {
	const rowItems = KANA_ITEMS.filter((item) => item.rowId === rowId);
	const totalCount = rowItems.length;
	let attemptedCount = 0;
	let strongCount = 0;
	let weakCount = 0;
	let rowAttempts = 0;
	let rowCorrect = 0;

	for (const item of rowItems) {
		const stats = masteryMap[item.id];
		const tier = getCharacterPerformanceTier(stats);
		if (stats && stats.attempts > 0) {
			attemptedCount += 1;
			rowAttempts += stats.attempts;
			rowCorrect += stats.correct;
		}
		if (tier === "strong") {
			strongCount += 1;
		} else if (tier === "weak") {
			weakCount += 1;
		}
	}

	const accuracyPercent =
		rowAttempts > 0 ? Math.round((rowCorrect / rowAttempts) * 100) : null;

	const coverageRatio = totalCount > 0 ? attemptedCount / totalCount : 0;
	const strongRatio = totalCount > 0 ? strongCount / totalCount : 0;
	const accuracyRatio = rowAttempts > 0 ? rowCorrect / rowAttempts : 0;

	const masteryPercent = Math.round(
		Math.min(
			100,
			coverageRatio * 40 + accuracyRatio * 40 + strongRatio * 20
		)
	);

	const isMastered =
		totalCount > 0 &&
		((attemptedCount >= Math.ceil(totalCount * 0.6) &&
			accuracyPercent !== null &&
			accuracyPercent >= 70) ||
			rowCorrect >= totalCount * 2);

	return {
		rowId,
		attemptedCount,
		strongCount,
		weakCount,
		totalCount,
		totalCorrectInRow: rowCorrect,
		accuracyPercent,
		masteryPercent,
		isMastered,
	};
};

export const updateCharacterMastery = (
	previousMap: Record<string, CharacterMastery>,
	payload: CharacterAttemptPayload
): Record<string, CharacterMastery> => {
	const existing = previousMap[payload.kanaId];
	const previousAttempts = existing?.attempts ?? 0;
	const previousCorrect = existing?.correct ?? 0;
	const previousWrong =
		existing?.wrong ?? Math.max(0, previousAttempts - previousCorrect);
	const previousStreak = existing?.streak ?? 0;
	const previousBestStreak = existing?.bestStreak ?? previousStreak;
	const previousTotalTime = existing?.totalResponseTimeMilliseconds ?? 0;
	const previousFastestTime = existing?.fastestResponseTimeMilliseconds ?? null;

	const clampedTime = Math.max(
		120,
		Math.min(30000, Math.round(payload.responseTimeMilliseconds))
	);

	const nextAttempts = previousAttempts + 1;
	const nextCorrect = previousCorrect + (payload.isCorrect ? 1 : 0);
	const nextWrong = previousWrong + (payload.isCorrect ? 0 : 1);
	const nextStreak = payload.isCorrect ? previousStreak + 1 : 0;
	const nextBestStreak = Math.max(previousBestStreak, nextStreak);
	const nextTotalTime = previousTotalTime + clampedTime;

	let nextFastestTime = previousFastestTime;
	if (payload.isCorrect) {
		nextFastestTime =
			previousFastestTime === null
				? clampedTime
				: Math.min(previousFastestTime, clampedTime);
	}

	const nextHiraganaAttempts =
		(existing?.hiraganaAttempts ?? 0) + (payload.script === "hiragana" ? 1 : 0);
	const nextHiraganaCorrect =
		(existing?.hiraganaCorrect ?? 0) +
		(payload.script === "hiragana" && payload.isCorrect ? 1 : 0);
	const nextKatakanaAttempts =
		(existing?.katakanaAttempts ?? 0) + (payload.script === "katakana" ? 1 : 0);
	const nextKatakanaCorrect =
		(existing?.katakanaCorrect ?? 0) +
		(payload.script === "katakana" && payload.isCorrect ? 1 : 0);

	const nextConfusedWith: Record<string, number> = {
		...(existing?.confusedWith ?? {}),
	};
	if (!payload.isCorrect && payload.chosenRomaji.trim().length > 0) {
		const normalizedKey = payload.chosenRomaji.trim().toLowerCase();
		nextConfusedWith[normalizedKey] =
			(nextConfusedWith[normalizedKey] ?? 0) + 1;
	}

	const nextAccuracyRatio = nextCorrect / nextAttempts;
	const becomesWeak =
		!payload.isCorrect &&
		(nextAccuracyRatio < 0.7 || (nextAttempts >= 2 && nextAccuracyRatio < 0.85));

	const updatedEntry: CharacterMastery = {
		attempts: nextAttempts,
		correct: nextCorrect,
		wrong: nextWrong,
		streak: nextStreak,
		bestStreak: nextBestStreak,
		totalResponseTimeMilliseconds: nextTotalTime,
		fastestResponseTimeMilliseconds: nextFastestTime,
		lastPracticedIso: payload.timestampIso ?? new Date().toISOString(),
		hiraganaAttempts: nextHiraganaAttempts,
		hiraganaCorrect: nextHiraganaCorrect,
		katakanaAttempts: nextKatakanaAttempts,
		katakanaCorrect: nextKatakanaCorrect,
		confusedWith: nextConfusedWith,
		wasWeak: existing?.wasWeak === true || becomesWeak,
	};

	return {
		...previousMap,
		[payload.kanaId]: updatedEntry,
	};
};

export const loadGameSettings = (): StoredGameSettings => {
	if (typeof window === "undefined") {
		return DEFAULT_GAME_SETTINGS;
	}
	try {
		const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!raw) {
			return DEFAULT_GAME_SETTINGS;
		}
		const parsed = JSON.parse(raw) as Partial<StoredGameSettings>;
		const validRows =
			Array.isArray(parsed.selectedRows) && parsed.selectedRows.length > 0
				? parsed.selectedRows
				: DEFAULT_SELECTED_ROWS;
		return {
			scriptMode: parsed.scriptMode ?? DEFAULT_GAME_SETTINGS.scriptMode,
			gameMode: parsed.gameMode ?? DEFAULT_GAME_SETTINGS.gameMode,
			inputMode: parsed.inputMode ?? DEFAULT_GAME_SETTINGS.inputMode,
			selectedRows: validRows,
			soundEnabled: parsed.soundEnabled ?? DEFAULT_GAME_SETTINGS.soundEnabled,
			voiceEnabled: parsed.voiceEnabled ?? DEFAULT_GAME_SETTINGS.voiceEnabled,
			showTouchKeyboard:
				parsed.showTouchKeyboard ?? DEFAULT_GAME_SETTINGS.showTouchKeyboard,
			sprintDeckSize:
				parsed.sprintDeckSize ?? DEFAULT_GAME_SETTINGS.sprintDeckSize,
		};
	} catch {
		return DEFAULT_GAME_SETTINGS;
	}
};

export const saveGameSettings = (settings: StoredGameSettings): void => {
	if (typeof window === "undefined") {
		return;
	}
	try {
		window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Ignore quota errors
	}
};

export const loadMasteryMap = (): Record<string, CharacterMastery> => {
	if (typeof window === "undefined") {
		return {};
	}
	try {
		const raw = window.localStorage.getItem(MASTERY_STORAGE_KEY);
		if (!raw) {
			return {};
		}
		return JSON.parse(raw) as Record<string, CharacterMastery>;
	} catch {
		return {};
	}
};

export const saveMasteryMap = (
	mastery: Record<string, CharacterMastery>
): void => {
	if (typeof window === "undefined") {
		return;
	}
	try {
		window.localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(mastery));
	} catch {
		// Ignore quota errors
	}
};

export const loadUserProgression = (): UserProgression => {
	if (typeof window === "undefined") {
		return DEFAULT_USER_PROGRESSION;
	}
	try {
		const raw = window.localStorage.getItem(PROGRESSION_STORAGE_KEY);
		if (!raw) {
			return DEFAULT_USER_PROGRESSION;
		}
		const parsed = JSON.parse(raw) as Partial<UserProgression>;
		const unlockedRowIds =
			Array.isArray(parsed.unlockedRowIds) && parsed.unlockedRowIds.length > 0
				? parsed.unlockedRowIds
				: [...DEFAULT_SELECTED_ROWS];
		const xp = typeof parsed.xp === "number" ? parsed.xp : 0;
		return {
			xp,
			level: calculateLevelFromXp(xp),
			currentDailyStreak: parsed.currentDailyStreak ?? 0,
			bestDailyStreak: parsed.bestDailyStreak ?? 0,
			lastPracticeDate: parsed.lastPracticeDate ?? null,
			bestAnswerStreak: parsed.bestAnswerStreak ?? 0,
			totalSessionsCompleted: parsed.totalSessionsCompleted ?? 0,
			totalCardsAnswered: parsed.totalCardsAnswered ?? 0,
			totalCorrectAnswers: parsed.totalCorrectAnswers ?? 0,
			unlockedRowIds,
			unlockAllRows: parsed.unlockAllRows ?? false,
			unlockedAchievements: parsed.unlockedAchievements ?? {},
		};
	} catch {
		return DEFAULT_USER_PROGRESSION;
	}
};

export const saveUserProgression = (progression: UserProgression): void => {
	if (typeof window === "undefined") {
		return;
	}
	try {
		window.localStorage.setItem(
			PROGRESSION_STORAGE_KEY,
			JSON.stringify(progression)
		);
	} catch {
		// Ignore quota errors
	}
};

const formatDateKey = (date: Date): string => {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const isYesterdayDateKey = (
	previousDateKey: string,
	currentDate: Date
): boolean => {
	const yesterday = new Date(currentDate);
	yesterday.setDate(yesterday.getDate() - 1);
	return formatDateKey(yesterday) === previousDateKey;
};

export const getAchievementProgressList = (
	progression: UserProgression,
	masteryMap: Record<string, CharacterMastery>
): Array<AchievementStatus> => {
	const analysis = analyzeKanaPerformance(masteryMap);
	const effectiveUnlockedCount = progression.unlockAllRows
		? KANA_ROW_GROUPS.length
		: progression.unlockedRowIds.length;

	return ACHIEVEMENT_DEFINITIONS.map((definition) => {
		let currentValue = 0;
		switch (definition.id) {
			case "streak-5":
			case "streak-15":
			case "streak-30": {
				currentValue = progression.bestAnswerStreak;
				break;
			}
			case "daily-3": {
				currentValue = progression.bestDailyStreak;
				break;
			}
			case "unlock-row-4":
			case "unlock-monographs":
			case "unlock-dakuten":
			case "unlock-all-rows": {
				currentValue = effectiveUnlockedCount;
				break;
			}
			case "first-session": {
				currentValue = progression.totalSessionsCompleted;
				break;
			}
			case "strong-5":
			case "strong-15":
			case "strong-46": {
				currentValue = analysis.strongItems.length;
				break;
			}
			case "weakness-redeemed": {
				currentValue = analysis.redeemedCount;
				break;
			}
			case "speed-reflex": {
				currentValue = analysis.fastStrongCount;
				break;
			}
			default: {
				currentValue = 0;
			}
		}

		const unlockedAtIso =
			progression.unlockedAchievements[definition.id] ?? null;
		const isUnlocked =
			unlockedAtIso !== null || currentValue >= definition.targetValue;
		const progressPercent = Math.min(
			100,
			Math.round((currentValue / definition.targetValue) * 100)
		);

		return {
			...definition,
			currentValue,
			progressPercent,
			isUnlocked,
			unlockedAtIso,
		};
	});
};

export const evaluateSessionProgression = (
	input: SessionProgressionInput
): SessionProgressionResult => {
	const now = input.nowDate ?? new Date();
	const todayKey = formatDateKey(now);
	const nowIso = now.toISOString();
	const previous = input.currentProgression;

	// 1. Update daily streak
	let nextDailyStreak = previous.currentDailyStreak;
	let nextLastPracticeDate = previous.lastPracticeDate;
	if (input.sessionAttempts > 0) {
		if (previous.lastPracticeDate === todayKey) {
			nextDailyStreak = Math.max(1, previous.currentDailyStreak);
		} else if (
			previous.lastPracticeDate !== null &&
			isYesterdayDateKey(previous.lastPracticeDate, now)
		) {
			nextDailyStreak = previous.currentDailyStreak + 1;
		} else {
			nextDailyStreak = 1;
		}
		nextLastPracticeDate = todayKey;
	}
	const nextBestDailyStreak = Math.max(
		previous.bestDailyStreak,
		nextDailyStreak
	);

	// 2. Calculate base XP from session
	const accuracyRatio =
		input.sessionAttempts > 0
			? input.sessionCorrect / input.sessionAttempts
			: 0;
	const baseSessionXp =
		input.sessionAttempts > 0
			? input.sessionCorrect * 12 +
				input.sessionBestStreak * 5 +
				(accuracyRatio >= 0.85 ? 45 : accuracyRatio >= 0.7 ? 20 : 10)
			: 0;

	const nextBestAnswerStreak = Math.max(
		previous.bestAnswerStreak,
		input.sessionBestStreak
	);
	const nextSessionsCompleted =
		previous.totalSessionsCompleted + (input.sessionAttempts > 0 ? 1 : 0);
	const nextTotalAnswered =
		previous.totalCardsAnswered + input.sessionAttempts;
	const nextTotalCorrect = previous.totalCorrectAnswers + input.sessionCorrect;

	// 3. Evaluate progressive row unlocks
	const unlockedSet = new Set<string>(previous.unlockedRowIds);
	const newlyUnlockedRows: Array<KanaRowGroup> = [];

	// Unlock subsequent rows when previous unlocked rows are mastered or level rises
	const tentativeLevel = calculateLevelFromXp(previous.xp + baseSessionXp);
	const guaranteedRowCount = Math.min(
		KANA_ROW_GROUPS.length,
		Math.max(DEFAULT_SELECTED_ROWS.length, 2 + tentativeLevel)
	);

	for (let index = 0; index < KANA_ROW_GROUPS.length; index += 1) {
		const rowGroup = KANA_ROW_GROUPS[index];
		if (!rowGroup || unlockedSet.has(rowGroup.id)) {
			continue;
		}

		const previousRow = index > 0 ? KANA_ROW_GROUPS[index - 1] : undefined;
		const previousRowMastered = previousRow
			? getRowMasterySummary(previousRow.id, input.masteryMap).isMastered
			: true;

		const allPriorUnlockedAndPracticed = KANA_ROW_GROUPS.slice(0, index).every(
			(prior) =>
				unlockedSet.has(prior.id) &&
				getRowMasterySummary(prior.id, input.masteryMap).isMastered
		);

		if (
			index < guaranteedRowCount ||
			(previousRow !== undefined &&
				unlockedSet.has(previousRow.id) &&
				previousRowMastered) ||
			allPriorUnlockedAndPracticed
		) {
			unlockedSet.add(rowGroup.id);
			newlyUnlockedRows.push(rowGroup);
		}
	}

	const nextUnlockedRowIds = KANA_ROW_GROUPS.filter((group) =>
		unlockedSet.has(group.id)
	).map((group) => group.id);

	// 4. Evaluate newly unlocked achievements
	const interimProgression: UserProgression = {
		xp: previous.xp + baseSessionXp,
		level: tentativeLevel,
		currentDailyStreak: nextDailyStreak,
		bestDailyStreak: nextBestDailyStreak,
		lastPracticeDate: nextLastPracticeDate,
		bestAnswerStreak: nextBestAnswerStreak,
		totalSessionsCompleted: nextSessionsCompleted,
		totalCardsAnswered: nextTotalAnswered,
		totalCorrectAnswers: nextTotalCorrect,
		unlockedRowIds: nextUnlockedRowIds,
		unlockAllRows: previous.unlockAllRows,
		unlockedAchievements: { ...previous.unlockedAchievements },
	};

	const statuses = getAchievementProgressList(
		interimProgression,
		input.masteryMap
	);
	const newlyUnlockedAchievements: Array<AchievementDefinition> = [];
	const nextUnlockedAchievements: Record<string, string> = {
		...previous.unlockedAchievements,
	};
	let achievementBonusXp = 0;

	for (const status of statuses) {
		if (
			status.currentValue >= status.targetValue &&
			nextUnlockedAchievements[status.id] === undefined
		) {
			nextUnlockedAchievements[status.id] = nowIso;
			newlyUnlockedAchievements.push(status);
			achievementBonusXp += status.xpReward;
		}
	}

	const totalXpEarned = baseSessionXp + achievementBonusXp;
	const finalXp = previous.xp + totalXpEarned;
	const finalLevel = calculateLevelFromXp(finalXp);

	const updatedProgression: UserProgression = {
		...interimProgression,
		xp: finalXp,
		level: finalLevel,
		unlockedAchievements: nextUnlockedAchievements,
	};

	saveUserProgression(updatedProgression);

	return {
		updatedProgression,
		xpEarned: totalXpEarned,
		previousLevel: previous.level,
		newLevel: finalLevel,
		newlyUnlockedRows,
		newlyUnlockedAchievements,
	};
};

export const loadHighScores = (): Array<HighScoreRecord> => {
	if (typeof window === "undefined") {
		return [];
	}
	try {
		const raw = window.localStorage.getItem(HIGHSCORES_STORAGE_KEY);
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw) as Array<HighScoreRecord>;
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

export const saveHighScore = (
	record: HighScoreRecord
): Array<HighScoreRecord> => {
	const existing = loadHighScores();
	const updated = [record, ...existing]
		.sort((first, second) => second.score - first.score)
		.slice(0, 15);
	if (typeof window !== "undefined") {
		try {
			window.localStorage.setItem(
				HIGHSCORES_STORAGE_KEY,
				JSON.stringify(updated)
			);
		} catch {
			// Ignore quota errors
		}
	}
	return updated;
};

export const clearAllProgress = (): void => {
	if (typeof window === "undefined") {
		return;
	}
	try {
		window.localStorage.removeItem(MASTERY_STORAGE_KEY);
		window.localStorage.removeItem(HIGHSCORES_STORAGE_KEY);
		window.localStorage.removeItem(PROGRESSION_STORAGE_KEY);
	} catch {
		// Ignore storage errors
	}
};

const shuffleArray = <T>(items: Array<T>): Array<T> => {
	const clone = [...items];
	for (let index = clone.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		const currentItem = clone[index];
		const swapItem = clone[swapIndex];
		if (currentItem !== undefined && swapItem !== undefined) {
			clone[index] = swapItem;
			clone[swapIndex] = currentItem;
		}
	}
	return clone;
};

export const buildOptionsForItem = (
	target: KanaItem,
	pool: Array<KanaItem>
): Array<string> => {
	const sameCategoryPool = pool.filter(
		(candidate) =>
			candidate.romaji !== target.romaji &&
			candidate.category === target.category
	);
	const fallbackPool = KANA_ITEMS.filter(
		(candidate) =>
			candidate.romaji !== target.romaji &&
			candidate.category === target.category
	);
	const sourcePool =
		sameCategoryPool.length >= 3 ? sameCategoryPool : fallbackPool;

	const distractorRomajiSet = new Set<string>();
	const shuffledDistractors = shuffleArray(sourcePool);
	for (const candidate of shuffledDistractors) {
		if (distractorRomajiSet.size >= 3) {
			break;
		}
		if (candidate.romaji !== target.romaji) {
			distractorRomajiSet.add(candidate.romaji);
		}
	}

	return shuffleArray([target.romaji, ...Array.from(distractorRomajiSet)]);
};

export const createFlashcardChallenge = (
	item: KanaItem,
	scriptMode: ScriptSelection,
	pool: Array<KanaItem>,
	sequenceNumber: number
): FlashcardChallenge => {
	const resolvedScript: KanaScript =
		scriptMode === "mixed"
			? Math.random() < 0.5
				? "hiragana"
				: "katakana"
			: scriptMode;

	const displayCharacter =
		resolvedScript === "hiragana" ? item.hiragana : item.katakana;

	return {
		cardId: `${item.id}-${resolvedScript}-${sequenceNumber}`,
		item,
		script: resolvedScript,
		displayCharacter,
		options: buildOptionsForItem(item, pool),
	};
};

export const generateCustomItemsDeck = (
	targetItems: Array<KanaItem>,
	scriptMode: ScriptSelection,
	count: number,
	masteryMap: Record<string, CharacterMastery>
): Array<FlashcardChallenge> => {
	const activePool =
		targetItems.length > 0
			? targetItems
			: KANA_ITEMS.filter((item) => DEFAULT_SELECTED_ROWS.includes(item.rowId));

	const weightedPool: Array<KanaItem> = [];
	for (const item of activePool) {
		const stats = masteryMap[item.id];
		const tier = getCharacterPerformanceTier(stats);
		let weight = 2;
		if (tier === "weak") {
			weight = 5;
		} else if (tier === "learning" || tier === "unseen") {
			weight = 3;
		} else {
			weight = 1;
		}
		for (let repeat = 0; repeat < weight; repeat += 1) {
			weightedPool.push(item);
		}
	}

	const deck: Array<FlashcardChallenge> = [];
	let previousId = "";
	const baseQueue = shuffleArray(activePool);

	for (let index = 0; index < count; index += 1) {
		let chosenItem: KanaItem | undefined;
		if (index < baseQueue.length) {
			chosenItem = baseQueue[index];
		} else {
			const candidates =
				activePool.length > 1
					? weightedPool.filter((candidate) => candidate.id !== previousId)
					: weightedPool;
			const source = candidates.length > 0 ? candidates : activePool;
			chosenItem = source[Math.floor(Math.random() * source.length)];
		}

		const resolvedItem = chosenItem ?? activePool[0] ?? KANA_ITEMS[0];
		if (resolvedItem) {
			previousId = resolvedItem.id;
			deck.push(
				createFlashcardChallenge(resolvedItem, scriptMode, KANA_ITEMS, index)
			);
		}
	}

	return deck;
};

export const generateWeakLettersDeck = (
	masteryMap: Record<string, CharacterMastery>,
	scriptMode: ScriptSelection,
	count: number,
	fallbackSelectedRows: Array<string>
): Array<FlashcardChallenge> => {
	const analysis = analyzeKanaPerformance(masteryMap);
	let targetItems = [...analysis.weakItems];

	if (targetItems.length < 4 && analysis.learningItems.length > 0) {
		for (const learningItem of analysis.learningItems) {
			if (!targetItems.some((existing) => existing.id === learningItem.id)) {
				targetItems.push(learningItem);
			}
			if (targetItems.length >= 8) {
				break;
			}
		}
	}

	if (targetItems.length === 0) {
		const fallbackPool = KANA_ITEMS.filter((item) =>
			fallbackSelectedRows.includes(item.rowId)
		);
		targetItems =
			fallbackPool.length > 0
				? fallbackPool
				: KANA_ITEMS.filter((item) =>
						DEFAULT_SELECTED_ROWS.includes(item.rowId)
					);
	}

	return generateCustomItemsDeck(targetItems, scriptMode, count, masteryMap);
};

export const generateChallengeDeck = (
	selectedRows: Array<string>,
	scriptMode: ScriptSelection,
	count: number,
	masteryMap: Record<string, CharacterMastery>
): Array<FlashcardChallenge> => {
	const filteredPool = KANA_ITEMS.filter((item) =>
		selectedRows.includes(item.rowId)
	);
	const activePool =
		filteredPool.length > 0
			? filteredPool
			: KANA_ITEMS.filter((item) => DEFAULT_SELECTED_ROWS.includes(item.rowId));

	return generateCustomItemsDeck(activePool, scriptMode, count, masteryMap);
};
