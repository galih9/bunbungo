import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { FunctionComponent } from "../../common/types";
import { AppBottomNav } from "../../components/layout/AppBottomNav";
import { AppNavbar } from "../../components/layout/AppNavbar";
import {
	analyzeKanaPerformance,
	type AppRoutePath,
	type CharacterMastery,
	clearAllProgress,
	DEFAULT_USER_PROGRESSION,
	getAchievementProgressList,
	type HighScoreRecord,
	loadGameSettings,
	loadHighScores,
	loadMasteryMap,
	loadUserProgression,
	navigateToAppPath,
	saveGameSettings,
	type StoredGameSettings,
	type UserProgression,
} from "./gameStorage";
import { KANA_ITEMS } from "./kanaData";
import { CodexAchievementsTab } from "./modal/CodexAchievementsTab";
import { CodexAnalyticsTab } from "./modal/CodexAnalyticsTab";
import { CodexLeaderboardTab } from "./modal/CodexLeaderboardTab";

export type StatsPageSubTab = "analytics" | "achievements" | "leaderboard";

interface KanaStatsPageProps {
	readonly initialTab?: StatsPageSubTab;
	readonly onNavigate?: (targetPath: AppRoutePath) => void;
}

export const KanaStatsPage = ({
	initialTab = "analytics",
	onNavigate,
}: KanaStatsPageProps): FunctionComponent => {
	const [activeSubTab, setActiveSubTab] = useState<StatsPageSubTab>(initialTab);
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

	const mainHeadingId = useId();

	useEffect(() => {
		document.title = "Learner Stats & Achievements | Bun Bun Go";
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

	const handlePracticeWeakLetters = useCallback((): void => {
		navigateToAppPath("/", onNavigate);
	}, [onNavigate]);

	const handleClearProgress = useCallback((): void => {
		clearAllProgress();
		setMasteryMap({});
		setProgression(DEFAULT_USER_PROGRESSION);
		setHighScores([]);
	}, []);

	return (
		<div className="safe-shell flex min-h-dvh w-full flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-100 selection:text-zinc-950">
			<AppNavbar
				activePath="/stats"
				level={progression.level}
				masteredCount={performanceAnalysis.strongItems.length}
				skipTargetId={mainHeadingId}
				soundEnabled={settings.soundEnabled}
				totalAchievements={achievementStatuses.length}
				totalKanaCount={KANA_ITEMS.length}
				unlockedAchievements={unlockedAchievementCount}
				voiceEnabled={settings.voiceEnabled}
				weakCount={performanceAnalysis.weakItems.length}
				onNavigate={onNavigate}
				onToggleSound={(): void => {
					const nextSettings: StoredGameSettings = {
						...settings,
						soundEnabled: !settings.soundEnabled,
					};
					setSettings(nextSettings);
					saveGameSettings(nextSettings);
				}}
				onToggleVoice={(): void => {
					const nextSettings: StoredGameSettings = {
						...settings,
						voiceEnabled: !settings.voiceEnabled,
					};
					setSettings(nextSettings);
					saveGameSettings(nextSettings);
				}}
			/>

			<main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 pt-6 pb-24 sm:pb-28">
				{/* Page Header */}
				<div className="kana-view-enter flex flex-wrap items-start justify-between gap-4 border-b border-zinc-900 pb-5">
					<div>
						<p className="text-[11px] font-semibold tracking-widest text-emerald-400 uppercase">
							Mastery Codex & Learner Analytics
						</p>
						<h1
							className="mt-1 text-2xl font-bold tracking-tight text-zinc-100 focus:outline-none sm:text-3xl"
							id={mainHeadingId}
							tabIndex={-1}
						>
							Learner Stats & Achievements
						</h1>
						<p className="mt-1 text-xs text-zinc-400">
							Review detailed character-by-character accuracy, unlockable rank
							badges, and local arcade session high scores.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* Sub-tab Navigation */}
						<div
							aria-label="Stats sub-views"
							className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-1"
							role="tablist"
						>
							<button
								aria-selected={activeSubTab === "analytics"}
								role="tab"
								type="button"
								className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
									activeSubTab === "analytics"
										? "bg-zinc-800 text-zinc-100 shadow-sm"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
								onClick={(): void => {
									setActiveSubTab("analytics");
								}}
							>
								Analytics Table
							</button>
							<button
								aria-selected={activeSubTab === "achievements"}
								role="tab"
								type="button"
								className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
									activeSubTab === "achievements"
										? "bg-zinc-800 text-zinc-100 shadow-sm"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
								onClick={(): void => {
									setActiveSubTab("achievements");
								}}
							>
								Badges ({unlockedAchievementCount}/{achievementStatuses.length})
							</button>
							<button
								aria-selected={activeSubTab === "leaderboard"}
								role="tab"
								type="button"
								className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
									activeSubTab === "leaderboard"
										? "bg-zinc-800 text-zinc-100 shadow-sm"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
								onClick={(): void => {
									setActiveSubTab("leaderboard");
								}}
							>
								Leaderboard ({highScores.length})
							</button>
						</div>
					</div>
				</div>

				{/* Active Sub-tab View */}
				<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-6">
					{activeSubTab === "analytics" && (
						<CodexAnalyticsTab
							masteryMap={masteryMap}
							performanceAnalysis={performanceAnalysis}
							onPracticeWeakLetters={handlePracticeWeakLetters}
						/>
					)}

					{activeSubTab === "achievements" && (
						<CodexAchievementsTab
							achievementStatuses={achievementStatuses}
							masteryMap={masteryMap}
							progression={progression}
						/>
					)}

					{activeSubTab === "leaderboard" && (
						<CodexLeaderboardTab
							highScores={highScores}
							onClearProgress={handleClearProgress}
						/>
					)}
				</div>
			</main>

			<AppBottomNav
				activePath="/stats"
				level={progression.level}
				masteredCount={performanceAnalysis.strongItems.length}
				totalAchievements={achievementStatuses.length}
				totalKanaCount={KANA_ITEMS.length}
				unlockedAchievements={unlockedAchievementCount}
				weakCount={performanceAnalysis.weakItems.length}
				onNavigate={onNavigate}
			/>
		</div>
	);
};
