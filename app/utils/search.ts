/** Case-insensitive "contains"; an empty query matches everything */
export const matchesSearch = (coin: string, query: string) =>
  coin.toLowerCase().includes(query.trim().toLowerCase());
