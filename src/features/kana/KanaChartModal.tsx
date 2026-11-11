import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FunctionComponent } from "../../common/types";
import { speakKanaCharacter } from "./audioEffects";
import {
	type AchievementCategory,
	analyzeKanaPerformance,
	type CharacterMastery,
	getAchievementProgressList,
	getCharacterAccuracy,
	getCharacterAverageResponseMilliseconds,
	getCharacterPerformanceTier,
	getCharacterProficiencyScore,
	getRankTitleForLevel,
	getRowMasterySummary,
	getTopConfusedRomaji,
	getXpThresholdForLevel,
	type HighScoreRecord,
	type LetterPerformanceTier,
	type UserProgression,
} from "./gameStorage";
import {
	KANA_ITEMS,
	KANA_ROW_GROUPS,
	type KanaCategory,
	type KanaItem,
	type KanaScript,
} from "./kanaData";

export type CodexModalTab =
	| "chart"
	| "analytics"
	| "achievements"
	| "leaderboard";

interface KanaChartModalProps {
	readonly activeTab?: CodexModalTab;
	readonly highScores: Array<HighScoreRecord>;
	readonly isOpen: boolean;
	readonly masteryMap: Record<string, CharacterMastery>;
	readonly progression: UserProgression;
	readonly voiceEnabled: boolean;
	readonly onClearProgress: () => void;
	readonly onClose: () => void;
	readonly onPracticeWeakLetters: () => void;
	readonly onTabChange?: (tab: CodexModalTab) => void;
}

type ElementWithViewTransition = HTMLElement & {
	startViewTransition?: (updateCallback: () => void) => void;
};

type DocumentWithViewTransition = Document & {
	startViewTransition?: (updateCallback: () => void) => void;
};

type ElementWithMoveBefore = HTMLElement & {
	moveBefore?: (node: Node, child: Node | null) => void;
};

let cachedSupportsDisplayTransition: boolean | undefined;

const canTransitionDisplay = (): boolean => {
	if (cachedSupportsDisplayTransition !== undefined) {
		return cachedSupportsDisplayTransition;
	}
	if (
		typeof window === "undefined" ||
		!window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
		!document.body
	) {
		return false;
	}
	const probe = document.createElement("div");
	probe.style.cssText =
		"transition: display 1s allow-discrete !important; display: block;";
	document.body.appendChild(probe);
	void window.getComputedStyle(probe).display;
	probe.style.display = "none";
	cachedSupportsDisplayTransition =
		window.getComputedStyle(probe).display === "block";
	probe.remove();
	return cachedSupportsDisplayTransition;
};

const supportsTopLayerExit = (): boolean => {
	return (
		typeof window !== "undefined" &&
		Boolean(window.CSS?.supports?.("overlay", "auto")) &&
		canTransitionDisplay()
	);
};

const textCollator = new Intl.Collator(undefined, {
	numeric: true,
	sensitivity: "base",
});

const reorderContainerChildren = (
	container: HTMLElement,
	orderedNodes: Array<HTMLElement>
): void => {
	const moveBeforeMethod = (container as ElementWithMoveBefore).moveBefore;
	const canMoveBefore = typeof moveBeforeMethod === "function";
	for (const node of orderedNodes) {
		if (canMoveBefore) {
			moveBeforeMethod.call(container, node, null);
		} else {
			container.append(node);
		}
	}
};

const getTierBadgeStyle = (tier: LetterPerformanceTier): string => {
	if (tier === "strong") {
		return "border-emerald-500/40 bg-emerald-950/40 text-emerald-300";
	}
	if (tier === "weak") {
		return "border-rose-500/40 bg-rose-950/40 text-rose-300";
	}
	if (tier === "learning") {
		return "border-amber-500/40 bg-amber-950/40 text-amber-300";
	}
	return "border-zinc-800 bg-zinc-900 text-zinc-400";
};

const getTierLabel = (tier: LetterPerformanceTier): string => {
	if (tier === "strong") {
		return "Strong";
	}
	if (tier === "weak") {
		return "Weak";
	}
	if (tier === "learning") {
		return "Learning";
	}
	return "Unseen";
};

