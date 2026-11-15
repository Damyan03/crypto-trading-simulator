/** One order book price level */
export interface DepthLevel {
  price: number;
  /** Coins waiting to be bought (bid) or sold (ask) at this price */
  quantity: number;
}

/** An order book; best price first on both sides */
export interface Depth {
  bids: DepthLevel[];
  asks: DepthLevel[];
}

/**
 * Merges levels into price groups of `size` ticks and keeps the best `levels` groups per side.
 * Bids round down and asks round up, so a group never looks better than its orders.
 */
export function groupDepth(depth: Depth, tick: number, size: number, levels: number): Depth {
  const group = (side: DepthLevel[], round: (n: number) => number) => {
    // group number → total quantity; sides are best first, so groups arrive in order
    const groups = new Map<number, number>();
    for (const { price, quantity } of side) {
      // whole ticks first, so float noise can't put a price in the wrong group
      const key = round(Math.round(price / tick) / size);
      if (!groups.has(key) && groups.size === levels) break;
      groups.set(key, (groups.get(key) ?? 0) + quantity);
    }
    return [...groups].map(([key, quantity]) => ({ price: key * size * tick, quantity }));
  };
  return { bids: group(depth.bids, Math.floor), asks: group(depth.asks, Math.ceil) };
}
