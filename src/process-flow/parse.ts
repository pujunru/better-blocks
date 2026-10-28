export interface Step {
	title: string;
	subtitle?: string;
	bullets: string[];
	tag?: string;
	foot?: string;
	note?: string;
	color?: string;
	badge?: string;
}

export interface Handoff {
	label?: string;
	detail?: string;
}

export interface Flow {
	title?: string;
	subtitle?: string;
	badges: "letters" | "numbers" | "none";
	stagger: boolean;
	steps: Step[];
	/** handoffs[i] sits between steps[i] and steps[i + 1]; null means no marker there. */
	handoffs: (Handoff | null)[];
}

const ARROW = /\s*(?:→|->|=>|⟶)\s*/;
const HANDOFF_LINE = /^(?:->|→|=>)\s*/;
const CIRCLED_ONLY = /^[\s①-⑳❶-❿\d.,]*$/;
const KEY_VALUE = /^([a-zA-Z]+)\s*[:：]\s*(.*)$/;

const FLOW_KEYS = new Set(["title", "subtitle", "badges", "stagger"]);
const STEP_KEYS = new Set(["tag", "foot", "note", "color", "badge", "sub", "subtitle"]);

function splitPipe(s: string): [string, string | undefined] {
	const i = s.indexOf("|");
	if (i < 0) return [s.trim(), undefined];
	return [s.slice(0, i).trim(), s.slice(i + 1).trim() || undefined];
}

function applyFlowKey(flow: Flow, key: string, value: string) {
	if (key === "title") flow.title = value;
	else if (key === "subtitle") flow.subtitle = value;
	else if (key === "badges") flow.badges = value === "numbers" || value === "none" ? value : "letters";
	else if (key === "stagger") flow.stagger = !/^(false|no|off|0)$/i.test(value);
}

export function parseFlow(source: string): Flow {
	const flow: Flow = { badges: "letters", stagger: true, steps: [], handoffs: [] };
	const lines = source.split(/\r?\n/);
	const rich = lines.some((l) => /^#{1,6}\s+/.test(l.trim()));

	if (!rich) {
		for (const raw of lines) {
			const line = raw.trim();
			if (!line || CIRCLED_ONLY.test(line)) continue;
			const kv = line.match(KEY_VALUE);
			if (kv && FLOW_KEYS.has(kv[1].toLowerCase())) {
				applyFlowKey(flow, kv[1].toLowerCase(), kv[2].trim());
				continue;
			}
			// Every arrow in a chain is a handoff between the two steps it joins.
			for (const part of line.split(ARROW)) {
				if (!part.trim()) continue;
				const [title, subtitle] = splitPipe(part);
				if (flow.steps.length) flow.handoffs.push({});
				flow.steps.push({ title, subtitle, bullets: [] });
			}
		}
		return flow;
	}

	let step: Step | null = null;
	let pending: Handoff | null = null;
	for (const raw of lines) {
		const line = raw.trim();
		if (!line) continue;

		const heading = line.match(/^#{1,6}\s+(.*)$/);
		if (heading) {
			const [title, subtitle] = splitPipe(heading[1]);
			if (flow.steps.length) flow.handoffs.push(pending);
			pending = null;
			step = { title, subtitle, bullets: [] };
			flow.steps.push(step);
			continue;
		}

		if (HANDOFF_LINE.test(line)) {
			const [label, detail] = splitPipe(line.replace(HANDOFF_LINE, ""));
			pending = { label: label || undefined, detail };
			continue;
		}

		const bullet = line.match(/^[-*+•]\s+(.*)$/);
		if (bullet) {
			if (step) step.bullets.push(bullet[1]);
			continue;
		}

		const kv = line.match(KEY_VALUE);
		if (kv) {
			const key = kv[1].toLowerCase();
			const value = kv[2].trim();
			if (!step && FLOW_KEYS.has(key)) {
				applyFlowKey(flow, key, value);
				continue;
			}
			if (step && STEP_KEYS.has(key)) {
				if (key === "sub" || key === "subtitle") step.subtitle = value;
				else step[key as "tag" | "foot" | "note" | "color" | "badge"] = value;
				continue;
			}
		}

		if (!step) {
			if (!flow.title) flow.title = line;
			else if (!flow.subtitle) flow.subtitle = line;
		} else if (!step.subtitle && !step.bullets.length) {
			step.subtitle = line;
		} else {
			step.bullets.push(line);
		}
	}
	return flow;
}
