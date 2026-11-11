import { KANA_ITEMS, KANA_ITEMS_BY_ROW, type KanaItem } from "../kanaData";
import type {
	CharacterAttemptPayload,
	CharacterMastery,
	KanaPerformanceAnalysis,
	LetterPerformanceTier,
	RowMasterySummary,
} from "./storageTypes";

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
	const scoreByItemId = new Map<string, number>();

	let totalAttempts = 0;
	let totalCorrect = 0;
	let totalResponseTime = 0;
	let responseTimeAttempts = 0;
	let redeemedCount = 0;
	let fastStrongCount = 0;

	for (const item of KANA_ITEMS) {
		const stats = masteryMap[item.id];
		const tier = getCharacterPerformanceTier(stats);
		scoreByItemId.set(item.id, getCharacterProficiencyScore(stats));

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
			const averageMilliseconds =
				getCharacterAverageResponseMilliseconds(stats);
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
		const firstScore = scoreByItemId.get(first.id) ?? 0;
		const secondScore = scoreByItemId.get(second.id) ?? 0;
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
		const firstScore = scoreByItemId.get(first.id) ?? 0;
		const secondScore = scoreByItemId.get(second.id) ?? 0;
		if (secondScore !== firstScore) {
			return secondScore - firstScore;
		}
		return (
			(masteryMap[second.id]?.attempts ?? 0) -
			(masteryMap[first.id]?.attempts ?? 0)
		);
	});

	learningItems.sort((first, second) => {
		const firstScore = scoreByItemId.get(first.id) ?? 0;
		const secondScore = scoreByItemId.get(second.id) ?? 0;
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
	const rowItems = KANA_ITEMS_BY_ROW.get(rowId) ?? [];
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
		Math.min(100, coverageRatio * 40 + accuracyRatio * 40 + strongRatio * 20)
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
		Math.min(30_000, Math.round(payload.responseTimeMilliseconds))
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
		(nextAccuracyRatio < 0.7 ||
			(nextAttempts >= 2 && nextAccuracyRatio < 0.85));

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
