import type { AppRoutePath } from "./storageTypes";

type DocumentWithViewTransition = Document & {
	startViewTransition?: (updateCallback: () => void) => void;
};

export const navigateToAppPath = (
	targetPath: AppRoutePath,
	customHandler?: (path: AppRoutePath) => void
): void => {
	if (customHandler) {
		customHandler(targetPath);
		return;
	}
	if (typeof window === "undefined") {
		return;
	}
	if (window.location.pathname === targetPath) {
		return;
	}
	const performNavigation = (): void => {
		window.history.pushState({}, "", targetPath);
		window.dispatchEvent(new PopStateEvent("popstate"));
	};
	const transitionDocument = document as DocumentWithViewTransition;
	if (typeof transitionDocument.startViewTransition === "function") {
		transitionDocument.startViewTransition(performNavigation);
	} else {
		performNavigation();
	}
};
