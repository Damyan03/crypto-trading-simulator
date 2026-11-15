import CoinDetails from "~/components/CoinDetails";
import type { Route } from "./+types/trade";

export default function Trade({ params }: Route.ComponentProps) {
  // "/trade/btc" → "BTC"
  const coin = params.coin.toUpperCase();

  return (
    <div className="flex h-full w-full bg-red-500">
      <div className="flex flex-col w-9/12 h-full bg-green-500">
        <div className="flex w-full h-9/12 bg-blue-500">
          <div className="flex flex-col w-4/5 bg-yellow-500 h-full">
            <div className="w-full bg-green-500">
              {/* key: a new coin starts with fresh state instead of showing the previous coin's data */}
              <CoinDetails key={coin} coin={coin} />
            </div>
            <div className="bg-orange-500 flex-1 min-h-0">Chart</div>
          </div>
          <div className="flex-1 bg-cyan-500 h-full">
            <div className="bg-purple-500 w-full">trade</div>
            <div className="bg-pink-500 w-full">trade</div>
            <div className="bg-gray-500 w-full">trade</div>
          </div>
        </div>
        <div className="flex-1 bg-purple-500">
          <div className="bg-pink-500 w-full">trade history</div>
          <div className="bg-gray-500 w-full">trade history</div>
          <div className="bg-indigo-500 w-full">trade history</div>
        </div>
      </div>
      <div className="flex-1 bg-amber-500">
        trading window
      </div>
    </div>
  );
}
