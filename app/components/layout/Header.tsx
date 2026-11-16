import { Link, NavLink } from "react-router";
import ProfileMenu from "~/components/layout/ProfileMenu";
import { QUOTE } from "~/domain/profile";
import { useText } from "~/i18n/language";
import { useProfile } from "~/state/store";
import { formatUsdt } from "~/utils/format";

// the current page's link is highlighted
const navLink = ({ isActive }: { isActive: boolean }) =>
	isActive ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground";

/**
 * Top bar: title, navigation, cash balance and the profile menu.
 * Phones: title and profile on the first row, navigation and balance on the second; wider screens: one row.
 */
export default function Header() {
	const { profile } = useProfile();
	const text = useText().header;

	return (
		<header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b bg-surface px-4 py-2 text-foreground sm:flex-nowrap sm:py-3">
			{/* shrinks and truncates first when space runs out */}
			<Link to="/" className="min-w-0 flex-1 sm:flex-initial">
				<h1 className="truncate text-lg font-bold sm:text-xl">{text.title}</h1>
			</Link>
			{/* phones: top right (second in the markup); wider screens: last */}
			<div className="sm:order-last">
				<ProfileMenu />
			</div>
			<div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:flex-1">
				<nav className="flex gap-4">
					<NavLink to="/" end className={navLink}>
						{text.discover}
					</NavLink>
					<NavLink to="/portfolio" className={navLink}>
						{text.portfolio}
					</NavLink>
				</nav>
				<div className="whitespace-nowrap font-semibold tabular-nums">
					{formatUsdt(profile.balance)} {QUOTE}
				</div>
			</div>
		</header>
	);
}
