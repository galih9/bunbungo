import { memo, useId, useMemo, useState } from "react";
import type { FunctionComponent } from "../../../common/types";
import {
	type AchievementCategory,
	type AchievementStatus,
	type CharacterMastery,
	getRankTitleForLevel,
	getRowMasterySummary,
	getXpThresholdForLevel,
	type UserProgression,
} from "../gameStorage";
import { KANA_ROW_GROUPS } from "../kanaData";

interface CodexAchievementsTabProps {
	readonly achievementStatuses: Array<AchievementStatus>;
	readonly masteryMap: Record<string, CharacterMastery>;
	readonly progression: UserProgression;
}

export const CodexAchievementsTab = memo(function CodexAchievementsTab({
	achievementStatuses,
	masteryMap,
	progression,
}: CodexAchievementsTabProps): FunctionComponent {
	const levelProgressLabelId = useId();
	const [achievementFilter, setAchievementFilter] = useState<
		"all" | AchievementCategory
	>("all");

	const filteredAchievements = useMemo(() => {
		if (achievementFilter === "all") {
			return achievementStatuses;
		}
		return achievementStatuses.filter(
			(status) => status.category === achievementFilter
		);
	}, [achievementFilter, achievementStatuses]);

	const unlockedRowSet = useMemo(
		() => new Set(progression.unlockedRowIds),
		[progression.unlockedRowIds]
	);

	const currentLevelFloorXp = getXpThresholdForLevel(progression.level);
	const nextLevelFloorXp = getXpThresholdForLevel(progression.level + 1);
	const xpInCurrentLevel = Math.max(0, progression.xp - currentLevelFloorXp);
	const xpNeededForNextLevel = Math.max(
		1,
		nextLevelFloorXp - currentLevelFloorXp
	);

	return (
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
							{progression.xp.toLocaleString()} Total XP ({xpInCurrentLevel} /{" "}
							{xpNeededForNextLevel} XP to Level {progression.level + 1})
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
							Master unlocked rows (70%+ accuracy across 60% of the row) or
							level up to unlock new Kana rows
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
							progression.unlockAllRows || unlockedRowSet.has(group.id);
						const rowSummary = getRowMasterySummary(group.id, masteryMap);
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
										{isUnlocked ? `${rowSummary.masteryPercent}%` : "Locked"}
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
	);
});
