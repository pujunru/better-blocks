import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

export interface BetterBlocksSettings {
	/** Extra tools: optional helpers that are not code blocks. Each one is off until turned on. */
	revealInTree: boolean;
	reloadFile: boolean;
}

export const DEFAULT_SETTINGS: BetterBlocksSettings = {
	revealInTree: false,
	reloadFile: false,
};

interface SettingsHost extends Plugin {
	settings: BetterBlocksSettings;
	saveSettings(): Promise<void>;
}

export class BetterBlocksSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: SettingsHost) {
		super(app, plugin);
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Extra tools").setHeading();
		new Setting(containerEl)
			.setName("Reveal in file explorer button")
			.setDesc("Adds a button to each note's header that locates the note in the file explorer.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.revealInTree).onChange(async (value) => {
					this.plugin.settings.revealInTree = value;
					await this.plugin.saveSettings();
				}),
			);
		new Setting(containerEl)
			.setName("Reload file button")
			.setDesc(
				"Adds a button to each file's header that reloads it from disk, as if you closed and reopened it. " +
					"Useful when a drawing or embed changed outside the tab. Also adds the Reload current file command.",
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.reloadFile).onChange(async (value) => {
					this.plugin.settings.reloadFile = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}
