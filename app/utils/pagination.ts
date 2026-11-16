import { useState } from "react";

/**
 * The items on the current page, plus the props for <Pagination>.
 * A new `resetKey`, e.g. the search text, starts again on the first page.
 */
export function usePage<T>(items: T[], pageSize: number, resetKey: string) {
	// kept with the key it belongs to
	const [paging, setPaging] = useState({ key: resetKey, page: 0 });
	const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
	// stays in range if the list got shorter, e.g. after a reset
	const page = Math.min(paging.key === resetKey ? paging.page : 0, pageCount - 1);

	return {
		shown: items.slice(page * pageSize, (page + 1) * pageSize),
		pagination: {
			page,
			pageSize,
			total: items.length,
			onChange: (next: number) => setPaging({ key: resetKey, page: next }),
		},
	};
}

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
