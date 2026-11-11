import { DIACRITIC_KANA_ITEMS } from "./data/diacriticKana";
import { DIGRAPH_KANA_ITEMS } from "./data/digraphKana";
import {
	DEFAULT_SELECTED_ROWS,
	KANA_ROW_GROUPS,
	type KanaCategory,
	type KanaItem,
	type KanaRowGroup,
	type KanaScript,
} from "./data/kanaTypes";
import { MONOGRAPH_KANA_ITEMS } from "./data/monographKana";

export {
	DEFAULT_SELECTED_ROWS,
	KANA_ROW_GROUPS,
	type KanaCategory,
	type KanaItem,
	type KanaRowGroup,
	type KanaScript,
};

export const KANA_ITEMS: Array<KanaItem> = [
	...MONOGRAPH_KANA_ITEMS,
	...DIACRITIC_KANA_ITEMS,
	...DIGRAPH_KANA_ITEMS,
];

/**
 * Pre-indexed O(1) lookup maps to avoid repeated linear array filtering
 * across renders, deck generation, and row mastery evaluations.
 */
export const KANA_ITEM_BY_ID: ReadonlyMap<string, KanaItem> = new Map(
	KANA_ITEMS.map((item) => [item.id, item])
);

const buildKanaItemsByRow = (): ReadonlyMap<string, Array<KanaItem>> => {
	const map = new Map<string, Array<KanaItem>>();
	for (const item of KANA_ITEMS) {
		const bucket = map.get(item.rowId);
		if (bucket) {
			bucket.push(item);
		} else {
			map.set(item.rowId, [item]);
		}
	}
	return map;
};

const buildKanaItemsByCategory = (): ReadonlyMap<
	KanaCategory,
	Array<KanaItem>
> => {
	const map = new Map<KanaCategory, Array<KanaItem>>([
		["monograph", []],
		["diacritic", []],
		["digraph", []],
	]);
	for (const item of KANA_ITEMS) {
		map.get(item.category)?.push(item);
	}
	return map;
};

export const KANA_ITEMS_BY_ROW: ReadonlyMap<
	string,
	Array<KanaItem>
> = buildKanaItemsByRow();

export const KANA_ITEMS_BY_CATEGORY: ReadonlyMap<
	KanaCategory,
	Array<KanaItem>
> = buildKanaItemsByCategory();
