//gloabal.d.ts
export {};

declare global {
  interface Window {
    __initialDoc?: string;
    __currentProjectId?: string;
    __currentTypPath?: string;
    __editorView?: any;
  }
}
