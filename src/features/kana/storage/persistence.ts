import { DEFAULT_SELECTED_ROWS } from "../kanaData";
import { calculateLevelFromXp } from "./progressionEngine";
import {
	type CharacterMastery,
	DEFAULT_GAME_SETTINGS,
	DEFAULT_USER_PROGRESSION,
	type HighScoreRecord,
	type StoredGameSettings,
	type UserProgression,
} from "./storageTypes";

const SETTINGS_STORAGE_KEY = "gokana_offline_settings_v1";
const MASTERY_STORAGE_KEY = "gokana_offline_mastery_v1";
export const HIGHSCORES_STORAGE_KEY = "gokana_offline_highscores_v1";
const PROGRESSION_STORAGE_KEY = "gokana_offline_progression_v1";

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
