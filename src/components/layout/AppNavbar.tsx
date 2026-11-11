import type { MouseEvent as ReactMouseEvent } from "react";
import type { FunctionComponent } from "../../common/types";
import {
	type AppRoutePath,
	getRankTitleForLevel,
	navigateToAppPath,
} from "../../features/kana/gameStorage";

export interface AppNavbarProps {
	readonly activePath?: AppRoutePath;
	readonly level: number;
	readonly masteredCount?: number;
	readonly skipTargetId: string;
	readonly soundEnabled?: boolean;
	readonly totalAchievements: number;
	readonly totalKanaCount?: number;
	readonly unlockedAchievements: number;
	readonly voiceEnabled?: boolean;
	readonly weakCount?: number;
	readonly onNavigate?: (targetPath: AppRoutePath) => void;
	readonly onOpenChart?: () => void;
	readonly onOpenStats?: () => void;
	readonly onToggleSound?: () => void;
	readonly onToggleVoice?: () => void;
}

export const AppNavbar = ({
	level,
	skipTargetId,
	soundEnabled,
	totalAchievements,
	unlockedAchievements,
	voiceEnabled,
	onNavigate,
	onToggleSound,
	onToggleVoice,
}: AppNavbarProps): FunctionComponent => {
	const handleHomeLinkClick = (
		event: ReactMouseEvent<HTMLAnchorElement>
	): void => {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}
		event.preventDefault();
		navigateToAppPath("/", onNavigate);
	};

	return (
		<header className="site-header sticky top-0 z-20 border-b border-zinc-900 bg-zinc-950/85 backdrop-blur-md">
			<a className="skip-link visually-hidden" href={`#${skipTargetId}`}>
				Skip to main content
			</a>

			<div className="header-inner toolbar mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
				{/* Brand Identity & Level Status */}
				<div className="flex items-center gap-3">
					<a
						aria-label="Bun Bun Go Home"
						className="kana-interactive flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-base font-semibold text-zinc-100 hover:border-zinc-700"
						href="/"
						onClick={handleHomeLinkClick}
					>
						<span aria-hidden="true" lang="ja">
							あ
						</span>
					</a>
					<div>
						<div className="flex items-center gap-2">
							<span className="text-sm font-semibold tracking-tight text-zinc-100">
								Bun Bun Go
							</span>
							<span className="rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-zinc-400">
								Lv.{level}
							</span>
						</div>
						<p className="text-[11px] text-zinc-500">
							{getRankTitleForLevel(level)} · {unlockedAchievements}/
							{totalAchievements} Badges
						</p>
					</div>
				</div>

				{/* Quick Audio Controls */}
				<div className="flex items-center gap-1.5">
					{onToggleSound !== undefined && soundEnabled !== undefined && (
						<button
							type="button"
							aria-label={
								soundEnabled ? "Mute sound effects" : "Unmute sound effects"
							}
							className={`kana-interactive inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
								soundEnabled
									? "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700"
									: "border-zinc-900 bg-zinc-950 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400"
							}`}
							onClick={onToggleSound}
						>
							<span
								aria-hidden="true"
								className={`h-1.5 w-1.5 rounded-full ${
									soundEnabled ? "bg-emerald-400" : "bg-zinc-700"
								}`}
							/>
							<span>SFX</span>
						</button>
					)}

					{onToggleVoice !== undefined && voiceEnabled !== undefined && (
						<button
							type="button"
							aria-label={
								voiceEnabled
									? "Disable kana voice pronunciation"
									: "Enable kana voice pronunciation"
							}
							className={`kana-interactive inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
								voiceEnabled
									? "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700"
									: "border-zinc-900 bg-zinc-950 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400"
							}`}
							onClick={onToggleVoice}
						>
							<span
								aria-hidden="true"
								className={`h-1.5 w-1.5 rounded-full ${
									voiceEnabled ? "bg-emerald-400" : "bg-zinc-700"
								}`}
							/>
							<span>Voice</span>
						</button>
					)}
				</div>
			</div>
		</header>
	);
};
