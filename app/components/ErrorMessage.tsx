interface Props {
  message: string;
  onRetry: () => void;
}

/** Error text with a Retry button */
export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex items-center gap-4 p-4 text-danger">
      <span>{message}</span>
      <button onClick={onRetry} className="rounded bg-primary px-3 py-1 text-white hover:bg-primary/90">
        Retry
      </button>
    </div>
  );
}
