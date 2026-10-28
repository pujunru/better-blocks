export interface Step {
	title: string;
	details: string[];
}

export interface Flow {
	steps: Step[];
	/** labels[i] describes the handoff between steps[i] and steps[i + 1]. */
	labels: (string | undefined)[];
}

const ARROW = /\s*(?:→|->|=>)\s*/;
const LEADING_ARROW = /^(?:→|->|=>)\s*/;
const CIRCLED_ONLY = /^[\s①-⑳]*$/;

/**
 * Three rules:
 *   A → B → C          steps in a chain (or one step per line)
 *     indented / - x   a detail under the step above
 *   ① label / 1. label names handoff 1 (or `→ label` right under a step names the one after it)
 */
export function parseFlow(source: string): Flow {
	const flow: Flow = { steps: [], labels: [] };
	const last = () => flow.steps[flow.steps.length - 1];

	for (const raw of source.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line || CIRCLED_ONLY.test(line)) continue;

		const circled = line.match(/^([①-⑳])\s*(.+)$/);
		const numbered = line.match(/^(\d{1,2})[.)、]\s*(.+)$/);
		if (circled || numbered) {
			const index = circled ? circled[1].charCodeAt(0) - 0x2460 : Number(numbered![1]) - 1;
			if (index >= 0) flow.labels[index] = (circled ?? numbered)![2];
			continue;
		}

		if (LEADING_ARROW.test(line)) {
			if (last()) flow.labels[flow.steps.length - 1] = line.replace(LEADING_ARROW, "");
			continue;
		}

		const bullet = /^[-*•]\s+/.test(line);
		if ((bullet || /^\s/.test(raw)) && last()) {
			last().details.push(line.replace(/^[-*•]\s+/, ""));
			continue;
		}

		for (const part of line.split(ARROW)) {
			if (part.trim()) flow.steps.push({ title: part.trim(), details: [] });
		}
	}
	flow.labels = Array.from({ length: Math.max(flow.steps.length - 1, 0) }, (_, i) => flow.labels[i]);
	return flow;
}
