import type { MouseEvent as ReactMouseEvent } from "react";
import type { FunctionComponent } from "../../common/types";
import {
	type AppRoutePath,
	navigateToAppPath,
} from "../../features/kana/gameStorage";

export interface AppBottomNavProps {
	readonly activePath: AppRoutePath;
	readonly level?: number;
	readonly masteredCount?: number;
	readonly totalAchievements?: number;
	readonly totalKanaCount?: number;
	readonly unlockedAchievements?: number;
	readonly weakCount?: number;
	readonly onNavigate?: (targetPath: AppRoutePath) => void;
	readonly onOpenChart?: () => void;
	readonly onOpenStats?: () => void;
}

export const AppBottomNav = ({
	activePath,
	level,
	masteredCount,
	totalAchievements,
	totalKanaCount,
	unlockedAchievements,
	weakCount = 0,
	onNavigate,
	onOpenChart,
	onOpenStats,
}: AppBottomNavProps): FunctionComponent => {
	const handleNavLinkClick = (
		event: ReactMouseEvent<HTMLAnchorElement>,
		targetPath: AppRoutePath
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
		if (targetPath === "/chart" && onOpenChart) {
			onOpenChart();
		}
		if (targetPath === "/stats" && onOpenStats) {
			onOpenStats();
		}
		navigateToAppPath(targetPath, onNavigate);
	};

	const isPracticeActive = activePath === "/";
	const isDashboardActive = activePath === "/dashboard";
	const isChartActive = activePath === "/chart";
	const isStatsActive = activePath === "/stats";

	return (
		<nav
			aria-label="Primary"
			className="app-bottom-nav fixed bottom-0 inset-x-0 z-30 border-t border-zinc-800/85 bg-zinc-950/95 backdrop-blur-xl sm:bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md sm:rounded-2xl sm:border sm:border-zinc-800 sm:shadow-2xl sm:shadow-black/70"
		>
			<ul className="flex items-center justify-around px-2 pt-1 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] sm:pb-1 sm:pt-1 list-none m-0">
				{/* 1. Practice Tab */}
				<li className="flex-1">
					<a
						aria-current={isPracticeActive ? "page" : undefined}
						href="/"
						className={`group relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-center transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
							isPracticeActive
								? "app-tab-active font-semibold text-emerald-400"
								: "font-medium text-zinc-400 hover:text-zinc-200"
						}`}
						onClick={(event): void => {
							handleNavLinkClick(event, "/");
						}}
					>
						<span className="relative flex h-6 w-6 items-center justify-center">
							<svg
								aria-hidden="true"
								className="h-5 w-5 transition-transform duration-150 group-active:scale-90"
								fill={isPracticeActive ? "currentColor" : "none"}
								stroke="currentColor"
								strokeWidth={isPracticeActive ? 1.5 : 2}
								viewBox="0 0 24 24"
							>
								<path
									d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>
						<span className="text-[11px] tracking-tight">Practice</span>
						{isPracticeActive && (
							<span
								aria-hidden="true"
								className="app-tab-indicator mt-0.5 h-1 w-5 rounded-full bg-emerald-400"
							/>
						)}
					</a>
				</li>

				{/* 2. Dashboard Tab */}
				<li className="flex-1">
					<a
						aria-current={isDashboardActive ? "page" : undefined}
						href="/dashboard"
						className={`group relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-center transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
							isDashboardActive
								? "app-tab-active font-semibold text-sky-400"
								: "font-medium text-zinc-400 hover:text-zinc-200"
						}`}
						onClick={(event): void => {
							handleNavLinkClick(event, "/dashboard");
						}}
					>
						<span className="relative flex h-6 w-6 items-center justify-center">
							<svg
								aria-hidden="true"
								className="h-5 w-5 transition-transform duration-150 group-active:scale-90"
								fill="none"
								stroke="currentColor"
								strokeWidth={2}
								viewBox="0 0 24 24"
							>
								<path
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							{weakCount > 0 && (
								<span
									aria-label={`${weakCount} weak kana`}
									className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-zinc-950 tabular-nums"
								>
									{weakCount}
								</span>
							)}
						</span>
						<span className="text-[11px] tracking-tight">Dashboard</span>
						{isDashboardActive && (
							<span
								aria-hidden="true"
								className="app-tab-indicator mt-0.5 h-1 w-5 rounded-full bg-sky-400"
							/>
						)}
					</a>
				</li>

				{/* 3. Kana Chart Tab (Page Link) */}
				<li className="flex-1">
					<a
						aria-current={isChartActive ? "page" : undefined}
						href="/chart"
						className={`group relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-center transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
							isChartActive
								? "app-tab-active font-semibold text-amber-400"
								: "font-medium text-zinc-400 hover:text-zinc-200"
						}`}
						onClick={(event): void => {
							handleNavLinkClick(event, "/chart");
						}}
					>
						<span className="relative flex h-6 w-6 items-center justify-center">
							<svg
								aria-hidden="true"
								className="h-5 w-5 transition-transform duration-150 group-active:scale-90"
								fill="none"
								stroke="currentColor"
								strokeWidth={2}
								viewBox="0 0 24 24"
							>
								<path
									d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							{masteredCount !== undefined && totalKanaCount !== undefined && (
								<span className="absolute -top-1 -right-3 hidden rounded bg-zinc-800/90 px-1 text-[9px] font-semibold text-zinc-300 tabular-nums sm:inline-flex">
									{masteredCount}/{totalKanaCount}
								</span>
							)}
						</span>
						<span className="text-[11px] tracking-tight">Chart</span>
						{isChartActive && (
							<span
								aria-hidden="true"
								className="app-tab-indicator mt-0.5 h-1 w-5 rounded-full bg-amber-400"
							/>
						)}
					</a>
				</li>

				{/* 4. Stats & Badges Tab (Page Link) */}
				<li className="flex-1">
					<a
						aria-current={isStatsActive ? "page" : undefined}
						href="/stats"
						className={`group relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-center transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none ${
							isStatsActive
								? "app-tab-active font-semibold text-purple-400"
								: "font-medium text-zinc-400 hover:text-zinc-200"
						}`}
						onClick={(event): void => {
							handleNavLinkClick(event, "/stats");
						}}
					>
						<span className="relative flex h-6 w-6 items-center justify-center">
							<svg
								aria-hidden="true"
								className="h-5 w-5 transition-transform duration-150 group-active:scale-90"
								fill="none"
								stroke="currentColor"
								strokeWidth={2}
								viewBox="0 0 24 24"
							>
								<path
									d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.003 0H9.497m5.003 0a6 6 0 003.882-5.467c.074-.755-.494-1.408-1.252-1.408h-1.002a7.487 7.487 0 00-.73-2.022A4.5 4.5 0 0012 3.75a4.5 4.5 0 00-3.398 1.578 7.487 7.487 0 00-.73 2.022H6.87c-.758 0-1.326.653-1.252 1.408A6 6 0 009.498 14.25"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							{unlockedAchievements !== undefined &&
								totalAchievements !== undefined && (
									<span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/20 px-1 text-[9px] font-semibold text-amber-300 ring-1 ring-amber-500/40 tabular-nums">
										{unlockedAchievements}
									</span>
								)}
						</span>
						<span className="text-[11px] tracking-tight">
							Stats{level !== undefined ? ` · Lv.${level}` : ""}
						</span>
						{isStatsActive && (
							<span
								aria-hidden="true"
								className="app-tab-indicator mt-0.5 h-1 w-5 rounded-full bg-purple-400"
							/>
						)}
					</a>
				</li>
			</ul>
		</nav>
	);
};
