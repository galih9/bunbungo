import { memo, useId } from "react";
import type { FunctionComponent } from "../../../common/types";
import {
	type CharacterMastery,
	getCharacterAccuracy,
	getRankTitleForLevel,
	getXpThresholdForLevel,
	type KanaPerformanceAnalysis,
	navigateToAppPath,
	type PracticeFocusMode,
	type UserProgression,
} from "../gameStorage";

interface LobbyProgressionBannerProps {
	readonly masteryMap: Record<string, CharacterMastery>;
	readonly performanceAnalysis: KanaPerformanceAnalysis;
	readonly practiceFocusMode: PracticeFocusMode;
	readonly progression: UserProgression;
	readonly totalAchievements: number;
	readonly unlockedAchievementCount: number;
	readonly onOpenAchievements: () => void;
	readonly onStartWeakLettersSession: () => void;
	readonly onTogglePracticeFocusMode: () => void;
}

export const LobbyProgressionBanner = memo(function LobbyProgressionBanner({
	masteryMap,
	performanceAnalysis,
	practiceFocusMode,
	progression,
	totalAchievements,
	unlockedAchievementCount,
	onOpenAchievements,
	onStartWeakLettersSession,
	onTogglePracticeFocusMode,
}: LobbyProgressionBannerProps): FunctionComponent {
	const lobbyXpProgressId = useId();

	const currentLevelFloorXp = getXpThresholdForLevel(progression.level);
	const nextLevelFloorXp = getXpThresholdForLevel(progression.level + 1);
	const xpInCurrentLevel = Math.max(0, progression.xp - currentLevelFloorXp);
	const xpNeededForNextLevel = Math.max(
		1,
		nextLevelFloorXp - currentLevelFloorXp
	);

	return (
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
							navigateToAppPath("/dashboard");
						}}
					>
						Full Dashboard →
					</button>
					<button
						className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
						type="button"
						onClick={onOpenAchievements}
					>
						Achievements ({unlockedAchievementCount}/{totalAchievements})
					</button>
					<button
						type="button"
						className={`kana-interactive rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
							practiceFocusMode === "weak-letters"
								? "border-rose-400/60 bg-rose-950/40 text-rose-200"
								: "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700"
						}`}
						onClick={onTogglePracticeFocusMode}
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
							const accuracy = getCharacterAccuracy(masteryMap[item.id]);
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
						onClick={onStartWeakLettersSession}
					>
						Drill Weak Letters Now →
					</button>
				</div>
			)}
		</section>
	);
});
