import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFlow } from "../src/process-flow/parse.ts";

test("a chain makes every arrow a handoff and ignores a circled-number line", () => {
	const f = parseFlow("业务决定 → 持久化 → 交给执行方 → 执行 → 记录结果\n       ①        ②          ③       ④");
	assert.deepEqual(f.steps.map((s) => s.title), ["业务决定", "持久化", "交给执行方", "执行", "记录结果"]);
	assert.equal(f.handoffs.length, 4);
	assert.ok(f.handoffs.every((h) => h !== null));
});

test("chain accepts -> and subtitles after a pipe", () => {
	const f = parseFlow("title: T\nA | one -> B");
	assert.equal(f.title, "T");
	assert.deepEqual(f.steps[0], { title: "A", subtitle: "one", bullets: [] });
});

test("rich steps carry bullets and keys; handoffs only where declared", () => {
	const f = parseFlow(`title: Flow
badges: numbers
## A | first
- x
- y
tag: API
foot: done
note: n
-> crash | lost
## B
## C
color: teal`);
	assert.equal(f.badges, "numbers");
	assert.deepEqual(f.steps[0], { title: "A", subtitle: "first", bullets: ["x", "y"], tag: "API", foot: "done", note: "n" });
	assert.deepEqual(f.handoffs, [{ label: "crash", detail: "lost" }, null]);
	assert.equal(f.steps[2].color, "teal");
});

test("plain lines become subtitle, then bullets; stagger can be turned off", () => {
	const f = parseFlow("stagger: off\n## A\nsub line\nmore");
	assert.equal(f.stagger, false);
	assert.equal(f.steps[0].subtitle, "sub line");
	assert.deepEqual(f.steps[0].bullets, ["more"]);
});