export const KanaChartModal = ({
	activeTab: controlledTab,
	highScores,
	isOpen,
	masteryMap,
	progression,
	voiceEnabled,
	onClearProgress,
	onClose,
	onPracticeWeakLetters,
	onTabChange,
}: KanaChartModalProps): FunctionComponent => {
	const dialogRef = useRef<HTMLDialogElement | null>(null);
	const tableRef = useRef<HTMLTableElement | null>(null);
	const tbodyRef = useRef<HTMLTableSectionElement | null>(null);
	const sortStatusRef = useRef<HTMLParagraphElement | null>(null);

	const titleId = useId();
	const tableId = useId();
	const tableCaptionId = useId();
	const levelProgressLabelId = useId();

	const [internalTab, setInternalTab] = useState<CodexModalTab>("chart");
	const activeTab = controlledTab ?? internalTab;
	const setActiveTab = (nextTab: CodexModalTab): void => {
		setInternalTab(nextTab);
		onTabChange?.(nextTab);
	};

	const [chartScript, setChartScript] = useState<KanaScript>("hiragana");
	const [categoryFilter, setCategoryFilter] =
		useState<KanaCategory>("monograph");
	const [selectedKana, setSelectedKana] = useState<KanaItem | null>(
		KANA_ITEMS[0] ?? null
	);
	const [confirmReset, setConfirmReset] = useState<boolean>(false);
	const [tableTierFilter, setTableTierFilter] = useState<
		"all" | "practiced" | "weak" | "strong"
	>("all");
	const [achievementFilter, setAchievementFilter] = useState<
		"all" | AchievementCategory
	>("all");

	const closeTopLayer = useCallback(
		async (element: HTMLDialogElement): Promise<void> => {
			if (
				!supportsTopLayerExit() &&
				typeof element.getAnimations === "function"
			) {
				element.setAttribute("data-closing", "");
				const animations = element.getAnimations({ subtree: true });
				if (animations.length > 0) {
					await Promise.race([
						Promise.allSettled(
							animations.map((animation) => animation.finished)
						),
						new Promise((resolve) => {
							window.setTimeout(resolve, 400);
						}),
					]);
				}
				if (!element.hasAttribute("data-closing")) {
					return;
				}
				element.removeAttribute("data-closing");
			}
			if (element.open) {
				element.close();
			}
		},
		[]
	);

	useEffect(() => {
		const dialogElement = dialogRef.current;
		if (!dialogElement) {
			return;
		}
		if (isOpen && !dialogElement.open) {
			dialogElement.removeAttribute("data-closing");
			dialogElement.showModal();
		} else if (!isOpen && dialogElement.open) {
			void closeTopLayer(dialogElement);
		}
	}, [closeTopLayer, isOpen]);

	useEffect(() => {
		const dialogElement = dialogRef.current;
		if (!dialogElement) {
			return;
		}

		const handleNativeClose = (): void => {
			dialogElement.removeAttribute("data-closing");
			setConfirmReset(false);
			onClose();
		};

		const handleCancel = (event: Event): void => {
			event.preventDefault();
			void closeTopLayer(dialogElement);
		};

		dialogElement.addEventListener("close", handleNativeClose);
		dialogElement.addEventListener("cancel", handleCancel);

		const handleLightDismissClick = (event: MouseEvent): void => {
			if (event.target !== dialogElement) {
				return;
			}
			const rect = dialogElement.getBoundingClientRect();
			const isDialogContent =
				rect.top <= event.clientY &&
				event.clientY <= rect.top + rect.height &&
				rect.left <= event.clientX &&
				event.clientX <= rect.left + rect.width;
			if (isDialogContent) {
				return;
			}
			void closeTopLayer(dialogElement);
		};

		const supportsClosedBy =
			typeof HTMLDialogElement !== "undefined" &&
			"closedBy" in HTMLDialogElement.prototype;

		if (!supportsClosedBy) {
			dialogElement.addEventListener("click", handleLightDismissClick);
		}

		return (): void => {
			dialogElement.removeEventListener("close", handleNativeClose);
			dialogElement.removeEventListener("cancel", handleCancel);
			if (!supportsClosedBy) {
				dialogElement.removeEventListener("click", handleLightDismissClick);
			}
		};
	}, [closeTopLayer, onClose]);

	const performanceAnalysis = useMemo(
		() => analyzeKanaPerformance(masteryMap),
		[masteryMap]
	);

	const achievementStatuses = useMemo(
		() => getAchievementProgressList(progression, masteryMap),
		[masteryMap, progression]
	);

	const unlockedAchievementCount = useMemo(
		() => achievementStatuses.filter((status) => status.isUnlocked).length,
		[achievementStatuses]
	);

	const filteredAchievements = useMemo(() => {
		if (achievementFilter === "all") {
			return achievementStatuses;
		}
		return achievementStatuses.filter(
			(status) => status.category === achievementFilter
		);
	}, [achievementFilter, achievementStatuses]);

	const filteredKana = useMemo(
		() => KANA_ITEMS.filter((item) => item.category === categoryFilter),
		[categoryFilter]
	);

	const tableItems = useMemo(() => {
		return KANA_ITEMS.filter((item) => {
			const stats = masteryMap[item.id];
			const tier = getCharacterPerformanceTier(stats);
			if (tableTierFilter === "practiced") {
				return (stats?.attempts ?? 0) > 0;
			}
			if (tableTierFilter === "weak") {
				return tier === "weak";
			}
			if (tableTierFilter === "strong") {
				return tier === "strong";
			}
			return true;
		});
	}, [masteryMap, tableTierFilter]);

	const executeTableSort = useCallback((sourceButton: HTMLElement): void => {
		const tableElement = tableRef.current;
		const tbodyElement = tbodyRef.current;
		if (!tableElement || !tbodyElement) {
			return;
		}
		const headerCell = sourceButton.closest("th");
		if (!headerCell || !tableElement.tHead?.rows[0]) {
			return;
		}

		const direction =
			headerCell.getAttribute("aria-sort") === "ascending"
				? "descending"
				: "ascending";

		for (const cell of Array.from(tableElement.tHead.rows[0].cells)) {
			cell.removeAttribute("aria-sort");
		}
		headerCell.setAttribute("aria-sort", direction);

		const columnIndex = headerCell.cellIndex;
		const columnType = headerCell.dataset["type"] ?? "text";
		const directionFactor = direction === "ascending" ? 1 : -1;

		const rowsWithValues = Array.from(tbodyElement.rows).map((row) => {
			const cell = row.cells[columnIndex];
			const rawValue =
				cell?.dataset["value"] ?? cell?.textContent?.trim() ?? "";
			return {
				numericValue: Number(rawValue),
				row,
				textValue: rawValue,
			};
		});

		rowsWithValues.sort((first, second) => {
			if (columnType === "number") {
				return directionFactor * (first.numericValue - second.numericValue);
			}
			return (
				directionFactor *
				textCollator.compare(first.textValue, second.textValue)
			);
		});

		const orderedRows = rowsWithValues.map((entry) => entry.row);
		const applyReorder = (): void => {
			reorderContainerChildren(tbodyElement, orderedRows);
		};

		const transitionTable = tableElement as ElementWithViewTransition;
		const transitionDocument = document as DocumentWithViewTransition;
		if (
			orderedRows.length <= 120 &&
			typeof transitionTable.startViewTransition === "function"
		) {
			transitionTable.startViewTransition(applyReorder);
		} else if (
			orderedRows.length <= 120 &&
			typeof transitionDocument.startViewTransition === "function"
		) {
			transitionDocument.startViewTransition(applyReorder);
		} else {
			applyReorder();
		}

		if (sortStatusRef.current) {
			const columnLabel = sourceButton.textContent?.trim() ?? "column";
			sortStatusRef.current.textContent = `Sorted by ${columnLabel}, ${direction}, ${orderedRows.length} rows`;
		}
	}, []);

	useEffect(() => {
		const tableElement = tableRef.current;
		if (!tableElement) {
			return;
		}
		const handleCommand = (
			event: Event & { command?: string; source?: Element | null }
		): void => {
			if (event.command !== "--sort" || !(event.source instanceof HTMLElement)) {
				return;
			}
			executeTableSort(event.source);
		};
		tableElement.addEventListener("command", handleCommand);
		return (): void => {
			tableElement.removeEventListener("command", handleCommand);
		};
	}, [activeTab, executeTableSort]);

	const supportsInvokerCommands =
		typeof HTMLButtonElement !== "undefined" &&
		"commandForElement" in HTMLButtonElement.prototype;

	const handleSortButtonClick = (
		event: React.MouseEvent<HTMLButtonElement>
	): void => {
		if (supportsInvokerCommands) {
			return;
		}
		executeTableSort(event.currentTarget);
	};

	const handleSelectCharacter = (item: KanaItem): void => {
		setSelectedKana(item);
		const characterToSpeak =
			chartScript === "hiragana" ? item.hiragana : item.katakana;
		speakKanaCharacter(characterToSpeak, voiceEnabled);
	};

	const selectedStats = selectedKana ? masteryMap[selectedKana.id] : undefined;
	const selectedAccuracy = getCharacterAccuracy(selectedStats);
	const selectedAverageMilliseconds =
		getCharacterAverageResponseMilliseconds(selectedStats);
	const selectedTier = getCharacterPerformanceTier(selectedStats);
	const selectedConfusions = getTopConfusedRomaji(selectedStats);

	const currentLevelFloorXp = getXpThresholdForLevel(progression.level);
	const nextLevelFloorXp = getXpThresholdForLevel(progression.level + 1);
	const xpInCurrentLevel = Math.max(0, progression.xp - currentLevelFloorXp);
	const xpNeededForNextLevel = Math.max(
		1,
		nextLevelFloorXp - currentLevelFloorXp
	);

	return (
		<dialog
			ref={dialogRef}
			aria-labelledby={titleId}
			className="m-auto max-h-[88dvh] w-[min(95vw,46rem)] rounded-2xl border border-zinc-800/90 bg-zinc-950 p-0 text-zinc-100 shadow-2xl"
			{...({ closedby: "any" } as Record<string, string>)}
		>
			<div className="flex max-h-[88dvh] flex-col overflow-hidden">
				{/* Minimal Header */}
				<div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
					<div>
						<h2
							className="text-base font-semibold tracking-tight text-zinc-100"
							id={titleId}
						>
							Kana Codex & Mastery
						</h2>
						<p className="mt-0.5 text-xs text-zinc-400">
							Inspect letter performance analytics, progression unlocks, and
							achievements
						</p>
					</div>
					<button
						aria-label="Close Kana Codex dialog"
						className="kana-interactive inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
						type="button"
						onClick={(): void => {
							if (dialogRef.current) {
								void closeTopLayer(dialogRef.current);
							} else {
								onClose();
							}
						}}
					>
						Close
					</button>
				</div>

				{/* Navigation Bar */}
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 bg-zinc-950/60 px-5 py-2.5">
					<div className="flex flex-wrap rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-0.5">
						<button
							type="button"
							className={`kana-interactive rounded-md px-3 py-1 text-xs font-medium ${
								activeTab === "chart"
									? "bg-zinc-100 text-zinc-950 shadow-xs"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
							onClick={(): void => {
								setActiveTab("chart");
							}}
						>
							Reference Chart
						</button>
						<button
							type="button"
							className={`kana-interactive rounded-md px-3 py-1 text-xs font-medium ${
								activeTab === "analytics"
									? "bg-zinc-100 text-zinc-950 shadow-xs"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
							onClick={(): void => {
								setActiveTab("analytics");
							}}
						>
							Performance ({performanceAnalysis.weakItems.length} Weak)
						</button>
						<button
							type="button"
							className={`kana-interactive rounded-md px-3 py-1 text-xs font-medium ${
								activeTab === "achievements"
									? "bg-zinc-100 text-zinc-950 shadow-xs"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
							onClick={(): void => {
								setActiveTab("achievements");
							}}
						>
							Achievements ({unlockedAchievementCount}/
							{achievementStatuses.length})
						</button>
						<button
							type="button"
							className={`kana-interactive rounded-md px-3 py-1 text-xs font-medium ${
								activeTab === "leaderboard"
									? "bg-zinc-100 text-zinc-950 shadow-xs"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
							onClick={(): void => {
								setActiveTab("leaderboard");
							}}
						>
							Records ({highScores.length})
						</button>
					</div>

					{activeTab === "chart" && (
						<div className="flex rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-0.5">
							<button
								type="button"
								className={`kana-interactive rounded-md px-2.5 py-1 text-xs font-medium ${
									chartScript === "hiragana"
										? "bg-zinc-800 text-zinc-100"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
								onClick={(): void => {
									setChartScript("hiragana");
								}}
							>
								あ Hiragana
							</button>
							<button
								type="button"
								className={`kana-interactive rounded-md px-2.5 py-1 text-xs font-medium ${
									chartScript === "katakana"
										? "bg-zinc-800 text-zinc-100"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
								onClick={(): void => {
									setChartScript("katakana");
								}}
							>
								ア Katakana
							</button>
						</div>
					)}
				</div>

				{/* Modal Body */}
				<div className="flex-1 overflow-y-auto p-5">
					{activeTab === "chart" && (
						<div className="space-y-4">
							{/* Spotlight Character Detail */}
							{selectedKana && (
								<div className="space-y-3 rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4">
									<div className="flex items-start justify-between gap-4">
										<div className="flex items-center gap-4">
											<div
												key={`${selectedKana.id}-${chartScript}`}
												className="kana-glyph-enter flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-2xl font-semibold text-zinc-100"
											>
												{chartScript === "hiragana"
													? selectedKana.hiragana
													: selectedKana.katakana}
											</div>
											<div>
												<div className="flex flex-wrap items-center gap-2">
													<span className="text-base font-semibold tracking-wide text-zinc-100 uppercase">
														{selectedKana.romaji}
													</span>
													<span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400">
														{selectedKana.hiragana} / {selectedKana.katakana}
													</span>
													<span
														className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${getTierBadgeStyle(selectedTier)}`}
													>
														{getTierLabel(selectedTier)}
													</span>
													{selectedAccuracy !== null && (
														<span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300 tabular-nums">
															{selectedAccuracy}% accuracy (
															{selectedStats?.attempts} tries)
														</span>
													)}
												</div>
												<p className="mt-1 text-xs text-zinc-400">
													{selectedKana.hint}
												</p>
											</div>
										</div>
										<button
											aria-label={`Pronounce ${selectedKana.romaji}`}
											className="kana-interactive inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
											type="button"
											onClick={(): void => {
												handleSelectCharacter(selectedKana);
											}}
										>
											<svg
												aria-hidden="true"
												className="h-3.5 w-3.5 text-zinc-400"
												fill="none"
												stroke="currentColor"
												strokeWidth={1.75}
												viewBox="0 0 24 24"
											>
												<path
													d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
											<span>Listen</span>
										</button>
									</div>

									{/* Detailed Character Telemetry Strip */}
									{selectedStats && selectedStats.attempts > 0 && (
										<div className="grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-3 text-[11px] sm:grid-cols-4">
											<div className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-2.5 py-1.5">
												<span className="block text-zinc-500">
													Correct / Missed
												</span>
												<span className="mt-0.5 block font-semibold text-zinc-200 tabular-nums">
													{selectedStats.correct} /{" "}
													{selectedStats.wrong ??
														selectedStats.attempts - selectedStats.correct}
												</span>
											</div>
											<div className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-2.5 py-1.5">
												<span className="block text-zinc-500">
													Streak / Best
												</span>
												<span className="mt-0.5 block font-semibold text-zinc-200 tabular-nums">
													{selectedStats.streak}x /{" "}
													{selectedStats.bestStreak ?? selectedStats.streak}x
												</span>
											</div>
											<div className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-2.5 py-1.5">
												<span className="block text-zinc-500">Avg Recall</span>
												<span className="mt-0.5 block font-semibold text-zinc-200 tabular-nums">
													{selectedAverageMilliseconds !== null
														? `${(selectedAverageMilliseconds / 1000).toFixed(2)}s`
														: "—"}
												</span>
											</div>
											<div className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-2.5 py-1.5">
												<span className="block text-zinc-500">
													Confused With
												</span>
												<span className="mt-0.5 block truncate font-semibold text-zinc-200 uppercase">
													{selectedConfusions.length > 0
														? selectedConfusions
																.map(
																	(entry) => `${entry.romaji} (${entry.count}x)`
																)
																.join(", ")
														: "None"}
												</span>
											</div>
										</div>
									)}
								</div>
							)}

							{/* Category Pills */}
							<div className="flex flex-wrap gap-1.5">
								{(
									[
										{ id: "monograph", label: "Monographs (Gojūon)" },
										{ id: "diacritic", label: "Diacritics (Dakuten)" },
										{ id: "digraph", label: "Digraphs (Yōon)" },
									] as const
								).map((categoryOption) => (
									<button
										key={categoryOption.id}
										type="button"
										className={`kana-interactive rounded-lg px-3 py-1.5 text-xs font-medium ${
											categoryFilter === categoryOption.id
												? "bg-zinc-800 text-zinc-100"
												: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
										}`}
										onClick={(): void => {
											setCategoryFilter(categoryOption.id);
										}}
									>
										{categoryOption.label}
									</button>
								))}
							</div>

							{/* Minimalist Kana Grid */}
							<div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
								{filteredKana.map((item) => {
									const stats = masteryMap[item.id];
									const accuracyPercent = getCharacterAccuracy(stats);
									const tier = getCharacterPerformanceTier(stats);
									const isSelected = selectedKana?.id === item.id;
									const isRowUnlocked =
										progression.unlockAllRows ||
										progression.unlockedRowIds.includes(item.rowId);

									let barColor = "bg-zinc-800";
									if (tier === "strong") {
										barColor = "bg-emerald-500/80";
									} else if (tier === "learning") {
										barColor = "bg-amber-400/80";
									} else if (tier === "weak") {
										barColor = "bg-rose-500/80";
									}

									return (
										<button
											key={item.id}
											type="button"
											className={`kana-interactive group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border p-2.5 ${
												isSelected
													? "border-zinc-400 bg-zinc-900 text-zinc-100"
													: isRowUnlocked
														? "border-zinc-800/80 bg-zinc-900/35 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/80"
														: "border-zinc-900 bg-zinc-950/60 text-zinc-500 hover:border-zinc-800"
											}`}
											onClick={(): void => {
												handleSelectCharacter(item);
											}}
										>
											<span className="text-xl font-semibold text-zinc-100">
												{chartScript === "hiragana"
													? item.hiragana
													: item.katakana}
											</span>
											<span className="mt-0.5 text-[11px] font-medium text-zinc-400">
												{item.romaji}
											</span>
											<span className="mt-1 text-[10px] text-zinc-400 tabular-nums">
												{accuracyPercent !== null ? `${accuracyPercent}%` : "—"}
											</span>
											<span
												aria-hidden="true"
												className={`mt-1.5 h-0.5 w-full rounded-full ${barColor}`}
											/>
										</button>
									);
								})}
							</div>
						</div>
					)}

					{activeTab === "analytics" && (
						<div className="space-y-5">
							{/* Summary Metrics Grid */}
							<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
								<div className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-3">
									<span className="block text-[11px] font-medium text-emerald-300/90 uppercase">
										Strong Letters
									</span>
									<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
										{performanceAnalysis.strongItems.length}
									</span>
									<span className="text-[10px] text-zinc-400">
										80%+ acc & 2+ streak
									</span>
								</div>
								<div className="rounded-xl border border-rose-500/25 bg-rose-950/15 p-3">
									<span className="block text-[11px] font-medium text-rose-300/90 uppercase">
										Weak Letters
									</span>
									<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
										{performanceAnalysis.weakItems.length}
									</span>
									<span className="text-[10px] text-zinc-400">
										Needs targeted drill
									</span>
								</div>
								<div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-3">
									<span className="block text-[11px] font-medium text-amber-300/90 uppercase">
										Learning
									</span>
									<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
										{performanceAnalysis.learningItems.length}
									</span>
									<span className="text-[10px] text-zinc-400">
										Building streak
									</span>
								</div>
								<div className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-3">
									<span className="block text-[11px] font-medium text-zinc-400 uppercase">
										Overall Accuracy
									</span>
									<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
										{performanceAnalysis.overallAccuracy !== null
											? `${performanceAnalysis.overallAccuracy}%`
											: "—"}
									</span>
									<span className="text-[10px] text-zinc-400 tabular-nums">
										{performanceAnalysis.totalAttempts} total answers
									</span>
								</div>
							</div>

							{/* Targeted Weak Letters Practice Callout */}
							<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
								<div>
									<h3 className="text-xs font-semibold tracking-wider text-zinc-200 uppercase">
										Targeted Weak Letter Training
									</h3>
									<p className="mt-0.5 text-xs text-zinc-400">
										{performanceAnalysis.weakItems.length > 0
											? `You have ${performanceAnalysis.weakItems.length} weak performing letter(s). Launch a focused drill to turn them into strong letters.`
											: "No weak letters detected right now — practice your lowest-proficiency letters to sharpen recall speed."}
									</p>
								</div>
								<button
									className="kana-interactive rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white"
									type="button"
									onClick={(): void => {
										onPracticeWeakLetters();
									}}
								>
									Practice Weak Letters (
									{performanceAnalysis.weakItems.length > 0
										? performanceAnalysis.weakItems.length
										: Math.max(
												1,
												performanceAnalysis.learningItems.length
											)}
									)
								</button>
							</div>

							{/* Weakest vs Strongest Highlights */}
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3.5">
									<h3 className="text-xs font-medium tracking-wider text-rose-300 uppercase">
										Weakest Performing Letters
									</h3>
									{performanceAnalysis.weakItems.length === 0 ? (
										<p className="mt-2 text-xs text-zinc-500">
											No weak letters recorded yet. Any letter below 70%
											accuracy or with broken streaks will appear here.
										</p>
									) : (
										<div className="mt-2.5 flex flex-wrap gap-2">
											{performanceAnalysis.weakItems.slice(0, 8).map((item) => {
												const stats = masteryMap[item.id];
												const accuracy = getCharacterAccuracy(stats);
												const confusions = getTopConfusedRomaji(stats);
												return (
													<div
														key={item.id}
														className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 px-2.5 py-1.5"
													>
														<span className="text-base font-semibold text-zinc-100">
															{item.hiragana}
														</span>
														<div>
															<span className="block text-xs font-semibold text-rose-200 uppercase">
																{item.romaji} · {accuracy ?? 0}%
															</span>
															<span className="block text-[10px] text-zinc-400">
																{confusions[0]
																	? `Confused w/ ${confusions[0].romaji}`
																	: `${stats?.attempts ?? 0} tries`}
															</span>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>

								<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3.5">
									<h3 className="text-xs font-medium tracking-wider text-emerald-300 uppercase">
										Best Performing Letters
									</h3>
									{performanceAnalysis.strongItems.length === 0 ? (
										<p className="mt-2 text-xs text-zinc-500">
											Reach 80%+ accuracy with at least a 2x streak on a letter
											to mark it as Strong.
										</p>
									) : (
										<div className="mt-2.5 flex flex-wrap gap-2">
											{performanceAnalysis.strongItems
												.slice(0, 8)
												.map((item) => {
													const stats = masteryMap[item.id];
													const accuracy = getCharacterAccuracy(stats);
													return (
														<div
															key={item.id}
															className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2.5 py-1.5"
														>
															<span className="text-base font-semibold text-zinc-100">
																{item.hiragana}
															</span>
															<div>
																<span className="block text-xs font-semibold text-emerald-200 uppercase">
																	{item.romaji} · {accuracy ?? 100}%
																</span>
																<span className="block text-[10px] text-zinc-400">
																	Streak {stats?.streak ?? 0}x
																</span>
															</div>
														</div>
													);
												})}
										</div>
									)}
								</div>
							</div>

							{/* Filter Pills for Sortable Performance Table */}
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="flex flex-wrap gap-1.5">
									{(
										[
											{ id: "all", label: "All Letters (104)" },
											{ id: "practiced", label: "Practiced Only" },
											{
												id: "weak",
												label: `Weak (${performanceAnalysis.weakItems.length})`,
											},
											{
												id: "strong",
												label: `Strong (${performanceAnalysis.strongItems.length})`,
											},
										] as const
									).map((filterOption) => (
										<button
											key={filterOption.id}
											type="button"
											className={`kana-interactive rounded-lg px-2.5 py-1 text-xs font-medium ${
												tableTierFilter === filterOption.id
													? "bg-zinc-800 text-zinc-100"
													: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
											}`}
											onClick={(): void => {
												setTableTierFilter(filterOption.id);
											}}
										>
											{filterOption.label}
										</button>
									))}
								</div>
								<span className="text-[11px] text-zinc-500">
									Select any column header to sort
								</span>
							</div>

							{/* Visually hidden status region for single-announcement table sorting */}
							<p
								ref={sortStatusRef}
								className="visually-hidden"
								role="status"
							/>

							{/* Sortable Semantic Data Table */}
							<div
								aria-labelledby={tableCaptionId}
								className="max-h-72 overflow-x-auto overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-900/30"
								role="region"
								tabIndex={0}
							>
								<table
									ref={tableRef}
									className="kana-analytics-table w-full min-w-[34rem] border-separate border-spacing-0 text-left text-xs"
									id={tableId}
								>
									<caption
										className="border-b border-zinc-800/80 bg-zinc-950/70 px-4 py-2 text-left text-[11px] font-medium text-zinc-400"
										id={tableCaptionId}
									>
										Letter performance analytics table ({tableItems.length}{" "}
										letters shown)
									</caption>
									<thead className="sticky top-0 z-10 bg-zinc-950 text-[11px] text-zinc-400 uppercase">
										<tr>
											<th
												className="border-b border-zinc-800 font-medium"
												data-type="text"
												scope="col"
											>
												<button
													className="flex w-full items-center justify-between gap-1 px-3 py-2.5 text-left font-medium text-zinc-300 hover:bg-zinc-900/80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-400"
													type="button"
													{...({
														command: "--sort",
														commandfor: tableId,
													} as Record<string, string>)}
													onClick={handleSortButtonClick}
												>
													<span>Kana</span>
													<span aria-hidden="true" className="sort-indicator">
														↓
													</span>
												</button>
											</th>
											<th
												className="border-b border-zinc-800 font-medium"
												data-type="number"
												scope="col"
											>
												<button
													className="flex w-full items-center justify-between gap-1 px-3 py-2.5 text-left font-medium text-zinc-300 hover:bg-zinc-900/80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-400"
													type="button"
													{...({
														command: "--sort",
														commandfor: tableId,
													} as Record<string, string>)}
													onClick={handleSortButtonClick}
												>
													<span>Status</span>
													<span aria-hidden="true" className="sort-indicator">
														↓
													</span>
												</button>
											</th>
											<th
												className="border-b border-zinc-800 font-medium"
												data-type="number"
												scope="col"
											>
												<button
													className="flex w-full items-center justify-between gap-1 px-3 py-2.5 text-left font-medium text-zinc-300 hover:bg-zinc-900/80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-400"
													type="button"
													{...({
														command: "--sort",
														commandfor: tableId,
													} as Record<string, string>)}
													onClick={handleSortButtonClick}
												>
													<span>Accuracy</span>
													<span aria-hidden="true" className="sort-indicator">
														↓
													</span>
												</button>
											</th>
											<th
												className="border-b border-zinc-800 font-medium"
												data-type="number"
												scope="col"
											>
												<button
													className="flex w-full items-center justify-between gap-1 px-3 py-2.5 text-left font-medium text-zinc-300 hover:bg-zinc-900/80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-400"
													type="button"
													{...({
														command: "--sort",
														commandfor: tableId,
													} as Record<string, string>)}
													onClick={handleSortButtonClick}
												>
													<span>Attempts</span>
													<span aria-hidden="true" className="sort-indicator">
														↓
													</span>
												</button>
											</th>
											<th
												className="border-b border-zinc-800 font-medium"
												data-type="number"
												scope="col"
											>
												<button
													className="flex w-full items-center justify-between gap-1 px-3 py-2.5 text-left font-medium text-zinc-300 hover:bg-zinc-900/80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-400"
													type="button"
													{...({
														command: "--sort",
														commandfor: tableId,
													} as Record<string, string>)}
													onClick={handleSortButtonClick}
												>
													<span>Streak</span>
													<span aria-hidden="true" className="sort-indicator">
														↓
													</span>
												</button>
											</th>
											<th
												className="border-b border-zinc-800 font-medium"
												data-type="number"
												scope="col"
											>
												<button
													className="flex w-full items-center justify-between gap-1 px-3 py-2.5 text-left font-medium text-zinc-300 hover:bg-zinc-900/80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-400"
													type="button"
													{...({
														command: "--sort",
														commandfor: tableId,
													} as Record<string, string>)}
													onClick={handleSortButtonClick}
												>
													<span>Avg Speed</span>
													<span aria-hidden="true" className="sort-indicator">
														↓
													</span>
												</button>
											</th>
										</tr>
									</thead>
									<tbody ref={tbodyRef} className="divide-y divide-zinc-800/60">
										{tableItems.map((item) => {
											const stats = masteryMap[item.id];
											const accuracy = getCharacterAccuracy(stats);
											const averageMilliseconds =
												getCharacterAverageResponseMilliseconds(stats);
											const tier = getCharacterPerformanceTier(stats);
											const proficiency = getCharacterProficiencyScore(stats);

											return (
												<tr
													key={item.id}
													className="hover:bg-zinc-900/60"
												>
													<th
														className="bg-zinc-950/90 px-3 py-2 font-semibold text-zinc-100"
														data-value={item.romaji}
														scope="row"
													>
														<span className="mr-2 text-sm">
															{item.hiragana}/{item.katakana}
														</span>
														<span className="text-zinc-400 uppercase">
															{item.romaji}
														</span>
													</th>
													<td
														className="px-3 py-2"
														data-value={`${proficiency}`}
													>
														<span
															className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium ${getTierBadgeStyle(tier)}`}
														>
															{getTierLabel(tier)}
														</span>
													</td>
													<td
														className="px-3 py-2 text-zinc-200 tabular-nums"
														data-value={`${accuracy ?? -1}`}
													>
														{accuracy !== null ? `${accuracy}%` : "—"}
													</td>
													<td
														className="px-3 py-2 text-zinc-300 tabular-nums"
														data-value={`${stats?.attempts ?? 0}`}
													>
														{stats?.attempts ?? 0}{" "}
														{stats && stats.attempts > 0
															? `(${stats.correct}✓ / ${stats.wrong ?? stats.attempts - stats.correct}✗)`
															: ""}
													</td>
													<td
														className="px-3 py-2 text-zinc-300 tabular-nums"
														data-value={`${stats?.streak ?? 0}`}
													>
														{stats?.streak ?? 0}x
													</td>
													<td
														className="px-3 py-2 text-zinc-300 tabular-nums"
														data-value={`${averageMilliseconds ?? 999999}`}
													>
														{averageMilliseconds !== null
															? `${(averageMilliseconds / 1000).toFixed(2)}s`
															: "—"}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{activeTab === "achievements" && (
						<div className="space-y-5">
							{/* Level & XP Progression Banner */}
							<div className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<span className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
											Level {progression.level} ·{" "}
											{getRankTitleForLevel(progression.level)}
										</span>
										<h3
											className="mt-0.5 text-sm font-semibold text-zinc-100"
											id={levelProgressLabelId}
										>
											{progression.xp.toLocaleString()} Total XP (
											{xpInCurrentLevel} / {xpNeededForNextLevel} XP to Level{" "}
											{progression.level + 1})
										</h3>
									</div>
									<div className="flex items-center gap-2 text-xs tabular-nums">
										<span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-300">
											Best Streak: {progression.bestAnswerStreak}x
										</span>
										<span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-300">
											Daily Streak: {progression.currentDailyStreak}d
										</span>
									</div>
								</div>
								<progress
									aria-labelledby={levelProgressLabelId}
									className="mt-3 block h-2 w-full"
									max={xpNeededForNextLevel}
									value={xpInCurrentLevel}
								/>
							</div>

							{/* Kana Row Unlock Progression */}
							<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-xs font-semibold tracking-wider text-zinc-200 uppercase">
											Letter Row Unlock Progression
										</h3>
										<p className="mt-0.5 text-xs text-zinc-400">
											Master unlocked rows (70%+ accuracy across 60% of the row)
											or level up to unlock new Kana rows
										</p>
									</div>
									<span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 tabular-nums">
										{progression.unlockAllRows
											? KANA_ROW_GROUPS.length
											: progression.unlockedRowIds.length}{" "}
										/ {KANA_ROW_GROUPS.length} Rows
									</span>
								</div>

								<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
									{KANA_ROW_GROUPS.map((group) => {
										const isUnlocked =
											progression.unlockAllRows ||
											progression.unlockedRowIds.includes(group.id);
										const rowSummary = getRowMasterySummary(
											group.id,
											masteryMap
										);
										return (
											<div
												key={group.id}
												className={`rounded-lg border p-2.5 ${
													isUnlocked
														? "border-zinc-800 bg-zinc-950/70 text-zinc-200"
														: "border-zinc-900 bg-zinc-950/30 text-zinc-500"
												}`}
											>
												<div className="flex items-center justify-between text-xs font-semibold">
													<span>
														{group.sampleHiragana} {group.label.split(" ")[0]}
													</span>
													<span className="text-[10px] font-normal tabular-nums">
														{isUnlocked
															? `${rowSummary.masteryPercent}%`
															: "Locked"}
													</span>
												</div>
												<progress
													aria-label={`${group.label} mastery progress`}
													className="mt-1.5 block h-1.5 w-full"
													max={100}
													value={isUnlocked ? rowSummary.masteryPercent : 0}
												/>
											</div>
										);
									})}
								</div>
							</div>

							{/* Achievements Category Filter */}
							<div className="flex flex-wrap gap-1.5">
								{(
									[
										{ id: "all", label: "All Achievements" },
										{ id: "streak", label: "Streaks" },
										{ id: "unlock", label: "Unlocking Letters" },
										{ id: "performance", label: "Letter Performance" },
									] as const
								).map((tab) => (
									<button
										key={tab.id}
										type="button"
										className={`kana-interactive rounded-lg px-3 py-1.5 text-xs font-medium ${
											achievementFilter === tab.id
												? "bg-zinc-800 text-zinc-100"
												: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
										}`}
										onClick={(): void => {
											setAchievementFilter(tab.id);
										}}
									>
										{tab.label}
									</button>
								))}
							</div>

							{/* Achievements Grid */}
							<div className="grid gap-2.5 sm:grid-cols-2">
								{filteredAchievements.map((achievement) => (
									<div
										key={achievement.id}
										className={`flex flex-col justify-between rounded-xl border p-3.5 ${
											achievement.isUnlocked
												? "border-emerald-500/40 bg-emerald-950/15"
												: "border-zinc-800/80 bg-zinc-900/30"
										}`}
									>
										<div className="flex items-start gap-3">
											<div
												className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
													achievement.isUnlocked
														? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200"
														: "border-zinc-800 bg-zinc-900 text-zinc-500"
												}`}
											>
												{achievement.badgeSymbol}
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center justify-between gap-2">
													<h4 className="truncate text-xs font-semibold text-zinc-100">
														{achievement.title}
													</h4>
													<span className="shrink-0 text-[10px] font-medium text-zinc-400 tabular-nums">
														+{achievement.xpReward} XP
													</span>
												</div>
												<p className="mt-0.5 text-[11px] text-zinc-400">
													{achievement.description}
												</p>
											</div>
										</div>

										<div className="mt-3">
											<div className="mb-1 flex items-center justify-between text-[10px] text-zinc-400 tabular-nums">
												<span>
													{achievement.isUnlocked
														? "Unlocked"
														: `Progress: ${achievement.currentValue} / ${achievement.targetValue}`}
												</span>
												<span>{achievement.progressPercent}%</span>
											</div>
											<progress
												aria-label={`${achievement.title} progress`}
												className="block h-1.5 w-full"
												max={achievement.targetValue}
												value={Math.min(
													achievement.targetValue,
													achievement.currentValue
												)}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{activeTab === "leaderboard" && (
						<div className="space-y-4">
							{highScores.length === 0 ? (
								<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-8 text-center">
									<p className="text-sm font-medium text-zinc-300">
										No sessions recorded yet
									</p>
									<p className="mt-1 text-xs text-zinc-400">
										Complete a Sprint or Timed session to log your personal
										records locally.
									</p>
								</div>
							) : (
								<div className="divide-y divide-zinc-800/70 rounded-xl border border-zinc-800/80 bg-zinc-900/30">
									{highScores.map((record, index) => (
										<div
											key={record.id}
											className="flex items-center justify-between px-4 py-3"
										>
											<div className="flex items-center gap-3">
												<span className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-[11px] font-medium text-zinc-400 tabular-nums">
													{index + 1}
												</span>
												<div>
													<p className="text-xs font-semibold text-zinc-200 capitalize">
														{record.gameMode.replace("-", " ")} ·{" "}
														{record.scriptMode}
													</p>
													<p className="mt-0.5 text-[11px] text-zinc-400 tabular-nums">
														{record.cardsCleared} cards · {record.accuracy}%
														accuracy · {record.durationSeconds}s
													</p>
												</div>
											</div>
											<div className="text-right tabular-nums">
												<span className="text-sm font-semibold text-zinc-100">
													{record.score.toLocaleString()}
												</span>
												<span className="ml-1 text-[10px] text-zinc-400 uppercase">
													pts
												</span>
											</div>
										</div>
									))}
								</div>
							)}

							<div className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
								<span className="text-xs text-zinc-400">
									Progress, analytics, and achievements are stored locally.
								</span>
								{confirmReset ? (
									<div className="flex items-center gap-2">
										<button
											className="kana-interactive rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
											type="button"
											onClick={(): void => {
												onClearProgress();
												setConfirmReset(false);
											}}
										>
											Confirm Reset
										</button>
										<button
											className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
											type="button"
											onClick={(): void => {
												setConfirmReset(false);
											}}
										>
											Cancel
										</button>
									</div>
								) : (
									<button
										className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/30"
										type="button"
										onClick={(): void => {
											setConfirmReset(true);
										}}
									>
										Reset Progress
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</dialog>
	);
};
