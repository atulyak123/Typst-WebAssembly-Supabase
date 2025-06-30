/* -------------------------------------------------- */
/*  Imports                                           */
/* -------------------------------------------------- */
import { basicSetup }               from "codemirror";          // meta bundle
import { EditorState }              from "@codemirror/state";   // typed API
import { EditorView }               from "@codemirror/view";

/* -------------------------------------------------- */
/*  Initial document                                  */
/* -------------------------------------------------- */
const initialDoc = `= Hello, Typst!

This playground compiles Typst to **SVG** live.

* Edit on the left
* See SVG on the right
`;

/* -------------------------------------------------- */
/*  Compile + render helpers                          */
/* -------------------------------------------------- */
type TypstModule = {
  svg: (args: { mainContent: string }) => Promise<string>;
  /** Raw PDF bytes */
  pdf: (args: { mainContent: string }) => Promise<Uint8Array>;
};
declare const $typst: TypstModule;
const preview = document.getElementById("preview")!;
function compileAndRender(src: string) {
  preview.innerHTML = `<div class="placeholder">⌛ compiling…</div>`;
  $typst.svg({ mainContent: src })
        .then(svg => (preview.innerHTML = svg))
        .catch(err => {
          preview.innerHTML = `<pre style="color:red">${err}</pre>`;
          console.error(err);
        });
}
/*  Simple debounce */
let timer: number | undefined;
const debounceRender = (text: string) => {
  clearTimeout(timer);
  timer = window.setTimeout(() => compileAndRender(text), 300);
};

/* -------------------------------------------------- */
/*  Editor boot                                       */
/* -------------------------------------------------- */
const updateListener = EditorView.updateListener.of(u => {
  if (u.docChanged) debounceRender(u.state.doc.toString());
});

const view = new EditorView({
  state: EditorState.create({
    doc:        initialDoc,
    extensions: [basicSetup, updateListener],
  }),
  parent: document.getElementById("editor")!,
});

/* -------------------------------------------------- */
/*  First render once Typst WASM is ready             */
/* -------------------------------------------------- */
(document.getElementById("typst") as HTMLScriptElement)
  .addEventListener("load", () => compileAndRender(initialDoc));

const root = document.documentElement;
const KEY  = "typst-theme";

function setTheme(t: "light" | "dark") {
  root.setAttribute("data-theme", t);
  localStorage.setItem(KEY, t);
  (document.getElementById("theme-btn") as HTMLButtonElement).textContent =
    t === "dark" ? "☀" : "🌙";
}
// initial load
setTheme(
  (localStorage.getItem(KEY) as "light" | "dark" | null) ??
  (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
);
// click handler
document.getElementById("theme-btn")!.addEventListener("click", () =>
  setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark")
);
/* -------------------------------------------------- */
/*  Export PDF                               */
/* -------------------------------------------------- */
const exportBtn = document.getElementById("export-btn") as HTMLButtonElement;

async function downloadPDF() {
  try {
 const source = view.state.doc.toString();
const data   = await $typst.pdf({ mainContent: source });
const blob   = new Blob([data], { type: "application/pdf" });
const url    = URL.createObjectURL(blob);
const match  = source.match(/#let\s+name\s*=\s*"(.+?)"/);
const name   = match ? match[1].split(" ")[0] : "typst-output";
const a      = document.createElement("a");
a.href       = url;
a.download   = `${name}.pdf`;
a.click();
URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed", err);
  }
}
exportBtn.addEventListener("click", downloadPDF);
