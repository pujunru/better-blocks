import { Editor, Plugin } from "obsidian";
import { renderProcessFlow } from "./process-flow/render";

const LANG = "better-block-process-flow";
const PLACEHOLDER = "A → B → C";

export default class BetterBlocks extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor(LANG, (source, el) => {
			renderProcessFlow(source, el);
		});

		this.addCommand({
			id: "insert-process-flow",
			name: "Insert process flow",
			editorCallback: (editor: Editor) => insertBlock(editor),
		});
	}
}

/** Inserts the block on its own lines and selects the placeholder chain so typing replaces it. */
function insertBlock(editor: Editor) {
	const cursor = editor.getCursor();
	const before = editor.getLine(cursor.line).slice(0, cursor.ch).trim() ? "\n" : "";
	editor.replaceSelection(`${before}\`\`\`${LANG}\n${PLACEHOLDER}\n\`\`\`\n`);
	const line = cursor.line + (before ? 2 : 1);
	editor.setSelection({ line, ch: 0 }, { line, ch: PLACEHOLDER.length });
}
