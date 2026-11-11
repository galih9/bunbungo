import { memo, useMemo, useState } from "react";
import type { FunctionComponent } from "../../../common/types";
import { speakKanaCharacter } from "../audioEffects";
import {
	type CharacterMastery,
	getCharacterAccuracy,
	getCharacterAverageResponseMilliseconds,
	getCharacterPerformanceTier,
	getTopConfusedRomaji,
	type UserProgression,
} from "../gameStorage";
import {
	KANA_ITEMS,
	KANA_ITEMS_BY_CATEGORY,
	type KanaCategory,
	type KanaItem,
	type KanaScript,
} from "../kanaData";
import { getTierBadgeStyle, getTierLabel } from "./modalHelpers";

interface CodexReferenceChartTabProps {
	readonly chartScript: KanaScript;
	readonly masteryMap: Record<string, CharacterMastery>;
	readonly progression: UserProgression;
	readonly voiceEnabled: boolean;
}

export const CodexReferenceChartTab = memo(function CodexReferenceChartTab({
	chartScript,
	masteryMap,
	progression,
	voiceEnabled,
}: CodexReferenceChartTabProps): FunctionComponent {
	const [categoryFilter, setCategoryFilter] =
		useState<KanaCategory>("monograph");
	const [selectedKana, setSelectedKana] = useState<KanaItem | null>(
		KANA_ITEMS[0] ?? null
	);

	const filteredKana = useMemo(
		() => KANA_ITEMS_BY_CATEGORY.get(categoryFilter) ?? [],
		[categoryFilter]
	);

	const unlockedRowSet = useMemo(
		() => new Set(progression.unlockedRowIds),
		[progression.unlockedRowIds]
	);

	const handleSelectCharacter = (item: KanaItem): void => {
		setSelectedKana(item);
		const characterToSpeak =
			chartScript === "hiragana" ? item.hiragana : item.katakana;
		speakKanaCharacter(characterToSpeak, voiceEnabled);
	};

	const selectedStats = selectedKana ? masteryMap[selectedKana.id] : undefined;
	const selectedAccuracy = getCharacterAccuracy(selectedStats);
	const selectedAverageMilliseconds =
		getCharacterAverageResponseMilliseconds(selectedStats);
	const selectedTier = getCharacterPerformanceTier(selectedStats);
	const selectedConfusions = getTopConfusedRomaji(selectedStats);

	return (
		<div className="space-y-4">
			{/* Spotlight Character Detail */}
			{selectedKana && (
				<div className="space-y-3 rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4">
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-4">
							<div
								key={`${selectedKana.id}-${chartScript}`}
								className="kana-glyph-enter flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-2xl font-semibold text-zinc-100"
							>
								{chartScript === "hiragana"
									? selectedKana.hiragana
									: selectedKana.katakana}
							</div>
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-base font-semibold tracking-wide text-zinc-100 uppercase">
										{selectedKana.romaji}
									</span>
									<span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400">
										{selectedKana.hiragana} / {selectedKana.katakana}
									</span>
									<span
										className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${getTierBadgeStyle(selectedTier)}`}
									>
										{getTierLabel(selectedTier)}
									</span>
									{selectedAccuracy !== null && (
										<span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300 tabular-nums">
											{selectedAccuracy}% accuracy ({selectedStats?.attempts}{" "}
											tries)
										</span>
									)}
								</div>
								<p className="mt-1 text-xs text-zinc-400">
									{selectedKana.hint}
								</p>
							</div>
						</div>
						<button
							aria-label={`Pronounce ${selectedKana.romaji}`}
							className="kana-interactive inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
							type="button"
							onClick={(): void => {
								handleSelectCharacter(selectedKana);
							}}
						>
							<svg
								aria-hidden="true"
								className="h-3.5 w-3.5 text-zinc-400"
								fill="none"
								stroke="currentColor"
								strokeWidth={1.75}
								viewBox="0 0 24 24"
							>
								<path
									d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<span>Listen</span>
						</button>
					</div>

					{/* Detailed Character Telemetry Strip */}
					{selectedStats && selectedStats.attempts > 0 && (
						<div className="grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-3 text-[11px] sm:grid-cols-4">
							<div className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-2.5 py-1.5">
								<span className="block text-zinc-500">Correct / Missed</span>
								<span className="mt-0.5 block font-semibold text-zinc-200 tabular-nums">
									{selectedStats.correct} /{" "}
									{selectedStats.wrong ??
										selectedStats.attempts - selectedStats.correct}
								</span>
							</div>
							<div className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-2.5 py-1.5">
								<span className="block text-zinc-500">Streak / Best</span>
								<span className="mt-0.5 block font-semibold text-zinc-200 tabular-nums">
									{selectedStats.streak}x /{" "}
									{selectedStats.bestStreak ?? selectedStats.streak}x
								</span>
							</div>
							<div className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-2.5 py-1.5">
								<span className="block text-zinc-500">Avg Recall</span>
								<span className="mt-0.5 block font-semibold text-zinc-200 tabular-nums">
									{selectedAverageMilliseconds !== null
										? `${(selectedAverageMilliseconds / 1000).toFixed(2)}s`
										: "—"}
								</span>
							</div>
							<div className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-2.5 py-1.5">
								<span className="block text-zinc-500">Confused With</span>
								<span className="mt-0.5 block truncate font-semibold text-zinc-200 uppercase">
									{selectedConfusions.length > 0
										? selectedConfusions
												.map((entry) => `${entry.romaji} (${entry.count}x)`)
												.join(", ")
										: "None"}
								</span>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Category Pills */}
			<div className="flex flex-wrap gap-1.5">
				{(
					[
						{ id: "monograph", label: "Monographs (Gojūon)" },
						{ id: "diacritic", label: "Diacritics (Dakuten)" },
						{ id: "digraph", label: "Digraphs (Yōon)" },
					] as const
				).map((categoryOption) => (
					<button
						key={categoryOption.id}
						type="button"
						className={`kana-interactive rounded-lg px-3 py-1.5 text-xs font-medium ${
							categoryFilter === categoryOption.id
								? "bg-zinc-800 text-zinc-100"
								: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
						}`}
						onClick={(): void => {
							setCategoryFilter(categoryOption.id);
						}}
					>
						{categoryOption.label}
					</button>
				))}
			</div>

			{/* Minimalist Kana Grid */}
			<div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
				{filteredKana.map((item) => {
					const stats = masteryMap[item.id];
					const accuracyPercent = getCharacterAccuracy(stats);
					const tier = getCharacterPerformanceTier(stats);
					const isSelected = selectedKana?.id === item.id;
					const isRowUnlocked =
						progression.unlockAllRows || unlockedRowSet.has(item.rowId);

					let barColor = "bg-zinc-800";
					if (tier === "strong") {
						barColor = "bg-emerald-500/80";
					} else if (tier === "learning") {
						barColor = "bg-amber-400/80";
					} else if (tier === "weak") {
						barColor = "bg-rose-500/80";
					}

					return (
						<button
							key={item.id}
							type="button"
							className={`kana-interactive group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border p-2.5 ${
								isSelected
									? "border-zinc-400 bg-zinc-900 text-zinc-100"
									: isRowUnlocked
										? "border-zinc-800/80 bg-zinc-900/35 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/80"
										: "border-zinc-900 bg-zinc-950/60 text-zinc-500 hover:border-zinc-800"
							}`}
							onClick={(): void => {
								handleSelectCharacter(item);
							}}
						>
							<span className="text-xl font-semibold text-zinc-100">
								{chartScript === "hiragana" ? item.hiragana : item.katakana}
							</span>
							<span className="mt-0.5 text-[11px] font-medium text-zinc-400">
								{item.romaji}
							</span>
							<span className="mt-1 text-[10px] text-zinc-400 tabular-nums">
								{accuracyPercent !== null ? `${accuracyPercent}%` : "—"}
							</span>
							<span
								aria-hidden="true"
								className={`mt-1.5 h-0.5 w-full rounded-full ${barColor}`}
							/>
						</button>
					);
				})}
			</div>
		</div>
	);
});
