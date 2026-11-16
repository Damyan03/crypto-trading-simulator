import { Link } from "react-router";
import ProfileMenu from "~/components/layout/ProfileMenu";
import { QUOTE } from "~/data/binance-api";
import { useText } from "~/i18n/language";
import { useProfile } from "~/state/store";
import { formatUsdt } from "~/utils/format";

/** Top bar: title, navigation and cash balance */
export default function Header() {
	const { profile } = useProfile();
	const text = useText().header;

	return (
		<header className="flex h-1/12 items-center border-b bg-surface p-4 text-foreground">
			<Link to="/">
				<h1 className="text-2xl font-bold">{text.title}</h1>
			</Link>
			<Link to="/" className="ml-4 text-primary">
				{text.discover}
			</Link>
			<Link to="/portfolio" className="ml-4 text-primary">
				{text.portfolio}
			</Link>
			<div className="ml-auto tabular-nums">
				{formatUsdt(profile.balance)} {QUOTE}
			</div>
			<ProfileMenu />
		</header>
	);
}
