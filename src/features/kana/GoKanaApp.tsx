import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { FunctionComponent } from "../../common/types";
import {
	playCorrectSound,
	playVictorySound,
	playWrongSound,
	speakKanaCharacter,
} from "./audioEffects";
import {
	analyzeKanaPerformance,
	type CharacterMastery,
	clearAllProgress,
	createFlashcardChallenge,
	DEFAULT_USER_PROGRESSION,
	evaluateSessionProgression,
	type FlashcardChallenge,
	type GameMode,
	generateChallengeDeck,
	generateCustomItemsDeck,
	generateWeakLettersDeck,
	getAchievementProgressList,
	getCharacterAccuracy,
	getCharacterPerformanceTier,
	getRankTitleForLevel,
	getRowMasterySummary,
	getXpThresholdForLevel,
	type HighScoreRecord,
	type InputMode,
	loadGameSettings,
	loadHighScores,
	loadMasteryMap,
	loadUserProgression,
	type PracticeFocusMode,
	saveGameSettings,
	saveHighScore,
	saveMasteryMap,
	saveUserProgression,
	type ScriptSelection,
	type SessionProgressionResult,
	type StoredGameSettings,
	updateCharacterMastery,
	type UserProgression,
} from "./gameStorage";
import { type CodexModalTab, KanaChartModal } from "./KanaChartModal";
import {
	KANA_ITEMS,
	KANA_ROW_GROUPS,
	type KanaCategory,
	type KanaItem,
} from "./kanaData";

type ScreenPhase = "lobby" | "playing" | "summary";

interface FeedbackState {
	readonly status: "correct" | "wrong";
	readonly expectedRomaji: string;
	readonly chosenRomaji: string;
}

type ViewTransitionDocument = Document & {
	startViewTransition?: (updateCallback: () => void) => {
		finished: Promise<void>;
	};
};

