/** First line is `<number> <optional title>`; the number is whatever you type (1, 2.1, B, 三). */
export function parseDivider(source: string): { num: string; title: string } {
	const line = source.trim().split(/\r?\n/)[0] ?? "";
	const m = line.match(/^(\S+?)[.)、:：]?(?:\s+(.*))?$/);
	return m ? { num: m[1], title: (m[2] ?? "").trim() } : { num: "", title: "" };
}

export function renderDivider(source: string, container: HTMLElement) {
	const { num, title } = parseDivider(source);
	const doc = container.ownerDocument;
	const root = container.appendChild(doc.createElement("div"));
	root.className = "bb-dv";
	for (const [cls, text] of [["bb-dv-num", num], ["bb-dv-title", title]]) {
		if (!text) continue;
		const el = root.appendChild(doc.createElement("span"));
		el.className = cls;
		el.textContent = text;
	}
}
