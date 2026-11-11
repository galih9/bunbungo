import {
	DEFAULT_SELECTED_ROWS,
	KANA_ITEMS,
	KANA_ITEMS_BY_CATEGORY,
	type KanaItem,
	type KanaScript,
} from "../kanaData";
import {
	analyzeKanaPerformance,
	getCharacterPerformanceTier,
} from "./masteryAnalytics";
import type {
	CharacterMastery,
	FlashcardChallenge,
	ScriptSelection,
} from "./storageTypes";

const shuffleArray = <T>(items: ReadonlyArray<T>): Array<T> => {
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
	const categoryItems =
		KANA_ITEMS_BY_CATEGORY.get(target.category) ?? KANA_ITEMS;
	const fallbackPool = categoryItems.filter(
		(candidate) => candidate.romaji !== target.romaji
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
	sequenceNumber: number,
	isRedemption = false
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
		displayCharacter,
		isRedemption,
		item,
		options: buildOptionsForItem(item, pool),
		script: resolvedScript,
	};
};

export const areSameOrHomophoneKana = (
	first: KanaItem | undefined,
	second: KanaItem | undefined
): boolean => {
	if (!first || !second) {
		return false;
	}
	return (
		first.id === second.id ||
		first.romaji === second.romaji ||
		first.hiragana === second.hiragana ||
		first.katakana === second.katakana
	);
};

const ensureMinimumDistinctPool = (
	targetItems: Array<KanaItem>,
	masteryMap: Record<string, CharacterMastery>,
	fallbackRowIds: Array<string> = DEFAULT_SELECTED_ROWS
): {
	readonly expandedPool: Array<KanaItem>;
	readonly primaryIds: Set<string>;
} => {
	const primaryIds = new Set<string>();
	const expandedPool: Array<KanaItem> = [];
	const distinctRomajiSet = new Set<string>();

	for (const item of targetItems) {
		primaryIds.add(item.id);
		if (!expandedPool.some((existing) => existing.id === item.id)) {
			expandedPool.push(item);
			distinctRomajiSet.add(item.romaji);
		}
	}

	if (distinctRomajiSet.size < 5) {
		const analysis = analyzeKanaPerformance(masteryMap);
		const fallbackRowSet = new Set(fallbackRowIds);
		const defaultRowSet = new Set(DEFAULT_SELECTED_ROWS);
		const candidateSupplements = [
			...analysis.weakItems,
			...analysis.learningItems,
			...KANA_ITEMS.filter((item) => fallbackRowSet.has(item.rowId)),
			...KANA_ITEMS.filter((item) => defaultRowSet.has(item.rowId)),
			...KANA_ITEMS,
		];

		for (const candidate of candidateSupplements) {
			if (
				!expandedPool.some((existing) =>
					areSameOrHomophoneKana(existing, candidate)
				)
			) {
				expandedPool.push(candidate);
				distinctRomajiSet.add(candidate.romaji);
			}
			if (distinctRomajiSet.size >= 5) {
				break;
			}
		}
	}

	return { expandedPool, primaryIds };
};

export const pickNextDistinctKanaItem = (
	pool: Array<KanaItem>,
	masteryMap: Record<string, CharacterMastery>,
	previousItem?: KanaItem,
	secondPreviousItem?: KanaItem,
	priorityIds?: Set<string>
): KanaItem => {
	const { expandedPool } = ensureMinimumDistinctPool(pool, masteryMap);

	const weightedPool: Array<KanaItem> = [];
	for (const item of expandedPool) {
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
		if (priorityIds?.has(item.id)) {
			weight += 3;
		}
		for (let repeat = 0; repeat < weight; repeat += 1) {
			weightedPool.push(item);
		}
	}

	// Strictly forbid matching previousItem (id, romaji, hiragana, or katakana)
	const nonRepeatingPrevious = weightedPool.filter(
		(candidate) => !areSameOrHomophoneKana(candidate, previousItem)
	);

	// Also avoid secondPreviousItem when possible so we don't ping-pong A-B-A-B
	const nonRepeatingWindow = nonRepeatingPrevious.filter(
		(candidate) => !areSameOrHomophoneKana(candidate, secondPreviousItem)
	);

	const activeCandidates =
		nonRepeatingWindow.length > 0
			? nonRepeatingWindow
			: nonRepeatingPrevious.length > 0
				? nonRepeatingPrevious
				: expandedPool.filter(
						(candidate) => !areSameOrHomophoneKana(candidate, previousItem)
					);

	const chosen =
		activeCandidates[Math.floor(Math.random() * activeCandidates.length)];
	if (chosen) {
		return chosen;
	}

	const fallback = KANA_ITEMS.find(
		(candidate) => !areSameOrHomophoneKana(candidate, previousItem)
	);
	return fallback ?? KANA_ITEMS[0]!;
};

