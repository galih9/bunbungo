import type { RefObject } from "react";
import { flushSync } from "react-dom";
import type { RowPresetType } from "./components/LobbyDeckCustomizer";
import type { FeedbackState } from "./components/PlayingStage";
import type {
	AchievementStatus,
	CharacterMastery,
	FlashcardChallenge,
	HighScoreRecord,
	KanaPerformanceAnalysis,
	PracticeFocusMode,
	SessionProgressionResult,
	StoredGameSettings,
	UserProgression,
} from "./gameStorage";
import type { CodexModalTab } from "./KanaChartModal";
import { KANA_ROW_GROUPS, type KanaItem } from "./kanaData";

export type ScreenPhase = "lobby" | "playing" | "summary";

type ViewTransitionDocument = Document & {
	startViewTransition?: (updateCallback: () => void) => {
		finished: Promise<void>;
	};
};

export interface KanaArenaController {
	readonly achievementStatuses: Array<AchievementStatus>;
	readonly activePool: Array<KanaItem>;
	readonly attemptCount: number;
	readonly bestStreak: number;
	readonly codexInitialTab: CodexModalTab;
	readonly correctCount: number;
	readonly currentCard: FlashcardChallenge | undefined;
	readonly currentIndex: number;
	readonly deck: Array<FlashcardChallenge>;
	readonly elapsedSeconds: number;
	readonly feedback: FeedbackState | null;
	readonly handleBackspaceTyped: () => void;
	readonly handleClearProgress: () => void;
	readonly handleCloseCodex: () => void;
	readonly handleCustomizeDeck: () => void;
	readonly handleEndRun: () => void;
	readonly handleOpenAchievements: () => void;
	readonly handleOpenChart: () => void;
	readonly handleOpenStats: () => void;
	readonly handleToggleHint: () => void;
	readonly handleTogglePracticeFocusMode: () => void;
	readonly handleToggleSound: () => void;
	readonly handleToggleTouchKeyboard: () => void;
	readonly handleToggleVoice: () => void;
	readonly handleTypedInputChange: (nextText: string) => void;
	readonly handleUpdateSettings: (patch: Partial<StoredGameSettings>) => void;
	readonly highScores: Array<HighScoreRecord>;
	readonly isCodexOpen: boolean;
	readonly lastSessionResult: SessionProgressionResult | null;
	readonly lobbyHeadingRef: RefObject<HTMLHeadingElement | null>;
	readonly masteryMap: Record<string, CharacterMastery>;
	readonly missedItems: Array<KanaItem>;
	readonly performanceAnalysis: KanaPerformanceAnalysis;
	readonly phase: ScreenPhase;
	readonly playingStageRef: RefObject<HTMLDivElement | null>;
	readonly practiceFocusMode: PracticeFocusMode;
	readonly progression: UserProgression;
	readonly remainingSeconds: number;
	readonly score: number;
	readonly selectPresetRows: (preset: RowPresetType) => void;
	readonly sessionAccuracy: number;
	readonly setCodexInitialTab: (tab: CodexModalTab) => void;
	readonly settings: StoredGameSettings;
	readonly showHint: boolean;
	readonly skipWrongFeedbackWait: () => void;
	readonly startCustomItemsSession: (targetItems: Array<KanaItem>) => void;
	readonly startSession: () => void;
	readonly startWeakLettersSession: () => void;
	readonly streak: number;
	readonly submitAnswer: (submittedRomaji: string) => void;
	readonly summaryHeadingRef: RefObject<HTMLHeadingElement | null>;
	readonly toggleRowSelection: (rowId: string) => void;
	readonly toggleUnlockAllRows: () => void;
	readonly typedValue: string;
	readonly typingInputRef: RefObject<HTMLInputElement | null>;
	readonly unlockedAchievementCount: number;
}

export const runPhaseViewTransition = (
	applyStateUpdates: () => void,
	onAfterTransition: () => void
): void => {
	const transitionDocument = document as ViewTransitionDocument;
	if (typeof transitionDocument.startViewTransition !== "function") {
		applyStateUpdates();
		window.requestAnimationFrame(() => {
			onAfterTransition();
		});
		return;
	}
	const transition = transitionDocument.startViewTransition(() => {
		flushSync(() => {
			applyStateUpdates();
		});
	});
	void transition.finished.finally(() => {
		onAfterTransition();
	});
};

export const evaluateCorrectAnswerOutcome = (parameters: {
	readonly bestStreak: number;
	readonly chosenRomaji: string;
	readonly currentCard: FlashcardChallenge;
	readonly currentStreak: number;
	readonly responseTimeMilliseconds: number;
	readonly score: number;
	readonly showHint: boolean;
}): {
	readonly feedback: FeedbackState;
	readonly nextBestStreak: number;
	readonly nextScore: number;
	readonly nextStreak: number;
} => {
	const nextStreak = parameters.currentStreak + 1;
	const nextBestStreak = Math.max(parameters.bestStreak, nextStreak);
	const comboMultiplier = Math.min(4, 1 + Math.floor(nextStreak / 5));
	const speedTier: "instant" | "fast" | "steady" =
		parameters.responseTimeMilliseconds <= 1200
			? "instant"
			: parameters.responseTimeMilliseconds <= 2000
				? "fast"
				: "steady";
	const speedBonus =
		speedTier === "instant" ? 50 : speedTier === "fast" ? 25 : 0;
	const redemptionBonus = parameters.currentCard.isRedemption === true ? 50 : 0;
	const pointsEarned =
		100 * comboMultiplier +
		(parameters.showHint ? 0 : 25) +
		speedBonus +
		redemptionBonus;
	const nextScore = parameters.score + pointsEarned;

	return {
		feedback: {
			chosenRomaji: parameters.chosenRomaji,
			expectedRomaji: parameters.currentCard.item.romaji,
			isRedemptionCleared: parameters.currentCard.isRedemption === true,
			pointsEarned,
			responseTimeMilliseconds: parameters.responseTimeMilliseconds,
			speedTier,
			status: "correct",
		},
		nextBestStreak,
		nextScore,
		nextStreak,
	};
};

export const getCandidateRowIdsForPreset = (
	preset: RowPresetType
): Array<string> => {
	if (preset === "starter") {
		return ["row-a", "row-ka", "row-sa"];
	}
	if (preset === "basic") {
		return KANA_ROW_GROUPS.filter(
			(group) => group.category === "monograph"
		).map((group) => group.id);
	}
	if (preset === "dakuten") {
		return KANA_ROW_GROUPS.filter(
			(group) => group.category === "diacritic"
		).map((group) => group.id);
	}
	if (preset === "digraph") {
		return KANA_ROW_GROUPS.filter((group) => group.category === "digraph").map(
			(group) => group.id
		);
	}
	return KANA_ROW_GROUPS.map((group) => group.id);
};

export const shouldAutoSubmitTypedRomaji = (
	cleaned: string,
	acceptedRomaji: ReadonlyArray<string>
): boolean => {
	if (acceptedRomaji.includes(cleaned)) {
		return true;
	}
	const isPrefixOfValid = acceptedRomaji.some((valid) =>
		valid.startsWith(cleaned)
	);
	const maxValidLength = Math.max(
		...acceptedRomaji.map((valid) => valid.length)
	);
	return cleaned.length >= maxValidLength && !isPrefixOfValid;
};
