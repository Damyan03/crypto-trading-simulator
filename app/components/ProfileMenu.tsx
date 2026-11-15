import { useEffect, useRef, useState } from "react";
import { QUOTE } from "~/data/binance-api";
import { STARTING_BALANCE } from "~/domain/profile";
import { useProfile } from "~/state/store";
import { formatUsdt } from "~/utils/format";

/** Header dropdown with the account reset options */
export default function ProfileMenu() {
  const { reset, resetToDemo } = useProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // a click anywhere outside closes the menu
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // asks first: the old holdings and trades can't be restored
  const choose = (action: () => void, question: string) => {
    setOpen(false);
    if (window.confirm(question)) action();
  };

  const item = "block w-full px-4 py-2 text-left hover:bg-muted";

  return (
    <div ref={ref} className="relative ml-4">
      <button type="button" onClick={() => setOpen(!open)} className="rounded px-2 py-1 hover:bg-muted">
        Profile ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded border bg-surface text-sm shadow-lg">
          <button
            type="button"
            onClick={() =>
              choose(reset, `Reset to ${formatUsdt(STARTING_BALANCE)} ${QUOTE}? All holdings and trades will be deleted.`)
            }
            className={item}
          >
            Reset to default
          </button>
          <button
            type="button"
            onClick={() => choose(resetToDemo, "Switch to the demo account? All holdings and trades will be replaced.")}
            className={item}
          >
            Reset to demo account
          </button>
        </div>
      )}
    </div>
  );
}
