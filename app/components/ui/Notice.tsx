import type { ReactNode } from "react";

interface Props {
	children: ReactNode;
}

/** A status line shown in place of content, e.g. loading, empty or no match */
export default function Notice({ children }: Props) {
	return <p className="p-4 text-muted-foreground">{children}</p>;
}
