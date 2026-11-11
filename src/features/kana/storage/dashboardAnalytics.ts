import {
	KANA_ITEMS,
	KANA_ITEMS_BY_CATEGORY,
	KANA_ROW_GROUPS,
	type KanaCategory,
} from "../kanaData";
import {
	analyzeKanaPerformance,
	getCharacterAverageResponseMilliseconds,
	getCharacterPerformanceTier,
	getCharacterProficiencyScore,
	getRowMasterySummary,
	getTopConfusedRomaji,
} from "./masteryAnalytics";
import type {
	CategoryPerformanceSummary,
	CharacterMastery,
	ConfusionPairSummary,
	DashboardSummary,
	HighScoreRecord,
	ScriptPerformanceSummary,
	SessionTrendPoint,
	SpeedBucketSummary,
	StudyRecommendation,
	UserProgression,
} from "./storageTypes";

export { seedSampleDashboardData } from "./sampleDashboardSeeder";

const CATEGORY_DEFINITIONS: Array<{
	readonly category: KanaCategory;
	readonly label: string;
	readonly shortLabel: string;
}> = [
	{
		category: "monograph",
		label: "Monographs (Gojūon)",
		shortLabel: "Monographs",
	},
	{
		category: "diacritic",
		label: "Diacritics (Dakuten)",
		shortLabel: "Diacritics",
	},
	{
		category: "digraph",
		label: "Digraphs (Yōon)",
		shortLabel: "Digraphs",
	},
];

