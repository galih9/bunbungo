import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	analyzeKanaPerformance,
	type CharacterMastery,
	DEFAULT_USER_PROGRESSION,
	evaluateSessionProgression,
	getAchievementProgressList,
	getRowMasterySummary,
	saveMasteryMap,
	updateCharacterMastery,
} from "./gameStorage";
import { GoKanaApp } from "./GoKanaApp";
import { KANA_ITEMS } from "./kanaData";

describe("GoKanaApp & Local Performance / Progression Analytics", () => {
	beforeEach(() => {
		window.localStorage.clear();
		HTMLDialogElement.prototype.showModal = vi.fn(function (
			this: HTMLDialogElement
		) {
			this.setAttribute("open", "");
		});
		HTMLDialogElement.prototype.close = vi.fn(function (
			this: HTMLDialogElement
		) {
			this.removeAttribute("open");
		});
	});

	it("renders the minimalist lobby and starts a flashcard session", () => {
		render(<GoKanaApp />);

		expect(screen.getByText("GoKana Pocket")).toBeTruthy();
		expect(screen.getByText("Writing System")).toBeTruthy();

		const startButton = screen.getByRole("button", {
			name: /Start GoKana Session/i,
		});
		fireEvent.click(startButton);

		expect(screen.getByText(/Card 1 \/ 20/i)).toBeTruthy();
		expect(screen.getByRole("button", { name: /End Run/i })).toBeTruthy();
	});

	it("switches between Hiragana, Katakana, and Mixed modes and opens the Kana Chart", () => {
		render(<GoKanaApp />);

		const katakanaButton = screen.getByRole("button", { name: /Katakana/i });
		fireEvent.click(katakanaButton);
		expect(katakanaButton.getAttribute("aria-pressed")).toBe("true");

		const chartButton = screen.getByRole("button", { name: /Chart/i });
		fireEvent.click(chartButton);

		expect(screen.getByText("Kana Codex & Mastery")).toBeTruthy();
	});

	it("records detailed letter telemetry and classifies weak vs strong performing letters", () => {
		let masteryMap: Record<string, CharacterMastery> = {};

		// Record weak performance on 'shi' (1 correct, 3 wrong, confused with 'chi')
		masteryMap = updateCharacterMastery(masteryMap, {
			chosenRomaji: "shi",
			isCorrect: true,
			kanaId: "shi",
			responseTimeMilliseconds: 1800,
			script: "hiragana",
		});
		for (let repeat = 0; repeat < 3; repeat += 1) {
			masteryMap = updateCharacterMastery(masteryMap, {
				chosenRomaji: "chi",
				isCorrect: false,
				kanaId: "shi",
				responseTimeMilliseconds: 2600,
				script: "hiragana",
			});
		}

		// Record strong performance on 'a' (3 consecutive correct fast answers)
		for (let repeat = 0; repeat < 3; repeat += 1) {
			masteryMap = updateCharacterMastery(masteryMap, {
				chosenRomaji: "a",
				isCorrect: true,
				kanaId: "a",
				responseTimeMilliseconds: 1100,
				script: "hiragana",
			});
		}

		const analysis = analyzeKanaPerformance(masteryMap);
		expect(analysis.weakItems.map((item) => item.id)).toContain("shi");
		expect(analysis.strongItems.map((item) => item.id)).toContain("a");
		expect(masteryMap["shi"]?.confusedWith?.["chi"]).toBe(3);
	});

	it("displays weak letters in the lobby and launches a targeted Weak Letters practice session", () => {
		let masteryMap: Record<string, CharacterMastery> = {};
		masteryMap = updateCharacterMastery(masteryMap, {
			chosenRomaji: "ne",
			isCorrect: false,
			kanaId: "re",
			responseTimeMilliseconds: 2400,
			script: "hiragana",
		});
		masteryMap = updateCharacterMastery(masteryMap, {
			chosenRomaji: "ro",
			isCorrect: false,
			kanaId: "ru",
			responseTimeMilliseconds: 2200,
			script: "hiragana",
		});
		saveMasteryMap(masteryMap);

		render(<GoKanaApp />);

		expect(screen.getAllByText(/2 weak/i).length).toBeGreaterThan(0);
		const drillNowButton = screen.getByRole("button", {
			name: /Drill Weak Letters Now/i,
		});
		fireEvent.click(drillNowButton);

		expect(screen.getByText("Weak Focus")).toBeTruthy();
	});

	it("unlocks new Kana rows and achievements when rows are mastered and streaks are reached", () => {
		let masteryMap: Record<string, CharacterMastery> = {};
		const starterItems = KANA_ITEMS.filter((item) =>
			["row-a", "row-ka", "row-sa"].includes(item.rowId)
		);

		for (const item of starterItems) {
			for (let attempt = 0; attempt < 3; attempt += 1) {
				masteryMap = updateCharacterMastery(masteryMap, {
					chosenRomaji: item.romaji,
					isCorrect: true,
					kanaId: item.id,
					responseTimeMilliseconds: 1200,
					script: "hiragana",
				});
			}
		}

		expect(getRowMasterySummary("row-sa", masteryMap).isMastered).toBe(true);

		const progressionResult = evaluateSessionProgression({
			currentProgression: DEFAULT_USER_PROGRESSION,
			durationSeconds: 45,
			masteryMap,
			sessionAttempts: 20,
			sessionBestStreak: 16,
			sessionCorrect: 19,
			sessionScore: 2800,
		});

		// Should unlock at least the 4th row (row-ta) and streak/performance achievements
		expect(progressionResult.updatedProgression.unlockedRowIds).toContain(
			"row-ta"
		);
		const unlockedAchievementIds = Object.keys(
			progressionResult.updatedProgression.unlockedAchievements
		);
		expect(unlockedAchievementIds).toContain("first-session");
		expect(unlockedAchievementIds).toContain("streak-5");
		expect(unlockedAchievementIds).toContain("streak-15");
		expect(unlockedAchievementIds).toContain("unlock-row-4");
		expect(unlockedAchievementIds).toContain("strong-5");
		expect(unlockedAchievementIds).toContain("strong-15");

		const statuses = getAchievementProgressList(
			progressionResult.updatedProgression,
			masteryMap
		);
		expect(statuses.find((item) => item.id === "streak-15")?.isUnlocked).toBe(
			true
		);
	});
});
