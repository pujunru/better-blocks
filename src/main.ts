import { Plugin } from "obsidian";
import { renderProcessFlow } from "./process-flow/render";

export default class BetterBlocks extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor("better-block-process-flow", (source, el) => {
			renderProcessFlow(source, el);
		});
	}
}
