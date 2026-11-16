/**
 * Every text the app shows, in English. Other languages copy this file and keep the same shape (Dictionary).
 * Values passed to the functions are already formatted, e.g. "1,234.50 USDT".
 */
export const en = {
	/** The language's own name, shown in the language picker */
	languageName: "English",
	common: {
		coin: "Coin",
		price: "Price",
		quantity: "Quantity",
		profitLoss: "Profit / loss",
		retry: "Retry",
		reconnecting: "Live updates paused, reconnecting…",
		loadingCoin: (coin: string) => `Loading ${coin}…`,
		side: { BUY: "Buy", SELL: "Sell" },
	},
	errors: {
		offline: (service: string) => `Can't reach ${service}. Check your connection.`,
		failed: (service: string, status: number) => `${service} request failed (${status}).`,
		unknown: "Something went wrong.",
	},
	errorPage: {
		title: "Oops!",
		details: "An unexpected error occurred.",
		errorTitle: "Error",
		notFoundTitle: "404",
		notFound: "The requested page could not be found.",
	},
	header: {
		title: "Crypto Trading Simulator",
		discover: "Discover",
		portfolio: "Portfolio",
	},
	profileMenu: {
		open: "Profile",
		resetToDefault: "Reset to default",
		resetToDemo: "Reset to demo account",
		loadingDemo: "Loading demo…",
		confirmReset: (balance: string) => `Reset to ${balance}? All holdings and trades will be deleted.`,
		confirmDemo: "Switch to the demo account? All holdings and trades will be replaced.",
		demoFailed: (error: string) => `Couldn't load the demo. ${error}`,
		language: "Language",
		theme: "Theme",
		themes: { light: "Light", dark: "Dark" },
	},
	search: {
		label: "Search coins",
		placeholder: "Search coins, e.g. BTC",
	},
	discover: {
		title: "Discover",
		intro: "Find and trade hundreds of coins at live market prices.",
	},
	coinList: {
		loading: "Loading coins…",
		empty: "No coins available.",
		noMatch: (query: string) => `No coins match "${query}".`,
		change: "24h",
		volume: "Volume",
	},
	coinDetails: {
		high: "24h high",
		low: "24h low",
		volume: (unit: string) => `24h volume (${unit})`,
		trades: "24h trades",
		marketCap: "Market cap (USD)",
		rank: "Rank",
		circulatingSupply: "Circulating supply",
		maxSupply: "Max supply",
		allTimeHigh: "All-time high (USD)",
		infoFailed: "Name and market cap unavailable (CoinGecko didn't respond).",
		noInfo: (coin: string) => `No extra info available for ${coin}.`,
	},
	priceChart: {
		loading: "Loading chart…",
		timeframes: { "15m": "15m", "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w" },
	},
	orderBook: {
		loading: "Loading order book…",
		price: (quote: string) => `Price (${quote})`,
		amount: (coin: string) => `Amount (${coin})`,
	},
	trade: {
		notTraded: (coin: string) => `${coin} isn't traded on this platform.`,
		amountIn: (unit: string) => `Amount in ${unit}`,
		owned: "Owned",
		// button text; common.side is the trade's side in the history
		action: { BUY: "Buy", SELL: "Sell" },
		estimate: "Estimate",
		fee: "Fee",
		available: "Available",
		enterAmount: "Enter an amount, e.g. 0.5.",
		tooManyDecimals: (coin: string, decimals: number) => `${coin} allows at most ${decimals} decimals.`,
		// why validateTrade rejected the trade
		rejected: {
			amount: (_coin: string) => "Amount must be more than 0.",
			cash: (_coin: string) => "Not enough cash for the trade and its fee.",
			coins: (coin: string) => `You don't own that much ${coin}.`,
		},
		done: {
			BUY: (amount: string, price: string, fee: string) => `Bought ${amount} at ${price}, fee ${fee}.`,
			SELL: (amount: string, price: string, fee: string) => `Sold ${amount} at ${price}, fee ${fee}.`,
		},
	},
	quickAmounts: {
		edit: "Edit",
		done: "Done",
		shortcut: (label: string, number: number) => `${label} shortcut ${number}`,
	},
	portfolio: {
		tabs: { holdings: "Holdings", history: "Trade history" },
		totalValue: "Total value",
		cash: "Cash",
		holdings: "Holdings",
	},
	equityChart: {
		empty: "Your account value over time shows here as you trade and while prices are live.",
	},
	holdings: {
		empty: "No holdings yet.",
		discoverLink: "Discover coins",
		noMatch: (query: string) => `No holdings match "${query}".`,
		avgPrice: "Avg price",
		value: (quote: string) => `Value (${quote})`,
	},
	history: {
		empty: "No trades yet.",
		noMatch: (query: string) => `No trades match "${query}".`,
		time: "Time",
		side: "Side",
		total: (quote: string) => `Total (${quote})`,
		fee: (quote: string) => `Fee (${quote})`,
	},
	pagination: {
		previous: "Previous",
		next: "Next",
		goToPage: "Go to page",
		// e.g. "21–40 of 134"
		range: (from: string, to: string, total: string) => `${from}–${to} of ${total}`,
	},
};

export type Dictionary = typeof en;