const QWERTY_ROWS: Array<Array<string>> = [
	["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
	["a", "s", "d", "f", "g", "h", "j", "k", "l"],
	["z", "x", "c", "v", "b", "n", "m"],
];

export const GoKanaApp = (): FunctionComponent => {
	const [settings, setSettings] = useState<StoredGameSettings>(() =>
		loadGameSettings()
	);
	const [masteryMap, setMasteryMap] = useState<
		Record<string, CharacterMastery>
	>(() => loadMasteryMap());
	const [progression, setProgression] = useState<UserProgression>(() =>
		loadUserProgression()
	);
	const [highScores, setHighScores] = useState<Array<HighScoreRecord>>(() =>
		loadHighScores()
	);
	const [phase, setPhase] = useState<ScreenPhase>("lobby");
	const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
	const [codexInitialTab, setCodexInitialTab] =
		useState<CodexModalTab>("chart");
	const [activeCategoryTab, setActiveCategoryTab] =
		useState<KanaCategory>("monograph");
	const [practiceFocusMode, setPracticeFocusMode] =
		useState<PracticeFocusMode>("standard");

	// Active game session states
	const [deck, setDeck] = useState<Array<FlashcardChallenge>>([]);
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const [score, setScore] = useState<number>(0);
	const [streak, setStreak] = useState<number>(0);
	const [bestStreak, setBestStreak] = useState<number>(0);
	const [correctCount, setCorrectCount] = useState<number>(0);
	const [attemptCount, setAttemptCount] = useState<number>(0);
	const [missedItems, setMissedItems] = useState<Array<KanaItem>>([]);
	const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
	const [remainingSeconds, setRemainingSeconds] = useState<number>(60);
	const [typedValue, setTypedValue] = useState<string>("");
	const [showHint, setShowHint] = useState<boolean>(false);
	const [feedback, setFeedback] = useState<FeedbackState | null>(null);
	const [lastSessionResult, setLastSessionResult] =
		useState<SessionProgressionResult | null>(null);

	const masteryMapRef = useRef<Record<string, CharacterMastery>>(masteryMap);
	const progressionRef = useRef<UserProgression>(progression);
	const cardShownAtRef = useRef<number>(0);
	const typingInputRef = useRef<HTMLInputElement | null>(null);
	const advanceTimeoutRef = useRef<number | null>(null);
	const lobbyHeadingRef = useRef<HTMLHeadingElement | null>(null);
	const playingStageRef = useRef<HTMLDivElement | null>(null);
	const summaryHeadingRef = useRef<HTMLHeadingElement | null>(null);
	const lobbyXpProgressId = useId();

	useEffect(() => {
		masteryMapRef.current = masteryMap;
	}, [masteryMap]);

	useEffect(() => {
		progressionRef.current = progression;
	}, [progression]);

	const focusPhaseTarget = useCallback((targetPhase: ScreenPhase): void => {
		if (targetPhase === "lobby") {
			lobbyHeadingRef.current?.focus();
		} else if (targetPhase === "playing") {
			if (
				typingInputRef.current &&
				document.body.contains(typingInputRef.current)
			) {
				typingInputRef.current.focus();
			} else {
				playingStageRef.current?.focus();
			}
		} else {
			summaryHeadingRef.current?.focus();
		}
	}, []);

	const transitionToPhase = useCallback(
		(nextPhase: ScreenPhase, applyStateUpdates: () => void): void => {
			const transitionDocument = document as ViewTransitionDocument;
			if (typeof transitionDocument.startViewTransition !== "function") {
				applyStateUpdates();
				setPhase(nextPhase);
				window.requestAnimationFrame(() => {
					focusPhaseTarget(nextPhase);
				});
				return;
			}
			const transition = transitionDocument.startViewTransition(() => {
				flushSync(() => {
					applyStateUpdates();
					setPhase(nextPhase);
				});
			});
			void transition.finished.finally(() => {
				focusPhaseTarget(nextPhase);
			});
		},
		[focusPhaseTarget]
	);

	useEffect(() => {
		saveGameSettings(settings);
	}, [settings]);

	useEffect(() => {
		return (): void => {
			if (advanceTimeoutRef.current !== null) {
				window.clearTimeout(advanceTimeoutRef.current);
			}
		};
	}, []);

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

	const activePool = useMemo((): Array<KanaItem> => {
		const filtered = KANA_ITEMS.filter((item) =>
			settings.selectedRows.includes(item.rowId)
		);
		return filtered.length > 0 ? filtered : KANA_ITEMS.slice(0, 15);
	}, [settings.selectedRows]);

	const currentCard: FlashcardChallenge | undefined = deck[currentIndex];

	const finishSession = useCallback(
		(
			finalScore: number,
			finalCorrect: number,
			finalAttempts: number,
			finalDuration: number,
			finalBestStreak: number
		): void => {
			if (advanceTimeoutRef.current !== null) {
				window.clearTimeout(advanceTimeoutRef.current);
				advanceTimeoutRef.current = null;
			}
			playVictorySound(settings.soundEnabled);

			let updatedScores: Array<HighScoreRecord> | null = null;
			if (finalAttempts > 0 && settings.gameMode !== "zen") {
				const accuracy = Math.round((finalCorrect / finalAttempts) * 100);
				const newRecord: HighScoreRecord = {
					id: `${Date.now()}`,
					gameMode: settings.gameMode,
					scriptMode: settings.scriptMode,
					score: finalScore,
					accuracy,
					cardsCleared: finalCorrect,
					durationSeconds: Math.max(1, finalDuration),
					dateIso: new Date().toISOString(),
				};
				updatedScores = saveHighScore(newRecord);
			}

			const progressionResult = evaluateSessionProgression({
				currentProgression: progressionRef.current,
				durationSeconds: Math.max(1, finalDuration),
				masteryMap: masteryMapRef.current,
				sessionAttempts: finalAttempts,
				sessionBestStreak: finalBestStreak,
				sessionCorrect: finalCorrect,
				sessionScore: finalScore,
			});

			progressionRef.current = progressionResult.updatedProgression;

			transitionToPhase("summary", () => {
				setFeedback(null);
				setProgression(progressionResult.updatedProgression);
				setLastSessionResult(progressionResult);
				if (updatedScores !== null) {
					setHighScores(updatedScores);
				}
			});
		},
		[
			settings.gameMode,
			settings.scriptMode,
			settings.soundEnabled,
			transitionToPhase,
		]
	);

	// Timer effect during gameplay
	useEffect(() => {
		if (phase !== "playing") {
			return;
		}
		const intervalId = window.setInterval(() => {
			setElapsedSeconds((previous) => previous + 1);
			if (settings.gameMode === "time-attack") {
				setRemainingSeconds((previous) => {
					if (previous <= 1) {
						window.clearInterval(intervalId);
						finishSession(score, correctCount, attemptCount, 60, bestStreak);
						return 0;
					}
					return previous - 1;
				});
			}
		}, 1000);

		return (): void => {
			window.clearInterval(intervalId);
		};
	}, [
		attemptCount,
		bestStreak,
		correctCount,
		finishSession,
		phase,
		score,
		settings.gameMode,
	]);

	const launchSessionWithDeck = useCallback(
		(
			generatedDeck: Array<FlashcardChallenge>,
			focusMode: PracticeFocusMode
		): void => {
			if (advanceTimeoutRef.current !== null) {
				window.clearTimeout(advanceTimeoutRef.current);
				advanceTimeoutRef.current = null;
			}
			cardShownAtRef.current = Date.now();

			transitionToPhase("playing", () => {
				setPracticeFocusMode(focusMode);
				setDeck(generatedDeck);
				setCurrentIndex(0);
				setScore(0);
				setStreak(0);
				setBestStreak(0);
				setCorrectCount(0);
				setAttemptCount(0);
				setMissedItems([]);
				setElapsedSeconds(0);
				setRemainingSeconds(60);
				setTypedValue("");
				setShowHint(false);
				setFeedback(null);
				setLastSessionResult(null);
			});

			const firstCard = generatedDeck[0];
			if (firstCard && settings.voiceEnabled) {
				speakKanaCharacter(firstCard.displayCharacter, true);
			}
		},
		[settings.voiceEnabled, transitionToPhase]
	);

	const startSession = useCallback((): void => {
		const initialDeckSize =
			settings.gameMode === "sprint" ? settings.sprintDeckSize : 60;
		const generatedDeck =
			practiceFocusMode === "weak-letters"
				? generateWeakLettersDeck(
						masteryMapRef.current,
						settings.scriptMode,
						initialDeckSize,
						settings.selectedRows
					)
				: generateChallengeDeck(
						settings.selectedRows,
						settings.scriptMode,
						initialDeckSize,
						masteryMapRef.current
					);

		launchSessionWithDeck(generatedDeck, practiceFocusMode);
	}, [
		launchSessionWithDeck,
		practiceFocusMode,
		settings.gameMode,
		settings.scriptMode,
		settings.selectedRows,
		settings.sprintDeckSize,
	]);

	const startWeakLettersSession = useCallback((): void => {
		const initialDeckSize =
			settings.gameMode === "sprint" ? settings.sprintDeckSize : 60;
		const generatedDeck = generateWeakLettersDeck(
			masteryMapRef.current,
			settings.scriptMode,
			initialDeckSize,
			settings.selectedRows
		);
		setIsCodexOpen(false);
		launchSessionWithDeck(generatedDeck, "weak-letters");
	}, [
		launchSessionWithDeck,
		settings.gameMode,
		settings.scriptMode,
		settings.selectedRows,
		settings.sprintDeckSize,
	]);

	const startCustomItemsSession = useCallback(
		(targetItems: Array<KanaItem>): void => {
			const initialDeckSize =
				settings.gameMode === "sprint" ? settings.sprintDeckSize : 60;
			const generatedDeck = generateCustomItemsDeck(
				targetItems,
				settings.scriptMode,
				initialDeckSize,
				masteryMapRef.current
			);
			setIsCodexOpen(false);
			launchSessionWithDeck(generatedDeck, "weak-letters");
		},
		[
			launchSessionWithDeck,
			settings.gameMode,
			settings.scriptMode,
			settings.sprintDeckSize,
		]
	);

	const advanceToNextCard = useCallback(
		(
			updatedScore: number,
			updatedCorrect: number,
			updatedAttempts: number,
			updatedBestStreak: number
		): void => {
			setFeedback(null);
			setTypedValue("");
			setShowHint(false);
			cardShownAtRef.current = Date.now();

			const nextIndex = currentIndex + 1;
			if (settings.gameMode === "sprint" && nextIndex >= deck.length) {
				finishSession(
					updatedScore,
					updatedCorrect,
					updatedAttempts,
					elapsedSeconds,
					updatedBestStreak
				);
				return;
			}

			if (nextIndex >= deck.length - 3) {
				const sourcePool =
					practiceFocusMode === "weak-letters" &&
					performanceAnalysis.weakItems.length > 0
						? performanceAnalysis.weakItems
						: activePool;
				const randomItem =
					sourcePool[Math.floor(Math.random() * sourcePool.length)] ??
					KANA_ITEMS[0];
				if (randomItem) {
					setDeck((previousDeck) => [
						...previousDeck,
						createFlashcardChallenge(
							randomItem,
							settings.scriptMode,
							KANA_ITEMS,
							previousDeck.length + 1
						),
					]);
				}
			}

			setCurrentIndex(nextIndex);
			const upcomingCard = deck[nextIndex];
			if (upcomingCard && settings.voiceEnabled) {
				speakKanaCharacter(upcomingCard.displayCharacter, true);
			}
			if (settings.inputMode === "typing" && !settings.showTouchKeyboard) {
				typingInputRef.current?.focus();
			}
		},
		[
			activePool,
			currentIndex,
			deck,
			elapsedSeconds,
			finishSession,
			performanceAnalysis.weakItems,
			practiceFocusMode,
			settings.gameMode,
			settings.inputMode,
			settings.scriptMode,
			settings.showTouchKeyboard,
			settings.voiceEnabled,
		]
	);

	const submitAnswer = useCallback(
		(submittedRomaji: string): void => {
			if (!currentCard || feedback !== null) {
				return;
			}
			const normalized = submittedRomaji.trim().toLowerCase();
			const isCorrect = currentCard.item.acceptedRomaji.includes(normalized);
			const responseTimeMilliseconds = Math.max(
				120,
				Date.now() - cardShownAtRef.current
			);

			const nextAttempts = attemptCount + 1;
			setAttemptCount(nextAttempts);

			const nextMasteryMap = updateCharacterMastery(masteryMapRef.current, {
				chosenRomaji: normalized,
				isCorrect,
				kanaId: currentCard.item.id,
				responseTimeMilliseconds,
				script: currentCard.script,
			});
			masteryMapRef.current = nextMasteryMap;
			saveMasteryMap(nextMasteryMap);
			setMasteryMap(nextMasteryMap);

			if (isCorrect) {
				const nextStreak = streak + 1;
				const nextBestStreak = Math.max(bestStreak, nextStreak);
				const comboMultiplier = Math.min(4, 1 + Math.floor(nextStreak / 5));
				const pointsEarned = 100 * comboMultiplier + (showHint ? 0 : 25);
				const nextScore = score + pointsEarned;
				const nextCorrect = correctCount + 1;

				setStreak(nextStreak);
				setBestStreak(nextBestStreak);
				setScore(nextScore);
				setCorrectCount(nextCorrect);
				setFeedback({
					status: "correct",
					expectedRomaji: currentCard.item.romaji,
					chosenRomaji: normalized,
				});
				playCorrectSound(nextStreak, settings.soundEnabled);

				advanceTimeoutRef.current = window.setTimeout(() => {
					advanceToNextCard(
						nextScore,
						nextCorrect,
						nextAttempts,
						nextBestStreak
					);
				}, 260);
			} else {
				setStreak(0);
				setMissedItems((previousMissed) => {
					if (
						previousMissed.some(
							(existingItem) => existingItem.id === currentCard.item.id
						)
					) {
						return previousMissed;
					}
					return [...previousMissed, currentCard.item];
				});
				setFeedback({
					status: "wrong",
					expectedRomaji: currentCard.item.romaji,
					chosenRomaji: normalized,
				});
				playWrongSound(settings.soundEnabled);

				advanceTimeoutRef.current = window.setTimeout(() => {
					advanceToNextCard(score, correctCount, nextAttempts, bestStreak);
				}, 920);
			}
		},
		[
			advanceToNextCard,
			attemptCount,
			bestStreak,
			correctCount,
			currentCard,
			feedback,
			score,
			settings.soundEnabled,
			showHint,
			streak,
		]
	);

	// Handle keyboard shortcuts during gameplay
	useEffect(() => {
		if (phase !== "playing" || !currentCard || feedback !== null) {
			return;
		}
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (
				settings.inputMode === "choice" &&
				["1", "2", "3", "4"].includes(event.key)
			) {
				const optionIndex = Number(event.key) - 1;
				const selectedOption = currentCard.options[optionIndex];
				if (selectedOption) {
					event.preventDefault();
					submitAnswer(selectedOption);
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return (): void => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [currentCard, feedback, phase, settings.inputMode, submitAnswer]);

	const handleTypedInputChange = useCallback(
		(nextText: string): void => {
			if (!currentCard || feedback !== null) {
				return;
			}
			const cleaned = nextText.toLowerCase().replace(/[^a-z]/g, "");
			setTypedValue(cleaned);

			if (currentCard.item.acceptedRomaji.includes(cleaned)) {
				submitAnswer(cleaned);
				return;
			}

			const isPrefixOfValid = currentCard.item.acceptedRomaji.some((valid) =>
				valid.startsWith(cleaned)
			);
			const maxValidLength = Math.max(
				...currentCard.item.acceptedRomaji.map((valid) => valid.length)
			);
			if (cleaned.length >= maxValidLength && !isPrefixOfValid) {
				submitAnswer(cleaned);
			}
		},
		[currentCard, feedback, submitAnswer]
	);

	const isRowUnlocked = useCallback(
		(rowId: string): boolean => {
			return (
				progression.unlockAllRows || progression.unlockedRowIds.includes(rowId)
			);
		},
		[progression.unlockAllRows, progression.unlockedRowIds]
	);

	const toggleRowSelection = (rowId: string): void => {
		if (!isRowUnlocked(rowId)) {
			return;
		}
		setPracticeFocusMode("standard");
		setSettings((previous) => {
			const exists = previous.selectedRows.includes(rowId);
			if (exists && previous.selectedRows.length <= 1) {
				return previous;
			}
			const nextRows = exists
				? previous.selectedRows.filter((item) => item !== rowId)
				: [...previous.selectedRows, rowId];
			return {
				...previous,
				selectedRows: nextRows,
			};
		});
	};

	const toggleUnlockAllRows = (): void => {
		setProgression((previous) => {
			const updated: UserProgression = {
				...previous,
				unlockAllRows: !previous.unlockAllRows,
			};
			progressionRef.current = updated;
			saveUserProgression(updated);
			return updated;
		});
	};

	const selectPresetRows = (
		preset: "basic" | "dakuten" | "digraph" | "all" | "starter"
	): void => {
		setPracticeFocusMode("standard");
		let candidateRows: Array<string> = [];
		if (preset === "starter") {
			candidateRows = ["row-a", "row-ka", "row-sa"];
		} else if (preset === "basic") {
			candidateRows = KANA_ROW_GROUPS.filter(
				(group) => group.category === "monograph"
			).map((group) => group.id);
		} else if (preset === "dakuten") {
			candidateRows = KANA_ROW_GROUPS.filter(
				(group) => group.category === "diacritic"
			).map((group) => group.id);
		} else if (preset === "digraph") {
			candidateRows = KANA_ROW_GROUPS.filter(
				(group) => group.category === "digraph"
			).map((group) => group.id);
		} else {
			candidateRows = KANA_ROW_GROUPS.map((group) => group.id);
		}

		const unlockedCandidates = candidateRows.filter((rowId) =>
			isRowUnlocked(rowId)
		);
		if (unlockedCandidates.length === 0) {
			// If user explicitly clicks a preset whose rows are locked, unlock all rows for convenience
			setProgression((previous) => {
				const updated: UserProgression = {
					...previous,
					unlockAllRows: true,
				};
				progressionRef.current = updated;
				saveUserProgression(updated);
				return updated;
			});
			setSettings((previous) => ({
				...previous,
				selectedRows: candidateRows,
			}));
			return;
		}

		setSettings((previous) => ({
			...previous,
			selectedRows: unlockedCandidates,
		}));
	};

	const totalMasteredCount = performanceAnalysis.strongItems.length;

	const sessionAccuracy =
		attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 100;

	const currentLevelFloorXp = getXpThresholdForLevel(progression.level);
	const nextLevelFloorXp = getXpThresholdForLevel(progression.level + 1);
	const xpInCurrentLevel = Math.max(0, progression.xp - currentLevelFloorXp);
	const xpNeededForNextLevel = Math.max(
		1,
		nextLevelFloorXp - currentLevelFloorXp
	);

	return (
		<div className="safe-shell flex min-h-dvh w-full flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-100 selection:text-zinc-950">
			{/* Minimal Top Header */}
			<header className="sticky top-0 z-20 border-b border-zinc-900 bg-zinc-950/85 backdrop-blur-md">
				<div className="toolbar mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-base font-semibold text-zinc-100">
							あ
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-sm font-semibold tracking-tight text-zinc-100">
									GoKana Pocket
								</h1>
								<span className="rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-zinc-400">
									Lv.{progression.level}
								</span>
							</div>
							<p className="text-[11px] text-zinc-500">
								{getRankTitleForLevel(progression.level)} ·{" "}
								{unlockedAchievementCount}/{achievementStatuses.length} Badges
							</p>
						</div>
					</div>

					<div className="flex items-center gap-1.5">
						<button
							type="button"
							aria-label={
								settings.soundEnabled
									? "Mute sound effects"
									: "Unmute sound effects"
							}
							className={`kana-interactive inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
								settings.soundEnabled
									? "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700"
									: "border-zinc-900 bg-zinc-950 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400"
							}`}
							onClick={(): void => {
								setSettings((previous) => ({
									...previous,
									soundEnabled: !previous.soundEnabled,
								}));
							}}
						>
							<span
								aria-hidden="true"
								className={`h-1.5 w-1.5 rounded-full ${
									settings.soundEnabled ? "bg-emerald-400" : "bg-zinc-700"
								}`}
							/>
							<span>SFX</span>
						</button>

						<button
							type="button"
							aria-label={
								settings.voiceEnabled
									? "Disable kana voice pronunciation"
									: "Enable kana voice pronunciation"
							}
							className={`kana-interactive inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
								settings.voiceEnabled
									? "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700"
									: "border-zinc-900 bg-zinc-950 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400"
							}`}
							onClick={(): void => {
								setSettings((previous) => ({
									...previous,
									voiceEnabled: !previous.voiceEnabled,
								}));
							}}
						>
							<span
								aria-hidden="true"
								className={`h-1.5 w-1.5 rounded-full ${
									settings.voiceEnabled ? "bg-emerald-400" : "bg-zinc-700"
								}`}
							/>
							<span>Voice</span>
						</button>

						<button
							className="kana-interactive inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
							type="button"
							onClick={(): void => {
								setCodexInitialTab("analytics");
								setIsCodexOpen(true);
							}}
						>
							<span>Stats</span>
							{performanceAnalysis.weakItems.length > 0 && (
								<span className="rounded bg-rose-500/20 px-1 text-[10px] font-semibold text-rose-300 tabular-nums">
									{performanceAnalysis.weakItems.length}
								</span>
							)}
						</button>

						<button
							className="kana-interactive inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
							type="button"
							onClick={(): void => {
								setCodexInitialTab("chart");
								setIsCodexOpen(true);
							}}
						>
							<span>Chart</span>
							<span className="text-[11px] text-zinc-400 tabular-nums">
								{totalMasteredCount}/{KANA_ITEMS.length}
							</span>
						</button>
					</div>
				</div>
			</header>

			{/* Main Content Area */}
			<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-5">
				{phase === "lobby" && (
					<div className="kana-view-enter flex flex-1 flex-col justify-between gap-6 pb-2">
						<div className="space-y-6">
							{/* Progression & Weak-Letter Performance Banner */}
							<section
								aria-label="Player progression and letter analytics"
								className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-4"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<div className="flex items-center gap-2">
											<span className="text-xs font-semibold text-zinc-100">
												Level {progression.level} ·{" "}
												{getRankTitleForLevel(progression.level)}
											</span>
											<span
												className="text-[11px] text-zinc-400 tabular-nums"
												id={lobbyXpProgressId}
											>
												{progression.xp} XP
											</span>
										</div>
										<p className="mt-0.5 text-[11px] text-zinc-400">
											{performanceAnalysis.strongItems.length} strong ·{" "}
											{performanceAnalysis.learningItems.length} learning ·{" "}
											<span
												className={
													performanceAnalysis.weakItems.length > 0
														? "font-medium text-rose-300"
														: "text-zinc-400"
												}
											>
												{performanceAnalysis.weakItems.length} weak
											</span>{" "}
											· Best streak {progression.bestAnswerStreak}x
										</p>
									</div>

									<div className="flex flex-wrap items-center gap-1.5">
										<button
											className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
											type="button"
											onClick={(): void => {
												setCodexInitialTab("achievements");
												setIsCodexOpen(true);
											}}
										>
											Achievements ({unlockedAchievementCount}/
											{achievementStatuses.length})
										</button>
										<button
											type="button"
											className={`kana-interactive rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
												practiceFocusMode === "weak-letters"
													? "border-rose-400/60 bg-rose-950/40 text-rose-200"
													: "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700"
											}`}
											onClick={(): void => {
												setPracticeFocusMode((previous) =>
													previous === "weak-letters"
														? "standard"
														: "weak-letters"
												);
											}}
										>
											{practiceFocusMode === "weak-letters"
												? "✓ Weak Letters Mode"
												: `Practice Weak Letters (${performanceAnalysis.weakItems.length})`}
										</button>
									</div>
								</div>

								<progress
									aria-labelledby={lobbyXpProgressId}
									className="mt-3 block h-1.5 w-full"
									max={xpNeededForNextLevel}
									value={xpInCurrentLevel}
								/>

								{performanceAnalysis.weakItems.length > 0 && (
									<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/70 pt-2.5">
										<div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
											<span>Needs focus:</span>
											{performanceAnalysis.weakItems.slice(0, 6).map((item) => {
												const accuracy = getCharacterAccuracy(
													masteryMap[item.id]
												);
												return (
													<span
														key={item.id}
														className="rounded-md border border-rose-500/30 bg-rose-950/30 px-1.5 py-0.5 text-[11px] font-medium text-rose-200"
													>
														{item.hiragana} {item.romaji} ({accuracy ?? 0}%)
													</span>
												);
											})}
										</div>
										<button
											className="kana-interactive text-[11px] font-semibold text-rose-300 underline-offset-2 hover:text-rose-200 hover:underline"
											type="button"
											onClick={startWeakLettersSession}
										>
											Drill Weak Letters Now →
										</button>
									</div>
								)}
							</section>

							{/* Section 1: Writing System */}
							<section aria-label="Script selection" className="space-y-2.5">
								<div className="flex items-center justify-between">
									<h2
										ref={lobbyHeadingRef}
										className="text-xs font-medium tracking-wider text-zinc-400 uppercase focus:outline-none"
										tabIndex={-1}
									>
										Writing System
									</h2>
									<span className="text-xs text-zinc-400 tabular-nums">
										{practiceFocusMode === "weak-letters"
											? `Focusing on ${Math.max(1, performanceAnalysis.weakItems.length || performanceAnalysis.learningItems.length)} weak/learning kana`
											: `${activePool.length} kana selected`}
									</span>
								</div>

								<div className="grid grid-cols-3 gap-2.5">
									{(
										[
											{
												id: "hiragana",
												title: "Hiragana",
												symbol: "あ",
												subtitle: "Native script",
											},
											{
												id: "katakana",
												title: "Katakana",
												symbol: "ア",
												subtitle: "Loanword script",
											},
											{
												id: "mixed",
												title: "Mixed",
												symbol: "あ / ア",
												subtitle: "Both scripts",
											},
										] as Array<{
											id: ScriptSelection;
											title: string;
											symbol: string;
											subtitle: string;
										}>
									).map((option) => {
										const isSelected = settings.scriptMode === option.id;
										return (
											<button
												key={option.id}
												aria-pressed={isSelected}
												type="button"
												className={`kana-interactive flex flex-col items-start justify-between rounded-xl border p-3.5 text-left ${
													isSelected
														? "border-zinc-200 bg-zinc-100 text-zinc-950 shadow-sm"
														: "border-zinc-800/90 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/80"
												}`}
												onClick={(): void => {
													setSettings((previous) => ({
														...previous,
														scriptMode: option.id,
													}));
												}}
											>
												<span
													className={`text-lg font-semibold ${
														isSelected ? "text-zinc-950" : "text-zinc-100"
													}`}
												>
													{option.symbol}
												</span>
												<div className="mt-2.5">
													<span
														className={`block text-xs font-semibold ${
															isSelected ? "text-zinc-950" : "text-zinc-100"
														}`}
													>
														{option.title}
													</span>
													<span
														className={`mt-0.5 block text-[11px] ${
															isSelected ? "text-zinc-600" : "text-zinc-500"
														}`}
													>
														{option.subtitle}
													</span>
												</div>
											</button>
										);
									})}
								</div>
							</section>

							{/* Section 2: Session Mode & Input Style */}
							<section
								aria-label="Game mode and input settings"
								className="grid gap-3 sm:grid-cols-2"
							>
								<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3.5">
									<div className="flex items-center justify-between">
										<h2 className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
											Mode
										</h2>
										<span className="text-[11px] text-zinc-500">
											{settings.gameMode === "sprint"
												? `${settings.sprintDeckSize} cards`
												: settings.gameMode === "time-attack"
													? "60 seconds"
													: "Endless practice"}
										</span>
									</div>
									<div className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg border border-zinc-800/80 bg-zinc-950 p-1">
										{(
											[
												{ id: "sprint", label: "Sprint" },
												{ id: "time-attack", label: "60s Timed" },
												{ id: "zen", label: "Zen" },
											] as Array<{ id: GameMode; label: string }>
										).map((modeOption) => {
											const isSelected = settings.gameMode === modeOption.id;
											return (
												<button
													key={modeOption.id}
													aria-pressed={isSelected}
													type="button"
													className={`kana-interactive rounded-md py-1.5 text-center text-xs font-medium ${
														isSelected
															? "bg-zinc-800 text-zinc-100 shadow-2xs"
															: "text-zinc-400 hover:text-zinc-200"
													}`}
													onClick={(): void => {
														setSettings((previous) => ({
															...previous,
															gameMode: modeOption.id,
														}));
													}}
												>
													{modeOption.label}
												</button>
											);
										})}
									</div>
								</div>

								<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3.5">
									<div className="flex items-center justify-between">
										<h2 className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
											Response
										</h2>
										<span className="text-[11px] text-zinc-500">
											{settings.inputMode === "choice"
												? "Keys 1–4 or tap"
												: "Auto-submit on match"}
										</span>
									</div>
									<div className="mt-2.5 grid grid-cols-2 gap-1 rounded-lg border border-zinc-800/80 bg-zinc-950 p-1">
										{(
											[
												{ id: "choice", label: "Multiple Choice" },
												{ id: "typing", label: "Romaji Typing" },
											] as Array<{ id: InputMode; label: string }>
										).map((inputOption) => {
											const isSelected = settings.inputMode === inputOption.id;
											return (
												<button
													key={inputOption.id}
													aria-pressed={isSelected}
													type="button"
													className={`kana-interactive rounded-md py-1.5 text-center text-xs font-medium ${
														isSelected
															? "bg-zinc-800 text-zinc-100 shadow-2xs"
															: "text-zinc-400 hover:text-zinc-200"
													}`}
													onClick={(): void => {
														setSettings((previous) => ({
															...previous,
															inputMode: inputOption.id,
														}));
													}}
												>
													{inputOption.label}
												</button>
											);
										})}
									</div>
								</div>
							</section>

							{/* Section 3: Kana Row Deck Customizer */}
							<section
								aria-label="Kana row selection"
								className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<div className="flex items-center gap-2">
											<h2 className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
												Character Rows
											</h2>
											<span className="rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400 tabular-nums">
												{progression.unlockAllRows
													? KANA_ROW_GROUPS.length
													: progression.unlockedRowIds.length}
												/{KANA_ROW_GROUPS.length} Unlocked
											</span>
										</div>
										<p className="mt-0.5 text-xs text-zinc-500">
											Master unlocked rows (70%+ accuracy) to unlock the next
											Kana row
										</p>
									</div>
									<div className="flex flex-wrap gap-1">
										<button
											aria-pressed={progression.unlockAllRows}
											type="button"
											className={`kana-interactive rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
												progression.unlockAllRows
													? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
													: "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
											}`}
											onClick={toggleUnlockAllRows}
										>
											{progression.unlockAllRows
												? "Free Practice: All Unlocked"
												: "Unlock All Rows"}
										</button>
										{(
											[
												{ id: "starter", label: "Starter (15)" },
												{ id: "basic", label: "Basic (46)" },
												{ id: "dakuten", label: "Dakuten (25)" },
												{ id: "all", label: "All (104)" },
											] as const
										).map((preset) => (
											<button
												key={preset.id}
												className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
												type="button"
												onClick={(): void => {
													selectPresetRows(preset.id);
												}}
											>
												{preset.label}
											</button>
										))}
									</div>
								</div>

								{/* Category Tabs */}
								<div className="mt-3.5 flex gap-1 border-b border-zinc-800/80 pb-3">
									{(
										[
											{ id: "monograph", label: "Monographs" },
											{ id: "diacritic", label: "Diacritics" },
											{ id: "digraph", label: "Digraphs" },
										] as const
									).map((tab) => (
										<button
											key={tab.id}
											type="button"
											className={`kana-interactive rounded-lg px-3 py-1.5 text-xs font-medium ${
												activeCategoryTab === tab.id
													? "bg-zinc-100 text-zinc-950"
													: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
											}`}
											onClick={(): void => {
												setActiveCategoryTab(tab.id);
											}}
										>
											{tab.label}
										</button>
									))}
								</div>

								{/* Minimalist Row Selection Grid */}
								<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
									{KANA_ROW_GROUPS.filter(
										(group) => group.category === activeCategoryTab
									).map((group) => {
										const unlocked = isRowUnlocked(group.id);
										const isChecked =
											unlocked && settings.selectedRows.includes(group.id);
										const rowSummary = getRowMasterySummary(
											group.id,
											masteryMap
										);
										const sampleDisplay =
											settings.scriptMode === "katakana"
												? group.sampleKatakana
												: settings.scriptMode === "hiragana"
													? group.sampleHiragana
													: `${group.sampleHiragana}/${group.sampleKatakana}`;

										return (
											<button
												key={group.id}
												aria-disabled={!unlocked}
												aria-pressed={isChecked}
												type="button"
												className={`kana-interactive flex items-center justify-between rounded-xl border p-2.5 text-left ${
													!unlocked
														? "cursor-not-allowed border-zinc-900 bg-zinc-950/30 text-zinc-600 opacity-70"
														: isChecked
															? "border-zinc-500 bg-zinc-900 text-zinc-100"
															: "border-zinc-800/70 bg-zinc-950/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
												}`}
												onClick={(): void => {
													toggleRowSelection(group.id);
												}}
											>
												<div className="min-w-0 pr-2">
													<div className="flex items-center gap-2">
														<span
															className={`text-sm font-semibold ${
																isChecked ? "text-zinc-100" : "text-zinc-400"
															}`}
														>
															{sampleDisplay}
														</span>
														<span
															className={`truncate text-xs font-medium ${
																isChecked ? "text-zinc-200" : "text-zinc-400"
															}`}
														>
															{group.label}
														</span>
													</div>
													<p className="mt-0.5 truncate text-[11px] text-zinc-500">
														{unlocked
															? rowSummary.attemptedCount > 0
																? `${rowSummary.masteryPercent}% mastery · ${group.romajiSummary}`
																: group.romajiSummary
															: "Locked · Master prior row"}
													</p>
												</div>
												<span
													aria-hidden="true"
													className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
														!unlocked
															? "bg-zinc-900"
															: isChecked
																? "bg-zinc-100"
																: "bg-zinc-800"
													}`}
												/>
											</button>
										);
									})}
								</div>
							</section>
						</div>

						{/* Launch Button */}
						<div>
							<button
								className="kana-interactive w-full rounded-xl bg-zinc-100 py-3.5 text-sm font-semibold tracking-wide text-zinc-950 shadow-sm hover:bg-white"
								type="button"
								onClick={startSession}
							>
								{practiceFocusMode === "weak-letters"
									? `Start Weak Letters Drill (${Math.max(1, performanceAnalysis.weakItems.length || performanceAnalysis.learningItems.length)} Weak/Learning Kana)`
									: `Start GoKana Session (${activePool.length} Kana)`}
							</button>
						</div>
					</div>
				)}

				{phase === "playing" && currentCard && (
					<div
						ref={playingStageRef}
						className="kana-stage-container kana-view-enter flex flex-1 flex-col justify-between gap-5 focus:outline-none"
						tabIndex={-1}
					>
						{/* Minimal HUD Bar */}
						<div className="space-y-3">
							<div className="flex items-center justify-between gap-2">
								<button
									className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
									type="button"
									onClick={(): void => {
										finishSession(
											score,
											correctCount,
											attemptCount,
											elapsedSeconds,
											bestStreak
										);
									}}
								>
									End Run
								</button>

								<div className="flex items-center gap-2 text-xs tabular-nums">
									{practiceFocusMode === "weak-letters" && (
										<span className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-2 py-1 text-[11px] font-medium text-rose-300">
											Weak Focus
										</span>
									)}
									{settings.gameMode === "time-attack" ? (
										<span
											className={`rounded-lg border px-2.5 py-1 font-medium ${
												remainingSeconds <= 10
													? "border-rose-500/50 bg-rose-950/40 text-rose-300"
													: "border-zinc-800 bg-zinc-900/70 text-zinc-300"
											}`}
										>
											{remainingSeconds}s
										</span>
									) : (
										<span className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 font-medium text-zinc-300">
											{settings.gameMode === "sprint"
												? `Card ${currentIndex + 1} / ${deck.length}`
												: `Cleared ${correctCount}`}
										</span>
									)}

									<span
										className={`rounded-lg border px-2.5 py-1 font-medium transition-colors ${
											streak >= 5
												? "border-zinc-600 bg-zinc-800 text-zinc-100"
												: "border-zinc-800 bg-zinc-900/70 text-zinc-400"
										}`}
									>
										Streak {streak}x
									</span>

									<span className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 font-semibold text-zinc-100">
										{score.toLocaleString()} pts
									</span>
								</div>
							</div>

							{/* Ultra-slim Progress Line */}
							<div className="h-1 w-full overflow-hidden rounded-full bg-zinc-900">
								<div
									className="h-full rounded-full bg-zinc-200 transition-all duration-300 ease-out"
									style={{
										width:
											settings.gameMode === "sprint"
												? `${Math.min(100, ((currentIndex + 1) / deck.length) * 100)}%`
												: settings.gameMode === "time-attack"
													? `${(remainingSeconds / 60) * 100}%`
													: "100%",
									}}
								/>
							</div>
						</div>

						{/* Center Flashcard Stage */}
						<div
							className={`relative flex flex-1 flex-col items-center justify-center rounded-2xl border p-6 text-center transition-colors duration-200 ${
								feedback?.status === "correct"
									? "kana-card-correct border-emerald-500/60 bg-emerald-950/15"
									: feedback?.status === "wrong"
										? "kana-card-wrong border-rose-500/60 bg-rose-950/15"
										: "border-zinc-800/90 bg-zinc-900/35"
							}`}
						>
							{/* Top Card Meta */}
							<div className="absolute top-4 right-4 left-4 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
										{currentCard.script} · {currentCard.item.category}
									</span>
									{masteryMap[currentCard.item.id] && (
										<span className="rounded border border-zinc-800 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] text-zinc-400 tabular-nums">
											{getCharacterPerformanceTier(
												masteryMap[currentCard.item.id]
											)}
										</span>
									)}
								</div>

								<div className="flex items-center gap-1.5">
									<button
										aria-label="Show pronunciation hint"
										type="button"
										className={`kana-interactive rounded-lg border px-2.5 py-1 text-xs font-medium ${
											showHint
												? "border-zinc-600 bg-zinc-800 text-zinc-100"
												: "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
										}`}
										onClick={(): void => {
											setShowHint((previous) => !previous);
										}}
									>
										Hint
									</button>
									<button
										aria-label="Speak character aloud"
										className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
										type="button"
										onClick={(): void => {
											speakKanaCharacter(currentCard.displayCharacter, true);
										}}
									>
										Audio
									</button>
								</div>
							</div>

							{/* Giant Animated Kana Character */}
							<div
								key={currentCard.cardId}
								className="kana-glyph-enter kana-hero-glyph my-6 font-bold tracking-tight text-zinc-100 select-none"
							>
								{currentCard.displayCharacter}
							</div>

							{/* Reserved Feedback / Hint Slot */}
							<div className="flex min-h-9 items-center justify-center">
								{feedback ? (
									feedback.status === "correct" ? (
										<div className="kana-view-enter inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
											<span>Correct</span>
											<span className="uppercase">
												· {feedback.expectedRomaji}
											</span>
										</div>
									) : (
										<div className="kana-view-enter inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-medium text-rose-200">
											<span>
												Expected{" "}
												<strong className="font-semibold text-white uppercase">
													{feedback.expectedRomaji}
												</strong>
											</span>
											<span className="text-rose-300/80">
												· {currentCard.item.hint}
											</span>
										</div>
									)
								) : showHint ? (
									<p className="kana-view-enter rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
										{currentCard.item.hint} ·{" "}
										<span className="text-zinc-400">
											starts with &ldquo;{currentCard.item.romaji[0]}&rdquo;
										</span>
									</p>
								) : (
									<p className="text-xs text-zinc-500">
										{settings.inputMode === "choice"
											? "Select matching romaji or press 1–4"
											: "Type romaji below"}
									</p>
								)}
							</div>
						</div>

						{/* Answer Controls */}
						{settings.inputMode === "choice" ? (
							<div className="grid grid-cols-2 gap-2.5 pb-1">
								{currentCard.options.map((optionRomaji, optionIndex) => {
									const isCorrectOption =
										feedback !== null &&
										optionRomaji === currentCard.item.romaji;
									const isWrongChosen =
										feedback?.status === "wrong" &&
										feedback.chosenRomaji === optionRomaji;

									let buttonStyle =
										"border-zinc-800 bg-zinc-900/60 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900";
									if (isCorrectOption) {
										buttonStyle =
											"border-emerald-500/80 bg-emerald-500/20 text-emerald-100";
									} else if (isWrongChosen) {
										buttonStyle =
											"border-rose-500/80 bg-rose-500/20 text-rose-200";
									}

									return (
										<button
											key={optionRomaji}
											className={`kana-interactive relative flex min-h-15 items-center justify-center rounded-xl border px-4 py-3.5 text-lg font-semibold tracking-wide uppercase ${buttonStyle}`}
											disabled={feedback !== null}
											type="button"
											onClick={(): void => {
												submitAnswer(optionRomaji);
											}}
										>
											<span className="absolute left-3.5 text-[11px] font-medium text-zinc-500 tabular-nums">
												{optionIndex + 1}
											</span>
											<span>{optionRomaji}</span>
										</button>
									);
								})}
							</div>
						) : (
							<div className="space-y-3 pb-1">
								<form
									className="flex gap-2"
									onSubmit={(event): void => {
										event.preventDefault();
										if (typedValue.trim().length > 0) {
											submitAnswer(typedValue);
										}
									}}
								>
									<input
										ref={typingInputRef}
										aria-label="Type Romaji for the displayed Kana"
										autoCapitalize="none"
										autoComplete="off"
										autoCorrect="off"
										className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-center text-xl font-semibold tracking-widest text-zinc-100 uppercase placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
										placeholder="Type romaji (ka, shi, tsu)..."
										spellCheck={false}
										type="text"
										value={typedValue}
										onChange={(event): void => {
											handleTypedInputChange(event.target.value);
										}}
									/>
									<button
										className="kana-interactive rounded-xl bg-zinc-100 px-5 py-3 text-xs font-semibold text-zinc-950 hover:bg-white"
										type="submit"
									>
										Submit
									</button>
								</form>

								{/* Toggleable Mobile On-Screen Romaji Keypad */}
								<div className="space-y-1.5">
									<div className="flex items-center justify-between px-1">
										<span className="text-[11px] text-zinc-500">
											Auto-matches valid romaji immediately
										</span>
										<button
											className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200"
											type="button"
											onClick={(): void => {
												setSettings((previous) => ({
													...previous,
													showTouchKeyboard: !previous.showTouchKeyboard,
												}));
											}}
										>
											{settings.showTouchKeyboard
												? "Hide Touch Keypad"
												: "Show Touch Keypad"}
										</button>
									</div>

									{settings.showTouchKeyboard && (
										<div className="space-y-1.5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-2">
											{QWERTY_ROWS.map((rowKeys, rowIndex) => (
												<div
													key={`kb-row-${rowIndex}`}
													className="flex justify-center gap-1"
												>
													{rowKeys.map((letter) => (
														<button
															key={letter}
															className="kana-interactive flex h-10 flex-1 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-200 uppercase hover:border-zinc-700 hover:bg-zinc-800"
															type="button"
															onClick={(): void => {
																handleTypedInputChange(typedValue + letter);
															}}
														>
															{letter}
														</button>
													))}
													{rowIndex === 2 && (
														<button
															aria-label="Backspace"
															className="kana-interactive flex h-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200"
															type="button"
															onClick={(): void => {
																setTypedValue((previous) =>
																	previous.slice(0, -1)
																);
															}}
														>
															Del
														</button>
													)}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{phase === "summary" && (
					<div className="kana-view-enter flex flex-1 flex-col justify-between gap-6 py-2">
						<div className="space-y-6 rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-6 text-center">
							<div>
								<p className="text-[11px] font-medium tracking-widest text-zinc-500 uppercase">
									{settings.gameMode.replace("-", " ")} · {settings.scriptMode}
								</p>
								<h2
									ref={summaryHeadingRef}
									className="mt-1 text-xl font-semibold tracking-tight text-zinc-100 focus:outline-none"
									tabIndex={-1}
								>
									Session Complete
								</h2>
								{lastSessionResult && lastSessionResult.xpEarned > 0 && (
									<p className="mt-1 text-xs font-medium text-emerald-300">
										+{lastSessionResult.xpEarned} XP Earned · Level{" "}
										{lastSessionResult.newLevel}
										{lastSessionResult.newLevel >
										lastSessionResult.previousLevel
											? " (Level Up!)"
											: ""}
									</p>
								)}
							</div>

							{/* Score & Metrics Grid */}
							<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
								<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
									<span className="block text-[11px] font-medium text-zinc-500 uppercase">
										Score
									</span>
									<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
										{score.toLocaleString()}
									</span>
								</div>
								<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
									<span className="block text-[11px] font-medium text-zinc-500 uppercase">
										Accuracy
									</span>
									<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
										{sessionAccuracy}%
									</span>
								</div>
								<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
									<span className="block text-[11px] font-medium text-zinc-500 uppercase">
										Best Streak
									</span>
									<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
										{bestStreak}x
									</span>
								</div>
								<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
									<span className="block text-[11px] font-medium text-zinc-500 uppercase">
										Duration
									</span>
									<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
										{elapsedSeconds}s
									</span>
								</div>
							</div>

							{/* Newly Unlocked Rows Celebration */}
							{lastSessionResult &&
								lastSessionResult.newlyUnlockedRows.length > 0 && (
									<div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-left">
										<h3 className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
											New Kana Rows Unlocked (
											{lastSessionResult.newlyUnlockedRows.length})
										</h3>
										<div className="mt-2 flex flex-wrap gap-2">
											{lastSessionResult.newlyUnlockedRows.map((rowGroup) => (
												<span
													key={rowGroup.id}
													className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-100"
												>
													{rowGroup.sampleHiragana} {rowGroup.label} (
													{rowGroup.romajiSummary})
												</span>
											))}
										</div>
									</div>
								)}

							{/* Newly Unlocked Achievements Celebration */}
							{lastSessionResult &&
								lastSessionResult.newlyUnlockedAchievements.length > 0 && (
									<div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-left">
										<h3 className="text-xs font-semibold tracking-wider text-amber-300 uppercase">
											Achievements Unlocked (
											{lastSessionResult.newlyUnlockedAchievements.length})
										</h3>
										<div className="mt-2 grid gap-2 sm:grid-cols-2">
											{lastSessionResult.newlyUnlockedAchievements.map(
												(achievement) => (
													<div
														key={achievement.id}
														className="flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-zinc-950/70 p-2.5"
													>
														<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/20 text-xs font-bold text-amber-200">
															{achievement.badgeSymbol}
														</span>
														<div>
															<p className="text-xs font-semibold text-zinc-100">
																{achievement.title}
															</p>
															<p className="text-[11px] text-zinc-400">
																{achievement.description}
															</p>
														</div>
													</div>
												)
											)}
										</div>
									</div>
								)}

							{/* Missed Characters Review Section */}
							{missedItems.length > 0 ? (
								<div className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-4 text-left">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<h3 className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
											Characters to Review ({missedItems.length})
										</h3>
										<button
											className="kana-interactive rounded-lg border border-rose-500/40 bg-rose-950/30 px-2.5 py-1 text-xs font-medium text-rose-200 hover:bg-rose-950/50"
											type="button"
											onClick={(): void => {
												startCustomItemsSession(missedItems);
											}}
										>
											Practice Missed Letters Now
										</button>
									</div>
									<div className="mt-3 flex flex-wrap gap-2">
										{missedItems.map((item) => (
											<button
												key={item.id}
												className="kana-interactive flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left hover:border-zinc-700"
												type="button"
												onClick={(): void => {
													speakKanaCharacter(item.hiragana, true);
												}}
											>
												<span className="text-lg font-semibold text-zinc-100">
													{settings.scriptMode === "katakana"
														? item.katakana
														: item.hiragana}
												</span>
												<div>
													<span className="block text-xs font-semibold text-zinc-200 uppercase">
														{item.romaji}
													</span>
													<span className="block text-[10px] text-zinc-500">
														{item.hiragana} / {item.katakana}
													</span>
												</div>
											</button>
										))}
									</div>
								</div>
							) : (
								<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
									<p className="text-xs font-medium text-zinc-300">
										Flawless session — zero characters missed.
									</p>
								</div>
							)}
						</div>

						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							<button
								className="kana-interactive rounded-xl border border-zinc-800 bg-zinc-900 py-3.5 text-xs font-semibold text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
								type="button"
								onClick={(): void => {
									transitionToPhase("lobby", () => {
										setFeedback(null);
									});
								}}
							>
								Customize Deck
							</button>
							<button
								className="kana-interactive rounded-xl border border-zinc-800 bg-zinc-900 py-3.5 text-xs font-semibold text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
								type="button"
								onClick={startWeakLettersSession}
							>
								Practice Weak ({performanceAnalysis.weakItems.length})
							</button>
							<button
								className="kana-interactive col-span-2 rounded-xl bg-zinc-100 py-3.5 text-xs font-semibold text-zinc-950 hover:bg-white sm:col-span-1"
								type="button"
								onClick={startSession}
							>
								Play Again
							</button>
						</div>
					</div>
				)}
			</main>

			{/* Native Dialog Modal for Reference Chart, Analytics, Achievements & Leaderboard */}
			<KanaChartModal
				activeTab={codexInitialTab}
				highScores={highScores}
				isOpen={isCodexOpen}
				masteryMap={masteryMap}
				progression={progression}
				voiceEnabled={settings.voiceEnabled}
				onPracticeWeakLetters={startWeakLettersSession}
				onTabChange={setCodexInitialTab}
				onClearProgress={(): void => {
					clearAllProgress();
					masteryMapRef.current = {};
					progressionRef.current = DEFAULT_USER_PROGRESSION;
					setMasteryMap({});
					setProgression(DEFAULT_USER_PROGRESSION);
					setHighScores([]);
				}}
				onClose={(): void => {
					setIsCodexOpen(false);
				}}
			/>
		</div>
	);
};
