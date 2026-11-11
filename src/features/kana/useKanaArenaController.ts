import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	evaluateCorrectAnswerOutcome,
	getCandidateRowIdsForPreset,
	type KanaArenaController,
	runPhaseViewTransition,
	type ScreenPhase,
	shouldAutoSubmitTypedRomaji,
} from "./arenaHelpers";
import {
	playCorrectSound,
	playVictorySound,
	playWrongSound,
	speakKanaCharacter,
} from "./audioEffects";
import type { RowPresetType } from "./components/LobbyDeckCustomizer";
import type { FeedbackState } from "./components/PlayingStage";
import {
	analyzeKanaPerformance,
	appendDistinctFlashcardToDeck,
	type CharacterMastery,
	clearAllProgress,
	DEFAULT_USER_PROGRESSION,
	evaluateSessionProgression,
	type FlashcardChallenge,
	generateChallengeDeck,
	generateCustomItemsDeck,
	generateWeakLettersDeck,
	getAchievementProgressList,
	type HighScoreRecord,
	loadGameSettings,
	loadHighScores,
	loadMasteryMap,
	loadUserProgression,
	type PracticeFocusMode,
	saveGameSettings,
	saveHighScore,
	saveMasteryMap,
	saveUserProgression,
	scheduleSpacedRetryInDeck,
	type SessionProgressionResult,
	type StoredGameSettings,
	updateCharacterMastery,
	type UserProgression,
} from "./gameStorage";
import type { CodexModalTab } from "./KanaChartModal";
import { KANA_ITEMS, type KanaItem } from "./kanaData";

