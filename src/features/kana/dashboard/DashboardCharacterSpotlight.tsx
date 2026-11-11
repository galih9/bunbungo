import { memo } from "react";
import type { FunctionComponent } from "../../../common/types";
import { speakKanaCharacter } from "../audioEffects";
import {
	type CharacterMastery,
	type DashboardSummary,
	getCharacterAccuracy,
	getCharacterAverageResponseMilliseconds,
	getCharacterProficiencyScore,
	getTopConfusedRomaji,
} from "../gameStorage";

interface DashboardCharacterSpotlightProps {
	readonly masteryMap: Record<string, CharacterMastery>;
	readonly summary: DashboardSummary;
	readonly onDrillWeakLetters: () => void;
	readonly onOpenFullTable: () => void;
}

export const DashboardCharacterSpotlight = memo(
	function DashboardCharacterSpotlight({
		masteryMap,
		summary,
		onDrillWeakLetters,
		onOpenFullTable,
	}: DashboardCharacterSpotlightProps): FunctionComponent {
		return (
			<section
				aria-labelledby="character-spotlight-heading"
				className="kana-deferred-section grid gap-4 lg:grid-cols-2"
			>
				<h2 className="visually-hidden" id="character-spotlight-heading">
					Character Performance Spotlight and Confusions
				</h2>

				{/* Weakest Characters & Confusion Pairs */}
				<div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-5">
					<div className="flex items-center justify-between gap-2">
						<div>
							<h3 className="text-sm font-semibold text-zinc-100">
								Characters Needing Focus ({summary.analysis.weakItems.length})
							</h3>
							<p className="mt-0.5 text-xs text-zinc-400">
								Click any character to hear its native pronunciation.
							</p>
						</div>
						{summary.analysis.weakItems.length > 0 && (
							<button
								className="kana-interactive rounded-lg border border-rose-500/40 bg-rose-950/30 px-2.5 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-950/50"
								type="button"
								onClick={onDrillWeakLetters}
							>
								Drill Weak Letters →
							</button>
						)}
					</div>

					{summary.analysis.weakItems.length > 0 ? (
						<div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
							{summary.analysis.weakItems.slice(0, 6).map((item) => {
								const stats = masteryMap[item.id];
								const accuracy = getCharacterAccuracy(stats);
								const averageMilliseconds =
									getCharacterAverageResponseMilliseconds(stats);
								const topConfused = getTopConfusedRomaji(stats)[0];
								return (
									<button
										key={item.id}
										className="kana-interactive flex flex-col justify-between rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-left hover:border-rose-400/60"
										type="button"
										onClick={(): void => {
											speakKanaCharacter(item.hiragana, true);
										}}
									>
										<div className="flex items-center justify-between">
											<span className="text-xl font-bold text-zinc-100">
												{item.hiragana}{" "}
												<span className="text-sm font-medium text-zinc-400">
													{item.katakana}
												</span>
											</span>
											<span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-rose-200 tabular-nums">
												{accuracy ?? 0}%
											</span>
										</div>
										<div className="mt-2">
											<span className="block text-xs font-semibold text-zinc-200 uppercase">
												{item.romaji}
											</span>
											<span className="block text-[10px] text-zinc-400 tabular-nums">
												{averageMilliseconds !== null
													? `${(averageMilliseconds / 1000).toFixed(1)}s avg`
													: "No speed"}
												{topConfused ? ` · vs "${topConfused.romaji}"` : ""}
											</span>
										</div>
									</button>
								);
							})}
						</div>
					) : (
						<div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 text-xs text-zinc-400">
							Zero weak characters detected! Practice more rows or load sample
							telemetry to inspect weak-letter diagnostics.
						</div>
					)}

					{summary.topConfusions.length > 0 && (
						<div className="mt-4 border-t border-zinc-800/80 pt-3.5">
							<h4 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
								Most Frequent Romaji Confusions
							</h4>
							<div className="mt-2 flex flex-wrap gap-2">
								{summary.topConfusions.map((confusion) => (
									<span
										key={`${confusion.item.id}-${confusion.confusedRomaji}`}
										className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300"
									>
										<strong className="text-zinc-100">
											{confusion.item.hiragana}/{confusion.item.katakana} (
											{confusion.item.romaji})
										</strong>{" "}
										mistaken for{" "}
										<strong className="text-rose-300 uppercase">
											{confusion.confusedRomaji}
										</strong>{" "}
										({confusion.count}x)
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Top Mastered Kana Spotlight */}
				<div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-5">
					<div className="flex items-center justify-between gap-2">
						<div>
							<h3 className="text-sm font-semibold text-zinc-100">
								Top Mastered Kana ({summary.analysis.strongItems.length})
							</h3>
							<p className="mt-0.5 text-xs text-zinc-400">
								Your highest-proficiency characters with fast recall and active
								streaks.
							</p>
						</div>
						<button
							className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-700"
							type="button"
							onClick={onOpenFullTable}
						>
							Full Table →
						</button>
					</div>

					{summary.analysis.strongItems.length > 0 ? (
						<div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
							{summary.analysis.strongItems.slice(0, 6).map((item) => {
								const stats = masteryMap[item.id];
								const accuracy = getCharacterAccuracy(stats);
								const proficiency = getCharacterProficiencyScore(stats);
								const averageMilliseconds =
									getCharacterAverageResponseMilliseconds(stats);
								return (
									<button
										key={item.id}
										className="kana-interactive flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-3 text-left hover:border-emerald-400/60"
										type="button"
										onClick={(): void => {
											speakKanaCharacter(item.hiragana, true);
										}}
									>
										<div className="flex items-center justify-between">
											<span className="text-xl font-bold text-zinc-100">
												{item.hiragana}{" "}
												<span className="text-sm font-medium text-zinc-400">
													{item.katakana}
												</span>
											</span>
											<span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-300 tabular-nums">
												{proficiency} pts
											</span>
										</div>
										<div className="mt-2">
											<span className="block text-xs font-semibold text-zinc-200 uppercase">
												{item.romaji} · {accuracy ?? 100}%
											</span>
											<span className="block text-[10px] text-zinc-400 tabular-nums">
												{averageMilliseconds !== null
													? `${(averageMilliseconds / 1000).toFixed(2)}s reflex`
													: "Fast recall"}{" "}
												· {stats?.streak ?? 0}x streak
											</span>
										</div>
									</button>
								);
							})}
						</div>
					) : (
						<div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 text-xs text-zinc-400">
							Reach 80%+ accuracy and a 2+ streak on practiced Kana to unlock
							Strong mastery cards here.
						</div>
					)}
				</div>
			</section>
		);
	}
);
