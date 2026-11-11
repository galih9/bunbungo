import type { KanaItem } from "./kanaTypes";

const createMonograph = (
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
	category: "monograph",
	hint,
});

export const MONOGRAPH_KANA_ITEMS: Array<KanaItem> = [
	// Vowels (A-row)
	createMonograph("a", "あ", "ア", "a", "row-a", "'a' as in father"),
	createMonograph("i", "い", "イ", "i", "row-a", "'i' as in machine (ee)"),
	createMonograph("u", "う", "ウ", "u", "row-a", "'u' as in flute (oo)"),
	createMonograph("e", "え", "エ", "e", "row-a", "'e' as in pet (eh)"),
	createMonograph("o", "お", "オ", "o", "row-a", "'o' as in more (oh)"),

	// K-row
	createMonograph("ka", "か", "カ", "ka", "row-ka", "'ka' as in karma", [
		"ka",
		"ca",
	]),
	createMonograph("ki", "き", "キ", "ki", "row-ka", "Sounds like 'key'"),
	createMonograph(
		"ku",
		"く",
		"ク",
		"ku",
		"row-ka",
		"'ku' like a cuckoo bird beak",
		["ku", "cu"]
	),
	createMonograph("ke", "け", "ケ", "ke", "row-ka", "'ke' as in keg"),
	createMonograph("ko", "こ", "コ", "ko", "row-ka", "'ko' as in koi fish", [
		"ko",
		"co",
	]),

	// S-row
	createMonograph("sa", "さ", "サ", "sa", "row-sa", "'sa' as in salsa"),
	createMonograph("shi", "し", "シ", "shi", "row-sa", "Sounds like 'she'", [
		"shi",
		"si",
	]),
	createMonograph("su", "す", "ス", "su", "row-sa", "'su' as in sushi"),
	createMonograph("se", "せ", "セ", "se", "row-sa", "'se' as in set"),
	createMonograph("so", "そ", "ソ", "so", "row-sa", "'so' as in soda"),

	// T-row
	createMonograph("ta", "た", "タ", "ta", "row-ta", "'ta' as in taco"),
	createMonograph("chi", "ち", "チ", "chi", "row-ta", "'chi' as in cheer", [
		"chi",
		"ti",
	]),
	createMonograph("tsu", "つ", "ツ", "tsu", "row-ta", "'tsu' as in tsunami", [
		"tsu",
		"tu",
	]),
	createMonograph("te", "て", "テ", "te", "row-ta", "'te' as in ten"),
	createMonograph("to", "と", "ト", "to", "row-ta", "'to' as in tornado"),

	// N-row
	createMonograph("na", "な", "ナ", "na", "row-na", "'na' as in nacho"),
	createMonograph("ni", "に", "ニ", "ni", "row-na", "'ni' as in knee"),
	createMonograph("nu", "ぬ", "ヌ", "nu", "row-na", "'nu' as in noodle"),
	createMonograph("ne", "ね", "ネ", "ne", "row-na", "'ne' as in neko (cat)"),
	createMonograph(
		"no",
		"の",
		"ノ",
		"no",
		"row-na",
		"Looks like a 'No' prohibition sign"
	),

	// H-row
	createMonograph("ha", "は", "ハ", "ha", "row-ha", "'ha' as in haha"),
	createMonograph("hi", "ひ", "ヒ", "hi", "row-ha", "Sounds like 'he'"),
	createMonograph("fu", "ふ", "フ", "fu", "row-ha", "'fu' as in Mt. Fuji", [
		"fu",
		"hu",
	]),
	createMonograph(
		"he",
		"へ",
		"ヘ",
		"he",
		"row-ha",
		"'he' as in heaven (points up)"
	),
	createMonograph("ho", "ほ", "ホ", "ho", "row-ha", "'ho' as in hotel"),

	// M-row
	createMonograph("ma", "ま", "マ", "ma", "row-ma", "'ma' as in mama"),
	createMonograph(
		"mi",
		"み",
		"ミ",
		"mi",
		"row-ma",
		"Sounds like musical note 'mi'"
	),
	createMonograph("mu", "む", "ム", "mu", "row-ma", "'mu' as in cow moo"),
	createMonograph("me", "め", "メ", "me", "row-ma", "Means 'eye' in Japanese"),
	createMonograph(
		"mo",
		"も",
		"モ",
		"mo",
		"row-ma",
		"'mo' as in more fishhooks"
	),

	// Y-row
	createMonograph("ya", "や", "ヤ", "ya", "row-ya", "'ya' as in yak"),
	createMonograph("yu", "ゆ", "ユ", "yu", "row-ya", "Sounds like 'you'"),
	createMonograph("yo", "よ", "ヨ", "yo", "row-ya", "'yo' as in yo-yo"),

	// R-row
	createMonograph("ra", "ら", "ラ", "ra", "row-ra", "'ra' as in ramen", [
		"ra",
		"la",
	]),
	createMonograph("ri", "り", "リ", "ri", "row-ra", "'ri' as in river reeds", [
		"ri",
		"li",
	]),
	createMonograph(
		"ru",
		"る",
		"ル",
		"ru",
		"row-ra",
		"'ru' has a loop at the bottom",
		["ru", "lu"]
	),
	createMonograph(
		"re",
		"れ",
		"レ",
		"re",
		"row-ra",
		"'re' kicks outward at the end",
		["re", "le"]
	),
	createMonograph(
		"ro",
		"ろ",
		"ロ",
		"ro",
		"row-ra",
		"'ro' is like 'ru' without the loop",
		["ro", "lo"]
	),

	// W-row & N
	createMonograph("wa", "わ", "ワ", "wa", "row-wa", "'wa' as in water"),
	createMonograph(
		"wo",
		"を",
		"ヲ",
		"wo",
		"row-wa",
		"Object particle pronounced 'o' / 'wo'",
		["wo", "o"]
	),
	createMonograph("n", "ん", "ン", "n", "row-wa", "Standalone nasal 'n'", [
		"n",
		"nn",
	]),
];
