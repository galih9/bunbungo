export type KanaScript = "hiragana" | "katakana";

export type KanaCategory = "monograph" | "diacritic" | "digraph";

export interface KanaItem {
	readonly id: string;
	readonly hiragana: string;
	readonly katakana: string;
	readonly romaji: string;
	readonly acceptedRomaji: Array<string>;
	readonly rowId: string;
	readonly category: KanaCategory;
	readonly hint: string;
}

export interface KanaRowGroup {
	readonly id: string;
	readonly label: string;
	readonly sampleHiragana: string;
	readonly sampleKatakana: string;
	readonly romajiSummary: string;
	readonly category: KanaCategory;
}

export const DEFAULT_SELECTED_ROWS: Array<string> = [
	"row-a",
	"row-ka",
	"row-sa",
];

export const KANA_ROW_GROUPS: Array<KanaRowGroup> = [
	// Monographs (Gojūon)
	{
		id: "row-a",
		label: "Vowels (A-row)",
		sampleHiragana: "あ",
		sampleKatakana: "ア",
		romajiSummary: "a • i • u • e • o",
		category: "monograph",
	},
	{
		id: "row-ka",
		label: "K-row",
		sampleHiragana: "か",
		sampleKatakana: "カ",
		romajiSummary: "ka • ki • ku • ke • ko",
		category: "monograph",
	},
	{
		id: "row-sa",
		label: "S-row",
		sampleHiragana: "さ",
		sampleKatakana: "サ",
		romajiSummary: "sa • shi • su • se • so",
		category: "monograph",
	},
	{
		id: "row-ta",
		label: "T-row",
		sampleHiragana: "た",
		sampleKatakana: "タ",
		romajiSummary: "ta • chi • tsu • te • to",
		category: "monograph",
	},
	{
		id: "row-na",
		label: "N-row",
		sampleHiragana: "な",
		sampleKatakana: "ナ",
		romajiSummary: "na • ni • nu • ne • no",
		category: "monograph",
	},
	{
		id: "row-ha",
		label: "H-row",
		sampleHiragana: "は",
		sampleKatakana: "ハ",
		romajiSummary: "ha • hi • fu • he • ho",
		category: "monograph",
	},
	{
		id: "row-ma",
		label: "M-row",
		sampleHiragana: "ま",
		sampleKatakana: "マ",
		romajiSummary: "ma • mi • mu • me • mo",
		category: "monograph",
	},
	{
		id: "row-ya",
		label: "Y-row",
		sampleHiragana: "や",
		sampleKatakana: "ヤ",
		romajiSummary: "ya • yu • yo",
		category: "monograph",
	},
	{
		id: "row-ra",
		label: "R-row",
		sampleHiragana: "ら",
		sampleKatakana: "ラ",
		romajiSummary: "ra • ri • ru • re • ro",
		category: "monograph",
	},
	{
		id: "row-wa",
		label: "W-row & N",
		sampleHiragana: "わ",
		sampleKatakana: "ワ",
		romajiSummary: "wa • wo • n",
		category: "monograph",
	},
	// Diacritics (Dakuon & Handakuon)
	{
		id: "row-ga",
		label: "G-row (Dakuten)",
		sampleHiragana: "が",
		sampleKatakana: "ガ",
		romajiSummary: "ga • gi • gu • ge • go",
		category: "diacritic",
	},
	{
		id: "row-za",
		label: "Z-row (Dakuten)",
		sampleHiragana: "ざ",
		sampleKatakana: "ザ",
		romajiSummary: "za • ji • zu • ze • zo",
		category: "diacritic",
	},
	{
		id: "row-da",
		label: "D-row (Dakuten)",
		sampleHiragana: "だ",
		sampleKatakana: "ダ",
		romajiSummary: "da • ji • zu • de • do",
		category: "diacritic",
	},
	{
		id: "row-ba",
		label: "B-row (Dakuten)",
		sampleHiragana: "ば",
		sampleKatakana: "バ",
		romajiSummary: "ba • bi • bu • be • bo",
		category: "diacritic",
	},
	{
		id: "row-pa",
		label: "P-row (Handakuten)",
		sampleHiragana: "ぱ",
		sampleKatakana: "パ",
		romajiSummary: "pa • pi • pu • pe • po",
		category: "diacritic",
	},
	// Digraphs (Yōon)
	{
		id: "row-kya",
		label: "KY & GY Digraphs",
		sampleHiragana: "きゃ",
		sampleKatakana: "キャ",
		romajiSummary: "kya • kyu • kyo • gya • gyu • gyo",
		category: "digraph",
	},
	{
		id: "row-sha",
		label: "SH & J Digraphs",
		sampleHiragana: "しゃ",
		sampleKatakana: "シャ",
		romajiSummary: "sha • shu • sho • ja • ju • jo",
		category: "digraph",
	},
	{
		id: "row-cha",
		label: "CH & NY Digraphs",
		sampleHiragana: "ちゃ",
		sampleKatakana: "チャ",
		romajiSummary: "cha • chu • cho • nya • nyu • nyo",
		category: "digraph",
	},
	{
		id: "row-hya",
		label: "HY, BY & PY Digraphs",
		sampleHiragana: "ひゃ",
		sampleKatakana: "ヒャ",
		romajiSummary: "hya/bya/pya • hyu/byu/pyu • hyo/byo/pyo",
		category: "digraph",
	},
	{
		id: "row-mya",
		label: "MY & RY Digraphs",
		sampleHiragana: "みゃ",
		sampleKatakana: "ミャ",
		romajiSummary: "mya • myu • myo • rya • ryu • ryo",
		category: "digraph",
	},
];
