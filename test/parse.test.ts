import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFlow } from "../src/process-flow/parse.ts";

test("a chain is the steps; a circled-number sketch line is ignored", () => {
	const f = parseFlow("业务决定 → 持久化 → 交给执行方 → 执行 → 记录结果\n       ①        ②          ③       ④");
	assert.deepEqual(f.steps.map((s) => s.title), ["业务决定", "持久化", "交给执行方", "执行", "记录结果"]);
	assert.equal(f.labels.length, 4);
	assert.ok(f.labels.every((l) => l === undefined));
});

test("① lines name handoffs by number", () => {
	const f = parseFlow("A -> B -> C\n② second\n① first");
	assert.deepEqual(f.labels, ["first", "second"]);
});

test("one step per line, indented or dashed details, → names the next handoff", () => {
	const f = parseFlow("A\n  detail a\n→ handoff\nB\n- detail b\nC");
	assert.deepEqual(f.steps, [
		{ title: "A", details: ["detail a"] },
		{ title: "B", details: ["detail b"] },
		{ title: "C", details: [] },
	]);
	assert.deepEqual(f.labels, ["handoff", undefined]);
});

test("labels past the last step are dropped", () => {
	assert.deepEqual(parseFlow("A → B\n③ nope").labels, [undefined]);
});

test("1. / 1) / 1、 lines name handoffs too", () => {
	const f = parseFlow("A → B → C → D\n1. first\n2) second\n3、third");
	assert.deepEqual(f.labels, ["first", "second", "third"]);
});

test("divider: number and optional title", async () => {
	const { parseDivider } = await import("../src/divider/render.ts");
	assert.deepEqual(parseDivider("1"), { num: "1", title: "" });
	assert.deepEqual(parseDivider("2. 持久化"), { num: "2", title: "持久化" });
	assert.deepEqual(parseDivider("  B  Notes\nignored"), { num: "B", title: "Notes" });
	assert.deepEqual(parseDivider(""), { num: "", title: "" });
});
