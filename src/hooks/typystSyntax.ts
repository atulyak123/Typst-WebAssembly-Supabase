/* eslint-disable @typescript-eslint/no-explicit-any */

import { StreamLanguage } from "@codemirror/language";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

// --- BASIC TYPST TOKENIZER ---
const typstTokenizer = {
  startState: () => ({}),
  token: (stream: any) => {
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }
    if (
      stream.match("#let") ||
      stream.match("#show") ||
      stream.match("#set") ||
      stream.match("#import")
    ) {
      return "keyword";
    }
    if (stream.match(/^=+ /)) {
      return "heading";
    }
    if (stream.match(/"[^"]*"/)) {
      return "string";
    }
    stream.next();
    return null;
  },
};

// --- HIGHLIGHT STYLES ---
const typstHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: "#e11d48", fontWeight: "bold" },
  { tag: tags.strong, color: "#1f2937", fontWeight: "bold" },
  { tag: tags.emphasis, color: "#1f2937", fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.keyword, color: "#7c3aed" },
  { tag: tags.atom, color: "#059669" },
  { tag: tags.bool, color: "#dc2626" },
  { tag: tags.url, color: "#2563eb", textDecoration: "underline" },
  { tag: tags.labelName, color: "#7c2d12" },
  { tag: tags.inserted, color: "#059669" },
  { tag: tags.deleted, color: "#dc2626" },
  { tag: tags.literal, color: "#0891b2" },
  { tag: tags.string, color: "#059669" },
  { tag: tags.number, color: "#dc2626" },
  {
    tag: [tags.regexp, tags.escape, tags.special(tags.string)],
    color: "#e11d48",
  },
  { tag: tags.definition(tags.variableName), color: "#0369a1" },
  { tag: tags.local(tags.variableName), color: "#065f46" },
  { tag: [tags.typeName, tags.namespace], color: "#7c3aed" },
  { tag: tags.className, color: "#7c3aed" },
  { tag: [tags.special(tags.variableName), tags.macroName], color: "#be185d" },
  { tag: tags.definition(tags.propertyName), color: "#0369a1" },
  { tag: tags.comment, color: "#6b7280", fontStyle: "italic" },
  { tag: tags.meta, color: "#6b7280" },
  { tag: tags.invalid, color: "#dc2626" },
]);

// --- EXPORT EXTENSIONS ---
export function createTypstSyntax(): Extension[] {
  return [
    StreamLanguage.define(typstTokenizer),
    syntaxHighlighting(typstHighlightStyle),
  ];
}

export const typstSyntax = createTypstSyntax;