export const useKanaArenaController = (): KanaArenaController => {
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
	const [practiceFocusMode, setPracticeFocusMode] =
		useState<PracticeFocusMode>("standard");

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
	const sessionStatsRef = useRef({
		attemptCount: 0,
		bestStreak: 0,
		correctCount: 0,
		score: 0,
	});
	const cardShownAtRef = useRef<number>(0);
	const typingInputRef = useRef<HTMLInputElement | null>(null);
	const advanceTimeoutRef = useRef<number | null>(null);
	const lobbyHeadingRef = useRef<HTMLHeadingElement | null>(null);
	const playingStageRef = useRef<HTMLDivElement | null>(null);
	const summaryHeadingRef = useRef<HTMLHeadingElement | null>(null);

	useEffect(() => {
		document.title = "Practice Arena | GoKana Pocket";
	}, []);

	useEffect(() => {
		masteryMapRef.current = masteryMap;
	}, [masteryMap]);

	useEffect(() => {
		progressionRef.current = progression;
	}, [progression]);

	useEffect(() => {
		sessionStatsRef.current = {
			attemptCount,
			bestStreak,
			correctCount,
			score,
		};
	}, [attemptCount, bestStreak, correctCount, score]);

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
			runPhaseViewTransition(
				() => {
					applyStateUpdates();
					setPhase(nextPhase);
				},
				() => {
					focusPhaseTarget(nextPhase);
				}
			);
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
		const selectedSet = new Set(settings.selectedRows);
		const filtered = KANA_ITEMS.filter((item) => selectedSet.has(item.rowId));
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
				updatedScores = saveHighScore({
					accuracy,
					cardsCleared: finalCorrect,
					dateIso: new Date().toISOString(),
					durationSeconds: Math.max(1, finalDuration),
					gameMode: settings.gameMode,
					id: `${Date.now()}`,
					score: finalScore,
					scriptMode: settings.scriptMode,
				});
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

	// Stable 1-second timer effect during gameplay (does not tear down on card answers)
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
						const latest = sessionStatsRef.current;
						finishSession(
							latest.score,
							latest.correctCount,
							latest.attemptCount,
							60,
							latest.bestStreak
						);
						return 0;
					}
					return previous - 1;
				});
			}
		}, 1000);

		return (): void => {
			window.clearInterval(intervalId);
		};
	}, [finishSession, phase, settings.gameMode]);

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
				setDeck((previousDeck) =>
					appendDistinctFlashcardToDeck(
						previousDeck,
						sourcePool,
						settings.scriptMode,
						masteryMapRef.current
					)
				);
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

	const skipWrongFeedbackWait = useCallback((): void => {
		if (feedback?.status !== "wrong") {
			return;
		}
		if (advanceTimeoutRef.current !== null) {
			window.clearTimeout(advanceTimeoutRef.current);
			advanceTimeoutRef.current = null;
		}
		advanceToNextCard(score, correctCount, attemptCount, bestStreak);
	}, [
		advanceToNextCard,
		attemptCount,
		bestStreak,
		correctCount,
		feedback?.status,
		score,
	]);

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
				const outcome = evaluateCorrectAnswerOutcome({
					bestStreak,
					chosenRomaji: normalized,
					currentCard,
					currentStreak: streak,
					responseTimeMilliseconds,
					score,
					showHint,
				});
				const nextCorrect = correctCount + 1;

				setStreak(outcome.nextStreak);
				setBestStreak(outcome.nextBestStreak);
				setScore(outcome.nextScore);
				setCorrectCount(nextCorrect);
				setFeedback(outcome.feedback);
				playCorrectSound(outcome.nextStreak, settings.soundEnabled);

				advanceTimeoutRef.current = window.setTimeout(() => {
					advanceToNextCard(
						outcome.nextScore,
						nextCorrect,
						nextAttempts,
						outcome.nextBestStreak
					);
				}, 280);
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
				setDeck((previousDeck) =>
					scheduleSpacedRetryInDeck(
						previousDeck,
						currentIndex,
						currentCard.item,
						settings.scriptMode
					)
				);
				setFeedback({
					chosenRomaji: normalized,
					expectedRomaji: currentCard.item.romaji,
					responseTimeMilliseconds,
					status: "wrong",
				});
				playWrongSound(settings.soundEnabled);

				advanceTimeoutRef.current = window.setTimeout(() => {
					advanceToNextCard(score, correctCount, nextAttempts, bestStreak);
				}, 1050);
			}
		},
		[
			advanceToNextCard,
			attemptCount,
			bestStreak,
			correctCount,
			currentCard,
			currentIndex,
			feedback,
			score,
			settings.scriptMode,
			settings.soundEnabled,
			showHint,
			streak,
		]
	);

	// Handle keyboard shortcuts during gameplay
	useEffect(() => {
		if (phase !== "playing" || !currentCard) {
			return;
		}
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (feedback !== null) {
				if (
					feedback.status === "wrong" &&
					(event.key === " " || event.key === "Enter")
				) {
					event.preventDefault();
					skipWrongFeedbackWait();
				}
				return;
			}

			if (settings.inputMode === "choice") {
				if (["1", "2", "3", "4"].includes(event.key)) {
					const optionIndex = Number(event.key) - 1;
					const selectedOption = currentCard.options[optionIndex];
					if (selectedOption) {
						event.preventDefault();
						submitAnswer(selectedOption);
					}
				} else if (event.key.toLowerCase() === "h" || event.key === "?") {
					event.preventDefault();
					setShowHint((previous) => !previous);
				} else if (event.key.toLowerCase() === "r") {
					event.preventDefault();
					speakKanaCharacter(currentCard.displayCharacter, true);
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return (): void => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [
		currentCard,
		feedback,
		phase,
		settings.inputMode,
		skipWrongFeedbackWait,
		submitAnswer,
	]);

	const handleTypedInputChange = useCallback(
		(nextText: string): void => {
			if (!currentCard || feedback !== null) {
				return;
			}
			const cleaned = nextText.toLowerCase().replace(/[^a-z]/g, "");
			setTypedValue(cleaned);

			if (
				shouldAutoSubmitTypedRomaji(cleaned, currentCard.item.acceptedRomaji)
			) {
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

	const toggleRowSelection = useCallback(
		(rowId: string): void => {
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
		},
		[isRowUnlocked]
	);

	const toggleUnlockAllRows = useCallback((): void => {
		setProgression((previous) => {
			const updated: UserProgression = {
				...previous,
				unlockAllRows: !previous.unlockAllRows,
			};
			progressionRef.current = updated;
			saveUserProgression(updated);
			return updated;
		});
	}, []);

	const selectPresetRows = useCallback(
		(preset: RowPresetType): void => {
			setPracticeFocusMode("standard");
			const candidateRows = getCandidateRowIdsForPreset(preset);
			const unlockedCandidates = candidateRows.filter((rowId) =>
				isRowUnlocked(rowId)
			);
			if (unlockedCandidates.length === 0) {
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
		},
		[isRowUnlocked]
	);

	const handleUpdateSettings = useCallback(
		(patch: Partial<StoredGameSettings>): void => {
			setSettings((previous) => ({ ...previous, ...patch }));
		},
		[]
	);

	const handleToggleHint = useCallback((): void => {
		setShowHint((previous) => !previous);
	}, []);

	const handleToggleTouchKeyboard = useCallback((): void => {
		setSettings((previous) => ({
			...previous,
			showTouchKeyboard: !previous.showTouchKeyboard,
		}));
	}, []);

	const handleBackspaceTyped = useCallback((): void => {
		setTypedValue((previous) => previous.slice(0, -1));
	}, []);

	const handleEndRun = useCallback((): void => {
		finishSession(
			score,
			correctCount,
			attemptCount,
			elapsedSeconds,
			bestStreak
		);
	}, [
		attemptCount,
		bestStreak,
		correctCount,
		elapsedSeconds,
		finishSession,
		score,
	]);

	const handleOpenChart = useCallback((): void => {
		setCodexInitialTab("chart");
		setIsCodexOpen(true);
	}, []);

	const handleOpenStats = useCallback((): void => {
		setCodexInitialTab("analytics");
		setIsCodexOpen(true);
	}, []);

	const handleOpenAchievements = useCallback((): void => {
		setCodexInitialTab("achievements");
		setIsCodexOpen(true);
	}, []);

	const handleCloseCodex = useCallback((): void => {
		setIsCodexOpen(false);
	}, []);

	const handleToggleSound = useCallback((): void => {
		setSettings((previous) => ({
			...previous,
			soundEnabled: !previous.soundEnabled,
		}));
	}, []);

	const handleToggleVoice = useCallback((): void => {
		setSettings((previous) => ({
			...previous,
			voiceEnabled: !previous.voiceEnabled,
		}));
	}, []);

	const handleTogglePracticeFocusMode = useCallback((): void => {
		setPracticeFocusMode((previous) =>
			previous === "weak-letters" ? "standard" : "weak-letters"
		);
	}, []);

	const handleCustomizeDeck = useCallback((): void => {
		transitionToPhase("lobby", () => {
			setFeedback(null);
		});
	}, [transitionToPhase]);

	const handleClearProgress = useCallback((): void => {
		clearAllProgress();
		masteryMapRef.current = {};
		progressionRef.current = DEFAULT_USER_PROGRESSION;
		setMasteryMap({});
		setProgression(DEFAULT_USER_PROGRESSION);
		setHighScores([]);
	}, []);

	const sessionAccuracy =
		attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 100;

	return {
		achievementStatuses,
		activePool,
		attemptCount,
		bestStreak,
		codexInitialTab,
		correctCount,
		currentCard,
		currentIndex,
		deck,
		elapsedSeconds,
		feedback,
		handleBackspaceTyped,
		handleClearProgress,
		handleCloseCodex,
		handleCustomizeDeck,
		handleEndRun,
		handleOpenAchievements,
		handleOpenChart,
		handleOpenStats,
		handleToggleHint,
		handleTogglePracticeFocusMode,
		handleToggleSound,
		handleToggleTouchKeyboard,
		handleToggleVoice,
		handleTypedInputChange,
		handleUpdateSettings,
		highScores,
		isCodexOpen,
		lastSessionResult,
		lobbyHeadingRef,
		masteryMap,
		missedItems,
		performanceAnalysis,
		phase,
		playingStageRef,
		practiceFocusMode,
		progression,
		remainingSeconds,
		score,
		selectPresetRows,
		sessionAccuracy,
		setCodexInitialTab,
		settings,
		showHint,
		skipWrongFeedbackWait,
		startCustomItemsSession,
		startSession,
		startWeakLettersSession,
		streak,
		submitAnswer,
		summaryHeadingRef,
		toggleRowSelection,
		toggleUnlockAllRows,
		typedValue,
		typingInputRef,
		unlockedAchievementCount,
	};
};
