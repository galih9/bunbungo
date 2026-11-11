import {
	DEFAULT_SELECTED_ROWS,
	type KanaCategory,
	type KanaItem,
	type KanaRowGroup,
	type KanaScript,
} from "../kanaData";

export type ScriptSelection = "hiragana" | "katakana" | "mixed";
export type GameMode = "sprint" | "time-attack" | "zen";
export type InputMode = "choice" | "typing";
export type PracticeFocusMode = "standard" | "weak-letters";
export type LetterPerformanceTier = "unseen" | "weak" | "learning" | "strong";
export type AchievementCategory = "streak" | "unlock" | "performance";
export type AppRoutePath = "/" | "/dashboard" | "/chart" | "/stats";

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
	readonly isRedemption?: boolean;
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

export interface ScriptPerformanceSummary {
	readonly script: KanaScript;
	readonly label: string;
	readonly attempts: number;
	readonly correct: number;
	readonly accuracyPercent: number | null;
	readonly practicedCharacterCount: number;
}

export interface CategoryPerformanceSummary {
	readonly category: KanaCategory;
	readonly label: string;
	readonly shortLabel: string;
	readonly totalCount: number;
	readonly practicedCount: number;
	readonly strongCount: number;
	readonly learningCount: number;
	readonly weakCount: number;
	readonly unseenCount: number;
	readonly attempts: number;
	readonly correct: number;
	readonly accuracyPercent: number | null;
	readonly masteryPercent: number;
	readonly averageResponseMilliseconds: number | null;
}

export interface SpeedBucketSummary {
	readonly id: "instant" | "fast" | "steady" | "slow";
	readonly label: string;
	readonly rangeLabel: string;
	readonly count: number;
	readonly sharePercent: number;
}

export interface ConfusionPairSummary {
	readonly item: KanaItem;
	readonly confusedRomaji: string;
	readonly count: number;
}

export interface SessionTrendPoint {
	readonly id: string;
	readonly sessionLabel: string;
	readonly dateLabel: string;
	readonly gameMode: GameMode;
	readonly scriptMode: ScriptSelection;
	readonly score: number;
	readonly accuracy: number;
	readonly cardsCleared: number;
	readonly durationSeconds: number;
	readonly cardsPerMinute: number;
}

export interface StudyRecommendation {
	readonly id: string;
	readonly title: string;
	readonly description: string;
	readonly priority: "high" | "medium" | "positive";
	readonly actionLabel: string;
	readonly actionType:
		| "weak-drill"
		| "katakana-focus"
		| "hiragana-focus"
		| "standard-practice";
}

export interface DashboardSummary {
	readonly analysis: KanaPerformanceAnalysis;
	readonly scriptSummaries: Array<ScriptPerformanceSummary>;
	readonly categorySummaries: Array<CategoryPerformanceSummary>;
	readonly rowSummaries: Array<
		RowMasterySummary & { readonly group: KanaRowGroup }
	>;
	readonly speedBuckets: Array<SpeedBucketSummary>;
	readonly topConfusions: Array<ConfusionPairSummary>;
	readonly sessionTrend: Array<SessionTrendPoint>;
	readonly recommendations: Array<StudyRecommendation>;
	readonly overallProficiencyScore: number;
	readonly coveragePercent: number;
	readonly masteryPercent: number;
}

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
		description:
			"Reach Strong performance (85%+ accuracy, 2+ streak) on 5 letters.",
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
