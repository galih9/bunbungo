import { memo, type RefObject, useMemo, useState } from "react";
import type { FunctionComponent } from "../../../common/types";
import {
	type CharacterMastery,
	type GameMode,
	getRowMasterySummary,
	type InputMode,
	type KanaPerformanceAnalysis,
	type PracticeFocusMode,
	type ScriptSelection,
	type StoredGameSettings,
	type UserProgression,
} from "../gameStorage";
import { KANA_ROW_GROUPS, type KanaCategory } from "../kanaData";

export type RowPresetType = "basic" | "dakuten" | "digraph" | "all" | "starter";

interface LobbyDeckCustomizerProps {
	readonly activePoolCount: number;
	readonly lobbyHeadingRef: RefObject<HTMLHeadingElement | null>;
	readonly masteryMap: Record<string, CharacterMastery>;
	readonly performanceAnalysis: KanaPerformanceAnalysis;
	readonly practiceFocusMode: PracticeFocusMode;
	readonly progression: UserProgression;
	readonly settings: StoredGameSettings;
	readonly onSelectPresetRows: (preset: RowPresetType) => void;
	readonly onToggleRowSelection: (rowId: string) => void;
	readonly onToggleUnlockAllRows: () => void;
	readonly onUpdateSettings: (patch: Partial<StoredGameSettings>) => void;
}

const SCRIPT_OPTIONS: Array<{
	readonly id: ScriptSelection;
	readonly subtitle: string;
	readonly symbol: string;
	readonly title: string;
}> = [
	{
		id: "hiragana",
		subtitle: "Native script",
		symbol: "あ",
		title: "Hiragana",
	},
	{
		id: "katakana",
		subtitle: "Loanword script",
		symbol: "ア",
		title: "Katakana",
	},
	{
		id: "mixed",
		subtitle: "Both scripts",
		symbol: "あ / ア",
		title: "Mixed",
	},
];

const GAME_MODE_OPTIONS: Array<{
	readonly id: GameMode;
	readonly label: string;
}> = [
	{ id: "sprint", label: "Sprint" },
	{ id: "time-attack", label: "60s Timed" },
	{ id: "zen", label: "Zen" },
];

const INPUT_MODE_OPTIONS: Array<{
	readonly id: InputMode;
	readonly label: string;
}> = [
	{ id: "choice", label: "Multiple Choice" },
	{ id: "typing", label: "Romaji Typing" },
];

