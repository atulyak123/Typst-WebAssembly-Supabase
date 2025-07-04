/* -------------------------------------------------- */
/*  Imports                                           */
/* -------------------------------------------------- */
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/* -------------------------------------------------- */
/*  Initial document                                  */
/* -------------------------------------------------- */
const initialDoc = ``;

/* -------------------------------------------------- */
/*  Compile + render helpers                          */
/* -------------------------------------------------- */
type TypstModule = {
  svg: (args: { mainContent: string }) => Promise<string>;
  pdf: (args: { mainContent: string }) => Promise<Uint8Array>;
};
declare const $typst: TypstModule;

const preview = document.getElementById("preview")! as HTMLDivElement;

/* ―― ❶ helper so we can reuse the same placeholder ――――――――――――― */
const showPlaceholder = () => {
  preview.innerHTML = `
    <div class="placeholder">
      <div>Start typing to see your document</div>     
    </div>
  `;
};
/* show it on first load */
showPlaceholder();

function compileAndRender(src: string) {
  preview.innerHTML = `<div class="placeholder">⌛ compiling…</div>`;
  
  $typst.svg({ mainContent: src })
    .then(svg => {
      // Extract SVG dimensions
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      
      if (!svgElement) {
        displaySinglePage(svg);
        return;
      }
      
      const viewBox = svgElement.getAttribute('viewBox');
      if (!viewBox) {
        displaySinglePage(svg);
        return;
      }
      
      const [x, y, svgWidth, svgHeight] = viewBox.split(' ').map(Number);      
      // Smart page detection with better logic
      const pageAnalysis = analyzePageRequirements(svgHeight);
      if (pageAnalysis.pages > 1) {
        createMultiplePages(svgElement, x, y, svgWidth, svgHeight, pageAnalysis.pageHeight);
      } else {
        displaySinglePage(svg);
      }
    })
    .catch(err => {
      preview.innerHTML = `<pre style="color:red; padding: 1rem;">${err}</pre>`;
      console.error(err);
    });
}

function analyzePageRequirements(totalHeight: number): { pages: number, pageHeight: number, reason: string } {
  // Standard page heights in points
  const STANDARD_PAGES = [
    { name: "Letter", height: 792 },
    { name: "A4", height: 841.89 },
    { name: "Legal", height: 1008 },
  ];  
  // First, check if it's close to a single page
  for (const page of STANDARD_PAGES) {
    const singlePageTolerance = page.height * 0.2; // 20% tolerance for single pages
    
    if (totalHeight <= page.height + singlePageTolerance) {
      return {
        pages: 1,
        pageHeight: page.height,
        reason: `Content fits in single ${page.name} page with ${singlePageTolerance.toFixed(0)}pt tolerance`
      };
    }
  }
  
  // If not single page, find the best multi-page layout
  for (const page of STANDARD_PAGES) {
    const possiblePages = Math.ceil(totalHeight / page.height);
    const lastPageHeight = totalHeight - ((possiblePages - 1) * page.height);
    const minLastPageHeight = page.height * 0.3; // Last page must be at least 30% of a full page
    
    if (lastPageHeight >= minLastPageHeight) {
      return {
        pages: possiblePages,
        pageHeight: page.height,
        reason: `${possiblePages} ${page.name} pages, last page has ${lastPageHeight.toFixed(0)}pt content`
      };
    } 
  }
  
  // Fallback: use adaptive sizing
  const adaptiveHeight = totalHeight / 2;  
  return {
    pages: 2,
    pageHeight: adaptiveHeight,
    reason: `Adaptive sizing with ${adaptiveHeight.toFixed(0)}pt per page`
  };
}

function displaySinglePage(svgContent: string) {
  preview.innerHTML = `
    <div class="pages-container">
      <div class="page-wrapper">
        <div class="svg-page">
          ${svgContent}
        </div>
      </div>
    </div>
  `;
}

function createMultiplePages(
  svgElement: SVGElement,
  x: number,
  y: number,
  width: number,
  totalHeight: number,
  pageHeight: number
) {
  const numPages = Math.ceil(totalHeight / pageHeight);
  let html = "";

  for (let i = 0; i < numPages; i++) {
    const startY = i * pageHeight;
    const endY = Math.min(startY + pageHeight, totalHeight);
    const currentPageHeight = endY - startY;
    html += /* html */ `
      <div class="page-wrapper" data-page="${i + 1}">
        <div class="svg-page">
          <svg viewBox="${x} ${startY} ${width} ${currentPageHeight}"
               width="100%" 
               height="${currentPageHeight}pt"
               xmlns="http://www.w3.org/2000/svg"
               style="background: white; display: block;">
            ${svgElement.innerHTML}
          </svg>
        </div>
        <div class="page-info">Page ${i + 1} of ${numPages}</div>
      </div>`;
  }

  preview.innerHTML = `<div class="pages-container">${html}</div>`;
}

/*  Simple debounce */
let timer: number | undefined;
const debounceRender = (text: string) => {
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    const clean = text.trim();
    if (clean.length) {
      compileAndRender(clean);
    } else {
      showPlaceholder();
    }
  }, 300);
};

/* -------------------------------------------------- */
/*  Editor boot                                       */
/* -------------------------------------------------- */
const updateListener = EditorView.updateListener.of(u => {
  if (u.docChanged) debounceRender(u.state.doc.toString());
});

const view = new EditorView({
  state: EditorState.create({
    doc: initialDoc,
    extensions: [basicSetup, updateListener],
  }),
  parent: document.getElementById("editor")!,
});

/* -------------------------------------------------- */
/*  First render once Typst WASM is ready             */
/* -------------------------------------------------- */
(document.getElementById("typst") as HTMLScriptElement).addEventListener(
  "load",
  async () => {
    if (typeof ($typst as any).ready === "object") {
      await ($typst as any).ready;
    }
  },
);

/* -------------------------------------------------- */
/*  Theme toggle & export logic (unchanged)           */
/* -------------------------------------------------- */
const root = document.documentElement;
const KEY = "typst-theme";

function setTheme(t: "light" | "dark") {
  root.setAttribute("data-theme", t);
  localStorage.setItem(KEY, t);
  (document.getElementById("theme-btn") as HTMLButtonElement).textContent =
    t === "dark" ? "☀" : "🌙";
}

setTheme(
  (localStorage.getItem(KEY) as "light" | "dark" | null) ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
);

document.getElementById("theme-btn")!.addEventListener("click", () =>
  setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"),
);

/* -------------------------------------------------- */
/*  Export PDF                                        */
/* -------------------------------------------------- */
const exportBtn = document.getElementById("export-btn") as HTMLButtonElement;

async function downloadPDF() {
  try {
    const source = view.state.doc.toString();
    const data = await $typst.pdf({ mainContent: source });
    const blob = new Blob([data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const match = source.match(/#let\s+name\s*=\s*"(.+?)"/);
    const name = match ? match[1].split(" ")[0] : "typst-output";
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed", err);
  }
}
exportBtn.addEventListener("click", downloadPDF);