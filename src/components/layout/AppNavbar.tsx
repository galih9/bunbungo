import {
	type MouseEvent as ReactMouseEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
} from "react";
import type { FunctionComponent } from "../../common/types";
import {
	type AppRoutePath,
	getRankTitleForLevel,
	navigateToAppPath,
} from "../../features/kana/gameStorage";

interface AppNavbarProps {
	readonly activePath: AppRoutePath;
	readonly level: number;
	readonly masteredCount: number;
	readonly skipTargetId: string;
	readonly soundEnabled?: boolean;
	readonly totalAchievements: number;
	readonly totalKanaCount: number;
	readonly unlockedAchievements: number;
	readonly voiceEnabled?: boolean;
	readonly weakCount: number;
	readonly onNavigate?: (targetPath: AppRoutePath) => void;
	readonly onOpenChart: () => void;
	readonly onOpenStats: () => void;
	readonly onToggleSound?: () => void;
	readonly onToggleVoice?: () => void;
}

type PopoverCapableElement = HTMLElement & {
	hidePopover?: () => void;
	showPopover?: () => void;
};

export const AppNavbar = ({
	activePath,
	level,
	masteredCount,
	skipTargetId,
	soundEnabled,
	totalAchievements,
	totalKanaCount,
	unlockedAchievements,
	voiceEnabled,
	weakCount,
	onNavigate,
	onOpenChart,
	onOpenStats,
	onToggleSound,
	onToggleVoice,
}: AppNavbarProps): FunctionComponent => {
	const headerRef = useRef<HTMLElement | null>(null);
	const innerRef = useRef<HTMLDivElement | null>(null);
	const menuRef = useRef<HTMLUListElement | null>(null);
	const lastCollapsedWidthRef = useRef<number>(0);
	const rawMenuId = useId();
	const menuId = `site-menu-${rawMenuId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

	const synchronizeLayout = useCallback((forceMeasure: boolean): void => {
		const headerElement = headerRef.current;
		const innerElement = innerRef.current;
		const menuElement = menuRef.current as PopoverCapableElement | null;
		if (!headerElement || !innerElement || !menuElement) {
			return;
		}

		const currentlyWide = headerElement.classList.contains("is-wide");
		const currentHeaderWidth = headerElement.clientWidth;

		if (
			!forceMeasure &&
			!currentlyWide &&
			currentHeaderWidth <= lastCollapsedWidthRef.current
		) {
			return;
		}

		const wasPopoverOpen =
			menuElement.matches?.(":popover-open") === true ||
			menuElement.classList.contains(":popover-open");

		headerElement.classList.add("is-measuring", "is-wide");
		const fitsInline =
			innerElement.scrollWidth <= innerElement.clientWidth ||
			innerElement.clientWidth === 0;

		if (fitsInline) {
			headerElement.classList.add("is-wide");
			menuElement.removeAttribute("popover");
		} else {
			headerElement.classList.remove("is-wide");
			lastCollapsedWidthRef.current = currentHeaderWidth;
			menuElement.setAttribute("popover", "auto");
			if (wasPopoverOpen && typeof menuElement.showPopover === "function") {
				try {
					menuElement.showPopover();
				} catch {
					// Ignore if popover cannot be re-opened in current environment
				}
			}
		}

		window.requestAnimationFrame(() => {
			headerElement.classList.remove("is-measuring");
		});
	}, []);

	useEffect(() => {
		synchronizeLayout(true);

		if (typeof ResizeObserver === "undefined") {
			return;
		}

		const observer = new ResizeObserver(() => {
			synchronizeLayout(false);
		});

		if (headerRef.current) {
			observer.observe(headerRef.current);
		}
		if (menuRef.current) {
			observer.observe(menuRef.current);
		}

		return (): void => {
			observer.disconnect();
		};
	}, [synchronizeLayout]);

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
		const menuElement = menuRef.current as PopoverCapableElement | null;
		if (
			menuElement?.hasAttribute("popover") &&
			typeof menuElement.hidePopover === "function"
		) {
			try {
				menuElement.hidePopover();
			} catch {
				// Ignore if not currently open
			}
		}
		navigateToAppPath(targetPath, onNavigate);
	};

	const popoverListAttributes = {
		popover: "auto",
	} as Record<string, string>;

	return (
		<header
			ref={headerRef}
			className="site-header is-wide sticky top-0 z-20 border-b border-zinc-900 bg-zinc-950/85 backdrop-blur-md"
		>
			<a className="skip-link visually-hidden" href={`#${skipTargetId}`}>
				Skip to main content
			</a>

			<div
				ref={innerRef}
				className="header-inner toolbar mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3"
			>
				<div className="flex items-center gap-3">
					<a
						aria-label="Bun Bun Go Home"
						className="kana-interactive flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-base font-semibold text-zinc-100 hover:border-zinc-700"
						href="/"
						onClick={(event): void => {
							handleNavLinkClick(event, "/");
						}}
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

				<div className="flex items-center gap-2">
					<nav aria-label="Primary" className="site-nav">
						<button
							aria-controls={menuId}
							className="menu-button kana-interactive inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
							popoverTarget={menuId}
							popoverTargetAction="toggle"
							type="button"
							onClick={(): void => {
								if (
									typeof HTMLElement !== "undefined" &&
									!Object.prototype.hasOwnProperty.call(
										HTMLElement.prototype,
										"popover"
									)
								) {
									menuRef.current?.classList.toggle(":popover-open");
								}
							}}
						>
							<svg
								aria-hidden="true"
								className="h-3.5 w-3.5 text-zinc-400"
								fill="none"
								stroke="currentColor"
								strokeWidth={2}
								viewBox="0 0 24 24"
							>
								<path
									d="M4 7h16M4 12h16M4 17h16"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<span>Menu</span>
						</button>

						<ul
							ref={menuRef}
							className="site-menu"
							id={menuId}
							{...popoverListAttributes}
						>
							<li>
								<a
									aria-current={activePath === "/" ? "page" : undefined}
									className="kana-interactive inline-flex w-full items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100"
									href="/"
									onClick={(event): void => {
										handleNavLinkClick(event, "/");
									}}
								>
									<svg
										aria-hidden="true"
										className="h-3.5 w-3.5 text-emerald-400"
										fill="none"
										stroke="currentColor"
										strokeWidth={2}
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
									<span>Practice</span>
								</a>
							</li>
							<li>
								<a
									className="kana-interactive inline-flex w-full items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100"
									href="/dashboard"
									aria-current={
										activePath === "/dashboard" ? "page" : undefined
									}
									onClick={(event): void => {
										handleNavLinkClick(event, "/dashboard");
									}}
								>
									<svg
										aria-hidden="true"
										className="h-3.5 w-3.5 text-sky-400"
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
									<span>Dashboard</span>
									{weakCount > 0 && (
										<span className="rounded bg-rose-500/20 px-1 text-[10px] font-semibold text-rose-300 tabular-nums">
											{weakCount}
										</span>
									)}
								</a>
							</li>
						</ul>
					</nav>

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

						<button
							className="kana-interactive inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
							type="button"
							onClick={onOpenStats}
						>
							<span>Stats</span>
							{weakCount > 0 && (
								<span className="rounded bg-rose-500/20 px-1 text-[10px] font-semibold text-rose-300 tabular-nums">
									{weakCount}
								</span>
							)}
						</button>

						<button
							className="kana-interactive inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
							type="button"
							onClick={onOpenChart}
						>
							<span>Chart</span>
							<span className="text-[11px] text-zinc-400 tabular-nums">
								{masteredCount}/{totalKanaCount}
							</span>
						</button>
					</div>
				</div>
			</div>
		</header>
	);
};
