---
name: run-crypto-trading-simulator
description: Install, run, build, check and manually test the Crypto Trading Simulator (React Router 8 SPA). Use when setting up, starting, building, serving, typechecking, formatting or testing this app.
---

# Run the Crypto Trading Simulator

## Requirements

- Node.js 22.22 or newer (React Router 8's minimum) and npm.
- Internet access to `api.binance.com`, `stream.binance.com:9443` and `api.coingecko.com`. No API keys are needed.

## Install

```bash
npm install
```

## Run in development

```bash
npm run dev
```

Opens on http://localhost:5173 with hot reload.

## Build and serve production

```bash
npm run build
npm start
```

`npm start` serves the build on http://localhost:3000. Set `PORT` to change the port.

## Checks

| Command                | Checks                                     |
| ---------------------- | ------------------------------------------ |
| `npm run typecheck`    | Generates route types, runs `tsc` (strict) |
| `npm run format:check` | Prettier formatting                        |
| `npm run format`       | Fixes formatting                           |

## Tests

There are no automated tests. To test manually, run `npm run dev` and check:

1. **Discover (`/`):** the coin list loads and prices update live. Search filters the list, and the page buttons work.
2. **Trade (click a coin):**
   - Stats, chart and order book load.
   - The timeframe buttons change the chart, and scrolling left loads older candles.
3. **Trading:**
   - Buy a small amount; the balance, holdings and history update.
   - Buy more than the cash allows; a validation message appears.
   - Sell what you own.
4. **Portfolio (`/portfolio`):**
   - The summary, equity curve and holdings with P/L show.
   - Trade history search, the All / Buy / Sell filter and paging work.
5. **Profile menu:**
   - "Reset to demo account" loads sample trades, and "Reset to default" goes back to 10,000 USDT.
   - Switching theme and language works.
6. **Persistence:** reload the page; the account is still there.

## Troubleshooting

- **Binance or CoinGecko errors:** the app shows the error with a Retry button. Check that the hosts listed above are reachable from your network.
- **Saved data:** stored in `localStorage` under keys starting with `crypto-sim-`. Use "Reset to default" or clear those keys to start fresh.
