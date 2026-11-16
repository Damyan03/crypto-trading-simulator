import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
import Header from "~/components/layout/Header";
import { DICTIONARIES, LanguageProvider, startLanguage } from "~/i18n/language";
import { ProfileProvider } from "~/state/store";
import { ThemeProvider } from "~/state/theme";
import "./app.css";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href:
			"https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		// gives the header and every page access to the theme, the text and the profile
		<ThemeProvider>
			<LanguageProvider>
				<ProfileProvider>
					<div className="flex h-dvh flex-col">
						<Header />
						<main className="min-h-0 flex-1 overflow-y-auto">
							<Outlet />
						</main>
					</div>
				</ProfileProvider>
			</LanguageProvider>
		</ThemeProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	// renders instead of App, outside LanguageProvider
	const text = DICTIONARIES[startLanguage()].errorPage;
	let message = text.title;
	let details = text.details;
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? text.notFoundTitle : text.errorTitle;
		details = error.status === 404 ? text.notFound : error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="container mx-auto flex flex-col gap-4 px-4 pb-4 pt-16 text-foreground">
			<h1 className="text-2xl font-bold">{message}</h1>
			<p className="text-muted-foreground">{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto bg-muted p-4 text-sm">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
