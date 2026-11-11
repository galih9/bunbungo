import type { LetterPerformanceTier } from "../gameStorage";

export type CodexModalTab =
	| "chart"
	| "analytics"
	| "achievements"
	| "leaderboard";

export type ElementWithViewTransition = HTMLElement & {
	startViewTransition?: (updateCallback: () => void) => void;
};

export type DocumentWithViewTransition = Document & {
	startViewTransition?: (updateCallback: () => void) => void;
};

type ElementWithMoveBefore = HTMLElement & {
	moveBefore?: (node: Node, child: Node | null) => void;
};

let cachedSupportsDisplayTransition: boolean | undefined;

const canTransitionDisplay = (): boolean => {
	if (cachedSupportsDisplayTransition !== undefined) {
		return cachedSupportsDisplayTransition;
	}
	if (
		typeof window === "undefined" ||
		!window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
		!document.body
	) {
		return false;
	}
	const probe = document.createElement("div");
	probe.style.cssText =
		"transition: display 1s allow-discrete !important; display: block;";
	document.body.appendChild(probe);
	void window.getComputedStyle(probe).display;
	probe.style.display = "none";
	cachedSupportsDisplayTransition =
		window.getComputedStyle(probe).display === "block";
	probe.remove();
	return cachedSupportsDisplayTransition;
};

export const supportsTopLayerExit = (): boolean => {
	return (
		typeof window !== "undefined" &&
		Boolean(window.CSS?.supports?.("overlay", "auto")) &&
		canTransitionDisplay()
	);
};

export const textCollator = new Intl.Collator(undefined, {
	numeric: true,
	sensitivity: "base",
});

export const reorderContainerChildren = (
	container: HTMLElement,
	orderedNodes: Array<HTMLElement>
): void => {
	const moveBeforeMethod = (container as ElementWithMoveBefore).moveBefore;
	const canMoveBefore = typeof moveBeforeMethod === "function";
	for (const node of orderedNodes) {
		if (canMoveBefore) {
			moveBeforeMethod.call(container, node, null);
		} else {
			container.append(node);
		}
	}
};

export const getTierBadgeStyle = (tier: LetterPerformanceTier): string => {
	if (tier === "strong") {
		return "border-emerald-500/40 bg-emerald-950/40 text-emerald-300";
	}
	if (tier === "weak") {
		return "border-rose-500/40 bg-rose-950/40 text-rose-300";
	}
	if (tier === "learning") {
		return "border-amber-500/40 bg-amber-950/40 text-amber-300";
	}
	return "border-zinc-800 bg-zinc-900 text-zinc-400";
};

export const getTierLabel = (tier: LetterPerformanceTier): string => {
	if (tier === "strong") {
		return "Strong";
	}
	if (tier === "weak") {
		return "Weak";
	}
	if (tier === "learning") {
		return "Learning";
	}
	return "Unseen";
};
