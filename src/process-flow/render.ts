import { Flow, parseFlow } from "./parse";

const PALETTE: Record<string, string> = {
	orange: "#F39200",
	teal: "#13A89E",
	indigo: "#4D4FA3",
	crimson: "#C23B5E",
	blue: "#2E86DE",
	green: "#5FA846",
	purple: "#8E44AD",
	coral: "#E15F41",
};
const ORDER = Object.values(PALETTE);

// Timeline geometry in px: where the upper and lower rails sit inside the track.
const RAIL_HIGH = 10;
const RAIL_LOW = 38;
const TRACK_HEIGHT = 48;
const SVG_NS = "http://www.w3.org/2000/svg";

type Doc = Document;

function h<K extends keyof HTMLElementTagNameMap>(doc: Doc, parent: HTMLElement, tag: K, cls?: string, text?: string) {
	const el = doc.createElement(tag);
	if (cls) el.className = cls;
	if (text !== undefined) appendInline(doc, el, text);
	parent.appendChild(el);
	return el;
}

/** Minimal inline markdown: `code` and **bold**. Built with DOM nodes, never innerHTML. */
function appendInline(doc: Doc, el: HTMLElement, text: string) {
	for (const part of text.split(/(`[^`]+`|\*\*[^*]+\*\*)/)) {
		if (!part) continue;
		if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
			el.appendChild(doc.createElement("code")).textContent = part.slice(1, -1);
		} else if (part.startsWith("**") && part.endsWith("**") && part.length > 3) {
			el.appendChild(doc.createElement("strong")).textContent = part.slice(2, -2);
		} else {
			el.appendChild(doc.createTextNode(part));
		}
	}
}

function resolveColor(value: string | undefined, index: number) {
	if (value) {
		const named = PALETTE[value.toLowerCase()];
		if (named) return named;
		if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
	}
	return ORDER[index % ORDER.length];
}

function badgeText(flow: Flow, i: number, override?: string) {
	if (override) return override;
	if (flow.badges === "none") return "";
	if (flow.badges === "numbers") return String(i + 1);
	let s = "";
	for (let n = i; n >= 0; n = Math.floor(n / 26) - 1) s = String.fromCharCode(65 + (n % 26)) + s;
	return s;
}

function svg(doc: Doc, parent: Element, tag: string, attrs: Record<string, string | number>) {
	const el = doc.createElementNS(SVG_NS, tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
	parent.appendChild(el);
	return el;
}

export function renderProcessFlow(source: string, container: HTMLElement) {
	const doc = container.ownerDocument;
	const flow = parseFlow(source);
	const root = h(doc, container, "div", "bb-pf");

	if (!flow.steps.length) {
		h(doc, root, "div", "bb-pf-empty", "No steps. Write `A → B → C`, or start each step with `## Title`.");
		return;
	}

	const n = flow.steps.length;
	const colors = flow.steps.map((s, i) => resolveColor(s.color, i));
	const level = (i: number) => (flow.stagger && i % 2 === 1 ? 1 : 0);
	const railY = (i: number) => (level(i) ? RAIL_LOW : RAIL_HIGH);

	if (flow.title || flow.subtitle) {
		const head = h(doc, root, "div", "bb-pf-head");
		if (flow.title) h(doc, head, "div", "bb-pf-title", flow.title);
		if (flow.subtitle) h(doc, head, "div", "bb-pf-subtitle", flow.subtitle);
	}

	const scroller = h(doc, root, "div", "bb-pf-scroll");
	const board = h(doc, scroller, "div", "bb-pf-board");
	board.style.setProperty("--bb-n", String(n));

	// Row 1: cards, each with a stem dropping to the rail.
	const cards = h(doc, board, "div", "bb-pf-row bb-pf-cards");
	flow.steps.forEach((step, i) => {
		const col = h(doc, cards, "div", "bb-pf-col");
		col.style.setProperty("--bb-c", colors[i]);
		if (level(i)) col.classList.add("is-low");

		const card = h(doc, col, "div", "bb-pf-card");
		const badge = badgeText(flow, i, step.badge);
		if (badge) h(doc, card, "div", "bb-pf-badge", badge);
		const body = h(doc, card, "div", "bb-pf-body");
		h(doc, body, "div", "bb-pf-card-title", step.title);
		if (step.subtitle) h(doc, body, "div", "bb-pf-card-sub", step.subtitle);
		if (step.bullets.length) {
			h(doc, body, "div", "bb-pf-rule");
			const ul = h(doc, body, "ul", "bb-pf-list");
			for (const b of step.bullets) h(doc, ul, "li", undefined, b);
		}
		h(doc, card, "div", step.foot ? "bb-pf-foot" : "bb-pf-bar", step.foot);
		if (step.tag) h(doc, card, "div", "bb-pf-tag", step.tag);

		h(doc, col, "div", "bb-pf-stem");
	});

	// Row 2: the stepped rail. Stretched SVG with non-scaling strokes, so each column is 100 units wide.
	const track = h(doc, board, "div", "bb-pf-track");
	const rail = svg(doc, track, "svg", {
		class: "bb-pf-rail",
		viewBox: `0 0 ${n * 100} ${TRACK_HEIGHT}`,
		preserveAspectRatio: "none",
		height: TRACK_HEIGHT,
	});
	flow.steps.forEach((_, i) => {
		const y = railY(i);
		const from = i === 0 ? y : railY(i - 1);
		svg(doc, rail, "path", { d: `M${i * 100} ${from}V${y}H${(i + 1) * 100}`, stroke: colors[i] });
		svg(doc, rail, "path", { d: `M${i * 100 + 50} 0V${y}`, stroke: colors[i] });
	});

	let k = 0;
	const legend: { num: string; from: number; label?: string; detail?: string }[] = [];
	flow.handoffs.forEach((handoff, i) => {
		if (!handoff) return;
		const num = String(++k);
		const mark = h(doc, track, "div", "bb-pf-mark", num);
		mark.style.left = `${((i + 1) / n) * 100}%`;
		mark.style.top = `${(railY(i) + railY(i + 1)) / 2}px`;
		mark.setAttribute("aria-label", `Handoff ${k}: ${handoff.label ?? `${flow.steps[i].title} → ${flow.steps[i + 1].title}`}`);
		legend.push({ num, from: i, ...handoff });
	});

	// Row 3: step labels and notes, following the rail down and up.
	const labels = h(doc, board, "div", "bb-pf-row bb-pf-labels");
	flow.steps.forEach((step, i) => {
		const col = h(doc, labels, "div", "bb-pf-label");
		col.style.setProperty("--bb-c", colors[i]);
		if (level(i)) col.classList.add("is-low");
		h(doc, col, "div", "bb-pf-step", `Step ${i + 1}`);
		if (step.note) h(doc, col, "div", "bb-pf-note", step.note);
	});

	if (legend.some((item) => item.label || item.detail)) {
		const list = h(doc, root, "div", "bb-pf-legend");
		h(doc, list, "div", "bb-pf-legend-title", "Handoffs");
		for (const item of legend) {
			const row = h(doc, list, "div", "bb-pf-legend-row");
			h(doc, row, "span", "bb-pf-mark is-inline", item.num);
			const text = h(doc, row, "div", "bb-pf-legend-text");
			const route = h(doc, text, "span", "bb-pf-route");
			const a = h(doc, route, "span", undefined, flow.steps[item.from].title);
			a.style.setProperty("--bb-c", colors[item.from]);
			route.appendChild(doc.createTextNode(" → "));
			const b = h(doc, route, "span", undefined, flow.steps[item.from + 1].title);
			b.style.setProperty("--bb-c", colors[item.from + 1]);
			if (item.label) h(doc, text, "span", "bb-pf-handoff-label", item.label);
			if (item.detail) h(doc, text, "span", "bb-pf-handoff-detail", item.detail);
		}
	}
}
