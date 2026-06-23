/**
 * Converts markdown syntax to React elements
 * Supports:
 * - **text** or __text__ for bold
 * - *text* or _text_ for italic
 * - ***text*** or ___text___ for bold italic
 * - `text` for code
 */
export function parseMarkdown(text) {
  if (!text || typeof text !== "string") return text;

  const parts = [];
  let lastIndex = 0;

  // Pattern to match markdown: bold, italic, bold-italic, code
  // Order matters: check bold-italic first, then bold, then italic, then code
  const patterns = [
    // Bold-italic: ***text*** or ___text___
    {
      regex: /(\*\*\*(.+?)\*\*\*|___(.+?)___)/g,
      type: "bold-italic",
      extractContent: (match) => match.replace(/[\*_]+/g, ""),
    },
    // Bold: **text** or __text__
    {
      regex: /(\*\*(.+?)\*\*|__(.+?)__)/g,
      type: "bold",
      extractContent: (match) => match.replace(/[\*_]{2,}/g, ""),
    },
    // Italic: *text* or _text_ (but not part of bold)
    {
      regex:
        /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g,
      type: "italic",
      extractContent: (match) => match.replace(/[\*_]/g, ""),
    },
    // Code: `text`
    {
      regex: /`(.+?)`/g,
      type: "code",
      extractContent: (match) => match.replace(/`/g, ""),
    },
  ];

  let processedText = text;
  let matchCount = 0;

  // Apply all patterns and collect matches
  const allMatches = [];
  patterns.forEach((pattern) => {
    const regex = new RegExp(pattern.regex);
    let match;
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: pattern.type,
        content: pattern.extractContent(match[0]),
        original: match[0],
      });
    }
  });

  // Sort by position and remove overlaps
  allMatches.sort((a, b) => a.start - b.start);
  const cleanMatches = [];
  let lastEnd = 0;
  allMatches.forEach((match) => {
    if (match.start >= lastEnd) {
      cleanMatches.push(match);
      lastEnd = match.end;
    }
  });

  // Build React elements
  if (cleanMatches.length === 0) {
    return text;
  }

  lastIndex = 0;
  cleanMatches.forEach((match, idx) => {
    // Add text before the match
    if (match.start > lastIndex) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex, match.start),
      });
    }

    // Add styled match
    parts.push({
      type: match.type,
      content: match.content,
    });

    lastIndex = match.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.substring(lastIndex),
    });
  }

  return parts;
}

export function MarkdownText({ text }) {
  const parts = parseMarkdown(text);

  if (typeof parts === "string") {
    return parts;
  }

  return parts.map((part, idx) => {
    switch (part.type) {
      case "bold":
        return (
          <strong key={idx} className="font-bold">
            {part.content}
          </strong>
        );
      case "italic":
        return (
          <em key={idx} className="italic">
            {part.content}
          </em>
        );
      case "bold-italic":
        return (
          <strong key={idx} className="font-bold italic">
            {part.content}
          </strong>
        );
      case "code":
        return (
          <code
            key={idx}
            className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-700"
          >
            {part.content}
          </code>
        );
      default:
        return <span key={idx}>{part.content}</span>;
    }
  });
}
