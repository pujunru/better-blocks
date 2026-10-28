import esbuild from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { examples } from "./examples.mjs";

mkdirSync("dev/out", { recursive: true });
const js = (await esbuild.build({
	entryPoints: ["src/process-flow/render.ts"],
	bundle: true,
	format: "iife",
	globalName: "BB",
	write: false,
})).outputFiles[0].text;
const css = readFileSync("styles.css", "utf8");

// Just enough of Obsidian's theme variables to preview both themes.
const vars = `
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Inter", "PingFang SC", sans-serif; font-size: 16px; }
.theme-light { --background-primary:#fff; --background-secondary:#f6f6f6; --background-modifier-border:#e3e3e3; --background-modifier-hover:rgba(0,0,0,.06); --text-normal:#222; --text-muted:#5c5c5c; --text-faint:#999; background:#fff; }
.theme-dark { --background-primary:#1e1e1e; --background-secondary:#262626; --background-modifier-border:#363636; --background-modifier-hover:rgba(255,255,255,.08); --text-normal:#dadada; --text-muted:#b3b3b3; --text-faint:#666; background:#1e1e1e; }
.page { padding: 28px; width: var(--w, 760px); }
`;
const sources = JSON.stringify(examples);
for (const theme of ["light", "dark"]) {
	for (const width of [760, 1000]) {
		const html = `<!doctype html><meta charset="utf-8"><style>${vars}${css}</style>
<body class="theme-${theme}"><div class="page" style="--w:${width}px"></div>
<script>${js}
const page = document.querySelector(".page");
for (const ex of ${sources}) { const d = document.createElement("div"); d.style.marginBottom = "28px"; page.appendChild(d); BB.renderProcessFlow(ex.source, d); }
</script>`;
		writeFileSync(`dev/out/${theme}-${width}.html`, html);
	}
}
console.log("wrote dev/out/*.html");
