export interface Callout {
	num: string;
	title: string;
	/** Everything after the first line, as written; Obsidian renders it as markdown. */
	body: string;
}

/** First line is `<number> <title>` (the number is optional); the lines after it are markdown. */
export function parseCallout(source: string): Callout {
	const lines = source.replace(/^\s*\n/, "").split(/\r?\n/);
	const first = (lines.shift() ?? "").trim();
	const m = first.match(/^(\d[\d.\-]*?)[.)、:：]?(?:\s+(.*))?$/);
	return {
		num: m ? m[1] : "",
		title: (m ? (m[2] ?? "") : first).trim(),
		body: lines.join("\n").trim() ? lines.join("\n").replace(/\s+$/, "") : "",
	};
}