export const LobbyDeckCustomizer = memo(function LobbyDeckCustomizer({
	activePoolCount,
	lobbyHeadingRef,
	masteryMap,
	performanceAnalysis,
	practiceFocusMode,
	progression,
	settings,
	onSelectPresetRows,
	onToggleRowSelection,
	onToggleUnlockAllRows,
	onUpdateSettings,
}: LobbyDeckCustomizerProps): FunctionComponent {
	const [activeCategoryTab, setActiveCategoryTab] =
		useState<KanaCategory>("monograph");

	const unlockedRowSet = useMemo(
		() => new Set(progression.unlockedRowIds),
		[progression.unlockedRowIds]
	);

	const selectedRowSet = useMemo(
		() => new Set(settings.selectedRows),
		[settings.selectedRows]
	);

	const visibleRowGroups = useMemo(
		() =>
			KANA_ROW_GROUPS.filter((group) => group.category === activeCategoryTab),
		[activeCategoryTab]
	);

	return (
		<>
			{/* Section 1: Writing System */}
			<section aria-label="Script selection" className="space-y-2.5">
				<div className="flex items-center justify-between">
					<h2
						ref={lobbyHeadingRef}
						className="text-xs font-medium tracking-wider text-zinc-400 uppercase focus:outline-none"
						tabIndex={-1}
					>
						Writing System
					</h2>
					<span className="text-xs text-zinc-400 tabular-nums">
						{practiceFocusMode === "weak-letters"
							? `Focusing on ${Math.max(1, performanceAnalysis.weakItems.length || performanceAnalysis.learningItems.length)} weak/learning kana`
							: `${activePoolCount} kana selected`}
					</span>
				</div>

				<div className="grid grid-cols-3 gap-2.5">
					{SCRIPT_OPTIONS.map((option) => {
						const isSelected = settings.scriptMode === option.id;
						return (
							<button
								key={option.id}
								aria-pressed={isSelected}
								type="button"
								className={`kana-interactive flex flex-col items-start justify-between rounded-xl border p-3.5 text-left ${
									isSelected
										? "border-zinc-200 bg-zinc-100 text-zinc-950 shadow-sm"
										: "border-zinc-800/90 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/80"
								}`}
								onClick={(): void => {
									onUpdateSettings({ scriptMode: option.id });
								}}
							>
								<span
									className={`text-lg font-semibold ${
										isSelected ? "text-zinc-950" : "text-zinc-100"
									}`}
								>
									{option.symbol}
								</span>
								<div className="mt-2.5">
									<span
										className={`block text-xs font-semibold ${
											isSelected ? "text-zinc-950" : "text-zinc-100"
										}`}
									>
										{option.title}
									</span>
									<span
										className={`mt-0.5 block text-[11px] ${
											isSelected ? "text-zinc-600" : "text-zinc-500"
										}`}
									>
										{option.subtitle}
									</span>
								</div>
							</button>
						);
					})}
				</div>
			</section>

			{/* Section 2: Session Mode & Input Style */}
			<section
				aria-label="Game mode and input settings"
				className="grid gap-3 sm:grid-cols-2"
			>
				<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3.5">
					<div className="flex items-center justify-between">
						<h2 className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
							Mode
						</h2>
						<span className="text-[11px] text-zinc-500">
							{settings.gameMode === "sprint"
								? `${settings.sprintDeckSize} cards`
								: settings.gameMode === "time-attack"
									? "60 seconds"
									: "Endless practice"}
						</span>
					</div>
					<div className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg border border-zinc-800/80 bg-zinc-950 p-1">
						{GAME_MODE_OPTIONS.map((modeOption) => {
							const isSelected = settings.gameMode === modeOption.id;
							return (
								<button
									key={modeOption.id}
									aria-pressed={isSelected}
									type="button"
									className={`kana-interactive rounded-md py-1.5 text-center text-xs font-medium ${
										isSelected
											? "bg-zinc-800 text-zinc-100 shadow-2xs"
											: "text-zinc-400 hover:text-zinc-200"
									}`}
									onClick={(): void => {
										onUpdateSettings({ gameMode: modeOption.id });
									}}
								>
									{modeOption.label}
								</button>
							);
						})}
					</div>
					{settings.gameMode === "sprint" && (
						<div className="mt-2.5 flex items-center justify-between gap-2 border-t border-zinc-800/60 pt-2">
							<span className="text-[11px] text-zinc-400">Deck length:</span>
							<div className="flex gap-1">
								{[10, 20, 30].map((deckSizeOption) => {
									const isSizeSelected =
										settings.sprintDeckSize === deckSizeOption;
									return (
										<button
											key={deckSizeOption}
											aria-pressed={isSizeSelected}
											type="button"
											className={`kana-interactive rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${
												isSizeSelected
													? "border-zinc-500 bg-zinc-800 text-zinc-100"
													: "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
											}`}
											onClick={(): void => {
												onUpdateSettings({ sprintDeckSize: deckSizeOption });
											}}
										>
											{deckSizeOption} cards
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>

				<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3.5">
					<div className="flex items-center justify-between">
						<h2 className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
							Response
						</h2>
						<span className="text-[11px] text-zinc-500">
							{settings.inputMode === "choice"
								? "Keys 1–4 or tap"
								: "Auto-submit on match"}
						</span>
					</div>
					<div className="mt-2.5 grid grid-cols-2 gap-1 rounded-lg border border-zinc-800/80 bg-zinc-950 p-1">
						{INPUT_MODE_OPTIONS.map((inputOption) => {
							const isSelected = settings.inputMode === inputOption.id;
							return (
								<button
									key={inputOption.id}
									aria-pressed={isSelected}
									type="button"
									className={`kana-interactive rounded-md py-1.5 text-center text-xs font-medium ${
										isSelected
											? "bg-zinc-800 text-zinc-100 shadow-2xs"
											: "text-zinc-400 hover:text-zinc-200"
									}`}
									onClick={(): void => {
										onUpdateSettings({ inputMode: inputOption.id });
									}}
								>
									{inputOption.label}
								</button>
							);
						})}
					</div>
				</div>
			</section>

			{/* Section 3: Kana Row Deck Customizer */}
			<section
				aria-label="Kana row selection"
				className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4"
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
								Character Rows
							</h2>
							<span className="rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400 tabular-nums">
								{progression.unlockAllRows
									? KANA_ROW_GROUPS.length
									: progression.unlockedRowIds.length}
								/{KANA_ROW_GROUPS.length} Unlocked
							</span>
						</div>
						<p className="mt-0.5 text-xs text-zinc-500">
							Master unlocked rows (70%+ accuracy) to unlock the next Kana row
						</p>
					</div>
					<div className="flex flex-wrap gap-1">
						<button
							aria-pressed={progression.unlockAllRows}
							type="button"
							className={`kana-interactive rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
								progression.unlockAllRows
									? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
									: "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
							}`}
							onClick={onToggleUnlockAllRows}
						>
							{progression.unlockAllRows
								? "Free Practice: All Unlocked"
								: "Unlock All Rows"}
						</button>
						{(
							[
								{ id: "starter", label: "Starter (15)" },
								{ id: "basic", label: "Basic (46)" },
								{ id: "dakuten", label: "Dakuten (25)" },
								{ id: "all", label: "All (104)" },
							] as const
						).map((preset) => (
							<button
								key={preset.id}
								className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
								type="button"
								onClick={(): void => {
									onSelectPresetRows(preset.id);
								}}
							>
								{preset.label}
							</button>
						))}
					</div>
				</div>

				{/* Category Tabs */}
				<div className="mt-3.5 flex gap-1 border-b border-zinc-800/80 pb-3">
					{(
						[
							{ id: "monograph", label: "Monographs" },
							{ id: "diacritic", label: "Diacritics" },
							{ id: "digraph", label: "Digraphs" },
						] as const
					).map((tab) => (
						<button
							key={tab.id}
							type="button"
							className={`kana-interactive rounded-lg px-3 py-1.5 text-xs font-medium ${
								activeCategoryTab === tab.id
									? "bg-zinc-100 text-zinc-950"
									: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
							}`}
							onClick={(): void => {
								setActiveCategoryTab(tab.id);
							}}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Minimalist Row Selection Grid */}
				<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
					{visibleRowGroups.map((group) => {
						const unlocked =
							progression.unlockAllRows || unlockedRowSet.has(group.id);
						const isChecked = unlocked && selectedRowSet.has(group.id);
						const rowSummary = getRowMasterySummary(group.id, masteryMap);
						const sampleDisplay =
							settings.scriptMode === "katakana"
								? group.sampleKatakana
								: settings.scriptMode === "hiragana"
									? group.sampleHiragana
									: `${group.sampleHiragana}/${group.sampleKatakana}`;

						return (
							<button
								key={group.id}
								aria-disabled={!unlocked}
								aria-pressed={isChecked}
								type="button"
								className={`kana-interactive flex items-center justify-between rounded-xl border p-2.5 text-left ${
									!unlocked
										? "cursor-not-allowed border-zinc-900 bg-zinc-950/30 text-zinc-600 opacity-70"
										: isChecked
											? "border-zinc-500 bg-zinc-900 text-zinc-100"
											: "border-zinc-800/70 bg-zinc-950/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
								}`}
								onClick={(): void => {
									onToggleRowSelection(group.id);
								}}
							>
								<div className="min-w-0 pr-2">
									<div className="flex items-center gap-2">
										<span
											className={`text-sm font-semibold ${
												isChecked ? "text-zinc-100" : "text-zinc-400"
											}`}
										>
											{sampleDisplay}
										</span>
										<span
											className={`truncate text-xs font-medium ${
												isChecked ? "text-zinc-200" : "text-zinc-400"
											}`}
										>
											{group.label}
										</span>
									</div>
									<p className="mt-0.5 truncate text-[11px] text-zinc-500">
										{unlocked
											? rowSummary.attemptedCount > 0
												? `${rowSummary.masteryPercent}% mastery · ${group.romajiSummary}`
												: group.romajiSummary
											: "Locked · Master prior row"}
									</p>
								</div>
								<span
									aria-hidden="true"
									className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
										!unlocked
											? "bg-zinc-900"
											: isChecked
												? "bg-zinc-100"
												: "bg-zinc-800"
									}`}
								/>
							</button>
						);
					})}
				</div>
			</section>
		</>
	);
});
