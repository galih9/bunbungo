import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppBottomNav } from "./AppBottomNav";

describe("AppBottomNav Component", () => {
	it("renders 4 mobile navigation page tabs with appropriate landmarks and labels", () => {
		const handleNavigate = vi.fn();
		const handleOpenChart = vi.fn();
		const handleOpenStats = vi.fn();

		render(
			<AppBottomNav
				activePath="/"
				level={3}
				masteredCount={24}
				totalAchievements={10}
				totalKanaCount={71}
				unlockedAchievements={4}
				weakCount={2}
				onNavigate={handleNavigate}
				onOpenChart={handleOpenChart}
				onOpenStats={handleOpenStats}
			/>
		);

		const nav = screen.getByRole("navigation", { name: "Primary" });
		expect(nav).toBeTruthy();

		// 1. Practice Link
		const practiceLink = screen.getByRole("link", { name: /^Practice$/i });
		expect(practiceLink.getAttribute("aria-current")).toBe("page");
		expect(practiceLink.getAttribute("href")).toBe("/");

		// 2. Dashboard Link
		const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
		expect(dashboardLink.getAttribute("aria-current")).toBeNull();
		expect(dashboardLink.getAttribute("href")).toBe("/dashboard");

		// Badge for weak letters
		expect(screen.getByLabelText(/2 weak kana/i)).toBeTruthy();

		// 3. Chart Page Link
		const chartLink = screen.getByRole("link", { name: /Chart/i });
		expect(chartLink.getAttribute("aria-current")).toBeNull();
		expect(chartLink.getAttribute("href")).toBe("/chart");
		fireEvent.click(chartLink);
		expect(handleNavigate).toHaveBeenCalledWith("/chart");
		expect(handleOpenChart).toHaveBeenCalledTimes(1);

		// 4. Stats Page Link
		const statsLink = screen.getByRole("link", { name: /Stats/i });
		expect(statsLink.getAttribute("aria-current")).toBeNull();
		expect(statsLink.getAttribute("href")).toBe("/stats");
		fireEvent.click(statsLink);
		expect(handleNavigate).toHaveBeenCalledWith("/stats");
		expect(handleOpenStats).toHaveBeenCalledTimes(1);
	});

	it("indicates Dashboard as the active page when activePath is /dashboard", () => {
		const handleNavigate = vi.fn();

		render(
			<AppBottomNav
				activePath="/dashboard"
				level={5}
				onNavigate={handleNavigate}
			/>
		);

		const practiceLink = screen.getByRole("link", { name: /^Practice$/i });
		expect(practiceLink.getAttribute("aria-current")).toBeNull();

		const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
		expect(dashboardLink.getAttribute("aria-current")).toBe("page");

		// Click practice link triggers onNavigate to "/"
		fireEvent.click(practiceLink);
		expect(handleNavigate).toHaveBeenCalledWith("/");
	});

	it("indicates Chart and Stats as active pages when navigating to /chart and /stats", () => {
		const { rerender } = render(<AppBottomNav activePath="/chart" level={2} />);

		const chartLink = screen.getByRole("link", { name: /Chart/i });
		expect(chartLink.getAttribute("aria-current")).toBe("page");

		rerender(<AppBottomNav activePath="/stats" level={2} />);
		const statsLink = screen.getByRole("link", { name: /Stats/i });
		expect(statsLink.getAttribute("aria-current")).toBe("page");
	});
});
