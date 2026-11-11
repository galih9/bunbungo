import { memo, useId, useMemo, useState } from "react";
import type { FunctionComponent } from "../../../common/types";
import type { DashboardSummary } from "../gameStorage";

interface DashboardBreakdownChartsProps {
	readonly summary: DashboardSummary;
}

type BarChartViewMode = "category" | "rows";

export const DashboardBreakdownCharts = memo(function DashboardBreakdownCharts({
	summary,
}: DashboardBreakdownChartsProps): FunctionComponent {
	const barChartTitleId = useId();
	const [barChartView, setBarChartView] =
		useState<BarChartViewMode>("category");

	const displayedRowBars = useMemo(
		() => summary.rowSummaries.slice(0, 10),
		[summary.rowSummaries]
	);

	return (
		<div className="kana-deferred-section space-y-4">
			{/* Chart 3: Category & Kana Row Mastery Bar Chart */}
			<figure className="rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<figcaption
							className="text-sm font-semibold text-zinc-100"
							id={barChartTitleId}
						>
							Mastery & Accuracy Bar Chart (
							{barChartView === "category"
								? "By Kana Category"
								: "Top 10 Kana Rows"}
							)
						</figcaption>
						<p className="mt-0.5 text-xs text-zinc-400">
							Compare mastery progress and recognition accuracy across script
							groups or individual syllable rows.
						</p>
					</div>

					<div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
						<button
							aria-pressed={barChartView === "category"}
							type="button"
							className={`kana-interactive rounded-md px-3 py-1 text-xs font-medium ${
								barChartView === "category"
									? "bg-zinc-800 text-zinc-100"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
							onClick={(): void => {
								setBarChartView("category");
							}}
						>
							By Category (3)
						</button>
						<button
							aria-pressed={barChartView === "rows"}
							type="button"
							className={`kana-interactive rounded-md px-3 py-1 text-xs font-medium ${
								barChartView === "rows"
									? "bg-zinc-800 text-zinc-100"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
							onClick={(): void => {
								setBarChartView("rows");
							}}
						>
							By Row (10)
						</button>
					</div>
				</div>

				{barChartView === "category" ? (
					<div
						aria-labelledby={barChartTitleId}
						className="mt-5 grid gap-4 sm:grid-cols-3"
						role="img"
					>
						{summary.categorySummaries.map((categoryItem) => (
							<div
								key={categoryItem.category}
								className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4"
							>
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-zinc-100">
										{categoryItem.label}
									</span>
									<span className="text-xs font-bold text-emerald-400 tabular-nums">
										{categoryItem.masteryPercent}%
									</span>
								</div>
								<p className="mt-0.5 text-[11px] text-zinc-500">
									{categoryItem.practicedCount}/{categoryItem.totalCount}{" "}
									practiced · {categoryItem.strongCount} strong ·{" "}
									{categoryItem.weakCount} weak
								</p>

								{/* Dual Horizontal Bars: Mastery & Accuracy */}
								<div className="mt-3 space-y-2.5">
									<div>
										<div className="flex justify-between text-[11px] text-zinc-400">
											<span>Mastery Index</span>
											<span className="tabular-nums">
												{categoryItem.masteryPercent}%
											</span>
										</div>
										<div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-900">
											<div
												className="h-full rounded-full bg-emerald-400 transition-all duration-300"
												style={{ width: `${categoryItem.masteryPercent}%` }}
											/>
										</div>
									</div>

									<div>
										<div className="flex justify-between text-[11px] text-zinc-400">
											<span>Accuracy</span>
											<span className="tabular-nums">
												{categoryItem.accuracyPercent !== null
													? `${categoryItem.accuracyPercent}%`
													: "—"}
											</span>
										</div>
										<div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-900">
											<div
												className="h-full rounded-full bg-sky-400 transition-all duration-300"
												style={{
													width: `${categoryItem.accuracyPercent ?? 0}%`,
												}}
											/>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div
						aria-labelledby={barChartTitleId}
						className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5"
						role="img"
					>
						{displayedRowBars.map((rowItem) => (
							<div
								key={rowItem.rowId}
								className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3"
							>
								<div className="flex items-center justify-between">
									<span className="text-sm font-bold text-zinc-100">
										{rowItem.group.sampleHiragana}
									</span>
									<span className="text-[11px] font-semibold text-emerald-400 tabular-nums">
										{rowItem.masteryPercent}%
									</span>
								</div>
								<p className="mt-0.5 truncate text-xs font-medium text-zinc-300">
									{rowItem.group.label}
								</p>
								<p className="text-[10px] text-zinc-500 tabular-nums">
									{rowItem.attemptedCount}/{rowItem.totalCount} seen ·{" "}
									{rowItem.accuracyPercent !== null
										? `${rowItem.accuracyPercent}% acc`
										: "unseen"}
								</p>
								<div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-zinc-900">
									<div
										className="h-full rounded-full bg-emerald-400 transition-all duration-300"
										style={{ width: `${rowItem.masteryPercent}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				)}
			</figure>

			{/* Chart 4: Script Comparison & Response Speed Reflex Distribution */}
			<div className="grid gap-4 lg:grid-cols-2">
				{/* Script Balance Comparison */}
				<figure className="rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-5">
					<figcaption className="text-sm font-semibold text-zinc-100">
						Writing Script Comparison (Hiragana vs. Katakana)
					</figcaption>
					<p className="mt-0.5 text-xs text-zinc-400">
						Compare recognition accuracy and practice volume between native
						Hiragana and loanword Katakana scripts.
					</p>

					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						{summary.scriptSummaries.map((scriptItem) => (
							<div
								key={scriptItem.script}
								className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4"
							>
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-zinc-100">
										{scriptItem.label}
									</span>
									<span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-bold text-zinc-100 tabular-nums">
										{scriptItem.accuracyPercent !== null
											? `${scriptItem.accuracyPercent}%`
											: "—"}
									</span>
								</div>
								<p className="mt-1 text-xs text-zinc-400 tabular-nums">
									{scriptItem.correct}/{scriptItem.attempts} correct ·{" "}
									{scriptItem.practicedCharacterCount} characters practiced
								</p>
								<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-900">
									<div
										style={{ width: `${scriptItem.accuracyPercent ?? 0}%` }}
										className={`h-full rounded-full transition-all duration-300 ${
											scriptItem.script === "hiragana"
												? "bg-emerald-400"
												: "bg-sky-400"
										}`}
									/>
								</div>
							</div>
						))}
					</div>
				</figure>

				{/* Response Speed Reflex Distribution */}
				<figure className="rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-5">
					<figcaption className="text-sm font-semibold text-zinc-100">
						Response Speed Reflex Distribution
					</figcaption>
					<p className="mt-0.5 text-xs text-zinc-400">
						Distribution of practiced Kana by average recognition latency.
					</p>

					<div className="mt-4 space-y-3">
						{summary.speedBuckets.map((bucket) => (
							<div key={bucket.id} className="space-y-1">
								<div className="flex items-center justify-between text-xs">
									<span className="font-medium text-zinc-200">
										{bucket.label}{" "}
										<span className="text-zinc-500">({bucket.rangeLabel})</span>
									</span>
									<span className="font-semibold text-zinc-300 tabular-nums">
										{bucket.count} kana ({bucket.sharePercent}%)
									</span>
								</div>
								<div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900">
									<div
										style={{ width: `${bucket.sharePercent}%` }}
										className={`h-full rounded-full transition-all duration-300 ${
											bucket.id === "instant"
												? "bg-emerald-400"
												: bucket.id === "fast"
													? "bg-sky-400"
													: bucket.id === "steady"
														? "bg-amber-400"
														: "bg-rose-400"
										}`}
									/>
								</div>
							</div>
						))}
					</div>
				</figure>
			</div>
		</div>
	);
});
