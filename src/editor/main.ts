/* -------------------------------------------------- */
/*  Imports                                           */
/* -------------------------------------------------- */
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { typstSyntax } from "../typst-lang";

/* -------------------------------------------------- */
/*  Types                                             */
/* -------------------------------------------------- */
type TypstModule = {
  svg: (args: { mainContent: string }) => Promise<string>;
  pdf: (args: { mainContent: string }) => Promise<Uint8Array>;
};
declare const $typst: TypstModule;

/* -------------------------------------------------- */
/*  Constants & DOM Elements                          */
/* -------------------------------------------------- */
const initialDoc: string = (window as any).__initialDoc ?? "";
const preview = document.getElementById("preview")! as HTMLDivElement;


const showPlaceholder = () => {
  preview.innerHTML = `
    <div class="placeholder">
      <div>Start typing to see your document</div>     
    </div>
  `;
};

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

/* -------------------------------------------------- */
/*  Save Functions                                    */
/* -------------------------------------------------- */
function updateSaveStatus(status: 'saving' | 'saved' | 'error' | '') {
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
  if (!saveBtn) return;

  switch (status) {
    case 'saving':
      saveBtn.textContent = '💭'; // thinking/saving
      saveBtn.disabled = true;
      break;
    case 'saved':
      saveBtn.textContent = '✓'; // checkmark
      saveBtn.disabled = false;
      setTimeout(() => {
        if (saveBtn.textContent === '✓') {
          saveBtn.textContent = '💾';
        }
      }, 1500);
      break;
    case 'error':
      saveBtn.textContent = '⚠️'; // warning
      saveBtn.disabled = false;
      setTimeout(() => {
        if (saveBtn.textContent === '⚠️') {
          saveBtn.textContent = '💾';
        }
      }, 3000);
      break;
    default:
      saveBtn.textContent = '💾';
      saveBtn.disabled = false;
  }
}

/* -------------------------------------------------- */
/*  Page Analysis Logic                               */
/* -------------------------------------------------- */
function analyzePageRequirements(totalHeight: number): { pages: number, pageHeight: number, reason: string } {
  const STANDARD_PAGES = [
    { name: "Letter", height: 792 },
    { name: "A4", height: 841.89 },
    { name: "Legal", height: 1008 },
  ];  
  
  // Check if it's close to a single page
  for (const page of STANDARD_PAGES) {
    const singlePageTolerance = page.height * 0.2;
    
    if (totalHeight <= page.height + singlePageTolerance) {
      return {
        pages: 1,
        pageHeight: page.height,
        reason: `Content fits in single ${page.name} page`
      };
    }
  }
  
  // Find best multi-page layout
  for (const page of STANDARD_PAGES) {
    const possiblePages = Math.ceil(totalHeight / page.height);
    const lastPageHeight = totalHeight - ((possiblePages - 1) * page.height);
    const minLastPageHeight = page.height * 0.3;
    
    if (lastPageHeight >= minLastPageHeight) {
      return {
        pages: possiblePages,
        pageHeight: page.height,
        reason: `${possiblePages} ${page.name} pages`
      };
    } 
  }
  
  // Fallback
  const adaptiveHeight = totalHeight / 2;  
  return {
    pages: 2,
    pageHeight: adaptiveHeight,
    reason: `Adaptive sizing`
  };
}

