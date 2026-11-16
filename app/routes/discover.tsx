import { useState } from "react";
import CoinList from "~/components/market/CoinList";
import SearchBox from "~/components/ui/SearchBox";
import { useText } from "~/i18n/language";

export default function Discover() {
	const text = useText().discover;
	// text in the search box, passed to the list as a filter
	const [query, setQuery] = useState("");

	return (
		<div className="mx-auto flex h-full max-w-5xl flex-col gap-4 p-4">
			<section className="flex flex-col gap-3 border bg-surface p-4">
				<p className="text-muted-foreground">{text.intro}</p>
				<SearchBox value={query} onChange={setQuery} />
			</section>
			<section className="min-h-0 flex-1 overflow-hidden border bg-surface">
				<CoinList query={query} />
			</section>
		</div>
	);
}
