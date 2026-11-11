import { memo, type RefObject } from "react";
import type { FunctionComponent } from "../../../common/types";
import { speakKanaCharacter } from "../audioEffects";
import {
	navigateToAppPath,
	type SessionProgressionResult,
	type StoredGameSettings,
} from "../gameStorage";
import type { KanaItem } from "../kanaData";

interface SessionSummaryViewProps {
	readonly bestStreak: number;
	readonly elapsedSeconds: number;
	readonly lastSessionResult: SessionProgressionResult | null;
	readonly missedItems: Array<KanaItem>;
	readonly score: number;
	readonly sessionAccuracy: number;
	readonly settings: StoredGameSettings;
	readonly summaryHeadingRef: RefObject<HTMLHeadingElement | null>;
	readonly weakItemsCount: number;
	readonly onCustomizeDeck: () => void;
	readonly onPlayAgain: () => void;
	readonly onPracticeMissedItems: (items: Array<KanaItem>) => void;
	readonly onPracticeWeakLetters: () => void;
}

export const SessionSummaryView = memo(function SessionSummaryView({
	bestStreak,
	elapsedSeconds,
	lastSessionResult,
	missedItems,
	score,
	sessionAccuracy,
	settings,
	summaryHeadingRef,
	weakItemsCount,
	onCustomizeDeck,
	onPlayAgain,
	onPracticeMissedItems,
	onPracticeWeakLetters,
}: SessionSummaryViewProps): FunctionComponent {
	return (
		<div className="kana-view-enter flex flex-1 flex-col justify-between gap-6 py-2">
			<div className="space-y-6 rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-6 text-center">
				<div>
					<p className="text-[11px] font-medium tracking-widest text-zinc-500 uppercase">
						{settings.gameMode.replace("-", " ")} · {settings.scriptMode}
					</p>
					<h2
						ref={summaryHeadingRef}
						className="mt-1 text-xl font-semibold tracking-tight text-zinc-100 focus:outline-none"
						tabIndex={-1}
					>
						Session Complete
					</h2>
					{lastSessionResult && lastSessionResult.xpEarned > 0 && (
						<p className="mt-1 text-xs font-medium text-emerald-300">
							+{lastSessionResult.xpEarned} XP Earned · Level{" "}
							{lastSessionResult.newLevel}
							{lastSessionResult.newLevel > lastSessionResult.previousLevel
								? " (Level Up!)"
								: ""}
						</p>
					)}
				</div>

				{/* Score & Metrics Grid */}
				<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
					<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
						<span className="block text-[11px] font-medium text-zinc-500 uppercase">
							Score
						</span>
						<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
							{score.toLocaleString()}
						</span>
					</div>
					<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
						<span className="block text-[11px] font-medium text-zinc-500 uppercase">
							Accuracy
						</span>
						<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
							{sessionAccuracy}%
						</span>
					</div>
					<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
						<span className="block text-[11px] font-medium text-zinc-500 uppercase">
							Best Streak
						</span>
						<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
							{bestStreak}x
						</span>
					</div>
					<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
						<span className="block text-[11px] font-medium text-zinc-500 uppercase">
							Duration
						</span>
						<span className="mt-1 block text-lg font-semibold text-zinc-100 tabular-nums">
							{elapsedSeconds}s
						</span>
					</div>
				</div>

				{/* Newly Unlocked Rows Celebration */}
				{lastSessionResult &&
					lastSessionResult.newlyUnlockedRows.length > 0 && (
						<div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-left">
							<h3 className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
								New Kana Rows Unlocked (
								{lastSessionResult.newlyUnlockedRows.length})
							</h3>
							<div className="mt-2 flex flex-wrap gap-2">
								{lastSessionResult.newlyUnlockedRows.map((rowGroup) => (
									<span
										key={rowGroup.id}
										className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-100"
									>
										{rowGroup.sampleHiragana} {rowGroup.label} (
										{rowGroup.romajiSummary})
									</span>
								))}
							</div>
						</div>
					)}

				{/* Newly Unlocked Achievements Celebration */}
				{lastSessionResult &&
					lastSessionResult.newlyUnlockedAchievements.length > 0 && (
						<div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-left">
							<h3 className="text-xs font-semibold tracking-wider text-amber-300 uppercase">
								Achievements Unlocked (
								{lastSessionResult.newlyUnlockedAchievements.length})
							</h3>
							<div className="mt-2 grid gap-2 sm:grid-cols-2">
								{lastSessionResult.newlyUnlockedAchievements.map(
									(achievement) => (
										<div
											key={achievement.id}
											className="flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-zinc-950/70 p-2.5"
										>
											<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/20 text-xs font-bold text-amber-200">
												{achievement.badgeSymbol}
											</span>
											<div>
												<p className="text-xs font-semibold text-zinc-100">
													{achievement.title}
												</p>
												<p className="text-[11px] text-zinc-400">
													{achievement.description}
												</p>
											</div>
										</div>
									)
								)}
							</div>
						</div>
					)}

				{/* Missed Characters Review Section */}
				{missedItems.length > 0 ? (
					<div className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-4 text-left">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<h3 className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
								Characters to Review ({missedItems.length})
							</h3>
							<button
								className="kana-interactive rounded-lg border border-rose-500/40 bg-rose-950/30 px-2.5 py-1 text-xs font-medium text-rose-200 hover:bg-rose-950/50"
								type="button"
								onClick={(): void => {
									onPracticeMissedItems(missedItems);
								}}
							>
								Practice Missed Letters Now
							</button>
						</div>
						<div className="mt-3 flex flex-wrap gap-2">
							{missedItems.map((item) => (
								<button
									key={item.id}
									className="kana-interactive flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left hover:border-zinc-700"
									type="button"
									onClick={(): void => {
										speakKanaCharacter(item.hiragana, true);
									}}
								>
									<span className="text-lg font-semibold text-zinc-100">
										{settings.scriptMode === "katakana"
											? item.katakana
											: item.hiragana}
									</span>
									<div>
										<span className="block text-xs font-semibold text-zinc-200 uppercase">
											{item.romaji}
										</span>
										<span className="block text-[10px] text-zinc-500">
											{item.hiragana} / {item.katakana}
										</span>
									</div>
								</button>
							))}
						</div>
					</div>
				) : (
					<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
						<p className="text-xs font-medium text-zinc-300">
							Flawless session — zero characters missed.
						</p>
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<button
					className="kana-interactive rounded-xl border border-zinc-800 bg-zinc-900 py-3.5 text-xs font-semibold text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
					type="button"
					onClick={onCustomizeDeck}
				>
					Customize Deck
				</button>
				<button
					className="kana-interactive rounded-xl border border-zinc-800 bg-zinc-900 py-3.5 text-xs font-semibold text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
					type="button"
					onClick={(): void => {
						navigateToAppPath("/dashboard");
					}}
				>
					View Dashboard
				</button>
				<button
					className="kana-interactive rounded-xl border border-zinc-800 bg-zinc-900 py-3.5 text-xs font-semibold text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
					type="button"
					onClick={onPracticeWeakLetters}
				>
					Practice Weak ({weakItemsCount})
				</button>
				<button
					className="kana-interactive rounded-xl bg-zinc-100 py-3.5 text-xs font-semibold text-zinc-950 hover:bg-white"
					type="button"
					onClick={onPlayAgain}
				>
					Play Again
				</button>
			</div>
		</div>
	);
});
