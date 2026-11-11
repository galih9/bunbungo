import { memo, useState } from "react";
import type { FunctionComponent } from "../../../common/types";
import type { HighScoreRecord } from "../gameStorage";

interface CodexLeaderboardTabProps {
	readonly highScores: Array<HighScoreRecord>;
	readonly onClearProgress: () => void;
}

export const CodexLeaderboardTab = memo(function CodexLeaderboardTab({
	highScores,
	onClearProgress,
}: CodexLeaderboardTabProps): FunctionComponent {
	const [confirmReset, setConfirmReset] = useState<boolean>(false);

	return (
		<div className="space-y-4">
			{highScores.length === 0 ? (
				<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-8 text-center">
					<p className="text-sm font-medium text-zinc-300">
						No sessions recorded yet
					</p>
					<p className="mt-1 text-xs text-zinc-400">
						Complete a Sprint or Timed session to log your personal records
						locally.
					</p>
				</div>
			) : (
				<div className="divide-y divide-zinc-800/70 rounded-xl border border-zinc-800/80 bg-zinc-900/30">
					{highScores.map((record, index) => (
						<div
							key={record.id}
							className="flex items-center justify-between px-4 py-3"
						>
							<div className="flex items-center gap-3">
								<span className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-[11px] font-medium text-zinc-400 tabular-nums">
									{index + 1}
								</span>
								<div>
									<p className="text-xs font-semibold text-zinc-200 capitalize">
										{record.gameMode.replace("-", " ")} · {record.scriptMode}
									</p>
									<p className="mt-0.5 text-[11px] text-zinc-400 tabular-nums">
										{record.cardsCleared} cards · {record.accuracy}% accuracy ·{" "}
										{record.durationSeconds}s
									</p>
								</div>
							</div>
							<div className="text-right tabular-nums">
								<span className="text-sm font-semibold text-zinc-100">
									{record.score.toLocaleString()}
								</span>
								<span className="ml-1 text-[10px] text-zinc-400 uppercase">
									pts
								</span>
							</div>
						</div>
					))}
				</div>
			)}

			<div className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
				<span className="text-xs text-zinc-400">
					Progress, analytics, and achievements are stored locally.
				</span>
				{confirmReset ? (
					<div className="flex items-center gap-2">
						<button
							className="kana-interactive rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
							type="button"
							onClick={(): void => {
								onClearProgress();
								setConfirmReset(false);
							}}
						>
							Confirm Reset
						</button>
						<button
							className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
							type="button"
							onClick={(): void => {
								setConfirmReset(false);
							}}
						>
							Cancel
						</button>
					</div>
				) : (
					<button
						className="kana-interactive rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/30"
						type="button"
						onClick={(): void => {
							setConfirmReset(true);
						}}
					>
						Reset Progress
					</button>
				)}
			</div>
		</div>
	);
});
