import type { KanaItem } from "./kanaTypes";

const createDigraph = (
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
	category: "digraph",
	hint,
});

export const DIGRAPH_KANA_ITEMS: Array<KanaItem> = [
	// Digraphs: KY & GY
	createDigraph("kya", "きゃ", "キャ", "kya", "row-kya", "ki + small ya = kya"),
	createDigraph("kyu", "きゅ", "キュ", "kyu", "row-kya", "ki + small yu = kyu"),
	createDigraph(
		"kyo",
		"きょ",
		"キョ",
		"kyo",
		"row-kya",
		"ki + small yo = kyo (as in Kyoto)"
	),
	createDigraph("gya", "ぎゃ", "ギャ", "gya", "row-kya", "gi + small ya = gya"),
	createDigraph(
		"gyu",
		"ぎゅ",
		"ギュ",
		"gyu",
		"row-kya",
		"gi + small yu = gyu (wagyu)"
	),
	createDigraph(
		"gyo",
		"ぎょ",
		"ギョ",
		"gyo",
		"row-kya",
		"gi + small yo = gyo (gyoza)"
	),

	// Digraphs: SH & J
	createDigraph(
		"sha",
		"しゃ",
		"シャ",
		"sha",
		"row-sha",
		"shi + small ya = sha",
		["sha", "sya"]
	),
	createDigraph(
		"shu",
		"しゅ",
		"シュ",
		"shu",
		"row-sha",
		"shi + small yu = shu",
		["shu", "syu"]
	),
	createDigraph(
		"sho",
		"しょ",
		"ショ",
		"sho",
		"row-sha",
		"shi + small yo = sho (shoyu)",
		["sho", "syo"]
	),
	createDigraph("ja", "じゃ", "ジャ", "ja", "row-sha", "ji + small ya = ja", [
		"ja",
		"jya",
		"zya",
	]),
	createDigraph(
		"ju",
		"じゅ",
		"ジュ",
		"ju",
		"row-sha",
		"ji + small yu = ju (judo)",
		["ju", "jyu", "zyu"]
	),
	createDigraph("jo", "じょ", "ジョ", "jo", "row-sha", "ji + small yo = jo", [
		"jo",
		"jyo",
		"zyo",
	]),

	// Digraphs: CH & NY
	createDigraph(
		"cha",
		"ちゃ",
		"チャ",
		"cha",
		"row-cha",
		"chi + small ya = cha (matcha)",
		["cha", "tya", "cya"]
	),
	createDigraph(
		"chu",
		"ちゅ",
		"チュ",
		"chu",
		"row-cha",
		"chi + small yu = chu",
		["chu", "tyu", "cyu"]
	),
	createDigraph(
		"cho",
		"ちょ",
		"チョ",
		"cho",
		"row-cha",
		"chi + small yo = cho",
		["cho", "tyo", "cyo"]
	),
	createDigraph(
		"nya",
		"にゃ",
		"ニャ",
		"nya",
		"row-cha",
		"ni + small ya = nya (cat meow)"
	),
	createDigraph("nyu", "にゅ", "ニュ", "nyu", "row-cha", "ni + small yu = nyu"),
	createDigraph("nyo", "にょ", "ニョ", "nyo", "row-cha", "ni + small yo = nyo"),

	// Digraphs: HY, BY, PY
	createDigraph("hya", "ひゃ", "ヒャ", "hya", "row-hya", "hi + small ya = hya"),
	createDigraph("hyu", "ひゅ", "ヒュ", "hyu", "row-hya", "hi + small yu = hyu"),
	createDigraph("hyo", "ひょ", "ヒョ", "hyo", "row-hya", "hi + small yo = hyo"),
	createDigraph("bya", "びゃ", "ビャ", "bya", "row-hya", "bi + small ya = bya"),
	createDigraph("byu", "びゅ", "ビュ", "byu", "row-hya", "bi + small yu = byu"),
	createDigraph("byo", "びょ", "ビョ", "byo", "row-hya", "bi + small yo = byo"),
	createDigraph("pya", "ぴゃ", "ピャ", "pya", "row-hya", "pi + small ya = pya"),
	createDigraph("pyu", "ぴゅ", "ピュ", "pyu", "row-hya", "pi + small yu = pyu"),
	createDigraph("pyo", "ぴょ", "ピョ", "pyo", "row-hya", "pi + small yo = pyo"),

	// Digraphs: MY & RY
	createDigraph("mya", "みゃ", "ミャ", "mya", "row-mya", "mi + small ya = mya"),
	createDigraph("myu", "みゅ", "ミュ", "myu", "row-mya", "mi + small yu = myu"),
	createDigraph("myo", "みょ", "ミョ", "myo", "row-mya", "mi + small yo = myo"),
	createDigraph("rya", "りゃ", "リャ", "rya", "row-mya", "ri + small ya = rya"),
	createDigraph(
		"ryu",
		"りゅ",
		"リュ",
		"ryu",
		"row-mya",
		"ri + small yu = ryu (dragon)"
	),
	createDigraph(
		"ryo",
		"りょ",
		"リョ",
		"ryo",
		"row-mya",
		"ri + small yo = ryo (ryokan)"
	),
];
