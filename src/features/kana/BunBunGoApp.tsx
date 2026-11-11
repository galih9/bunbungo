import { useId } from "react";
import type { FunctionComponent } from "../../common/types";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { LobbyDeckCustomizer } from "./components/LobbyDeckCustomizer";
import { LobbyProgressionBanner } from "./components/LobbyProgressionBanner";
import { PlayingStage } from "./components/PlayingStage";
import { SessionSummaryView } from "./components/SessionSummaryView";
import { KanaChartModal } from "./KanaChartModal";
import { KANA_ITEMS } from "./kanaData";
import { useKanaArenaController } from "./useKanaArenaController";

export const BunBunGoApp = (): FunctionComponent => {
	const mainSkipTargetId = useId();
	const controller = useKanaArenaController();

	return (
		<div className="safe-shell flex min-h-dvh w-full flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-100 selection:text-zinc-950">
			<AppNavbar
				activePath="/"
				level={controller.progression.level}
				masteredCount={controller.performanceAnalysis.strongItems.length}
				skipTargetId={mainSkipTargetId}
				soundEnabled={controller.settings.soundEnabled}
				totalAchievements={controller.achievementStatuses.length}
				totalKanaCount={KANA_ITEMS.length}
				unlockedAchievements={controller.unlockedAchievementCount}
				voiceEnabled={controller.settings.voiceEnabled}
				weakCount={controller.performanceAnalysis.weakItems.length}
				onOpenChart={controller.handleOpenChart}
				onOpenStats={controller.handleOpenStats}
				onToggleSound={controller.handleToggleSound}
				onToggleVoice={controller.handleToggleVoice}
			/>

			<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-5">
				<h1 className="visually-hidden" id={mainSkipTargetId} tabIndex={-1}>
					Bun Bun Go Practice Arena
				</h1>

				{controller.phase === "lobby" && (
					<div className="kana-view-enter flex flex-1 flex-col justify-between gap-6 pb-2">
						<div className="space-y-6">
							<LobbyProgressionBanner
								masteryMap={controller.masteryMap}
								performanceAnalysis={controller.performanceAnalysis}
								practiceFocusMode={controller.practiceFocusMode}
								progression={controller.progression}
								totalAchievements={controller.achievementStatuses.length}
								unlockedAchievementCount={controller.unlockedAchievementCount}
								onOpenAchievements={controller.handleOpenAchievements}
								onStartWeakLettersSession={controller.startWeakLettersSession}
								onTogglePracticeFocusMode={
									controller.handleTogglePracticeFocusMode
								}
							/>

							<LobbyDeckCustomizer
								activePoolCount={controller.activePool.length}
								lobbyHeadingRef={controller.lobbyHeadingRef}
								masteryMap={controller.masteryMap}
								performanceAnalysis={controller.performanceAnalysis}
								practiceFocusMode={controller.practiceFocusMode}
								progression={controller.progression}
								settings={controller.settings}
								onSelectPresetRows={controller.selectPresetRows}
								onToggleRowSelection={controller.toggleRowSelection}
								onToggleUnlockAllRows={controller.toggleUnlockAllRows}
								onUpdateSettings={controller.handleUpdateSettings}
							/>
						</div>

						<div>
							<button
								className="kana-interactive w-full rounded-xl bg-zinc-100 py-3.5 text-sm font-semibold tracking-wide text-zinc-950 shadow-sm hover:bg-white"
								type="button"
								onClick={controller.startSession}
							>
								{controller.practiceFocusMode === "weak-letters"
									? `Start Weak Letters Drill (${Math.max(1, controller.performanceAnalysis.weakItems.length || controller.performanceAnalysis.learningItems.length)} Weak/Learning Kana)`
									: `Start Bun Bun Go Session (${controller.activePool.length} Kana)`}
							</button>
						</div>
					</div>
				)}

				{controller.phase === "playing" && controller.currentCard && (
					<PlayingStage
						attemptCount={controller.attemptCount}
						cardMastery={controller.masteryMap[controller.currentCard.item.id]}
						correctCount={controller.correctCount}
						currentCard={controller.currentCard}
						currentIndex={controller.currentIndex}
						deckLength={controller.deck.length}
						feedback={controller.feedback}
						playingStageRef={controller.playingStageRef}
						practiceFocusMode={controller.practiceFocusMode}
						remainingSeconds={controller.remainingSeconds}
						score={controller.score}
						sessionAccuracy={controller.sessionAccuracy}
						settings={controller.settings}
						showHint={controller.showHint}
						streak={controller.streak}
						typedValue={controller.typedValue}
						typingInputRef={controller.typingInputRef}
						onBackspaceTyped={controller.handleBackspaceTyped}
						onEndRun={controller.handleEndRun}
						onSkipWrongFeedbackWait={controller.skipWrongFeedbackWait}
						onSubmitAnswer={controller.submitAnswer}
						onToggleHint={controller.handleToggleHint}
						onToggleTouchKeyboard={controller.handleToggleTouchKeyboard}
						onTypedInputChange={controller.handleTypedInputChange}
					/>
				)}

				{controller.phase === "summary" && (
					<SessionSummaryView
						bestStreak={controller.bestStreak}
						elapsedSeconds={controller.elapsedSeconds}
						lastSessionResult={controller.lastSessionResult}
						missedItems={controller.missedItems}
						score={controller.score}
						sessionAccuracy={controller.sessionAccuracy}
						settings={controller.settings}
						summaryHeadingRef={controller.summaryHeadingRef}
						weakItemsCount={controller.performanceAnalysis.weakItems.length}
						onCustomizeDeck={controller.handleCustomizeDeck}
						onPlayAgain={controller.startSession}
						onPracticeMissedItems={controller.startCustomItemsSession}
						onPracticeWeakLetters={controller.startWeakLettersSession}
					/>
				)}
			</main>

			<KanaChartModal
				activeTab={controller.codexInitialTab}
				highScores={controller.highScores}
				isOpen={controller.isCodexOpen}
				masteryMap={controller.masteryMap}
				progression={controller.progression}
				voiceEnabled={controller.settings.voiceEnabled}
				onClearProgress={controller.handleClearProgress}
				onClose={controller.handleCloseCodex}
				onPracticeWeakLetters={controller.startWeakLettersSession}
				onTabChange={controller.setCodexInitialTab}
			/>
		</div>
	);
};

export const GoKanaApp = BunBunGoApp;