export const appendDistinctFlashcardToDeck = (
	currentDeck: Array<FlashcardChallenge>,
	sourcePool: Array<KanaItem>,
	scriptMode: ScriptSelection,
	masteryMap: Record<string, CharacterMastery>
): Array<FlashcardChallenge> => {
	const lastCard = currentDeck[currentDeck.length - 1];
	const secondLastCard = currentDeck[currentDeck.length - 2];
	const nextItem = pickNextDistinctKanaItem(
		sourcePool,
		masteryMap,
		lastCard?.item,
		secondLastCard?.item
	);
	const nextChallenge = createFlashcardChallenge(
		nextItem,
		scriptMode,
		KANA_ITEMS,
		currentDeck.length + 1
	);
	return [...currentDeck, nextChallenge];
};

export const scheduleSpacedRetryInDeck = (
	currentDeck: Array<FlashcardChallenge>,
	currentIndex: number,
	missedItem: KanaItem,
	scriptMode: ScriptSelection
): Array<FlashcardChallenge> => {
	// Avoid inserting if the same character is already queued in the next 4 upcoming cards
	const upcomingSlice = currentDeck.slice(currentIndex + 1, currentIndex + 5);
	if (
		upcomingSlice.some((card) => areSameOrHomophoneKana(card.item, missedItem))
	) {
		return currentDeck;
	}

	let insertIndex = Math.min(currentDeck.length, currentIndex + 3);
	while (insertIndex <= currentDeck.length) {
		const beforeCard = currentDeck[insertIndex - 1];
		const afterCard = currentDeck[insertIndex];
		const conflictsWithBefore = areSameOrHomophoneKana(
			beforeCard?.item,
			missedItem
		);
		const conflictsWithAfter = areSameOrHomophoneKana(
			afterCard?.item,
			missedItem
		);
		if (!conflictsWithBefore && !conflictsWithAfter) {
			break;
		}
		insertIndex += 1;
	}

	if (insertIndex > currentDeck.length) {
		return currentDeck;
	}

	const redemptionCard = createFlashcardChallenge(
		missedItem,
		scriptMode,
		KANA_ITEMS,
		currentDeck.length + 100 + currentIndex,
		true
	);

	return [
		...currentDeck.slice(0, insertIndex),
		redemptionCard,
		...currentDeck.slice(insertIndex),
	];
};

export const generateCustomItemsDeck = (
	targetItems: Array<KanaItem>,
	scriptMode: ScriptSelection,
	count: number,
	masteryMap: Record<string, CharacterMastery>
): Array<FlashcardChallenge> => {
	const { expandedPool, primaryIds } = ensureMinimumDistinctPool(
		targetItems,
		masteryMap
	);

	const deck: Array<FlashcardChallenge> = [];
	const remainingInitialQueue = shuffleArray(expandedPool);
	let previousItem: KanaItem | undefined;
	let secondPreviousItem: KanaItem | undefined;

	for (let index = 0; index < count; index += 1) {
		let chosenItem: KanaItem | undefined;

		if (remainingInitialQueue.length > 0) {
			const nonConflictingIndex = remainingInitialQueue.findIndex(
				(candidate) =>
					!areSameOrHomophoneKana(candidate, previousItem) &&
					(remainingInitialQueue.length <= 2 ||
						!areSameOrHomophoneKana(candidate, secondPreviousItem))
			);
			const fallbackQueueIndex =
				nonConflictingIndex !== -1
					? nonConflictingIndex
					: remainingInitialQueue.findIndex(
							(candidate) => !areSameOrHomophoneKana(candidate, previousItem)
						);

			if (fallbackQueueIndex !== -1) {
				chosenItem = remainingInitialQueue.splice(fallbackQueueIndex, 1)[0];
			}
		}

		if (!chosenItem || areSameOrHomophoneKana(chosenItem, previousItem)) {
			chosenItem = pickNextDistinctKanaItem(
				expandedPool,
				masteryMap,
				previousItem,
				secondPreviousItem,
				primaryIds
			);
		}

		deck.push(
			createFlashcardChallenge(chosenItem, scriptMode, KANA_ITEMS, index)
		);
		secondPreviousItem = previousItem;
		previousItem = chosenItem;
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
		const fallbackRowSet = new Set(fallbackSelectedRows);
		const fallbackPool = KANA_ITEMS.filter((item) =>
			fallbackRowSet.has(item.rowId)
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
	const selectedRowSet = new Set(selectedRows);
	const filteredPool = KANA_ITEMS.filter((item) =>
		selectedRowSet.has(item.rowId)
	);
	const activePool =
		filteredPool.length > 0
			? filteredPool
			: KANA_ITEMS.filter((item) => DEFAULT_SELECTED_ROWS.includes(item.rowId));

	return generateCustomItemsDeck(activePool, scriptMode, count, masteryMap);
};
