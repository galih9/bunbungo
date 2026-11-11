import type { KanaScript } from "../kanaData";
import { updateCharacterMastery } from "./masteryAnalytics";
import { HIGHSCORES_STORAGE_KEY, saveMasteryMap } from "./persistence";
import { evaluateSessionProgression, formatDateKey } from "./progressionEngine";
import {
	type CharacterMastery,
	DEFAULT_USER_PROGRESSION,
	type HighScoreRecord,
	type UserProgression,
} from "./storageTypes";

interface SampleProfileEntry {
	readonly attempts: number;
	readonly confusedRomaji?: string;
	readonly correct: number;
	readonly kanaId: string;
	readonly responseMilliseconds: number;
	readonly script: KanaScript;
}

const SAMPLE_PROFILES: ReadonlyArray<SampleProfileEntry> = [
	{
		attempts: 8,
		correct: 8,
		kanaId: "a",
		responseMilliseconds: 920,
		script: "hiragana",
	},
	{
		attempts: 7,
		correct: 7,
		kanaId: "i",
		responseMilliseconds: 980,
		script: "hiragana",
	},
	{
		attempts: 6,
		correct: 6,
		kanaId: "u",
		responseMilliseconds: 1120,
		script: "katakana",
	},
	{
		attempts: 6,
		correct: 6,
		kanaId: "e",
		responseMilliseconds: 1250,
		script: "hiragana",
	},
	{
		attempts: 7,
		correct: 6,
		kanaId: "o",
		responseMilliseconds: 1340,
		script: "katakana",
	},
	{
		attempts: 6,
		correct: 6,
		kanaId: "ka",
		responseMilliseconds: 1080,
		script: "hiragana",
	},
	{
		attempts: 5,
		correct: 5,
		kanaId: "ki",
		responseMilliseconds: 1420,
		script: "hiragana",
	},
	{
		attempts: 5,
		correct: 4,
		kanaId: "ku",
		responseMilliseconds: 1650,
		script: "katakana",
	},
	{
		attempts: 5,
		correct: 5,
		kanaId: "ke",
		responseMilliseconds: 1390,
		script: "hiragana",
	},
	{
		attempts: 6,
		correct: 6,
		kanaId: "ko",
		responseMilliseconds: 1150,
		script: "katakana",
	},
	{
		attempts: 6,
		confusedRomaji: "chi",
		correct: 3,
		kanaId: "shi",
		responseMilliseconds: 2850,
		script: "katakana",
	},
	{
		attempts: 5,
		confusedRomaji: "shi",
		correct: 2,
		kanaId: "tsu",
		responseMilliseconds: 3120,
		script: "katakana",
	},
	{
		attempts: 5,
		confusedRomaji: "wa",
		correct: 3,
		kanaId: "re",
		responseMilliseconds: 2680,
		script: "hiragana",
	},
	{
		attempts: 4,
		confusedRomaji: "ru",
		correct: 2,
		kanaId: "ro",
		responseMilliseconds: 2490,
		script: "hiragana",
	},
	{
		attempts: 4,
		correct: 3,
		kanaId: "sa",
		responseMilliseconds: 1790,
		script: "hiragana",
	},
	{
		attempts: 4,
		correct: 4,
		kanaId: "su",
		responseMilliseconds: 1520,
		script: "hiragana",
	},
	{
		attempts: 4,
		correct: 3,
		kanaId: "se",
		responseMilliseconds: 1940,
		script: "katakana",
	},
	{
		attempts: 5,
		confusedRomaji: "n",
		correct: 3,
		kanaId: "so",
		responseMilliseconds: 2560,
		script: "katakana",
	},
	{
		attempts: 4,
		correct: 4,
		kanaId: "ta",
		responseMilliseconds: 1410,
		script: "hiragana",
	},
	{
		attempts: 4,
		correct: 4,
		kanaId: "to",
		responseMilliseconds: 1320,
		script: "hiragana",
	},
	{
		attempts: 3,
		correct: 3,
		kanaId: "ga",
		responseMilliseconds: 1620,
		script: "hiragana",
	},
	{
		attempts: 3,
		correct: 2,
		kanaId: "gi",
		responseMilliseconds: 2150,
		script: "hiragana",
	},
	{
		attempts: 3,
		correct: 3,
		kanaId: "kya",
		responseMilliseconds: 1740,
		script: "hiragana",
	},
	{
		attempts: 3,
		correct: 2,
		kanaId: "sha",
		responseMilliseconds: 2280,
		script: "katakana",
	},
];

