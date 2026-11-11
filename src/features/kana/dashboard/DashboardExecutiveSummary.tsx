import { memo, useId } from "react";
import type { FunctionComponent } from "../../../common/types";
import {
	type DashboardSummary,
	getRankTitleForLevel,
	getXpThresholdForLevel,
	type StudyRecommendation,
	type UserProgression,
} from "../gameStorage";
import { KANA_ITEMS } from "../kanaData";

interface DashboardExecutiveSummaryProps {
	readonly progression: UserProgression;
	readonly summary: DashboardSummary;
	readonly totalAchievements: number;
	readonly unlockedAchievementCount: number;
	readonly onOpenBadges: () => void;
	readonly onRecommendationAction: (
		recommendation: StudyRecommendation
	) => void;
}

export const DashboardExecutiveSummary = memo(
	function DashboardExecutiveSummary({
		progression,
		summary,
		totalAchievements,
		unlockedAchievementCount,
		onOpenBadges,
		onRecommendationAction,
	}: DashboardExecutiveSummaryProps): FunctionComponent {
		const xpProgressLabelId = useId();
		const totalKana = KANA_ITEMS.length;

		const currentLevelFloorXp = getXpThresholdForLevel(progression.level);
		const nextLevelFloorXp = getXpThresholdForLevel(progression.level + 1);
		const xpInCurrentLevel = Math.max(0, progression.xp - currentLevelFloorXp);
		const xpNeededForNextLevel = Math.max(
			1,
			nextLevelFloorXp - currentLevelFloorXp
		);

		const formattedAverageSpeed =
			summary.analysis.averageResponseMilliseconds !== null
				? `${(summary.analysis.averageResponseMilliseconds / 1000).toFixed(2)}s`
				: "—";

		return (
			<section
				aria-labelledby="performance-summary-heading"
				className="kana-view-enter space-y-4"
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2
						className="text-sm font-semibold tracking-wide text-zinc-200 uppercase"
						id="performance-summary-heading"
					>
						User&apos;s Performance Summary
					</h2>
					<span className="text-xs text-zinc-400 tabular-nums">
						{progression.totalSessionsCompleted} sessions completed ·{" "}
						{progression.totalCardsAnswered} total cards answered
					</span>
				</div>

				{/* Rank & XP Progression Banner */}
				<div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-3.5">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/30 text-lg font-bold text-emerald-300 tabular-nums">
								Lv.{progression.level}
							</div>
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-base font-semibold text-zinc-100">
										{getRankTitleForLevel(progression.level)}
									</span>
									<span
										className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-300 tabular-nums"
										id={xpProgressLabelId}
									>
										{progression.xp.toLocaleString()} XP Total (
										{xpInCurrentLevel}/{xpNeededForNextLevel} XP to Lv.
										{progression.level + 1})
									</span>
								</div>
								<p className="mt-1 text-xs text-zinc-400">
									Daily streak:{" "}
									<strong className="font-semibold text-zinc-200">
										{progression.currentDailyStreak} days
									</strong>{" "}
									(Best {progression.bestDailyStreak}d) · Best answer streak:{" "}
									<strong className="font-semibold text-zinc-200">
										{progression.bestAnswerStreak}x
									</strong>{" "}
									· Unlocked rows:{" "}
									<strong className="font-semibold text-zinc-200">
										{progression.unlockAllRows
											? 20
											: progression.unlockedRowIds.length}
										/20
									</strong>
								</p>
							</div>
						</div>

						<button
							className="kana-interactive rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700"
							type="button"
							onClick={onOpenBadges}
						>
							View Badges ({unlockedAchievementCount}/{totalAchievements})
						</button>
					</div>

					<progress
						aria-labelledby={xpProgressLabelId}
						className="mt-4 block h-2 w-full"
						max={xpNeededForNextLevel}
						value={xpInCurrentLevel}
					/>
				</div>

				{/* 4 Executive KPI Cards */}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-4">
						<span className="block text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
							Overall Accuracy
						</span>
						<div className="mt-1.5 flex items-baseline gap-2">
							<span className="text-2xl font-bold text-zinc-100 tabular-nums">
								{summary.analysis.overallAccuracy !== null
									? `${summary.analysis.overallAccuracy}%`
									: "—"}
							</span>
							<span className="text-xs text-emerald-400 tabular-nums">
								{summary.analysis.totalCorrect}/{summary.analysis.totalAttempts}
							</span>
						</div>
						<p className="mt-1 text-[11px] text-zinc-500">
							{summary.analysis.overallAccuracy !== null &&
							summary.analysis.overallAccuracy >= 85
								? "High precision recognition"
								: summary.analysis.overallAccuracy !== null
									? "Building recognition consistency"
									: "No attempts recorded yet"}
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-4">
						<span className="block text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
							Syllabary Mastery
						</span>
						<div className="mt-1.5 flex items-baseline gap-2">
							<span className="text-2xl font-bold text-zinc-100 tabular-nums">
								{summary.analysis.strongItems.length}
								<span className="text-sm font-normal text-zinc-500">
									/{totalKana}
								</span>
							</span>
							<span className="text-xs text-sky-400 tabular-nums">
								{summary.masteryPercent}%
							</span>
						</div>
						<p className="mt-1 text-[11px] text-zinc-500">
							{summary.coveragePercent}% syllabary practiced (
							{summary.analysis.learningItems.length} learning)
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-4">
						<span className="block text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
							Avg Response Time
						</span>
						<div className="mt-1.5 flex items-baseline gap-2">
							<span className="text-2xl font-bold text-zinc-100 tabular-nums">
								{formattedAverageSpeed}
							</span>
							<span className="text-xs text-amber-300 tabular-nums">
								{summary.analysis.fastStrongCount} fast
							</span>
						</div>
						<p className="mt-1 text-[11px] text-zinc-500">
							{summary.analysis.fastStrongCount} strong kana under 1.8s reflex
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-4">
						<span className="block text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
							Proficiency Score
						</span>
						<div className="mt-1.5 flex items-baseline gap-2">
							<span className="text-2xl font-bold text-zinc-100 tabular-nums">
								{summary.overallProficiencyScore}
								<span className="text-sm font-normal text-zinc-500">/100</span>
							</span>
							{summary.analysis.redeemedCount > 0 && (
								<span className="text-xs text-emerald-400 tabular-nums">
									+{summary.analysis.redeemedCount} redeemed
								</span>
							)}
						</div>
						<p className="mt-1 text-[11px] text-zinc-500">
							Composite of accuracy, streak & speed
						</p>
					</div>
				</div>

				{/* Personalized Study Recommendations */}
				<div className="grid gap-3 sm:grid-cols-2">
					{summary.recommendations.map((recommendation) => {
						const badgeTone =
							recommendation.priority === "high"
								? "border-rose-500/40 bg-rose-950/25 text-rose-200"
								: recommendation.priority === "medium"
									? "border-amber-500/40 bg-amber-950/25 text-amber-200"
									: "border-emerald-500/40 bg-emerald-950/20 text-emerald-200";
						return (
							<div
								key={recommendation.id}
								className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 ${badgeTone}`}
							>
								<div>
									<div className="flex items-center justify-between gap-2">
										<span className="text-[10px] font-semibold tracking-wider uppercase opacity-80">
											{recommendation.priority === "high"
												? "Priority Focus"
												: recommendation.priority === "medium"
													? "Script Balance"
													: "Recommended Next Step"}
										</span>
									</div>
									<h3 className="mt-1 text-sm font-semibold text-zinc-100">
										{recommendation.title}
									</h3>
									<p className="mt-1 text-xs text-zinc-300">
										{recommendation.description}
									</p>
								</div>
								<div>
									<button
										className="kana-interactive rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800"
										type="button"
										onClick={(): void => {
											onRecommendationAction(recommendation);
										}}
									>
										{recommendation.actionLabel} →
									</button>
								</div>
							</div>
						);
					})}
				</div>
			</section>
		);
	}
);
