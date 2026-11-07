import { App, ItemView } from "obsidian";

const COMMAND = "file-explorer:reveal-active-file";

/** Header button that locates the open file in the file explorer, like IntelliJ's "Select Opened File". */
export class RevealInTree {
	private buttons = new Map<ItemView, HTMLElement>();

	constructor(private app: App) {}

	/** Adds the button to every open file view that lacks one; call again whenever the layout changes. */
	sync() {
		const open = new Set<ItemView>();
		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;
			if (!(view instanceof ItemView) || !("file" in view) || !view.file) return;
			open.add(view);
			if (this.buttons.has(view)) return;
			const button = view.addAction("locate-fixed", "Reveal in file explorer", () => {
				this.app.workspace.setActiveLeaf(leaf, { focus: true });
				// `commands` is not in the public typings, but it is the stable way to run a core command.
				(this.app as App & { commands: { executeCommandById(id: string): boolean } }).commands.executeCommandById(COMMAND);
			});
			this.buttons.set(view, button);
		});
		// Forget views that were closed so they can be garbage collected.
		for (const view of this.buttons.keys()) if (!open.has(view)) this.buttons.delete(view);
	}

	clear() {
		for (const button of this.buttons.values()) button.remove();
		this.buttons.clear();
	}
}
