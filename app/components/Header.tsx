import { Link } from "react-router";
import { QUOTE } from "~/data/api";
import { useProfile } from "~/state/store";
import { formatUsdt } from "~/utils/format";

/** Top bar: title, navigation and cash balance */
export default function Header() {
  const { profile } = useProfile();

  return (
    <header className="flex h-1/12 items-center border-b bg-surface p-4 text-foreground">
      <Link to="/">
        <h1 className="text-2xl font-bold">Crypto Trading Simulator</h1>
      </Link>
      <Link to="/" className="ml-4 text-primary">
        Discover
      </Link>
      <Link to="/portfolio" className="ml-4 text-primary">
        Portfolio
      </Link>
      <div className="ml-auto tabular-nums">
        {formatUsdt(profile.balance)} {QUOTE}
      </div>
      <div className="ml-4">profile</div>
    </header>
  );
}
