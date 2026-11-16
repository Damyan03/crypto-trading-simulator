import type { Dictionary } from "./en";

/** Every text the app shows, in Bulgarian */
export const bg: Dictionary = {
	languageName: "Български",
	common: {
		coin: "Монета",
		price: "Цена",
		quantity: "Количество",
		profitLoss: "Печалба / загуба",
		retry: "Опитай отново",
		reconnecting: "Обновяването на живо е на пауза, свързване отново…",
		loadingCoin: (coin: string) => `Зареждане на ${coin}…`,
		side: { BUY: "Покупка", SELL: "Продажба" },
	},
	errors: {
		offline: (service: string) => `Няма връзка с ${service}. Проверете интернет връзката си.`,
		failed: (service: string, status: number) => `Заявката към ${service} е неуспешна (${status}).`,
		unknown: "Нещо се обърка.",
	},
	errorPage: {
		title: "Опа!",
		details: "Възникна неочаквана грешка.",
		errorTitle: "Грешка",
		notFoundTitle: "404",
		notFound: "Търсената страница не е намерена.",
	},
	header: {
		title: "Симулатор за търговия с криптовалути",
		discover: "Открий",
		portfolio: "Портфейл",
	},
	profileMenu: {
		open: "Профил",
		resetToDefault: "Нулиране до началото",
		resetToDemo: "Нулиране до демо акаунт",
		loadingDemo: "Зареждане на демото…",
		confirmReset: (balance: string) => `Нулиране до ${balance}? Всички активи и сделки ще бъдат изтрити.`,
		confirmDemo: "Превключване към демо акаунта? Всички активи и сделки ще бъдат заменени.",
		demoFailed: (error: string) => `Демото не можа да се зареди. ${error}`,
		language: "Език",
	},
	search: {
		label: "Търсене на монети",
		placeholder: "Търсете монети, напр. BTC",
	},
	discover: {
		intro: "описание на страницата",
	},
	coinList: {
		loading: "Зареждане на монетите…",
		empty: "Няма налични монети.",
		noMatch: (query: string) => `Няма монети, съвпадащи с „${query}“.`,
		change: "24ч",
		volume: "Обем",
	},
	coinDetails: {
		high: "24ч най-висока",
		low: "24ч най-ниска",
		volume: (unit: string) => `24ч обем (${unit})`,
		trades: "24ч сделки",
		marketCap: "Пазарна капитализация (USD)",
		rank: "Ранг",
		circulatingSupply: "Предлагане в обращение",
		maxSupply: "Максимално предлагане",
		allTimeHigh: "Исторически връх (USD)",
		infoFailed: "Името и пазарната капитализация не са налични (CoinGecko не отговори).",
		noInfo: (coin: string) => `Няма допълнителна информация за ${coin}.`,
	},
	priceChart: {
		loading: "Зареждане на графиката…",
	},
	orderBook: {
		loading: "Зареждане на книгата с поръчки…",
		price: (quote: string) => `Цена (${quote})`,
		amount: (coin: string) => `Количество (${coin})`,
	},
	trade: {
		notTraded: (coin: string) => `${coin} не се търгува на тази платформа.`,
		amountIn: (unit: string) => `Сума в ${unit}`,
		owned: "Притежавани",
		action: { BUY: "Купи", SELL: "Продай" },
		estimate: "Приблизително",
		fee: "Такса",
		available: "Налични",
		enterAmount: "Въведете сума, напр. 0,5.",
		tooManyDecimals: (coin: string, decimals: number) =>
			`${coin} позволява най-много ${decimals} знака след десетичната запетая.`,
		rejected: {
			amount: (_coin: string) => "Сумата трябва да е по-голяма от 0.",
			cash: (_coin: string) => "Нямате достатъчно средства за сделката и таксата.",
			coins: (coin: string) => `Нямате толкова ${coin}.`,
		},
		done: {
			BUY: (amount: string, price: string, fee: string) => `Купени ${amount} на цена ${price}, такса ${fee}.`,
			SELL: (amount: string, price: string, fee: string) => `Продадени ${amount} на цена ${price}, такса ${fee}.`,
		},
	},
	quickAmounts: {
		edit: "Редактирай",
		done: "Готово",
		shortcut: (label: string, number: number) => `${label}, бърз избор ${number}`,
	},
	portfolio: {
		tabs: { holdings: "Активи", history: "История на сделките" },
		totalValue: "Обща стойност",
		cash: "Свободни средства",
		holdings: "Активи",
	},
	equityChart: {
		empty: "Тук ще виждате стойността на акаунта във времето, докато търгувате и цените са на живо.",
	},
	holdings: {
		empty: "Все още нямате активи.",
		discoverLink: "Открийте монети",
		noMatch: (query: string) => `Няма активи, съвпадащи с „${query}“.`,
		avgPrice: "Средна цена",
		value: (quote: string) => `Стойност (${quote})`,
	},
	history: {
		empty: "Все още нямате сделки.",
		noMatch: (query: string) => `Няма сделки, съвпадащи с „${query}“.`,
		time: "Време",
		side: "Посока",
		total: (quote: string) => `Общо (${quote})`,
		fee: (quote: string) => `Такса (${quote})`,
	},
};
