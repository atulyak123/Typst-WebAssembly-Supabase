"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { typstSyntax } from '../hooks/typystSyntax';
import { useTypst } from '@/hooks/useTypyst';

type Theme = 'light' | 'dark';

interface PageAnalysis {
  pages: number;
  pageHeight: number;
  reason: string;
}

interface EditorProps {
  projectId: string;
  initialDoc?: string;
}

export default function TypstEditor({ projectId }: EditorProps) {
  const { $typst, isReady: isTypstReady, error: typstError } = useTypst();

  const [documentContent, setDocumentContent] = useState('');
  const [theme, setTheme] = useState<Theme>('light');
  const [isCompiling, setIsCompiling] = useState(false);
  const [previewContent, setPreviewContent] = useState(
    typstError 
  );

  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const compileTimerRef = useRef<number | undefined>(undefined);
  const hasCompiledOnceRef = useRef(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('typst-theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

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
          reason: `Content fits in single ${page.name} page`
        };
      }
    }

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

    const adaptiveHeight = totalHeight / 2;
    return {
      pages: 2,
      pageHeight: adaptiveHeight,
      reason: `Adaptive sizing`
    };
  };

  const createMultiplePages = (
    svgElement: SVGElement,
    x: number,
    y: number,
    width: number,
    totalHeight: number,
    pageHeight: number
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

  const compileAndRender = useCallback(async (src: string) => {
    if (!isTypstReady || !$typst || isCompiling) return;

    setIsCompiling(true);
    setPreviewContent('<div class="placeholder"><div>⌛ Compiling...</div></div>');

    try {
      console.time('⏱ Typst Compile');
      const svg = await $typst.svg({ mainContent: src });
      console.timeEnd('⏱ Typst Compile');

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');

      if (!svgElement) {
        setPreviewContent(`<div class="pages-container"><div class="page-wrapper"><div class="svg-page">${svg}</div></div></div>`);
        return;
      }

      const viewBox = svgElement.getAttribute('viewBox');
      if (!viewBox) {
        setPreviewContent(`<div class="pages-container"><div class="page-wrapper"><div class="svg-page">${svg}</div></div></div>`);
        return;
      }

      const [x, y, svgWidth, svgHeight] = viewBox.split(' ').map(Number);
      const pageAnalysis = analyzePageRequirements(svgHeight);

      if (pageAnalysis.pages > 1) {
        const multiPageHtml = createMultiplePages(svgElement, x, y, svgWidth, svgHeight, pageAnalysis.pageHeight);
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
      setPreviewContent(`<div class="placeholder"><div style="color: #ef4444;">❌ ${err}</div></div>`);
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  }, [isTypstReady, $typst, isCompiling]);

  const debouncedCompile = useCallback((text: string) => {
    clearTimeout(compileTimerRef.current);

    compileTimerRef.current = window.setTimeout(() => {
      const clean = text.trim();

      if (clean.length < 10 && !hasCompiledOnceRef.current) {
        setPreviewContent('<div class="placeholder"><div>Start typing to see your document</div></div>');
        return;
      }

      hasCompiledOnceRef.current = true;

      if (clean.length) {
        compileAndRender(clean);
      } else {
        setPreviewContent('<div class="placeholder"><div>Start typing to see your document</div></div>');
      }
    }, 300);
  }, [compileAndRender]);

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newDoc = update.state.doc.toString();
        setDocumentContent(newDoc);
        debouncedCompile(newDoc);
      }
    });

    const state = EditorState.create({
      doc: documentContent,
      extensions: [
        basicSetup,
        ...typstSyntax(),
        updateListener,
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { fontFamily: 'Fira Code, Monaco, Consolas, monospace', padding: '1rem' },
          '.cm-content': { padding: '0', caretColor: '#4f46e5' },
          '.cm-focused': { outline: 'none' }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    editorViewRef.current = view;

    return () => view.destroy();
  }, [debouncedCompile]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('typst-theme', newTheme);
  };

  const exportPDF = async () => {
    if (!isTypstReady || !$typst) {
      alert('Typst is not ready yet. Please wait a moment.');
      return;
    }

    try {
      const source = editorViewRef.current?.state.doc.toString() || '';
      const data = await $typst.pdf({ mainContent: source });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const match = source.match(/#let\s+name\s*=\s*"(.+?)"/);
      const name = match ? match[1].split(' ')[0] : 'typst-output';

      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  useEffect(() => {
    if (!documentContent) {
      const sampleDoc = ``;
      setDocumentContent(sampleDoc);

      if (editorViewRef.current) {
        editorViewRef.current.dispatch({
          changes: { from: 0, to: editorViewRef.current.state.doc.length, insert: sampleDoc }
        });
      }
    }
  }, []);

  return (
    <>
      <div id="toolbar">
        <div className="toolbar-left">
          <span className="app-title">📄 Typst Editor</span>
          {projectId && <span className="project-title">Project: {projectId}</span>}
        </div>
        <div className="toolbar-right">
          <span className="user-email">User</span>
          <button onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <button onClick={exportPDF} disabled={!isTypstReady || isCompiling} title="Export PDF">
            📄
          </button>
        </div>
      </div>

      <div id="app">
        <div id="editor">
          <div ref={editorRef} style={{ height: '100%', fontFamily: 'Fira Code, Monaco, Consolas, monospace' }} />
        </div>
        <div id="preview">
          {!isTypstReady ? (
            <div className="placeholder"><div>Loading Typst compiler...</div></div>
          ) : (
            <div dangerouslySetInnerHTML={{
              __html: previewContent || '<div class="placeholder"><div>Start typing to see your document</div></div>'
            }} />
          )}
        </div>
      </div>
    </>
  );
}
