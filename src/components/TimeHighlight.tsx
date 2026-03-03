import { Fragment, type ReactNode } from "react";

const TIME_RE = /\b(?:[01]\d|2[0-3]):[0-5]\d\b/g;

export function highlightTimesInMarkdown(md: string): string {
  return md.replace(TIME_RE, (match) => `**\`${match}\`**`);
}

export function renderTimeHighlightedText(text: string): ReactNode {
  const matches = [...text.matchAll(TIME_RE)];
  if (matches.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    const token = match[0];
    const start = match.index ?? 0;

    if (start > cursor) {
      parts.push(<Fragment key={`plain-${index}`}>{text.slice(cursor, start)}</Fragment>);
    }

    parts.push(
      <mark className="time-mark" key={`time-${index}`}>
        {token}
      </mark>
    );

    cursor = start + token.length;
  });

  if (cursor < text.length) {
    parts.push(<Fragment key="plain-last">{text.slice(cursor)}</Fragment>);
  }

  return <>{parts}</>;
}
