import { useState } from "react";
import CoinList from "~/components/market/CoinList";
import SearchBox from "~/components/ui/SearchBox";

export default function Discover() {
	// text in the search box, passed to the list as a filter
	const [query, setQuery] = useState("");

	return (
		<div className="flex flex-col items-center justify-center h-full w-full bg-red-500">
			<div className="flex flex-col w-2/3 h-full bg-green-500">
				<div className="items-center justify-center w-full h-2/9 bg-blue-500">
					<div className="p-4 bg-yellow-500 w-full h-2/3">discover description</div>
					<div className="flex items-center px-4 bg-purple-500 w-full h-1/3">
						<SearchBox value={query} onChange={setQuery} />
					</div>
				</div>
				<div className="flex-1 min-h-0 bg-orange-500">
					<CoinList query={query} />
				</div>
			</div>
		</div>
	);
}
