import { useState } from "react";

interface Props {
  /** Shown before the buttons */
  label: string;
  options: string[];
  /** Button text for an option, e.g. "10" → "10%" */
  format?: (option: string) => string;
  onPick: (index: number) => void;
  /** Makes the options editable */
  onEdit?: (options: string[]) => void;
}

/** A row of shortcut buttons that fill in the amount */
export default function QuickAmounts({ label, options, format = (o) => o, onPick, onEdit }: Props) {
  // null unless editing
  const [drafts, setDrafts] = useState<string[] | null>(null);

  const save = (edited: string[]) => {
    onEdit?.(edited);
    setDrafts(null);
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="w-12 shrink-0 text-muted-foreground">{label}</span>
      {drafts
        ? drafts.map((d, i) => (
            <input
              key={i}
              type="text"
              inputMode="decimal"
              value={d}
              onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? e.target.value : x)))}
              aria-label={`${label} shortcut ${i + 1}`}
              className="w-0 flex-1 rounded border bg-muted px-1 py-1 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ))
        : options.map((option, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              className="flex-1 rounded bg-muted px-1 py-1 tabular-nums hover:bg-primary-subtle"
            >
              {format(option)}
            </button>
          ))}
      {onEdit && (
        <button
          type="button"
          onClick={() => (drafts ? save(drafts) : setDrafts(options))}
          className="px-1 text-primary hover:underline"
        >
          {drafts ? "Done" : "Edit"}
        </button>
      )}
    </div>
  );
}
