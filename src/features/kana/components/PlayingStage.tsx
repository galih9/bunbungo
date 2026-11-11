import { memo, type RefObject, useId, useRef } from "react";
import type { FunctionComponent } from "../../../common/types";
import { speakKanaCharacter } from "../audioEffects";
import {
	type CharacterMastery,
	type FlashcardChallenge,
	getCharacterPerformanceTier,
	type PracticeFocusMode,
	type StoredGameSettings,
} from "../gameStorage";

export interface FeedbackState {
	readonly status: "correct" | "wrong";
	readonly expectedRomaji: string;
	readonly chosenRomaji: string;
	readonly pointsEarned?: number;
	readonly responseTimeMilliseconds?: number;
	readonly speedTier?: "instant" | "fast" | "steady";
	readonly isRedemptionCleared?: boolean;
}

const QWERTY_ROWS: Array<Array<string>> = [
	["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
	["a", "s", "d", "f", "g", "h", "j", "k", "l"],
	["z", "x", "c", "v", "b", "n", "m"],
];

interface PlayingStageCardProps {
	readonly cardMastery: CharacterMastery | undefined;
	readonly currentCard: FlashcardChallenge;
	readonly feedback: FeedbackState | null;
	readonly inputMode: StoredGameSettings["inputMode"];
	readonly showHint: boolean;
	readonly onSkipWrongFeedbackWait: () => void;
	readonly onToggleHint: () => void;
}

const PlayingStageCard = memo(function PlayingStageCard({
	cardMastery,
	currentCard,
	feedback,
	inputMode,
	showHint,
	onSkipWrongFeedbackWait,
	onToggleHint,
}: PlayingStageCardProps): FunctionComponent {
	return (
		<div
			className={`relative flex flex-1 flex-col items-center justify-center rounded-2xl border p-6 text-center transition-colors duration-200 ${
				feedback?.status === "correct"
					? "kana-card-correct border-emerald-500/60 bg-emerald-950/15"
					: feedback?.status === "wrong"
						? "kana-card-wrong border-rose-500/60 bg-rose-950/15"
						: "border-zinc-800/90 bg-zinc-900/35"
			}`}
		>
			{/* Top Card Meta */}
			<div className="absolute top-4 right-4 left-4 flex items-center justify-between">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
						{currentCard.script} · {currentCard.item.category}
					</span>
					{cardMastery && (
						<span className="rounded border border-zinc-800 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] text-zinc-400 tabular-nums">
							{getCharacterPerformanceTier(cardMastery)}
						</span>
					)}
					{currentCard.isRedemption && (
						<span className="rounded border border-amber-500/40 bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
							Redemption Retry · +50 Bonus
						</span>
					)}
				</div>

				<div className="flex items-center gap-1.5">
					<button
						aria-label="Show pronunciation hint"
						type="button"
						className={`kana-interactive rounded-lg border px-2.5 py-1 text-xs font-medium ${
							showHint
								? "border-zinc-600 bg-zinc-800 text-zinc-100"
								: "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
						}`}
						onClick={onToggleHint}
					>
						Hint
					</button>
					<button
						aria-label="Speak character aloud"
						className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
						type="button"
						onClick={(): void => {
							speakKanaCharacter(currentCard.displayCharacter, true);
						}}
					>
						Audio
					</button>
				</div>
			</div>

			{/* Giant Animated Kana Character */}
			<div
				key={currentCard.cardId}
				className="kana-glyph-enter kana-hero-glyph my-6 font-bold tracking-tight text-zinc-100 select-none"
			>
				{currentCard.displayCharacter}
			</div>

			{/* Reserved Feedback / Hint Slot */}
			<div className="flex min-h-9 items-center justify-center">
				{feedback ? (
					feedback.status === "correct" ? (
						<div className="kana-view-enter inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
							<span>Correct</span>
							<span className="uppercase">· {feedback.expectedRomaji}</span>
							{feedback.pointsEarned !== undefined && (
								<span className="text-emerald-200 tabular-nums">
									· +{feedback.pointsEarned} pts
								</span>
							)}
							{feedback.speedTier === "instant" && (
								<span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-200">
									⚡ Instant
								</span>
							)}
							{feedback.speedTier === "fast" && (
								<span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-200">
									🔥 Fast
								</span>
							)}
							{feedback.isRedemptionCleared && (
								<span className="rounded bg-amber-500/25 px-1.5 py-0.5 text-[10px] text-amber-200">
									Redeemed!
								</span>
							)}
						</div>
					) : (
						<div className="kana-view-enter inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-medium text-rose-200">
							<span>
								Expected{" "}
								<strong className="font-semibold text-white uppercase">
									{feedback.expectedRomaji}
								</strong>
							</span>
							<span className="text-rose-300/80">
								· {currentCard.item.hint}
							</span>
							<button
								className="ml-1 rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/35"
								type="button"
								onClick={onSkipWrongFeedbackWait}
							>
								Next →
							</button>
						</div>
					)
				) : showHint ? (
					<p className="kana-view-enter rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
						{currentCard.item.hint} ·{" "}
						<span className="text-zinc-400">
							starts with &ldquo;{currentCard.item.romaji[0]}&rdquo;
						</span>
					</p>
				) : (
					<p className="text-xs text-zinc-500">
						{inputMode === "choice"
							? "Select matching romaji or press 1–4 (H for hint, R for audio)"
							: "Type romaji below"}
					</p>
				)}
			</div>
		</div>
	);
});

interface PlayingStageProps {
	readonly attemptCount: number;
	readonly cardMastery: CharacterMastery | undefined;
	readonly correctCount: number;
	readonly currentCard: FlashcardChallenge;
	readonly currentIndex: number;
	readonly deckLength: number;
	readonly feedback: FeedbackState | null;
	readonly playingStageRef: RefObject<HTMLDivElement | null>;
	readonly practiceFocusMode: PracticeFocusMode;
	readonly remainingSeconds: number;
	readonly score: number;
	readonly sessionAccuracy: number;
	readonly settings: StoredGameSettings;
	readonly showHint: boolean;
	readonly streak: number;
	readonly typedValue: string;
	readonly typingInputRef: RefObject<HTMLInputElement | null>;
	readonly onBackspaceTyped: () => void;
	readonly onEndRun: () => void;
	readonly onSkipWrongFeedbackWait: () => void;
	readonly onSubmitAnswer: (romaji: string) => void;
	readonly onToggleHint: () => void;
	readonly onToggleTouchKeyboard: () => void;
	readonly onTypedInputChange: (nextText: string) => void;
}

export const PlayingStage = memo(function PlayingStage({
	attemptCount,
	cardMastery,
	correctCount,
	currentCard,
	currentIndex,
	deckLength,
	feedback,
	playingStageRef,
	practiceFocusMode,
	remainingSeconds,
	score,
	sessionAccuracy,
	settings,
	showHint,
	streak,
	typedValue,
	typingInputRef,
	onBackspaceTyped,
	onEndRun,
	onSkipWrongFeedbackWait,
	onSubmitAnswer,
	onToggleHint,
	onToggleTouchKeyboard,
	onTypedInputChange,
}: PlayingStageProps): FunctionComponent {
	const typingInputId = useId();
	const lastCompositionEndAtRef = useRef<number | null>(null);

	return (
		<div
			ref={playingStageRef}
			className="kana-stage-container kana-view-enter flex flex-1 flex-col justify-between gap-5 focus:outline-none"
			tabIndex={-1}
		>
			{/* Minimal HUD Bar */}
			<div className="space-y-3">
				<div className="flex items-center justify-between gap-2">
					<button
						className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
						type="button"
						onClick={onEndRun}
					>
						End Run
					</button>

					<div className="flex items-center gap-2 text-xs tabular-nums">
						{practiceFocusMode === "weak-letters" && (
							<span className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-2 py-1 text-[11px] font-medium text-rose-300">
								Weak Focus
							</span>
						)}
						{settings.gameMode === "time-attack" ? (
							<span
								className={`rounded-lg border px-2.5 py-1 font-medium ${
									remainingSeconds <= 10
										? "border-rose-500/50 bg-rose-950/40 text-rose-300"
										: "border-zinc-800 bg-zinc-900/70 text-zinc-300"
								}`}
							>
								{remainingSeconds}s
							</span>
						) : (
							<span className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 font-medium text-zinc-300">
								{settings.gameMode === "sprint"
									? `Card ${currentIndex + 1} / ${deckLength}`
									: `Cleared ${correctCount}`}
							</span>
						)}

						<span
							className={`rounded-lg border px-2.5 py-1 font-medium transition-colors ${
								streak >= 5
									? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
									: "border-zinc-800 bg-zinc-900/70 text-zinc-400"
							}`}
						>
							Streak {streak}x{" "}
							<span className="text-[10px] opacity-80">
								({Math.min(4, 1 + Math.floor(streak / 5))}x)
							</span>
						</span>

						{attemptCount > 0 && (
							<span className="hidden rounded-lg border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-[11px] font-medium text-zinc-400 sm:inline-block">
								{sessionAccuracy}% acc
							</span>
						)}

						<span className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 font-semibold text-zinc-100">
							{score.toLocaleString()} pts
						</span>
					</div>
				</div>

				{/* Ultra-slim Progress Line */}
				<div className="h-1 w-full overflow-hidden rounded-full bg-zinc-900">
					<div
						className="h-full rounded-full bg-zinc-200 transition-all duration-300 ease-out"
						style={{
							width:
								settings.gameMode === "sprint"
									? `${Math.min(100, ((currentIndex + 1) / deckLength) * 100)}%`
									: settings.gameMode === "time-attack"
										? `${(remainingSeconds / 60) * 100}%`
										: "100%",
						}}
					/>
				</div>
			</div>

			{/* Center Flashcard Stage */}
			<PlayingStageCard
				cardMastery={cardMastery}
				currentCard={currentCard}
				feedback={feedback}
				inputMode={settings.inputMode}
				showHint={showHint}
				onSkipWrongFeedbackWait={onSkipWrongFeedbackWait}
				onToggleHint={onToggleHint}
			/>

			{/* Answer Controls */}
			{settings.inputMode === "choice" ? (
				<div className="grid grid-cols-2 gap-2.5 pb-1">
					{currentCard.options.map((optionRomaji, optionIndex) => {
						const isCorrectOption =
							feedback !== null && optionRomaji === currentCard.item.romaji;
						const isWrongChosen =
							feedback?.status === "wrong" &&
							feedback.chosenRomaji === optionRomaji;

						let buttonStyle =
							"border-zinc-800 bg-zinc-900/60 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900";
						if (isCorrectOption) {
							buttonStyle =
								"border-emerald-500/80 bg-emerald-500/20 text-emerald-100";
						} else if (isWrongChosen) {
							buttonStyle = "border-rose-500/80 bg-rose-500/20 text-rose-200";
						}

						return (
							<button
								key={optionRomaji}
								className={`kana-interactive relative flex min-h-15 items-center justify-center rounded-xl border px-4 py-3.5 text-lg font-semibold tracking-wide uppercase ${buttonStyle}`}
								disabled={feedback !== null}
								type="button"
								onClick={(): void => {
									onSubmitAnswer(optionRomaji);
								}}
							>
								<span className="absolute left-3.5 text-[11px] font-medium text-zinc-500 tabular-nums">
									{optionIndex + 1}
								</span>
								<span>{optionRomaji}</span>
							</button>
						);
					})}
				</div>
			) : (
				<div className="space-y-3 pb-1">
					<form
						className="flex gap-2"
						onSubmit={(event): void => {
							event.preventDefault();
							if (typedValue.trim().length > 0) {
								onSubmitAnswer(typedValue);
							}
						}}
					>
						<label className="visually-hidden" htmlFor={typingInputId}>
							Type Romaji for the displayed Kana
						</label>
						<input
							ref={typingInputRef}
							autoCapitalize="none"
							autoComplete="off"
							autoCorrect="off"
							className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-center text-xl font-semibold tracking-widest text-zinc-100 uppercase placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
							id={typingInputId}
							placeholder="Type romaji (ka, shi, tsu)..."
							spellCheck={false}
							type="text"
							value={typedValue}
							onChange={(event): void => {
								onTypedInputChange(event.target.value);
							}}
							onCompositionEnd={(event): void => {
								lastCompositionEndAtRef.current = event.nativeEvent.timeStamp;
							}}
							onKeyDown={(event): void => {
								if (event.key === "Enter") {
									event.preventDefault();
									if (
										event.nativeEvent.isComposing ||
										event.nativeEvent.keyCode === 229
									) {
										return;
									}
									if (
										lastCompositionEndAtRef.current !== null &&
										Math.abs(
											event.nativeEvent.timeStamp -
												lastCompositionEndAtRef.current
										) < 50
									) {
										return;
									}
									if (typedValue.trim().length > 0) {
										onSubmitAnswer(typedValue);
									}
								}
							}}
						/>
						<button
							className="kana-interactive rounded-xl bg-zinc-100 px-5 py-3 text-xs font-semibold text-zinc-950 hover:bg-white"
							type="submit"
						>
							Submit
						</button>
					</form>

					{/* Toggleable Mobile On-Screen Romaji Keypad */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between px-1">
							<span className="text-[11px] text-zinc-500">
								Auto-matches valid romaji immediately
							</span>
							<button
								className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200"
								type="button"
								onClick={onToggleTouchKeyboard}
							>
								{settings.showTouchKeyboard
									? "Hide Touch Keypad"
									: "Show Touch Keypad"}
							</button>
						</div>

						{settings.showTouchKeyboard && (
							<div className="space-y-1.5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-2">
								{QWERTY_ROWS.map((rowKeys, rowIndex) => (
									<div
										key={`kb-row-${rowIndex}`}
										className="flex justify-center gap-1"
									>
										{rowKeys.map((letter) => (
											<button
												key={letter}
												className="kana-interactive flex h-10 flex-1 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-200 uppercase hover:border-zinc-700 hover:bg-zinc-800"
												type="button"
												onClick={(): void => {
													onTypedInputChange(typedValue + letter);
												}}
											>
												{letter}
											</button>
										))}
										{rowIndex === 2 && (
											<button
												aria-label="Backspace"
												className="kana-interactive flex h-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200"
												type="button"
												onClick={onBackspaceTyped}
											>
												Del
											</button>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
});