/* -------------------------------------------------- */
/*  Core Compilation Logic                            */
/* -------------------------------------------------- */
function compileAndRender(src: string) {
  preview.innerHTML = `<div class="placeholder">⌛ compiling…</div>`;
  
  $typst.svg({ mainContent: src })
    .then(svg => {
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
(window as any).compileAndRender = compileAndRender;
/* -------------------------------------------------- */
/*  Debounced Rendering                               */
/* -------------------------------------------------- */
let renderTimer: number | undefined;
const debounceRender = (text: string) => {
  clearTimeout(renderTimer);
  renderTimer = window.setTimeout(() => {
    const clean = text.trim();
    if (clean.length) {
      compileAndRender(clean);
    } else {
      showPlaceholder();
    }
  }, 300);
};

/* -------------------------------------------------- */
/*  Editor Setup                                      */
/* -------------------------------------------------- */
const updateListener = EditorView.updateListener.of(u => {
  if (u.docChanged) {
    const content = u.state.doc.toString();
    debounceRender(content);
  }
});

const view = new EditorView({
  state: EditorState.create({
    doc: initialDoc,
    extensions: [
      basicSetup,
      ...typstSyntax(),  // 🎨 Import syntax highlighting
      updateListener,
    ],
  }),
  parent: document.getElementById("editor")!,
});
(window as any).__editorView = view; 

/* ------------------------------------------------- */
/*  Initialization                                    */
/* -------------------------------------------------- */
showPlaceholder();

(document.getElementById("typst") as HTMLScriptElement).addEventListener(
  "load",
  async () => {
    if (typeof ($typst as any).ready === "object") {
      await ($typst as any).ready;
    }
  },
);

/* -------------------------------------------------- */
/*  Theme Management                                  */
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
/*  PDF Export                                        */
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

/* -------------------------------------------------- */
/*  Manual Save Function                             */
/* -------------------------------------------------- */
async function manualSave() {
  const projectId = (window as any).__currentProjectId;
  const typPath = (window as any).__currentTypPath;
  const content = view.state.doc.toString();

  if (!projectId || !typPath) {
    alert("No project to save");
    return;
  }

  if (!content.trim()) {
    alert("No content to save");
    return;
  }

  try {
    updateSaveStatus('saving');
    const { saveProjectFile } = await import('../lib/projectService');
    await saveProjectFile(projectId, typPath, content);
    updateSaveStatus('saved');
    alert("Saved!");
  } catch (error) {
    console.error('Manual save failed:', error);
    updateSaveStatus('error');
    alert("Save failed: " + (error as any).message);
  }
}

/* -------------------------------------------------- */
/*  Logout and Setup Functions                       */
/* -------------------------------------------------- */
async function setupLogoutFunctionality() {
  try {
    // Load user info
    const { getCurrentUser } = await import("../auth/auth");
    const user = await getCurrentUser();
    
    // Display user email in toolbar
    const userEmailElement = document.getElementById("user-email") as HTMLElement;
    if (user && userEmailElement) {
      const emailName = user.email?.split('@')[0] || 'User';
      userEmailElement.textContent = emailName;
    }

    // Setup logout button
    const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        // Confirm logout
        if (confirm("Are you sure you want to sign out?")) {
          try {
            const { signOut } = await import("../auth/auth");
            await signOut();
            // The onSession listener in index.html will handle the redirect
          } catch (error) {
            console.error("Logout failed:", error);
            alert("Failed to sign out. Please try again.");
          }
        }
      });
    }

    // Setup manual save button (enhanced)
    const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.addEventListener("click", manualSave);
    }
  } catch (error) {
    console.error("Failed to setup logout functionality:", error);
  }
}

// Call this function after your editor is initialized
setupLogoutFunctionality();

// Function to compile using Typst directly
async function directCompile(content: string) {
  const preview = document.getElementById('preview');
  if (!preview) return;
  
  try {
    console.log('🎨 Direct compilation starting...');
    preview.innerHTML = '<div class="placeholder">⌛ Compiling your document...</div>';
    
    const svg = await $typst.svg({ mainContent: content });
    console.log('✅ Compilation successful');
    
    // Display the result
    preview.innerHTML = `
      <div class="pages-container">
        <div class="page-wrapper">
          <div class="svg-page">
            ${svg}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('❌ Compilation failed:', error);
    preview.innerHTML = `<pre style="color:red; padding: 1rem;">${error}</pre>`;
  }
}

// Check if we can compile
async function compileWhenReady() {
  const content = view.state.doc.toString();  
  if (!content || content.trim().length === 0) {
    console.log('📭 No content to compile');
    return;
  }
  
  const preview = document.getElementById('preview');
  if (!preview) {
    console.log('❌ Preview element not found');
    return;
  }
  
  // Check if preview already has substantial content (more than placeholder)
  if (preview.innerHTML.length > 200 && !preview.innerHTML.includes('Start typing')) {
    console.log('✅ Preview already has content');
    return;
  }
  
  // Check if $typst is ready
  if (typeof $typst !== 'undefined' && $typst && typeof $typst.svg === 'function') {
    console.log('✅ Typst is ready, compiling directly...');
    await directCompile(content);
  } else {
    console.log('❌ Typst not ready');
  }
}

// Start compilation
compileWhenReady();