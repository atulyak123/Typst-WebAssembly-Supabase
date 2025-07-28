"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { typstSyntax } from "../hooks/typystSyntax";
import { useTypst } from "@/hooks/useTypyst";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { lineNumbers, EditorView, keymap } from "@codemirror/view";
import {
  history,
  historyKeymap,
  undo,
  redo,
  indentWithTab,
} from "@codemirror/commands";
import { defaultKeymap } from "@codemirror/commands";

import {
  saveProjectFile,
  loadProjectFile,
  fetchUserProjects,
} from "@/lib/projectService";
import {
  CheckCircle,
  FileDown,
  Loader2,
  LogOut,
  Moon,
  Save,
  Sun,
} from "lucide-react";

type Theme = "light" | "dark";

interface PageAnalysis {
  pages: number;
  pageHeight: number;
  reason: string;
}

interface EditorProps {
  projectId: string;
  user: User;
  signOut: () => Promise<void>;
  initialDoc?: string;
}

export default function TypstEditor({ projectId, user, signOut }: EditorProps) {
  const { $typst, isReady: isTypstReady, error: typstError } = useTypst();
  const router = useRouter();

  const [documentContent, setDocumentContent] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [typPath, setTypPath] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewContent, setPreviewContent] = useState(typstError);

  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const compileTimerRef = useRef<number | undefined>(undefined);
  const autoSaveTimerRef = useRef<number | undefined>(undefined);
  const hasCompiledOnceRef = useRef(false);

  // Helper function to get user name from email
  const getUserName = () => {
    if (user.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }

    const emailName = user.email?.split("@")[0];
    if (emailName) {
      return emailName
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }

    return "User";
  };

  // Load project data and content
  const loadProjectData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get project metadata
      const projects = await fetchUserProjects();
      const project = projects.find((p) => p.id === projectId);

      if (!project) {
        throw new Error("Project not found");
      }

      setProjectTitle(project.title);
      setTypPath(project.typ_path);

      // Load file content
      const content = await loadProjectFile(project.typ_path);
      setDocumentContent(content);

      // Update editor content
      if (editorViewRef.current) {
        editorViewRef.current.dispatch({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: content,
          },
        });
      }

      setLastSaved(new Date(project.updated_at));
      setHasUnsavedChanges(false);
      debouncedCompile(content);
    } catch (error) {
      console.error("Error loading project:", error);
      alert("Failed to load project. Redirecting to dashboard.");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  // Save function
  const saveDocument = useCallback(async () => {
    if (!documentContent.trim() || !typPath || isSaving) return;

    try {
      setIsSaving(true);
      await saveProjectFile(projectId, typPath, documentContent);

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Visual feedback
      console.log("Document saved successfully");
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [documentContent, typPath, projectId, isSaving]);

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (hasUnsavedChanges && !isSaving && documentContent.trim() && typPath) {
      console.log("Auto-saving document...");
      await saveDocument();
    }
  }, [hasUnsavedChanges, isSaving, documentContent, typPath, saveDocument]);

  // Handle sign out
  const handleSignOut = async () => {
    if (hasUnsavedChanges) {
      const shouldSave = confirm(
        "You have unsaved changes. Do you want to save before signing out?",
      );
      if (shouldSave) {
        await saveDocument();
      }
    }

    if (confirm("Are you sure you want to sign out?")) {
      try {
        await signOut();
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  };

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    if (hasUnsavedChanges) {
      const shouldSave = confirm(
        "You have unsaved changes. Do you want to save before leaving?",
      );
      if (shouldSave) {
        saveDocument().then(() => {
          router.push("/dashboard");
        });
        return;
      }
    }
    router.push("/dashboard");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveDocument();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [saveDocument]);

  // Auto-save every 60 seconds
  useEffect(() => {
    clearTimeout(autoSaveTimerRef.current);

    if (hasUnsavedChanges) {
      autoSaveTimerRef.current = window.setTimeout(autoSave, 60000);
    }

    return () => clearTimeout(autoSaveTimerRef.current);
  }, [hasUnsavedChanges, autoSave]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("typst-theme") as Theme | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  // Load project data on mount
  useEffect(() => {
    if (projectId && projectId !== "new") {
      loadProjectData();
    } else {
      setIsLoading(false);
    }
  }, [projectId, loadProjectData]);

  const analyzePageRequirements = (totalHeight: number): PageAnalysis => {
    const STANDARD_PAGES = [
      { name: "Letter", height: 792 },
      { name: "A4", height: 841.89 },
      { name: "Legal", height: 1008 },
    ];

    for (const page of STANDARD_PAGES) {
      const singlePageTolerance = page.height * 0.2;
      if (totalHeight <= page.height + singlePageTolerance) {
        return {
          pages: 1,
          pageHeight: page.height,
          reason: `Content fits in single ${page.name} page`,
        };
      }
    }

    for (const page of STANDARD_PAGES) {
      const possiblePages = Math.ceil(totalHeight / page.height);
      const lastPageHeight = totalHeight - (possiblePages - 1) * page.height;
      const minLastPageHeight = page.height * 0.3;

      if (lastPageHeight >= minLastPageHeight) {
        return {
          pages: possiblePages,
          pageHeight: page.height,
          reason: `${possiblePages} ${page.name} pages`,
        };
      }
    }

    const adaptiveHeight = totalHeight / 2;
    return {
      pages: 2,
      pageHeight: adaptiveHeight,
      reason: `Adaptive sizing`,
    };
  };

  const createMultiplePages = (
    svgElement: SVGElement,
    x: number,
    y: number,
    width: number,
    totalHeight: number,
    pageHeight: number,
  ): string => {
    const numPages = Math.ceil(totalHeight / pageHeight);
    let html = "";

    for (let i = 0; i < numPages; i++) {
      const startY = i * pageHeight;
      const endY = Math.min(startY + pageHeight, totalHeight);
      const currentPageHeight = endY - startY;

      html += `
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
          <div class="page-info">
            Page ${i + 1} of ${numPages}
          </div>
        </div>`;
    }

    return `<div class="pages-container">${html}</div>`;
  };

  const compileAndRender = useCallback(
    async (src: string) => {
      if (!isTypstReady || !$typst || isCompiling) return;

      setIsCompiling(true);
      setPreviewContent(
        '<div class="placeholder"><div>⌛ Compiling...</div></div>',
      );

      try {
        console.time("⏱ Typst Compile");
        const svg = await $typst.svg({ mainContent: src });
        console.timeEnd("⏱ Typst Compile");

        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, "image/svg+xml");
        const svgElement = doc.querySelector("svg");

        if (!svgElement) {
          setPreviewContent(
            `<div class="pages-container"><div class="page-wrapper"><div class="svg-page">${svg}</div></div></div>`,
          );
          return;
        }

        const viewBox = svgElement.getAttribute("viewBox");
        if (!viewBox) {
          setPreviewContent(
            `<div class="pages-container"><div class="page-wrapper"><div class="svg-page">${svg}</div></div></div>`,
          );
          return;
        }

        const [x, y, svgWidth, svgHeight] = viewBox.split(" ").map(Number);
        const pageAnalysis = analyzePageRequirements(svgHeight);

        if (pageAnalysis.pages > 1) {
          const multiPageHtml = createMultiplePages(
            svgElement,
            x,
            y,
            svgWidth,
            svgHeight,
            pageAnalysis.pageHeight,
          );
          setPreviewContent(multiPageHtml);
        } else {
          setPreviewContent(`
          <div class="pages-container">
            <div class="page-wrapper">
              <div class="svg-page">
                ${svg}
              </div>
            </div>
          </div>
        `);
        }
      } catch (err) {
        setPreviewContent(
          `<div class="placeholder"><div style="color: #ef4444;">❌ ${err}</div></div>`,
        );
        console.error(err);
      } finally {
        setIsCompiling(false);
      }
    },
    [isTypstReady, $typst, isCompiling],
  );

  const debouncedCompile = useCallback(
    (text: string) => {
      clearTimeout(compileTimerRef.current);

      compileTimerRef.current = window.setTimeout(() => {
        const clean = text.trim();

        // If there's no content, show placeholder
        if (!clean.length) {
          setPreviewContent(
            '<div class="placeholder"><div>Start typing to see your document</div></div>',
          );
          return;
        }

        // Always compile if there's content (removed the 10-character limitation)
        hasCompiledOnceRef.current = true;
        compileAndRender(clean);
      }, 300);
    },
    [compileAndRender],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorViewRef.current) {
        editorViewRef.current.focus();
      }
    }, 100); // slight delay

    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (isTypstReady && documentContent && !isLoading) {
      debouncedCompile(documentContent);
    }
  }, [isTypstReady, documentContent, isLoading, debouncedCompile]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      console.log(
        "Key pressed:",
        e.key,
        "Ctrl?",
        e.ctrlKey,
        "Meta?",
        e.metaKey,
      );
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const newDoc = update.state.doc.toString();
      setDocumentContent(newDoc);
      setHasUnsavedChanges(true);
      debouncedCompile(newDoc);
    }
  });
  useEffect(() => {
    if (!editorRef.current || isLoading) return;

    const state = EditorState.create({
      doc: documentContent,
      extensions: [
        lineNumbers(),
        keymap.of([
          ...historyKeymap,
          ...defaultKeymap,
          indentWithTab,
          {
            key: "Mod-z",
            run: undo,
          },
          {
            key: "Mod-Shift-z",
            run: redo,
          },
        ]),
        history(),

        ...typstSyntax(),
        updateListener,
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": {
            fontFamily: "Fira Code, Monaco, Consolas, monospace",
            padding: "1rem",
          },
          ".cm-content": { padding: "0", caretColor: "#4f46e5" },
          ".cm-focused": { outline: "none" },
          "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
            backgroundColor: "#3b82f6 !important",
          },
          "&.cm-focused .cm-content ::selection": {
            backgroundColor: "#3b82f6",
          },
          ".cm-content ::selection": {
            backgroundColor: "#93c5fd",
          },
          "&[data-theme='dark'] .cm-selectionBackground": {
            backgroundColor: "#1d4ed8 !important",
          },
          "&[data-theme='dark'] .cm-content ::selection": {
            backgroundColor: "#1d4ed8",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    editorViewRef.current = view;
    console.log(
      "Extensions loaded:",
      view.state.facet(EditorState.allowMultipleSelections),
    );

    console.log("EditorView initialized", view);
    return () => view.destroy();
  }, [debouncedCompile, isLoading]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("typst-theme", newTheme);
  };

  const exportPDF = async () => {
    if (!isTypstReady || !$typst) {
      alert("Typst is not ready yet. Please wait a moment.");
      return;
    }

    try {
      const source = editorViewRef.current?.state.doc.toString() || "";
      const data = await $typst.pdf({ mainContent: source });
      const blob = new Blob([data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Use project title or extract name from content
      let filename = projectTitle || "typst-output";
      const match = source.match(/#let\s+name\s*=\s*"(.+?)"/);
      if (match) {
        filename = match[1].split(" ")[0];
      }

      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export PDF. Please try again.");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
        }}
      >
        Loading your document...
      </div>
    );
  }

  return (
    <>
      <div id="toolbar">
        <div className="toolbar-left">
          <button
            onClick={handleBackToDashboard}
            title="Back to Dashboard"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginRight: "1rem",
              fontSize: "1.2rem",
            }}
          >
            ←
          </button>
          <span className="app-title">📄 Typst Editor</span>
          {projectTitle && (
            <span className="project-title">{projectTitle}</span>
          )}
          {hasUnsavedChanges && (
            <span
              style={{
                color: "#ef4444",
                fontSize: "0.8rem",
                marginLeft: "0.5rem",
                fontWeight: "500",
              }}
            >
              ● Unsaved
            </span>
          )}
        </div>

        <div className="toolbar-center">
          {lastSaved && !hasUnsavedChanges && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "#16a34a",
                fontStyle: "italic",
              }}
            >
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isSaving && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "#3b82f6",
                fontStyle: "italic",
              }}
            >
              Saving...
            </span>
          )}
        </div>

        <div className="toolbar-right">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginRight: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#64748b",
                }}
              >
                {getUserName()}
              </span>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                }}
              >
                {getUserName().charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveDocument}
            disabled={isSaving || !hasUnsavedChanges || !documentContent.trim()}
            title="Save Document (Ctrl+S)"
            style={{
              marginRight: "0.5rem",
              opacity: isSaving || (!hasUnsavedChanges && lastSaved) ? 0.5 : 1,
              cursor:
                isSaving || (!hasUnsavedChanges && lastSaved)
                  ? "not-allowed"
                  : "pointer",
              background: "none",
              border: "none",
              color: hasUnsavedChanges ? "#ef4444" : "#16a34a",
            }}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : hasUnsavedChanges ? (
              <Save size={18} />
            ) : (
              <CheckCircle size={18} />
            )}
          </button>

          <button onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={exportPDF}
            disabled={!isTypstReady || isCompiling}
            title="Export PDF"
          >
            <FileDown size={18} />
          </button>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
              color: "#ef4444",
            }}
          >
            <LogOut />
          </button>
        </div>
      </div>

      <div id="app">
        <div id="editor">
          <div
            ref={editorRef}
            style={{
              height: "100%",
              fontFamily: "Fira Code, Monaco, Consolas, monospace",
            }}
          />
        </div>
        <div id="preview" className="rounded-none">
          {!isTypstReady ? (
            <div className="placeholder">
              <div>Loading Typst compiler...</div>
            </div>
          ) : (
            <div
              dangerouslySetInnerHTML={{
                __html:
                  previewContent ||
                  '<div class="placeholder"><div>Start typing to see your document</div></div>',
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
