import { memo, useId, useMemo, useState } from "react";
import type { FunctionComponent } from "../../../common/types";
import type { SessionTrendPoint } from "../gameStorage";

interface DashboardSessionTrendChartProps {
	readonly sessionTrend: Array<SessionTrendPoint>;
	readonly onLoadSampleTelemetry: () => void;
}

type TrendMetricMode = "score" | "accuracy";

export const DashboardSessionTrendChart = memo(
	function DashboardSessionTrendChart({
		sessionTrend,
		onLoadSampleTelemetry,
	}: DashboardSessionTrendChartProps): FunctionComponent {
		const trendChartTitleId = useId();
		const [trendMetric, setTrendMetric] = useState<TrendMetricMode>("score");

		const trendChartGeometry = useMemo(() => {
			const chartWidth = 520;
			const chartHeight = 170;
			const padLeft = 36;
			const padRight = 18;
			const padTop = 18;
			const padBottom = 28;
			const plotWidth = chartWidth - padLeft - padRight;
			const plotHeight = chartHeight - padTop - padBottom;

			if (sessionTrend.length === 0) {
				return {
					areaPath: "",
					chartHeight,
					chartWidth,
					coordinates: [],
					linePath: "",
					maxValue: 100,
				};
			}

			const values = sessionTrend.map((point) =>
				trendMetric === "score" ? point.score : point.accuracy
			);
			const maxValue =
				trendMetric === "score" ? Math.max(1000, ...values, 1) : 100;

			const coordinates = sessionTrend.map((point, index) => {
				const xRatio =
					sessionTrend.length > 1 ? index / (sessionTrend.length - 1) : 0.5;
				const rawValue = trendMetric === "score" ? point.score : point.accuracy;
				const yRatio = Math.min(1, Math.max(0, rawValue / maxValue));
				const x = Math.round(padLeft + xRatio * plotWidth);
				const y = Math.round(padTop + plotHeight - yRatio * plotHeight);
				return {
					...point,
					displayValue:
						trendMetric === "score"
							? point.score.toLocaleString()
							: `${point.accuracy}%`,
					x,
					y,
				};
			});

			const linePath = coordinates
				.map(
					(coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`
				)
				.join(" ");

			const firstCoord = coordinates[0];
			const lastCoord = coordinates[coordinates.length - 1];
			const baselineY = padTop + plotHeight;
			const areaPath =
				firstCoord && lastCoord
					? `${linePath} L ${lastCoord.x} ${baselineY} L ${firstCoord.x} ${baselineY} Z`
					: "";

			return {
				areaPath,
				chartHeight,
				chartWidth,
				coordinates,
				linePath,
				maxValue,
			};
		}, [sessionTrend, trendMetric]);

		return (
			<figure className="flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-5">
				<div>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div>
							<figcaption
								className="text-sm font-semibold text-zinc-100"
								id={trendChartTitleId}
							>
								Recent Session Performance Trend
							</figcaption>
							<p className="mt-0.5 text-xs text-zinc-400">
								Progression of session scores and accuracy across recent runs.
							</p>
						</div>

						<div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
							<button
								aria-pressed={trendMetric === "score"}
								type="button"
								className={`kana-interactive rounded-md px-2.5 py-1 text-xs font-medium ${
									trendMetric === "score"
										? "bg-zinc-800 text-zinc-100"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
								onClick={(): void => {
									setTrendMetric("score");
								}}
							>
								Score
							</button>
							<button
								aria-pressed={trendMetric === "accuracy"}
								type="button"
								className={`kana-interactive rounded-md px-2.5 py-1 text-xs font-medium ${
									trendMetric === "accuracy"
										? "bg-zinc-800 text-zinc-100"
										: "text-zinc-400 hover:text-zinc-200"
								}`}
								onClick={(): void => {
									setTrendMetric("accuracy");
								}}
							>
								Accuracy %
							</button>
						</div>
					</div>

					{sessionTrend.length > 0 ? (
						<div className="mt-4">
							<svg
								aria-labelledby={trendChartTitleId}
								className="h-44 w-full overflow-visible"
								role="img"
								viewBox={`0 0 ${trendChartGeometry.chartWidth} ${trendChartGeometry.chartHeight}`}
							>
								<title>
									Session {trendMetric} trend chart across {sessionTrend.length}{" "}
									sessions
								</title>
								<defs>
									<linearGradient
										id="kanaTrendFill"
										x1="0"
										x2="0"
										y1="0"
										y2="1"
									>
										<stop offset="0%" stopColor="#34d399" stopOpacity="0.32" />
										<stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
									</linearGradient>
								</defs>

								{/* Horizontal grid lines */}
								{[0.25, 0.5, 0.75, 1].map((ratio) => {
									const y = Math.round(18 + (1 - ratio) * 124);
									const labelValue = Math.round(
										trendChartGeometry.maxValue * ratio
									);
									return (
										<g key={ratio}>
											<line
												stroke="#27272a"
												strokeDasharray="3 3"
												x1="36"
												x2="502"
												y1={y}
												y2={y}
											/>
											<text
												fill="#71717a"
												fontSize="10"
												textAnchor="end"
												x="30"
												y={y + 3}
											>
												{trendMetric === "accuracy"
													? `${labelValue}%`
													: labelValue}
											</text>
										</g>
									);
								})}

								{trendChartGeometry.areaPath && (
									<path
										d={trendChartGeometry.areaPath}
										fill="url(#kanaTrendFill)"
									/>
								)}
								{trendChartGeometry.linePath && (
									<path
										d={trendChartGeometry.linePath}
										fill="none"
										stroke="#34d399"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2.5"
									/>
								)}

								{trendChartGeometry.coordinates.map((point) => (
									<g key={point.id}>
										<circle
											cx={point.x}
											cy={point.y}
											fill="#09090b"
											r="4.5"
											stroke="#34d399"
											strokeWidth="2.5"
										/>
										<text
											fill="#e4e4e7"
											fontSize="10"
											fontWeight="600"
											textAnchor="middle"
											x={point.x}
											y={point.y - 9}
										>
											{point.displayValue}
										</text>
										<text
											fill="#71717a"
											fontSize="10"
											textAnchor="middle"
											x={point.x}
											y="162"
										>
											{point.sessionLabel} ({point.dateLabel})
										</text>
									</g>
								))}
							</svg>
						</div>
					) : (
						<div className="mt-5 flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-center">
							<p className="text-xs font-medium text-zinc-300">
								No completed Sprint or Timed sessions recorded yet.
							</p>
							<p className="mt-1 text-[11px] text-zinc-500">
								Complete a game session or load sample telemetry to visualize
								your score and accuracy curve.
							</p>
							<button
								className="kana-interactive mt-3 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
								type="button"
								onClick={onLoadSampleTelemetry}
							>
								Preview with Sample Telemetry
							</button>
						</div>
					)}
				</div>

				{sessionTrend.length > 0 && (
					<table className="mt-3 w-full border-collapse text-left text-xs text-zinc-400">
						<caption className="visually-hidden">
							Recent session scores, accuracy, and speed
						</caption>
						<thead>
							<tr className="border-b border-zinc-800 text-[11px] text-zinc-500 uppercase">
								<th className="py-1.5 font-medium" scope="col">
									Session
								</th>
								<th className="py-1.5 font-medium" scope="col">
									Mode
								</th>
								<th className="py-1.5 font-medium" scope="col">
									Score
								</th>
								<th className="py-1.5 font-medium" scope="col">
									Accuracy
								</th>
								<th className="py-1.5 text-right font-medium" scope="col">
									Pace
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-900">
							{sessionTrend.slice(-4).map((session) => (
								<tr key={`table-${session.id}`}>
									<th className="py-1.5 font-medium text-zinc-300" scope="row">
										{session.sessionLabel} ({session.dateLabel})
									</th>
									<td className="py-1.5 capitalize">
										{session.gameMode} · {session.scriptMode}
									</td>
									<td className="py-1.5 font-medium text-zinc-200 tabular-nums">
										{session.score.toLocaleString()}
									</td>
									<td className="py-1.5 tabular-nums">{session.accuracy}%</td>
									<td className="py-1.5 text-right tabular-nums">
										{session.cardsPerMinute}/min
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</figure>
		);
	}
);
