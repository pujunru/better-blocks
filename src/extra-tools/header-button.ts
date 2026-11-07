import { App, ItemView, WorkspaceLeaf } from "obsidian";

/** A button in the header of every open file view (next to the reading-mode toggle). */
export class HeaderButton {
	private buttons = new Map<ItemView, HTMLElement>();

	constructor(
		private app: App,
		private icon: string,
		private title: string,
		private onClick: (leaf: WorkspaceLeaf) => unknown,
	) {}

	/** Adds the button to every open file view that lacks one; call again whenever the layout changes. */
	sync() {
		const open = new Set<ItemView>();
		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;
			if (!(view instanceof ItemView) || !("file" in view) || !view.file) return;
			open.add(view);
			if (!this.buttons.has(view)) this.buttons.set(view, view.addAction(this.icon, this.title, () => this.onClick(leaf)));
		});
		// Forget views that were closed so they can be garbage collected.
		for (const view of this.buttons.keys()) if (!open.has(view)) this.buttons.delete(view);
	}

	clear() {
		for (const button of this.buttons.values()) button.remove();
		this.buttons.clear();
	}
}
