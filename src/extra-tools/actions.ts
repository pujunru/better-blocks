import { App, WorkspaceLeaf } from "obsidian";

/** Locates the leaf's file in the file explorer, like IntelliJ's "Select Opened File". */
export function revealInTree(app: App, leaf: WorkspaceLeaf) {
	app.workspace.setActiveLeaf(leaf, { focus: true });
	// `commands` is not in the public typings, but it is the stable way to run a core command.
	(app as App & { commands: { executeCommandById(id: string): boolean } }).commands.executeCommandById(
		"file-explorer:reveal-active-file",
	);
}

/**
 * Rebuilds the leaf's view from disk, the same as closing and reopening the file but keeping the
 * tab, its history and the scroll position. Views that cache their file (Excalidraw drawings, or a
 * note whose embeds changed) pick up the new contents this way.
 */
export async function reloadLeaf(leaf: WorkspaceLeaf) {
	const state = leaf.getViewState();
	const eState = leaf.getEphemeralState();
	await leaf.setViewState({ type: "empty", state: {} });
	await leaf.setViewState(state, eState);
}
