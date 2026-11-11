import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { FunctionComponent } from "../../common/types";
import { AppBottomNav } from "../../components/layout/AppBottomNav";
import { AppNavbar } from "../../components/layout/AppNavbar";
import {
	type AppRoutePath,
	type CharacterMastery,
	getAchievementProgressList,
	loadGameSettings,
	loadMasteryMap,
	loadUserProgression,
	navigateToAppPath,
	saveGameSettings,
	type StoredGameSettings,
	type UserProgression,
} from "./gameStorage";
import { KANA_ITEMS, type KanaScript } from "./kanaData";
import { CodexReferenceChartTab } from "./modal/CodexReferenceChartTab";

interface KanaChartPageProps {
	readonly onNavigate?: (targetPath: AppRoutePath) => void;
}

export const KanaChartPage = ({
	onNavigate,
}: KanaChartPageProps): FunctionComponent => {
	const [settings, setSettings] = useState<StoredGameSettings>(() =>
		loadGameSettings()
	);
	const [masteryMap] = useState<Record<string, CharacterMastery>>(() =>
		loadMasteryMap()
	);
	const [progression] = useState<UserProgression>(() => loadUserProgression());
	const [chartScript, setChartScript] = useState<KanaScript>("hiragana");

	const mainHeadingId = useId();

	useEffect(() => {
		document.title = "Kana Syllabary Chart | Bun Bun Go";
	}, []);

	const achievementStatuses = useMemo(
		() => getAchievementProgressList(progression, masteryMap),
		[masteryMap, progression]
	);

	const unlockedAchievementCount = useMemo(
		() => achievementStatuses.filter((status) => status.isUnlocked).length,
		[achievementStatuses]
	);

	const masteredCount = useMemo(
		() =>
			Object.values(masteryMap).filter(
				(item) => item.attempts >= 3 && item.correct / item.attempts >= 0.8
			).length,
		[masteryMap]
	);

	const weakCount = useMemo(
		() =>
			Object.values(masteryMap).filter(
				(item) => item.attempts >= 2 && item.correct / item.attempts < 0.65
			).length,
		[masteryMap]
	);

	const handleNavigatePractice = useCallback((): void => {
		const updatedSettings: StoredGameSettings = {
			...settings,
			scriptMode: chartScript,
		};
		setSettings(updatedSettings);
		saveGameSettings(updatedSettings);
		navigateToAppPath("/", onNavigate);
	}, [chartScript, onNavigate, settings]);

	return (
		<div className="safe-shell flex min-h-dvh w-full flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-100 selection:text-zinc-950">
			<AppNavbar
				activePath="/chart"
				level={progression.level}
				masteredCount={masteredCount}
				skipTargetId={mainHeadingId}
				soundEnabled={settings.soundEnabled}
				totalAchievements={achievementStatuses.length}
				totalKanaCount={KANA_ITEMS.length}
				unlockedAchievements={unlockedAchievementCount}
				voiceEnabled={settings.voiceEnabled}
				weakCount={weakCount}
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
							Syllabary Matrix & Pronunciation Guide
						</p>
						<h1
							className="mt-1 text-2xl font-bold tracking-tight text-zinc-100 focus:outline-none sm:text-3xl"
							id={mainHeadingId}
							tabIndex={-1}
						>
							Kana Syllabary Reference Chart
						</h1>
						<p className="mt-1 text-xs text-zinc-400">
							Explore all 71 Hiragana and Katakana characters. Tap any card for
							native audio pronunciation and mastery metrics.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* Script Switcher */}
						<div
							aria-label="Select syllabary script"
							className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-1"
							role="group"
						>
							<button
								aria-pressed={chartScript === "hiragana"}
								type="button"
								className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
									chartScript === "hiragana"
										? "bg-zinc-800 text-zinc-100 shadow-sm"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
								onClick={(): void => {
									setChartScript("hiragana");
								}}
							>
								Hiragana (あ)
							</button>
							<button
								aria-pressed={chartScript === "katakana"}
								type="button"
								className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
									chartScript === "katakana"
										? "bg-zinc-800 text-zinc-100 shadow-sm"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
								onClick={(): void => {
									setChartScript("katakana");
								}}
							>
								Katakana (ア)
							</button>
						</div>

						<button
							className="kana-interactive rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-white"
							type="button"
							onClick={handleNavigatePractice}
						>
							Practice {chartScript === "hiragana" ? "Hiragana" : "Katakana"} in
							Arena →
						</button>
					</div>
				</div>

				{/* Reference Chart Matrix */}
				<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-6">
					<CodexReferenceChartTab
						chartScript={chartScript}
						masteryMap={masteryMap}
						progression={progression}
						voiceEnabled={settings.voiceEnabled}
					/>
				</div>
			</main>

			<AppBottomNav
				activePath="/chart"
				level={progression.level}
				masteredCount={masteredCount}
				totalAchievements={achievementStatuses.length}
				totalKanaCount={KANA_ITEMS.length}
				unlockedAchievements={unlockedAchievementCount}
				weakCount={weakCount}
				onNavigate={onNavigate}
			/>
		</div>
	);
};
