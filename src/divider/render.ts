export interface Divider {
	num: string;
	title: string;
	/** 1 for `3`, 2 for `3.1` or `3-1`, 3 for `3.1.2`, ...; rendering caps it at 4. */
	level: number;
}

/** First line is `<number> <optional title>`; the number is whatever you type (1, 2.1, B, 三). */
export function parseDivider(source: string): Divider {
	const line = source.trim().split(/\r?\n/)[0] ?? "";
	const m = line.match(/^(\S+?)[.)、:：]?(?:\s+(.*))?$/);
	if (!m) return { num: "", title: "", level: 1 };
	return { num: m[1], title: (m[2] ?? "").trim(), level: m[1].split(/[.\-_]/).filter(Boolean).length || 1 };
}

export function renderDivider(source: string, container: HTMLElement) {
	const { num, title, level } = parseDivider(source);
	const doc = container.ownerDocument;
	const root = container.appendChild(doc.createElement("div"));
	const add = (cls: string, text: string, parent: HTMLElement = root) => {
		const el = parent.appendChild(doc.createElement("span"));
		el.className = cls;
		el.textContent = text;
		return el;
	};

	root.className = "bb-dv";
	root.dataset.level = String(Math.min(level, 4));
	if (num) {
		// `3.1.2`: each segment nests inside the one before at a smaller size, so the number steps
		// down as it goes deeper while `3` stays the size it has on its own.
		let parent = add("bb-dv-num", "");
		num.match(/[.\-_]?[^.\-_]+|[.\-_]+$/g)?.forEach((seg, i) => {
			if (i === 0) parent.textContent = seg;
			else parent = add("bb-dv-sub", seg, parent);
		});
	}
	if (title) add("bb-dv-title", title);
}
