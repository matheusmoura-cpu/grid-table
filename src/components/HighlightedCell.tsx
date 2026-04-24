interface HighlightedCellProps {
  value: string;
  indices?: [number, number][];
}

export function HighlightedCell({ value, indices }: HighlightedCellProps) {
  if (!indices || indices.length === 0) {
    return <>{value}</>;
  }

  const parts: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;

  const sorted = [...indices].sort((a, b) => a[0] - b[0]);

  for (const [start, end] of sorted) {
    if (start > lastIndex) {
      parts.push({ text: value.slice(lastIndex, start), highlight: false });
    }
    parts.push({ text: value.slice(start, end + 1), highlight: true });
    lastIndex = end + 1;
  }

  if (lastIndex < value.length) {
    parts.push({ text: value.slice(lastIndex), highlight: false });
  }

  return (
    <>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark key={i} className="highlight-match">{part.text}</mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}
