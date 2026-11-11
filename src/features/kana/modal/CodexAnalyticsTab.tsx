import {
	type MouseEvent as ReactMouseEvent,
	memo,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import type { FunctionComponent } from "../../../common/types";
import {
	type CharacterMastery,
	getCharacterAccuracy,
	getCharacterAverageResponseMilliseconds,
	getCharacterPerformanceTier,
	getCharacterProficiencyScore,
	getTopConfusedRomaji,
	type KanaPerformanceAnalysis,
} from "../gameStorage";
import { KANA_ITEMS } from "../kanaData";
import {
	type DocumentWithViewTransition,
	type ElementWithViewTransition,
	getTierBadgeStyle,
	getTierLabel,
	reorderContainerChildren,
	textCollator,
} from "./modalHelpers";

interface CodexAnalyticsTabProps {
	readonly masteryMap: Record<string, CharacterMastery>;
	readonly performanceAnalysis: KanaPerformanceAnalysis;
	readonly onPracticeWeakLetters: () => void;
}

const TABLE_COLUMNS: Array<{
	readonly dataType: "text" | "number";
	readonly label: string;
}> = [
	{ dataType: "text", label: "Kana" },
	{ dataType: "number", label: "Status" },
	{ dataType: "number", label: "Accuracy" },
	{ dataType: "number", label: "Attempts" },
	{ dataType: "number", label: "Streak" },
	{ dataType: "number", label: "Avg Speed" },
];

export const CodexAnalyticsTab = memo(function CodexAnalyticsTab({
	masteryMap,
	performanceAnalysis,
	onPracticeWeakLetters,
}: CodexAnalyticsTabProps): FunctionComponent {
	const tableRef = useRef<HTMLTableElement | null>(null);
	const tbodyRef = useRef<HTMLTableSectionElement | null>(null);
	const sortStatusRef = useRef<HTMLParagraphElement | null>(null);

	const tableId = useId();
	const tableCaptionId = useId();

	const [tableTierFilter, setTableTierFilter] = useState<
		"all" | "practiced" | "weak" | "strong"
	>("all");

	const tableItems = useMemo(() => {
		return KANA_ITEMS.filter((item) => {
			const stats = masteryMap[item.id];
			const tier = getCharacterPerformanceTier(stats);
			if (tableTierFilter === "practiced") {
				return (stats?.attempts ?? 0) > 0;
			}
			if (tableTierFilter === "weak") {
				return tier === "weak";
			}
			if (tableTierFilter === "strong") {
				return tier === "strong";
			}
			return true;
		});
	}, [masteryMap, tableTierFilter]);

	const executeTableSort = useCallback((sourceButton: HTMLElement): void => {
		const tableElement = tableRef.current;
		const tbodyElement = tbodyRef.current;
		if (!tableElement || !tbodyElement) {
			return;
		}
		const headerCell = sourceButton.closest("th");
		if (!headerCell || !tableElement.tHead?.rows[0]) {
			return;
		}

		const direction =
			headerCell.getAttribute("aria-sort") === "ascending"
				? "descending"
				: "ascending";

		for (const cell of Array.from(tableElement.tHead.rows[0].cells)) {
			cell.removeAttribute("aria-sort");
		}
		headerCell.setAttribute("aria-sort", direction);

		const columnIndex = headerCell.cellIndex;
		const columnType = headerCell.dataset["type"] ?? "text";
		const directionFactor = direction === "ascending" ? 1 : -1;

		const rowsWithValues = Array.from(tbodyElement.rows).map((row) => {
			const cell = row.cells[columnIndex];
			const rawValue =
				cell?.dataset["value"] ?? cell?.textContent?.trim() ?? "";
			return {
				numericValue: Number(rawValue),
				row,
				textValue: rawValue,
			};
		});

		rowsWithValues.sort((first, second) => {
			if (columnType === "number") {
				return directionFactor * (first.numericValue - second.numericValue);
			}
			return (
				directionFactor *
				textCollator.compare(first.textValue, second.textValue)
			);
		});

		const orderedRows = rowsWithValues.map((entry) => entry.row);
		const applyReorder = (): void => {
			reorderContainerChildren(tbodyElement, orderedRows);
		};

		const transitionTable = tableElement as ElementWithViewTransition;
		const transitionDocument = document as DocumentWithViewTransition;
		if (
			orderedRows.length <= 120 &&
			typeof transitionTable.startViewTransition === "function"
		) {
			transitionTable.startViewTransition(applyReorder);
		} else if (
			orderedRows.length <= 120 &&
			typeof transitionDocument.startViewTransition === "function"
		) {
			transitionDocument.startViewTransition(applyReorder);
		} else {
			applyReorder();
		}

		if (sortStatusRef.current) {
			const columnLabel = sourceButton.textContent?.trim() ?? "column";
			sortStatusRef.current.textContent = `Sorted by ${columnLabel}, ${direction}, ${orderedRows.length} rows`;
		}
	}, []);

	useEffect(() => {
		const tableElement = tableRef.current;
		if (!tableElement) {
			return;
		}
		const handleCommand = (
			event: Event & { command?: string; source?: Element | null }
		): void => {
			if (
				event.command !== "--sort" ||
				!(event.source instanceof HTMLElement)
			) {
				return;
			}
			executeTableSort(event.source);
		};
		tableElement.addEventListener("command", handleCommand);
		return (): void => {
			tableElement.removeEventListener("command", handleCommand);
		};
	}, [executeTableSort]);

	const supportsInvokerCommands =
		typeof HTMLButtonElement !== "undefined" &&
		"commandForElement" in HTMLButtonElement.prototype;

	const handleSortButtonClick = (
		event: ReactMouseEvent<HTMLButtonElement>
	): void => {
		if (supportsInvokerCommands) {
			return;
		}
		executeTableSort(event.currentTarget);
	};

	return (
		<div className="space-y-5">
			{/* Summary Metrics Grid */}
			<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
				<div className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-3">
					<span className="block text-[11px] font-medium text-emerald-300/90 uppercase">
						Strong Letters
					</span>
					<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
						{performanceAnalysis.strongItems.length}
					</span>
					<span className="text-[10px] text-zinc-400">
						80%+ acc & 2+ streak
					</span>
				</div>
				<div className="rounded-xl border border-rose-500/25 bg-rose-950/15 p-3">
					<span className="block text-[11px] font-medium text-rose-300/90 uppercase">
						Weak Letters
					</span>
					<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
						{performanceAnalysis.weakItems.length}
					</span>
					<span className="text-[10px] text-zinc-400">
						Needs targeted drill
					</span>
				</div>
				<div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-3">
					<span className="block text-[11px] font-medium text-amber-300/90 uppercase">
						Learning
					</span>
					<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
						{performanceAnalysis.learningItems.length}
					</span>
					<span className="text-[10px] text-zinc-400">Building streak</span>
				</div>
				<div className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-3">
					<span className="block text-[11px] font-medium text-zinc-400 uppercase">
						Overall Accuracy
					</span>
					<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
						{performanceAnalysis.overallAccuracy !== null
							? `${performanceAnalysis.overallAccuracy}%`
							: "—"}
					</span>
					<span className="text-[10px] text-zinc-400 tabular-nums">
						{performanceAnalysis.totalAttempts} total answers
					</span>
				</div>
			</div>

			{/* Targeted Weak Letters Practice Callout */}
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
				<div>
					<h3 className="text-xs font-semibold tracking-wider text-zinc-200 uppercase">
						Targeted Weak Letter Training
					</h3>
					<p className="mt-0.5 text-xs text-zinc-400">
						{performanceAnalysis.weakItems.length > 0
							? `You have ${performanceAnalysis.weakItems.length} weak performing letter(s). Launch a focused drill to turn them into strong letters.`
							: "No weak letters detected right now — practice your lowest-proficiency letters to sharpen recall speed."}
					</p>
				</div>
				<button
					className="kana-interactive rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white"
					type="button"
					onClick={onPracticeWeakLetters}
				>
					Practice Weak Letters (
					{performanceAnalysis.weakItems.length > 0
						? performanceAnalysis.weakItems.length
						: Math.max(1, performanceAnalysis.learningItems.length)}
					)
				</button>
			</div>

			{/* Weakest vs Strongest Highlights */}
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3.5">
					<h3 className="text-xs font-medium tracking-wider text-rose-300 uppercase">
						Weakest Performing Letters
					</h3>
					{performanceAnalysis.weakItems.length === 0 ? (
						<p className="mt-2 text-xs text-zinc-500">
							No weak letters recorded yet. Any letter below 70% accuracy or
							with broken streaks will appear here.
						</p>
					) : (
						<div className="mt-2.5 flex flex-wrap gap-2">
							{performanceAnalysis.weakItems.slice(0, 8).map((item) => {
								const stats = masteryMap[item.id];
								const accuracy = getCharacterAccuracy(stats);
								const confusions = getTopConfusedRomaji(stats);
								return (
									<div
										key={item.id}
										className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 px-2.5 py-1.5"
									>
										<span className="text-base font-semibold text-zinc-100">
											{item.hiragana}
										</span>
										<div>
											<span className="block text-xs font-semibold text-rose-200 uppercase">
												{item.romaji} · {accuracy ?? 0}%
											</span>
											<span className="block text-[10px] text-zinc-400">
												{confusions[0]
													? `Confused w/ ${confusions[0].romaji}`
													: `${stats?.attempts ?? 0} tries`}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3.5">
					<h3 className="text-xs font-medium tracking-wider text-emerald-300 uppercase">
						Best Performing Letters
					</h3>
					{performanceAnalysis.strongItems.length === 0 ? (
						<p className="mt-2 text-xs text-zinc-500">
							Reach 80%+ accuracy with at least a 2x streak on a letter to mark
							it as Strong.
						</p>
					) : (
						<div className="mt-2.5 flex flex-wrap gap-2">
							{performanceAnalysis.strongItems.slice(0, 8).map((item) => {
								const stats = masteryMap[item.id];
								const accuracy = getCharacterAccuracy(stats);
								return (
									<div
										key={item.id}
										className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2.5 py-1.5"
									>
										<span className="text-base font-semibold text-zinc-100">
											{item.hiragana}
										</span>
										<div>
											<span className="block text-xs font-semibold text-emerald-200 uppercase">
												{item.romaji} · {accuracy ?? 100}%
											</span>
											<span className="block text-[10px] text-zinc-400">
												Streak {stats?.streak ?? 0}x
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Filter Pills for Sortable Performance Table */}
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap gap-1.5">
					{(
						[
							{ id: "all", label: "All Letters (104)" },
							{ id: "practiced", label: "Practiced Only" },
							{
								id: "weak",
								label: `Weak (${performanceAnalysis.weakItems.length})`,
							},
							{
								id: "strong",
								label: `Strong (${performanceAnalysis.strongItems.length})`,
							},
						] as const
					).map((filterOption) => (
						<button
							key={filterOption.id}
							type="button"
							className={`kana-interactive rounded-lg px-2.5 py-1 text-xs font-medium ${
								tableTierFilter === filterOption.id
									? "bg-zinc-800 text-zinc-100"
									: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
							}`}
							onClick={(): void => {
								setTableTierFilter(filterOption.id);
							}}
						>
							{filterOption.label}
						</button>
					))}
				</div>
				<span className="text-[11px] text-zinc-500">
					Select any column header to sort
				</span>
			</div>

			{/* Visually hidden status region for single-announcement table sorting */}
			<p ref={sortStatusRef} className="visually-hidden" role="status" />

			{/* Sortable Semantic Data Table */}
			<div
				aria-labelledby={tableCaptionId}
				className="max-h-72 overflow-x-auto overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-900/30"
				role="region"
				tabIndex={0}
			>
				<table
					ref={tableRef}
					className="kana-analytics-table w-full min-w-[34rem] border-separate border-spacing-0 text-left text-xs"
					id={tableId}
				>
					<caption
						className="border-b border-zinc-800/80 bg-zinc-950/70 px-4 py-2 text-left text-[11px] font-medium text-zinc-400"
						id={tableCaptionId}
					>
						Letter performance analytics table ({tableItems.length} letters
						shown)
					</caption>
					<thead className="sticky top-0 z-10 bg-zinc-950 text-[11px] text-zinc-400 uppercase">
						<tr>
							{TABLE_COLUMNS.map((column) => (
								<th
									key={column.label}
									className="border-b border-zinc-800 font-medium"
									data-type={column.dataType}
									scope="col"
								>
									<button
										className="flex w-full items-center justify-between gap-1 px-3 py-2.5 text-left font-medium text-zinc-300 hover:bg-zinc-900/80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-400"
										type="button"
										{...({
											command: "--sort",
											commandfor: tableId,
										} as Record<string, string>)}
										onClick={handleSortButtonClick}
									>
										<span>{column.label}</span>
										<span aria-hidden="true" className="sort-indicator">
											↓
										</span>
									</button>
								</th>
							))}
						</tr>
					</thead>
					<tbody ref={tbodyRef} className="divide-y divide-zinc-800/60">
						{tableItems.map((item) => {
							const stats = masteryMap[item.id];
							const accuracy = getCharacterAccuracy(stats);
							const averageMilliseconds =
								getCharacterAverageResponseMilliseconds(stats);
							const tier = getCharacterPerformanceTier(stats);
							const proficiency = getCharacterProficiencyScore(stats);

							return (
								<tr key={item.id} className="hover:bg-zinc-900/60">
									<th
										className="bg-zinc-950/90 px-3 py-2 font-semibold text-zinc-100"
										data-value={item.romaji}
										scope="row"
									>
										<span className="mr-2 text-sm">
											{item.hiragana}/{item.katakana}
										</span>
										<span className="text-zinc-400 uppercase">
											{item.romaji}
										</span>
									</th>
									<td className="px-3 py-2" data-value={`${proficiency}`}>
										<span
											className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium ${getTierBadgeStyle(tier)}`}
										>
											{getTierLabel(tier)}
										</span>
									</td>
									<td
										className="px-3 py-2 text-zinc-200 tabular-nums"
										data-value={`${accuracy ?? -1}`}
									>
										{accuracy !== null ? `${accuracy}%` : "—"}
									</td>
									<td
										className="px-3 py-2 text-zinc-300 tabular-nums"
										data-value={`${stats?.attempts ?? 0}`}
									>
										{stats?.attempts ?? 0}{" "}
										{stats && stats.attempts > 0
											? `(${stats.correct}✓ / ${stats.wrong ?? stats.attempts - stats.correct}✗)`
											: ""}
									</td>
									<td
										className="px-3 py-2 text-zinc-300 tabular-nums"
										data-value={`${stats?.streak ?? 0}`}
									>
										{stats?.streak ?? 0}x
									</td>
									<td
										className="px-3 py-2 text-zinc-300 tabular-nums"
										data-value={`${averageMilliseconds ?? 999_999}`}
									>
										{averageMilliseconds !== null
											? `${(averageMilliseconds / 1000).toFixed(2)}s`
											: "—"}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
});
