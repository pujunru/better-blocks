import { Editor, Menu, MenuItem, Plugin } from "obsidian";
import { renderDivider } from "./divider/render";
import { reloadLeaf, revealInTree } from "./extra-tools/actions";
import { HeaderButton } from "./extra-tools/header-button";
import { renderProcessFlow } from "./process-flow/render";
import { BetterBlocksSettings, BetterBlocksSettingTab, DEFAULT_SETTINGS } from "./settings";

const LANG = "better-block-process-flow";
const PLACEHOLDER = "A → B → C";
const DIVIDER = "better-block-divider";

export default class BetterBlocks extends Plugin {
	settings: BetterBlocksSettings = { ...DEFAULT_SETTINGS };
	private revealButton = new HeaderButton(this.app, "locate-fixed", "Reveal in file explorer", (leaf) =>
		revealInTree(this.app, leaf),
	);
	private reloadButton = new HeaderButton(this.app, "refresh-cw", "Reload file", reloadLeaf);

	async onload() {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
		this.addSettingTab(new BetterBlocksSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor(LANG, (source, el) => {
			renderProcessFlow(source, el);
		});

		this.addCommand({
			id: "insert-process-flow",
			name: "Insert process flow",
			editorCallback: (editor: Editor) => insertBlock(editor),
		});

		this.registerMarkdownCodeBlockProcessor(DIVIDER, (source, el) => {
			renderDivider(source, el);
		});

		this.addCommand({
			id: "insert-divider",
			name: "Insert divider",
			editorCallback: (editor: Editor) => insertDivider(editor),
		});

		this.addCommand({
			id: "wrap-in-divider",
			name: "Wrap in divider",
			editorCallback: (editor: Editor) => wrapInDivider(editor),
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				menu.addItem((item) => {
					item.setTitle("Better Blocks").setIcon("blocks").setSection("insert");
					// setSubmenu exists at runtime but isn't in the public typings; fall back to flat items.
					const sub = (item as MenuItem & { setSubmenu?: () => Menu }).setSubmenu?.();
					const target = sub ?? menu;
					const prefix = sub ? "" : "Better Blocks: ";
					target.addItem((i) =>
						i.setTitle(`${prefix}Wrap in divider`).setIcon("separator-horizontal").onClick(() => wrapInDivider(editor)),
					);
					target.addItem((i) =>
						i.setTitle(`${prefix}Insert divider`).setIcon("list-ordered").onClick(() => insertDivider(editor)),
					);
					target.addItem((i) =>
						i.setTitle(`${prefix}Insert process flow`).setIcon("workflow").onClick(() => insertBlock(editor)),
					);
					if (!sub) item.setDisabled(true);
				});
			}),
		);

		this.addCommand({
			id: "reload-file",
			name: "Reload current file",
			checkCallback: (checking) => {
				const leaf = this.app.workspace.getMostRecentLeaf();
				if (!this.settings.reloadFile || !leaf) return false;
				if (!checking) void reloadLeaf(leaf);
				return true;
			},
		});

		// Extra tools: the handlers always run and check their flag, so toggling needs no reload.
		this.app.workspace.onLayoutReady(() => this.applyExtraTools());
		this.registerEvent(this.app.workspace.on("layout-change", () => this.applyExtraTools()));
		this.registerEvent(this.app.workspace.on("file-open", () => this.applyExtraTools()));
	}

	onunload() {
		this.revealButton.clear();
		this.reloadButton.clear();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.applyExtraTools();
	}

	private applyExtraTools() {
		for (const [on, button] of [
			[this.settings.revealInTree, this.revealButton],
			[this.settings.reloadFile, this.reloadButton],
		] as const) {
			if (on) button.sync();
			else button.clear();
		}
	}
}

/** The nearest divider above `line` with its last number bumped (3 → 4, 3.1 → 3.2), or "1". */
function nextDividerNumber(editor: Editor, line: number) {
	for (let i = line - 1; i > 0; i--) {
		if (editor.getLine(i - 1).trim() !== "```" + DIVIDER) continue;
		const m = editor.getLine(i).trim().match(/^((?:\d+[.\-_])*)(\d+)/);
		return m ? m[1] + (Number(m[2]) + 1) : "1";
	}
	return "1";
}

/**
 * Turns the cursor's line into a divider: heading / list / quote markers are dropped, a leading
 * number is kept as the divider's number, and a line without one gets the next number.
 */
function wrapInDivider(editor: Editor) {
	const line = editor.getCursor("from").line;
	const text = editor.getLine(line).replace(/^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+)?/, "").trim();
	const body = /^\d/.test(text) ? text : `${nextDividerNumber(editor, line)}${text ? " " + text : ""}`;
	editor.replaceRange(
		`\`\`\`${DIVIDER}\n${body}\n\`\`\``,
		{ line, ch: 0 },
		{ line, ch: editor.getLine(line).length },
	);
	editor.setCursor({ line: line + 2, ch: 3 });
}

/** Inserts a divider numbered one past the last plain-integer divider above the cursor, with the number selected. */
function insertDivider(editor: Editor) {
	const cursor = editor.getCursor();
	const num = nextDividerNumber(editor, cursor.line);
	const before = editor.getLine(cursor.line).slice(0, cursor.ch).trim() ? "\n" : "";
	editor.replaceSelection(`${before}\`\`\`${DIVIDER}\n${num}\n\`\`\`\n`);
	const line = cursor.line + (before ? 2 : 1);
	editor.setSelection({ line, ch: 0 }, { line, ch: num.length });
}

/** Inserts the block on its own lines and selects the placeholder chain so typing replaces it. */
function insertBlock(editor: Editor) {
	const cursor = editor.getCursor();
	const before = editor.getLine(cursor.line).slice(0, cursor.ch).trim() ? "\n" : "";
	editor.replaceSelection(`${before}\`\`\`${LANG}\n${PLACEHOLDER}\n\`\`\`\n`);
	const line = cursor.line + (before ? 2 : 1);
	editor.setSelection({ line, ch: 0 }, { line, ch: PLACEHOLDER.length });
}
