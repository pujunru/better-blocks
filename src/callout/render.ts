import { appendInline } from "../inline";
import { parseCallout } from "./parse";

/** Draws the label and leader; the body markdown goes to `renderMarkdown` (Obsidian's renderer in the plugin). */
export function renderCallout(
	source: string,
	container: HTMLElement,
	renderMarkdown: (markdown: string, el: HTMLElement) => unknown,
) {
	const { num, title, body } = parseCallout(source);
	const doc = container.ownerDocument;
	const add = (parent: HTMLElement, tag: string, cls: string, text?: string) => {
		const el = parent.appendChild(doc.createElement(tag));
		el.className = cls;
		if (text) appendInline(el, text);
		return el;
	};

	const root = add(container, "div", "bb-co");
	const label = add(root, "div", "bb-co-label");
	if (num) add(label, "span", "bb-co-num", num);
	if (title) add(label, "span", "bb-co-title", title);
	if (body) renderMarkdown(body, add(root, "div", "bb-co-body"));
}