export const buildDashboardSummary = (
	masteryMap: Record<string, CharacterMastery>,
	progression: UserProgression,
	highScores: Array<HighScoreRecord>
): DashboardSummary => {
	const analysis = analyzeKanaPerformance(masteryMap);
	const totalKanaCount = KANA_ITEMS.length;
	const practicedCharacterCount =
		analysis.strongItems.length +
		analysis.learningItems.length +
		analysis.weakItems.length;

	const coveragePercent =
		totalKanaCount > 0
			? Math.round((practicedCharacterCount / totalKanaCount) * 100)
			: 0;
	const masteryPercent =
		totalKanaCount > 0
			? Math.round((analysis.strongItems.length / totalKanaCount) * 100)
			: 0;

	let totalProficiencySum = 0;
	let hiraganaAttempts = 0;
	let hiraganaCorrect = 0;
	let hiraganaPracticedCount = 0;
	let katakanaAttempts = 0;
	let katakanaCorrect = 0;
	let katakanaPracticedCount = 0;

	let instantCount = 0;
	let fastCount = 0;
	let steadyCount = 0;
	let slowCount = 0;

	const confusionEntries: Array<ConfusionPairSummary> = [];

	for (const item of KANA_ITEMS) {
		const stats = masteryMap[item.id];
		totalProficiencySum += getCharacterProficiencyScore(stats);

		const itemHiraganaAttempts = stats?.hiraganaAttempts ?? 0;
		const itemHiraganaCorrect = stats?.hiraganaCorrect ?? 0;
		const itemKatakanaAttempts = stats?.katakanaAttempts ?? 0;
		const itemKatakanaCorrect = stats?.katakanaCorrect ?? 0;

		if (itemHiraganaAttempts > 0) {
			hiraganaAttempts += itemHiraganaAttempts;
			hiraganaCorrect += itemHiraganaCorrect;
			hiraganaPracticedCount += 1;
		}
		if (itemKatakanaAttempts > 0) {
			katakanaAttempts += itemKatakanaAttempts;
			katakanaCorrect += itemKatakanaCorrect;
			katakanaPracticedCount += 1;
		}

		const averageResponse = getCharacterAverageResponseMilliseconds(stats);
		if (averageResponse !== null) {
			if (averageResponse <= 1200) {
				instantCount += 1;
			} else if (averageResponse <= 1800) {
				fastCount += 1;
			} else if (averageResponse <= 3000) {
				steadyCount += 1;
			} else {
				slowCount += 1;
			}
		}

		const itemConfusions = getTopConfusedRomaji(stats);
		for (const confusion of itemConfusions) {
			confusionEntries.push({
				count: confusion.count,
				confusedRomaji: confusion.romaji,
				item,
			});
		}
	}

	confusionEntries.sort((first, second) => second.count - first.count);
	const topConfusions = confusionEntries.slice(0, 6);

	const overallProficiencyScore =
		practicedCharacterCount > 0
			? Math.round(totalProficiencySum / practicedCharacterCount)
			: 0;

	const scriptSummaries: Array<ScriptPerformanceSummary> = [
		{
			accuracyPercent:
				hiraganaAttempts > 0
					? Math.round((hiraganaCorrect / hiraganaAttempts) * 100)
					: null,
			attempts: hiraganaAttempts,
			correct: hiraganaCorrect,
			label: "Hiragana (あ)",
			practicedCharacterCount: hiraganaPracticedCount,
			script: "hiragana",
		},
		{
			accuracyPercent:
				katakanaAttempts > 0
					? Math.round((katakanaCorrect / katakanaAttempts) * 100)
					: null,
			attempts: katakanaAttempts,
			correct: katakanaCorrect,
			label: "Katakana (ア)",
			practicedCharacterCount: katakanaPracticedCount,
			script: "katakana",
		},
	];

	const categorySummaries: Array<CategoryPerformanceSummary> =
		CATEGORY_DEFINITIONS.map((definition) => {
			const categoryItems =
				KANA_ITEMS_BY_CATEGORY.get(definition.category) ?? [];
			const totalCount = categoryItems.length;
			let practicedCount = 0;
			let strongCount = 0;
			let learningCount = 0;
			let weakCount = 0;
			let unseenCount = 0;
			let attempts = 0;
			let correct = 0;
			let responseTimeSum = 0;
			let responseTimeAttempts = 0;

			for (const item of categoryItems) {
				const stats = masteryMap[item.id];
				const tier = getCharacterPerformanceTier(stats);
				if (tier === "strong") {
					strongCount += 1;
				} else if (tier === "learning") {
					learningCount += 1;
				} else if (tier === "weak") {
					weakCount += 1;
				} else {
					unseenCount += 1;
				}

				if (stats && stats.attempts > 0) {
					practicedCount += 1;
					attempts += stats.attempts;
					correct += stats.correct;
					if (
						stats.totalResponseTimeMilliseconds !== undefined &&
						stats.totalResponseTimeMilliseconds > 0
					) {
						responseTimeSum += stats.totalResponseTimeMilliseconds;
						responseTimeAttempts += stats.attempts;
					}
				}
			}

			const accuracyPercent =
				attempts > 0 ? Math.round((correct / attempts) * 100) : null;
			const coverageRatio = totalCount > 0 ? practicedCount / totalCount : 0;
			const strongRatio = totalCount > 0 ? strongCount / totalCount : 0;
			const accuracyRatio = attempts > 0 ? correct / attempts : 0;
			const categoryMasteryPercent = Math.round(
				Math.min(
					100,
					coverageRatio * 35 + accuracyRatio * 35 + strongRatio * 30
				)
			);

			return {
				accuracyPercent,
				attempts,
				averageResponseMilliseconds:
					responseTimeAttempts > 0
						? Math.round(responseTimeSum / responseTimeAttempts)
						: null,
				category: definition.category,
				correct,
				label: definition.label,
				learningCount,
				masteryPercent: categoryMasteryPercent,
				practicedCount,
				shortLabel: definition.shortLabel,
				strongCount,
				totalCount,
				unseenCount,
				weakCount,
			};
		});

	const rowSummaries = KANA_ROW_GROUPS.map((group) => ({
		...getRowMasterySummary(group.id, masteryMap),
		group,
	}));

	const speedMeasuredTotal = Math.max(
		1,
		instantCount + fastCount + steadyCount + slowCount
	);
	const speedBuckets: Array<SpeedBucketSummary> = [
		{
			count: instantCount,
			id: "instant",
			label: "Instant Reflex",
			rangeLabel: "≤ 1.2s",
			sharePercent:
				practicedCharacterCount > 0
					? Math.round((instantCount / speedMeasuredTotal) * 100)
					: 0,
		},
		{
			count: fastCount,
			id: "fast",
			label: "Fast Recall",
			rangeLabel: "1.2s – 1.8s",
			sharePercent:
				practicedCharacterCount > 0
					? Math.round((fastCount / speedMeasuredTotal) * 100)
					: 0,
		},
		{
			count: steadyCount,
			id: "steady",
			label: "Steady Recognition",
			rangeLabel: "1.8s – 3.0s",
			sharePercent:
				practicedCharacterCount > 0
					? Math.round((steadyCount / speedMeasuredTotal) * 100)
					: 0,
		},
		{
			count: slowCount,
			id: "slow",
			label: "Needs Speed Drill",
			rangeLabel: "> 3.0s",
			sharePercent:
				practicedCharacterCount > 0
					? Math.round((slowCount / speedMeasuredTotal) * 100)
					: 0,
		},
	];

	const chronologicalScores = [...highScores].sort(
		(first, second) =>
			new Date(first.dateIso).getTime() - new Date(second.dateIso).getTime()
	);

	const sessionTrend: Array<SessionTrendPoint> = chronologicalScores.map(
		(record, index) => {
			const parsedDate = new Date(record.dateIso);
			const dateLabel = Number.isNaN(parsedDate.getTime())
				? `Run ${index + 1}`
				: `${parsedDate.getMonth() + 1}/${parsedDate.getDate()}`;
			const durationMinutes = Math.max(0.1, record.durationSeconds / 60);
			return {
				accuracy: record.accuracy,
				cardsCleared: record.cardsCleared,
				cardsPerMinute: Math.round(record.cardsCleared / durationMinutes),
				dateLabel,
				durationSeconds: record.durationSeconds,
				gameMode: record.gameMode,
				id: record.id,
				score: record.score,
				scriptMode: record.scriptMode,
				sessionLabel: `S${index + 1}`,
			};
		}
	);

	const recommendations: Array<StudyRecommendation> = [];

	if (analysis.weakItems.length > 0) {
		const sampleWeak = analysis.weakItems
			.slice(0, 4)
			.map((item) => `${item.hiragana} (${item.romaji})`)
			.join(", ");
		recommendations.push({
			actionLabel: `Drill ${analysis.weakItems.length} Weak Kana`,
			actionType: "weak-drill",
			description: `Target ${sampleWeak} to raise recognition accuracy above 80% and build active recall.`,
			id: "rec-weak-kana",
			priority: "high",
			title: `${analysis.weakItems.length} Kana Need Targeted Review`,
		});
	}

	if (hiraganaAttempts >= 5 && katakanaAttempts < hiraganaAttempts * 0.4) {
		recommendations.push({
			actionLabel: "Practice Katakana",
			actionType: "katakana-focus",
			description: `You have ${hiraganaAttempts} Hiragana attempts vs ${katakanaAttempts} Katakana attempts. Balance your script fluency with a Katakana session.`,
			id: "rec-katakana-balance",
			priority: "medium",
			title: "Boost Katakana Script Balance",
		});
	} else if (
		katakanaAttempts >= 5 &&
		hiraganaAttempts < katakanaAttempts * 0.4
	) {
		recommendations.push({
			actionLabel: "Practice Hiragana",
			actionType: "hiragana-focus",
			description: `You have ${katakanaAttempts} Katakana attempts vs ${hiraganaAttempts} Hiragana attempts. Switch to Hiragana to balance script retention.`,
			id: "rec-hiragana-balance",
			priority: "medium",
			title: "Boost Hiragana Script Balance",
		});
	}

	const nextLockedRow = KANA_ROW_GROUPS.find(
		(group) =>
			!progression.unlockAllRows &&
			!progression.unlockedRowIds.includes(group.id)
	);
	if (nextLockedRow) {
		recommendations.push({
			actionLabel: "Continue Row Progression",
			actionType: "standard-practice",
			description: `Achieve 70%+ accuracy across your current unlocked rows to unlock ${nextLockedRow.sampleHiragana} ${nextLockedRow.label} (${nextLockedRow.romajiSummary}).`,
			id: "rec-next-row",
			priority: "positive",
			title: `Next Unlock: ${nextLockedRow.label}`,
		});
	}

	if (recommendations.length === 0) {
		recommendations.push({
			actionLabel: "Start Sprint Session",
			actionType: "standard-practice",
			description:
				analysis.totalAttempts > 0
					? "Your accuracy and script balance look strong! Challenge yourself with a 60-second Timed Run or Mixed Script session."
					: "Complete your first flashcard sprint to populate character telemetry, response speed distributions, and mastery charts.",
			id: "rec-general",
			priority: "positive",
			title:
				analysis.totalAttempts > 0
					? "Strong Momentum — Keep Up Your Streak"
					: "Ready for Your First Telemetry Session",
		});
	}

	return {
		analysis,
		categorySummaries,
		coveragePercent,
		masteryPercent,
		overallProficiencyScore,
		recommendations,
		rowSummaries,
		scriptSummaries,
		sessionTrend,
		speedBuckets,
		topConfusions,
	};
};
