import {
	DEFAULT_SELECTED_ROWS,
	KANA_ROW_GROUPS,
	type KanaRowGroup,
} from "../kanaData";
import {
	analyzeKanaPerformance,
	getRowMasterySummary,
} from "./masteryAnalytics";
import { saveUserProgression } from "./persistence";
import {
	ACHIEVEMENT_DEFINITIONS,
	type AchievementDefinition,
	type AchievementStatus,
	type CharacterMastery,
	type SessionProgressionInput,
	type SessionProgressionResult,
	type UserProgression,
} from "./storageTypes";

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

export const formatDateKey = (date: Date): string => {
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
	const nextTotalAnswered = previous.totalCardsAnswered + input.sessionAttempts;
	const nextTotalCorrect = previous.totalCorrectAnswers + input.sessionCorrect;

	// 3. Evaluate progressive row unlocks with precomputed mastery set (O(R))
	const unlockedSet = new Set<string>(previous.unlockedRowIds);
	const newlyUnlockedRows: Array<KanaRowGroup> = [];
	const masteredRowSet = new Set<string>();

	for (const group of KANA_ROW_GROUPS) {
		if (getRowMasterySummary(group.id, input.masteryMap).isMastered) {
			masteredRowSet.add(group.id);
		}
	}

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
			? masteredRowSet.has(previousRow.id)
			: true;

		const allPriorUnlockedAndPracticed = KANA_ROW_GROUPS.slice(0, index).every(
			(prior) => unlockedSet.has(prior.id) && masteredRowSet.has(prior.id)
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
