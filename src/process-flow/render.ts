import { parseFlow } from "./parse";

// Distinct hues in a fixed order, so step N always looks the same across notes.
const COLORS = ["#5B5BD6", "#2F80ED", "#0E9F9A", "#3A9D5D", "#E0962B", "#E25C45", "#C2477E", "#8B5CF6"];

function h<K extends keyof HTMLElementTagNameMap>(parent: HTMLElement, tag: K, cls?: string, text?: string) {
	const el = parent.ownerDocument.createElement(tag);
	if (cls) el.className = cls;
	if (text !== undefined) appendInline(el, text);
	parent.appendChild(el);
	return el;
}

/** Minimal inline markdown: `code` and **bold**. Built with DOM nodes, never innerHTML. */
function appendInline(el: HTMLElement, text: string) {
	const doc = el.ownerDocument;
	for (const part of text.split(/(`[^`]+`|\*\*[^*]+\*\*)/)) {
		if (!part) continue;
		if (/^`.+`$/.test(part)) el.appendChild(doc.createElement("code")).textContent = part.slice(1, -1);
		else if (/^\*\*.+\*\*$/.test(part)) el.appendChild(doc.createElement("strong")).textContent = part.slice(2, -2);
		else el.appendChild(doc.createTextNode(part));
	}
}

export function renderProcessFlow(source: string, container: HTMLElement) {
	const flow = parseFlow(source);
	const root = h(container, "div", "bb-pf");
	if (!flow.steps.length) {
		h(root, "div", "bb-pf-empty", "Write steps as A → B → C.");
		return;
	}

	const grid = h(h(root, "div", "bb-pf-scroll"), "div", "bb-pf-grid");
	grid.style.setProperty("--bb-n", String(flow.steps.length));
	const hasDetails = flow.steps.some((s) => s.details.length);

	flow.steps.forEach((step, i) => {
		const color = COLORS[i % COLORS.length];
		// The segment is clipped into an arrow, so the handoff number hangs off an unclipped wrapper.
		const cell = h(grid, "div", "bb-pf-cell");
		cell.style.setProperty("--bb-c", color);
		h(cell, "div", "bb-pf-seg", step.title);
		if (i === 0) cell.classList.add("is-first");
		if (i < flow.steps.length - 1) h(cell, "span", "bb-pf-num", String(i + 1));
		else cell.classList.add("is-last");

		if (hasDetails) {
			const col = h(grid, "div", "bb-pf-details");
			col.style.setProperty("--bb-c", color);
			col.style.gridColumn = String(i + 1);
			for (const d of step.details) h(col, "div", "bb-pf-detail", d);
		}
	});

	if (flow.labels.some(Boolean)) {
		const notes = h(root, "div", "bb-pf-notes");
		flow.labels.forEach((label, i) => {
			if (!label) return;
			const note = h(notes, "div", "bb-pf-note");
			h(note, "span", "bb-pf-num", String(i + 1));
			h(note, "span", undefined, label);
		});
	}
}
