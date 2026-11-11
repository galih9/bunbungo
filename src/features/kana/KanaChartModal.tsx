import {
	memo,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import type { FunctionComponent } from "../../common/types";
import {
	analyzeKanaPerformance,
	type CharacterMastery,
	getAchievementProgressList,
	type HighScoreRecord,
	type UserProgression,
} from "./gameStorage";
import type { KanaScript } from "./kanaData";
import { CodexAchievementsTab } from "./modal/CodexAchievementsTab";
import { CodexAnalyticsTab } from "./modal/CodexAnalyticsTab";
import { CodexLeaderboardTab } from "./modal/CodexLeaderboardTab";
import { CodexReferenceChartTab } from "./modal/CodexReferenceChartTab";
import { type CodexModalTab, supportsTopLayerExit } from "./modal/modalHelpers";

export type { CodexModalTab } from "./modal/modalHelpers";

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

export const KanaChartModal = memo(function KanaChartModal({
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
}: KanaChartModalProps): FunctionComponent {
	const dialogRef = useRef<HTMLDialogElement | null>(null);
	const titleId = useId();

	const [internalTab, setInternalTab] = useState<CodexModalTab>("chart");
	const activeTab = controlledTab ?? internalTab;
	const setActiveTab = (nextTab: CodexModalTab): void => {
		setInternalTab(nextTab);
		onTabChange?.(nextTab);
	};

	const [chartScript, setChartScript] = useState<KanaScript>("hiragana");

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
						<CodexReferenceChartTab
							chartScript={chartScript}
							masteryMap={masteryMap}
							progression={progression}
							voiceEnabled={voiceEnabled}
						/>
					)}
					{activeTab === "analytics" && (
						<CodexAnalyticsTab
							masteryMap={masteryMap}
							performanceAnalysis={performanceAnalysis}
							onPracticeWeakLetters={onPracticeWeakLetters}
						/>
					)}
					{activeTab === "achievements" && (
						<CodexAchievementsTab
							achievementStatuses={achievementStatuses}
							masteryMap={masteryMap}
							progression={progression}
						/>
					)}
					{activeTab === "leaderboard" && (
						<CodexLeaderboardTab
							highScores={highScores}
							onClearProgress={onClearProgress}
						/>
					)}
				</div>
			</div>
		</dialog>
	);
});
