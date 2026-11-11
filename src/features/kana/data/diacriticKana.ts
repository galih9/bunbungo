import type { KanaItem } from "./kanaTypes";

const createDiacritic = (
	id: string,
	hiragana: string,
	katakana: string,
	romaji: string,
	rowId: string,
	hint: string,
	acceptedRomaji: Array<string> = [romaji]
): KanaItem => ({
	id,
	hiragana,
	katakana,
	romaji,
	acceptedRomaji,
	rowId,
	category: "diacritic",
	hint,
});

export const DIACRITIC_KANA_ITEMS: Array<KanaItem> = [
	// G-row (Dakuten)
	createDiacritic("ga", "が", "ガ", "ga", "row-ga", "Voiced 'ka' -> 'ga'"),
	createDiacritic(
		"gi",
		"ぎ",
		"ギ",
		"gi",
		"row-ga",
		"Voiced 'ki' -> 'gi' (hard g)"
	),
	createDiacritic("gu", "ぐ", "グ", "gu", "row-ga", "Voiced 'ku' -> 'gu'"),
	createDiacritic("ge", "げ", "ゲ", "ge", "row-ga", "Voiced 'ke' -> 'ge'"),
	createDiacritic("go", "ご", "ゴ", "go", "row-ga", "Voiced 'ko' -> 'go'"),

	// Z-row (Dakuten)
	createDiacritic("za", "ざ", "ザ", "za", "row-za", "Voiced 'sa' -> 'za'"),
	createDiacritic("ji", "じ", "ジ", "ji", "row-za", "Voiced 'shi' -> 'ji'", [
		"ji",
		"zi",
	]),
	createDiacritic("zu", "ず", "ズ", "zu", "row-za", "Voiced 'su' -> 'zu'"),
	createDiacritic("ze", "ぜ", "ゼ", "ze", "row-za", "Voiced 'se' -> 'ze'"),
	createDiacritic("zo", "ぞ", "ゾ", "zo", "row-za", "Voiced 'so' -> 'zo'"),

	// D-row (Dakuten)
	createDiacritic("da", "だ", "ダ", "da", "row-da", "Voiced 'ta' -> 'da'"),
	createDiacritic(
		"dji",
		"ぢ",
		"ヂ",
		"ji",
		"row-da",
		"Voiced 'chi' -> 'ji' (di)",
		["ji", "di", "dji"]
	),
	createDiacritic(
		"dzu",
		"づ",
		"ヅ",
		"zu",
		"row-da",
		"Voiced 'tsu' -> 'zu' (du)",
		["zu", "du", "dzu"]
	),
	createDiacritic("de", "で", "デ", "de", "row-da", "Voiced 'te' -> 'de'"),
	createDiacritic("do", "ど", "ド", "do", "row-da", "Voiced 'to' -> 'do'"),

	// B-row (Dakuten)
	createDiacritic("ba", "ば", "バ", "ba", "row-ba", "Voiced 'ha' -> 'ba'"),
	createDiacritic("bi", "び", "ビ", "bi", "row-ba", "Voiced 'hi' -> 'bi'"),
	createDiacritic("bu", "ぶ", "ブ", "bu", "row-ba", "Voiced 'fu' -> 'bu'"),
	createDiacritic("be", "べ", "ベ", "be", "row-ba", "Voiced 'he' -> 'be'"),
	createDiacritic("bo", "ぼ", "ボ", "bo", "row-ba", "Voiced 'ho' -> 'bo'"),

	// P-row (Handakuten)
	createDiacritic("pa", "ぱ", "パ", "pa", "row-pa", "Handakuten 'ha' -> 'pa'"),
	createDiacritic("pi", "ぴ", "ピ", "pi", "row-pa", "Handakuten 'hi' -> 'pi'"),
	createDiacritic("pu", "ぷ", "プ", "pu", "row-pa", "Handakuten 'fu' -> 'pu'"),
	createDiacritic("pe", "ぺ", "ペ", "pe", "row-pa", "Handakuten 'he' -> 'pe'"),
	createDiacritic("po", "ぽ", "ポ", "po", "row-pa", "Handakuten 'ho' -> 'po'"),
];
