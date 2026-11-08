/** Minimal inline markdown: `code` and **bold**. Built with DOM nodes, never innerHTML. */
export function appendInline(el: HTMLElement, text: string) {
	const doc = el.ownerDocument;
	for (const part of text.split(/(`[^`]+`|\*\*[^*]+\*\*)/)) {
		if (!part) continue;
		if (/^`.+`$/.test(part)) el.appendChild(doc.createElement("code")).textContent = part.slice(1, -1);
		else if (/^\*\*.+\*\*$/.test(part)) el.appendChild(doc.createElement("strong")).textContent = part.slice(2, -2);
		else el.appendChild(doc.createTextNode(part));
	}
}
