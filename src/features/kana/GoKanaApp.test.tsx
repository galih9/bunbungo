import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	analyzeKanaPerformance,
	appendDistinctFlashcardToDeck,
	areSameOrHomophoneKana,
	buildDashboardSummary,
	type CharacterMastery,
	DEFAULT_USER_PROGRESSION,
	evaluateSessionProgression,
	generateChallengeDeck,
	generateCustomItemsDeck,
	generateWeakLettersDeck,
	getAchievementProgressList,
	getRowMasterySummary,
	saveMasteryMap,
	scheduleSpacedRetryInDeck,
	seedSampleDashboardData,
	updateCharacterMastery,
} from "./gameStorage";
import { GoKanaApp } from "./GoKanaApp";
import { KanaDashboard } from "./KanaDashboard";
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

	it("renders the primary navigation bar with aria-current page indication and skip link", () => {
		render(<GoKanaApp />);

		const primaryNav = screen.getByRole("navigation", { name: "Primary" });
		expect(primaryNav).toBeTruthy();

		const practiceLink = screen.getByRole("link", { name: /Practice/i });
		expect(practiceLink.getAttribute("aria-current")).toBe("page");

		const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
		expect(dashboardLink.getAttribute("aria-current")).toBeNull();
	});

	it("renders the Performance & Mastery Dashboard with charts, user performance summary, and sample telemetry", () => {
		const navigateSpy = vi.fn();
		render(<KanaDashboard onNavigate={navigateSpy} />);

		expect(
			screen.getByRole("heading", { name: /Performance & Mastery Dashboard/i })
		).toBeTruthy();
		expect(screen.getByText(/User's Performance Summary/i)).toBeTruthy();
		expect(screen.getByText("Syllabary Mastery Distribution")).toBeTruthy();

		const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
		expect(dashboardLink.getAttribute("aria-current")).toBe("page");

		// Load sample telemetry to populate charts and performance metrics
		const loadSampleButton = screen.getByRole("button", {
			name: /Load Sample Telemetry/i,
		});
		fireEvent.click(loadSampleButton);

		// Verify executive summary metrics and charts populate
		expect(screen.getByText(/Recent Session Performance Trend/i)).toBeTruthy();
		expect(
			screen.getByText(/Writing Script Comparison \(Hiragana vs\. Katakana\)/i)
		).toBeTruthy();
		expect(
			screen.getByText(/Response Speed Reflex Distribution/i)
		).toBeTruthy();
		expect(screen.getByText(/Most Frequent Romaji Confusions/i)).toBeTruthy();

		// Switch bar chart view from Category to Row
		const byRowButton = screen.getByRole("button", { name: /By Row \(10\)/i });
		fireEvent.click(byRowButton);
		expect(byRowButton.getAttribute("aria-pressed")).toBe("true");

		// Switch session trend chart metric to Accuracy %
		const accuracyToggle = screen.getByRole("button", { name: /Accuracy %/i });
		fireEvent.click(accuracyToggle);
		expect(accuracyToggle.getAttribute("aria-pressed")).toBe("true");

		// Navigate back to Practice Arena
		const startPracticeButton = screen.getByRole("button", {
			name: /Start Practice Session/i,
		});
		fireEvent.click(startPracticeButton);
		expect(navigateSpy).toHaveBeenCalledWith("/");
	});

	it("computes comprehensive dashboard summary metrics from seeded telemetry", () => {
		const seeded = seedSampleDashboardData();
		const summary = buildDashboardSummary(
			seeded.masteryMap,
			seeded.progression,
			seeded.highScores
		);

		expect(summary.analysis.totalAttempts).toBeGreaterThan(0);
		expect(summary.scriptSummaries).toHaveLength(2);
		expect(summary.categorySummaries).toHaveLength(3);
		expect(summary.speedBuckets).toHaveLength(4);
		expect(summary.sessionTrend).toHaveLength(6);
		expect(summary.topConfusions.length).toBeGreaterThan(0);
		expect(summary.recommendations.length).toBeGreaterThan(0);
	});

	it("guarantees no letter ever appears twice in a row across all deck generators, dynamic appends, and spaced retries", () => {
		let masteryMap: Record<string, CharacterMastery> = {};
		masteryMap = updateCharacterMastery(masteryMap, {
			chosenRomaji: "chi",
			isCorrect: false,
			kanaId: "shi",
			responseTimeMilliseconds: 2600,
			script: "hiragana",
		});

		const singleItemTarget = [KANA_ITEMS[0]!];
		const customDeck = generateCustomItemsDeck(
			singleItemTarget,
			"hiragana",
			40,
			masteryMap
		);
		const weakDeck = generateWeakLettersDeck(masteryMap, "mixed", 40, [
			"row-a",
		]);
		let challengeDeck = generateChallengeDeck(
			["row-a"],
			"hiragana",
			30,
			masteryMap
		);

		// Extend dynamically 15 times and schedule spaced retries
		for (let step = 0; step < 15; step += 1) {
			challengeDeck = appendDistinctFlashcardToDeck(
				challengeDeck,
				singleItemTarget,
				"hiragana",
				masteryMap
			);
		}
		challengeDeck = scheduleSpacedRetryInDeck(
			challengeDeck,
			0,
			challengeDeck[0]!.item,
			"hiragana"
		);

		for (const deck of [customDeck, weakDeck, challengeDeck]) {
			for (let index = 1; index < deck.length; index += 1) {
				const previousCard = deck[index - 1]!;
				const currentCard = deck[index]!;
				expect(
					areSameOrHomophoneKana(previousCard.item, currentCard.item)
				).toBe(false);
				expect(previousCard.displayCharacter).not.toBe(
					currentCard.displayCharacter
				);
			}
		}
	});
});