export const seedSampleDashboardData = (): {
	readonly highScores: Array<HighScoreRecord>;
	readonly masteryMap: Record<string, CharacterMastery>;
	readonly progression: UserProgression;
} => {
	let masteryMap: Record<string, CharacterMastery> = {};

	for (const profile of SAMPLE_PROFILES) {
		const wrongCount = Math.max(0, profile.attempts - profile.correct);
		for (let wrongIndex = 0; wrongIndex < wrongCount; wrongIndex += 1) {
			masteryMap = updateCharacterMastery(masteryMap, {
				chosenRomaji: profile.confusedRomaji ?? "ne",
				isCorrect: false,
				kanaId: profile.kanaId,
				responseTimeMilliseconds: profile.responseMilliseconds + 450,
				script: profile.script,
			});
		}
		for (
			let correctIndex = 0;
			correctIndex < profile.correct;
			correctIndex += 1
		) {
			masteryMap = updateCharacterMastery(masteryMap, {
				chosenRomaji: profile.kanaId,
				isCorrect: true,
				kanaId: profile.kanaId,
				responseTimeMilliseconds: profile.responseMilliseconds,
				script: profile.script,
			});
		}
	}

	const nowTimestamp = Date.now();
	const dayMilliseconds = 86_400_000;
	const sampleHighScores: Array<HighScoreRecord> = [
		{
			accuracy: 75,
			cardsCleared: 15,
			dateIso: new Date(nowTimestamp - 5 * dayMilliseconds).toISOString(),
			durationSeconds: 52,
			gameMode: "sprint",
			id: "sample-run-1",
			score: 1850,
			scriptMode: "hiragana",
		},
		{
			accuracy: 82,
			cardsCleared: 18,
			dateIso: new Date(nowTimestamp - 4 * dayMilliseconds).toISOString(),
			durationSeconds: 48,
			gameMode: "sprint",
			id: "sample-run-2",
			score: 2420,
			scriptMode: "hiragana",
		},
		{
			accuracy: 79,
			cardsCleared: 22,
			dateIso: new Date(nowTimestamp - 3 * dayMilliseconds).toISOString(),
			durationSeconds: 60,
			gameMode: "time-attack",
			id: "sample-run-3",
			score: 2890,
			scriptMode: "katakana",
		},
		{
			accuracy: 88,
			cardsCleared: 19,
			dateIso: new Date(nowTimestamp - 2 * dayMilliseconds).toISOString(),
			durationSeconds: 41,
			gameMode: "sprint",
			id: "sample-run-4",
			score: 3340,
			scriptMode: "mixed",
		},
		{
			accuracy: 92,
			cardsCleared: 28,
			dateIso: new Date(nowTimestamp - 1 * dayMilliseconds).toISOString(),
			durationSeconds: 60,
			gameMode: "time-attack",
			id: "sample-run-5",
			score: 4120,
			scriptMode: "mixed",
		},
		{
			accuracy: 95,
			cardsCleared: 20,
			dateIso: new Date(nowTimestamp).toISOString(),
			durationSeconds: 34,
			gameMode: "sprint",
			id: "sample-run-6",
			score: 4580,
			scriptMode: "hiragana",
		},
	];

	const baseProgression: UserProgression = {
		...DEFAULT_USER_PROGRESSION,
		bestAnswerStreak: 18,
		bestDailyStreak: 4,
		currentDailyStreak: 4,
		lastPracticeDate: formatDateKey(new Date(nowTimestamp)),
		level: 4,
		totalCardsAnswered: 122,
		totalCorrectAnswers: 103,
		totalSessionsCompleted: 6,
		unlockedRowIds: ["row-a", "row-ka", "row-sa", "row-ta", "row-na", "row-ha"],
		xp: 1280,
	};

	const evaluated = evaluateSessionProgression({
		currentProgression: baseProgression,
		durationSeconds: 34,
		masteryMap,
		sessionAttempts: 20,
		sessionBestStreak: 18,
		sessionCorrect: 19,
		sessionScore: 4580,
	});

	saveMasteryMap(masteryMap);
	if (typeof window !== "undefined") {
		try {
			window.localStorage.setItem(
				HIGHSCORES_STORAGE_KEY,
				JSON.stringify(sampleHighScores)
			);
		} catch {
			// Ignore quota errors
		}
	}

	return {
		highScores: sampleHighScores,
		masteryMap,
		progression: evaluated.updatedProgression,
	};
};
