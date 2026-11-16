import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
import Header from "~/components/layout/Header";
import { DICTIONARIES, LanguageProvider, startLanguage } from "~/i18n/language";
import { ProfileProvider } from "~/state/store";
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
		// gives the header and every page access to the text and the profile
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
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	// shown instead of App, so outside LanguageProvider
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
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
