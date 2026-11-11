import { memo, useId, useMemo, useState } from "react";
import type { FunctionComponent } from "../../../common/types";
import type { DashboardSummary, LetterPerformanceTier } from "../gameStorage";
import { KANA_ITEMS } from "../kanaData";

interface DashboardMasteryDonutChartProps {
	readonly summary: DashboardSummary;
}

export const DashboardMasteryDonutChart = memo(
	function DashboardMasteryDonutChart({
		summary,
	}: DashboardMasteryDonutChartProps): FunctionComponent {
		const donutChartTitleId = useId();
		const [selectedTierHighlight, setSelectedTierHighlight] = useState<
			LetterPerformanceTier | "all"
		>("all");

		const totalKana = KANA_ITEMS.length;
		const donutRadius = 62;
		const donutCircumference = 2 * Math.PI * donutRadius;

		const tierSegments = useMemo(() => {
			const rawSegments: Array<{
				readonly colorHex: string;
				readonly count: number;
				readonly description: string;
				readonly id: LetterPerformanceTier;
				readonly label: string;
				readonly textClass: string;
			}> = [
				{
					colorHex: "#34d399",
					count: summary.analysis.strongItems.length,
					description: "80%+ accuracy & 2+ streak",
					id: "strong",
					label: "Strong",
					textClass: "text-emerald-300",
				},
				{
					colorHex: "#fbbf24",
					count: summary.analysis.learningItems.length,
					description: "Practiced, building streak",
					id: "learning",
					label: "Learning",
					textClass: "text-amber-300",
				},
				{
					colorHex: "#fb7185",
					count: summary.analysis.weakItems.length,
					description: "Needs targeted drill (<70% or slow)",
					id: "weak",
					label: "Weak",
					textClass: "text-rose-300",
				},
				{
					colorHex: "#3f3f46",
					count: summary.analysis.unseenItems.length,
					description: "Not yet practiced",
					id: "unseen",
					label: "Unseen",
					textClass: "text-zinc-400",
				},
			];

			let accumulatedFraction = 0;
			return rawSegments.map((segment) => {
				const fraction = totalKana > 0 ? segment.count / totalKana : 0;
				const strokeDasharray = `${fraction * donutCircumference} ${donutCircumference}`;
				const strokeDashoffset = -accumulatedFraction * donutCircumference;
				accumulatedFraction += fraction;
				return {
					...segment,
					percent:
						totalKana > 0 ? Math.round((segment.count / totalKana) * 100) : 0,
					strokeDasharray,
					strokeDashoffset,
				};
			});
		}, [
			donutCircumference,
			summary.analysis.learningItems.length,
			summary.analysis.strongItems.length,
			summary.analysis.unseenItems.length,
			summary.analysis.weakItems.length,
			totalKana,
		]);

		return (
			<figure className="flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-5">
				<div>
					<div className="flex items-center justify-between gap-2">
						<figcaption
							className="text-sm font-semibold text-zinc-100"
							id={donutChartTitleId}
						>
							Syllabary Mastery Distribution
						</figcaption>
						<span className="text-xs text-zinc-400 tabular-nums">
							{totalKana} Total Kana
						</span>
					</div>
					<p className="mt-0.5 text-xs text-zinc-400">
						Breakdown of all 104 Kana across performance tiers. Select a tier to
						inspect its share.
					</p>

					<div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
						<div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
							<svg
								aria-labelledby={donutChartTitleId}
								className="h-40 w-40 -rotate-90 transform"
								role="img"
								viewBox="0 0 160 160"
							>
								<title>
									Syllabary Mastery Distribution:{" "}
									{summary.analysis.strongItems.length} Strong,{" "}
									{summary.analysis.learningItems.length} Learning,{" "}
									{summary.analysis.weakItems.length} Weak,{" "}
									{summary.analysis.unseenItems.length} Unseen
								</title>
								<circle
									cx="80"
									cy="80"
									fill="transparent"
									r={donutRadius}
									stroke="#18181b"
									strokeWidth="18"
								/>
								{tierSegments.map((segment) => {
									const isDimmed =
										selectedTierHighlight !== "all" &&
										selectedTierHighlight !== segment.id;
									return (
										<circle
											key={segment.id}
											cx="80"
											cy="80"
											fill="transparent"
											opacity={isDimmed ? 0.25 : 1}
											r={donutRadius}
											stroke={segment.colorHex}
											strokeDasharray={segment.strokeDasharray}
											strokeDashoffset={segment.strokeDashoffset}
											strokeLinecap="butt"
											strokeWidth={
												selectedTierHighlight === segment.id ? "21" : "18"
											}
										/>
									);
								})}
							</svg>
							<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
								<span className="text-xl font-bold text-zinc-100 tabular-nums">
									{selectedTierHighlight === "all"
										? `${summary.coveragePercent}%`
										: `${
												tierSegments.find(
													(item) => item.id === selectedTierHighlight
												)?.percent ?? 0
											}%`}
								</span>
								<span className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
									{selectedTierHighlight === "all"
										? "Practiced"
										: selectedTierHighlight}
								</span>
							</div>
						</div>

						<div className="grid w-full flex-1 grid-cols-1 gap-2">
							{tierSegments.map((segment) => {
								const isSelected = selectedTierHighlight === segment.id;
								return (
									<button
										key={segment.id}
										aria-pressed={isSelected}
										type="button"
										className={`kana-interactive flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${
											isSelected
												? "border-zinc-500 bg-zinc-800/90 text-zinc-100"
												: "border-zinc-800/80 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700"
										}`}
										onClick={(): void => {
											setSelectedTierHighlight((previous) =>
												previous === segment.id ? "all" : segment.id
											);
										}}
									>
										<div className="flex items-center gap-2.5">
											<span
												aria-hidden="true"
												className="h-2.5 w-2.5 shrink-0 rounded-full"
												style={{ backgroundColor: segment.colorHex }}
											/>
											<div>
												<span className="font-semibold text-zinc-100">
													{segment.label}
												</span>
												<span className="ml-1.5 text-[11px] text-zinc-400">
													{segment.description}
												</span>
											</div>
										</div>
										<span className="font-semibold text-zinc-200 tabular-nums">
											{segment.count} ({segment.percent}%)
										</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* Semantic data table alternative for screen readers & detailed inspection */}
				<table className="mt-4 w-full border-collapse text-left text-xs text-zinc-400">
					<caption className="visually-hidden">
						Syllabary mastery tier counts and percentages
					</caption>
					<thead>
						<tr className="border-b border-zinc-800 text-[11px] text-zinc-500 uppercase">
							<th className="py-1.5 font-medium" scope="col">
								Tier
							</th>
							<th className="py-1.5 font-medium" scope="col">
								Kana Count
							</th>
							<th className="py-1.5 text-right font-medium" scope="col">
								Share
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-zinc-900">
						{tierSegments.map((segment) => (
							<tr key={`row-${segment.id}`}>
								<th className="py-1.5 font-medium text-zinc-300" scope="row">
									{segment.label}
								</th>
								<td className="py-1.5 tabular-nums">{segment.count}</td>
								<td className="py-1.5 text-right tabular-nums">
									{segment.percent}%
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</figure>
		);
	}
);
