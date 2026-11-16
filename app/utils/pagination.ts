/**
 * Which page numbers to show (0-based), with null for a gap shown as "…": the first, the last, and the current
 * page with its neighbours. A gap of a single page shows that page instead.
 * e.g. page 5 of 10 → [0, null, 4, 5, 6, null, 9]; page 1 of 10 → [0, 1, 2, null, 9]
 */
export function pageList(current: number, count: number): (number | null)[] {
	const shown = [...new Set([0, current - 1, current, current + 1, count - 1])]
		.filter((page) => page >= 0 && page < count)
		.sort((a, b) => a - b);

	const list: (number | null)[] = [];
	shown.forEach((page, i) => {
		const gap = i === 0 ? 0 : page - shown[i - 1] - 1;
		if (gap === 1) list.push(page - 1);
		else if (gap > 1) list.push(null);
		list.push(page);
	});
	return list;
}
