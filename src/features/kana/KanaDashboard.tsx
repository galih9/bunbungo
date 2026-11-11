import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { FunctionComponent } from "../../common/types";
import { AppBottomNav } from "../../components/layout/AppBottomNav";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { DashboardBreakdownCharts } from "./dashboard/DashboardBreakdownCharts";
import { DashboardCharacterSpotlight } from "./dashboard/DashboardCharacterSpotlight";
import { DashboardExecutiveSummary } from "./dashboard/DashboardExecutiveSummary";
import { DashboardMasteryDonutChart } from "./dashboard/DashboardMasteryDonutChart";
import { DashboardSessionTrendChart } from "./dashboard/DashboardSessionTrendChart";
import {
	type AppRoutePath,
	buildDashboardSummary,
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
	seedSampleDashboardData,
	type StoredGameSettings,
	type StudyRecommendation,
	type UserProgression,
} from "./gameStorage";
import { type CodexModalTab, KanaChartModal } from "./KanaChartModal";
import { KANA_ITEMS } from "./kanaData";

interface KanaDashboardProps {
	readonly onNavigate?: (targetPath: AppRoutePath) => void;
}

export const KanaDashboard = ({
	onNavigate,
}: KanaDashboardProps): FunctionComponent => {
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
	const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
	const [codexInitialTab, setCodexInitialTab] =
		useState<CodexModalTab>("analytics");

	const mainHeadingId = useId();

	useEffect(() => {
		document.title = "Performance Dashboard | Bun Bun Go";
	}, []);

	const summary = useMemo(
		() => buildDashboardSummary(masteryMap, progression, highScores),
		[highScores, masteryMap, progression]
	);

	const achievementStatuses = useMemo(
		() => getAchievementProgressList(progression, masteryMap),
		[masteryMap, progression]
	);

	const unlockedAchievementCount = useMemo(
		() => achievementStatuses.filter((status) => status.isUnlocked).length,
		[achievementStatuses]
	);

	const handleLoadSampleTelemetry = useCallback((): void => {
		const seeded = seedSampleDashboardData();
		setMasteryMap(seeded.masteryMap);
		setProgression(seeded.progression);
		setHighScores(seeded.highScores);
	}, []);

	const handleRecommendationAction = useCallback(
		(recommendation: StudyRecommendation): void => {
			if (recommendation.actionType === "katakana-focus") {
				const updated: StoredGameSettings = {
					...settings,
					scriptMode: "katakana",
				};
				setSettings(updated);
				saveGameSettings(updated);
			} else if (recommendation.actionType === "hiragana-focus") {
				const updated: StoredGameSettings = {
					...settings,
					scriptMode: "hiragana",
				};
				setSettings(updated);
				saveGameSettings(updated);
			}
			navigateToAppPath("/", onNavigate);
		},
		[onNavigate, settings]
	);

	const handleOpenBadges = useCallback((): void => {
		setCodexInitialTab("achievements");
		setIsCodexOpen(true);
	}, []);

	const handleOpenFullTable = useCallback((): void => {
		setCodexInitialTab("analytics");
		setIsCodexOpen(true);
	}, []);

	const handleNavigatePractice = useCallback((): void => {
		navigateToAppPath("/", onNavigate);
	}, [onNavigate]);

	return (
		<div className="safe-shell flex min-h-dvh w-full flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-100 selection:text-zinc-950">
			<AppNavbar
				activePath="/dashboard"
				level={progression.level}
				masteredCount={summary.analysis.strongItems.length}
				skipTargetId={mainHeadingId}
				soundEnabled={settings.soundEnabled}
				totalAchievements={achievementStatuses.length}
				totalKanaCount={KANA_ITEMS.length}
				unlockedAchievements={unlockedAchievementCount}
				voiceEnabled={settings.voiceEnabled}
				weakCount={summary.analysis.weakItems.length}
				onNavigate={onNavigate}
				onOpenStats={handleOpenFullTable}
				onOpenChart={(): void => {
					setCodexInitialTab("chart");
					setIsCodexOpen(true);
				}}
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
				{/* Dashboard Header & Quick Actions */}
				<div className="kana-view-enter flex flex-wrap items-start justify-between gap-4 border-b border-zinc-900 pb-5">
					<div>
						<p className="text-[11px] font-semibold tracking-widest text-emerald-400 uppercase">
							Learner Telemetry & Study Insights
						</p>
						<h1
							className="mt-1 text-2xl font-bold tracking-tight text-zinc-100 focus:outline-none sm:text-3xl"
							id={mainHeadingId}
							tabIndex={-1}
						>
							Performance & Mastery Dashboard
						</h1>
						<p className="mt-1 text-xs text-zinc-400">
							Track your Hiragana and Katakana recognition accuracy, response
							reflex speed, and row-by-row syllabary mastery.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button
							className="kana-interactive rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
							type="button"
							onClick={handleLoadSampleTelemetry}
						>
							{summary.analysis.totalAttempts === 0
								? "Load Sample Telemetry"
								: "Refresh Sample Telemetry"}
						</button>
						<button
							className="kana-interactive rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-white"
							type="button"
							onClick={handleNavigatePractice}
						>
							Start Practice Session →
						</button>
					</div>
				</div>

				{/* Section 1: User's Performance Summary & Rank Progression */}
				<DashboardExecutiveSummary
					progression={progression}
					summary={summary}
					totalAchievements={achievementStatuses.length}
					unlockedAchievementCount={unlockedAchievementCount}
					onOpenBadges={handleOpenBadges}
					onRecommendationAction={handleRecommendationAction}
				/>

				{/* Section 2: Interactive Performance Charts Grid */}
				<section aria-labelledby="charts-section-heading" className="space-y-4">
					<h2
						className="text-sm font-semibold tracking-wide text-zinc-200 uppercase"
						id="charts-section-heading"
					>
						Interactive Mastery & Telemetry Charts
					</h2>

					<div className="grid gap-4 lg:grid-cols-2">
						<DashboardMasteryDonutChart summary={summary} />
						<DashboardSessionTrendChart
							sessionTrend={summary.sessionTrend}
							onLoadSampleTelemetry={handleLoadSampleTelemetry}
						/>
					</div>

					<DashboardBreakdownCharts summary={summary} />
				</section>

				{/* Section 3: Character Performance Spotlight (Weakest & Strongest + Confusions) */}
				<DashboardCharacterSpotlight
					masteryMap={masteryMap}
					summary={summary}
					onDrillWeakLetters={handleNavigatePractice}
					onOpenFullTable={handleOpenFullTable}
				/>
			</main>

			<AppBottomNav
				activePath="/dashboard"
				level={progression.level}
				masteredCount={summary.analysis.strongItems.length}
				totalAchievements={achievementStatuses.length}
				totalKanaCount={KANA_ITEMS.length}
				unlockedAchievements={unlockedAchievementCount}
				weakCount={summary.analysis.weakItems.length}
				onNavigate={onNavigate}
				onOpenStats={handleOpenFullTable}
				onOpenChart={(): void => {
					setCodexInitialTab("chart");
					setIsCodexOpen(true);
				}}
			/>

			<KanaChartModal
				activeTab={codexInitialTab}
				highScores={highScores}
				isOpen={isCodexOpen}
				masteryMap={masteryMap}
				progression={progression}
				voiceEnabled={settings.voiceEnabled}
				onTabChange={setCodexInitialTab}
				onClearProgress={(): void => {
					clearAllProgress();
					setMasteryMap({});
					setProgression(DEFAULT_USER_PROGRESSION);
					setHighScores([]);
				}}
				onClose={(): void => {
					setIsCodexOpen(false);
				}}
				onPracticeWeakLetters={(): void => {
					setIsCodexOpen(false);
					navigateToAppPath("/", onNavigate);
				}}
			/>
		</div>
	);
};
