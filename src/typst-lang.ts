
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { StreamLanguage } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/* -------------------------------------------------- */
/*  Typst Language Definition                         */
/* -------------------------------------------------- */
export const typstLanguage = StreamLanguage.define({
  name: "typst",
  startState: () => ({
    inMath: false,
    inComment: false,
    inString: false,
    inRawString: false,
    depth: 0,
  }),
  
  token(stream, state) {
    // Skip whitespace
    if (stream.eatSpace()) return null;
    
    // Line comments
    if (stream.match('//')) {
      stream.skipToEnd();
      return "lineComment";
    }
    
    // Block comments
    if (stream.match('/*')) {
      state.inComment = true;
      return "blockComment";
    }
    
    if (state.inComment) {
      if (stream.match('*/')) {
        state.inComment = false;
      } else {
        stream.next();
      }
      return "blockComment";
    }
    
    // Regular strings - IMPROVED detection
    if (stream.match('"')) {
      while (stream.peek() && !stream.match('"', false)) {
        if (stream.match('\\"')) {
          // Skip escaped quotes
          continue;
        }
        stream.next();
      }
      if (stream.match('"')) {
        // Closing quote
      }
      return "string";
    }
    
    // Raw strings with backticks
    if (stream.match('`')) {
      while (stream.peek() && !stream.match('`', false)) {
        stream.next();
      }
      if (stream.match('`')) {
        // Closing backtick
      }
      return "string";
    }
    
    // Math mode
    if (stream.match('$')) {
      state.inMath = !state.inMath;
      return "keyword";
    }
    
    if (state.inMath) {
      if (stream.match(/[a-zA-Z_][a-zA-Z0-9_]*/)) {
        return "variableName";
      }
      if (stream.match(/\d+(\.\d+)?/)) {
        return "number";
      }
      stream.next();
      return "operator";
    }
    
    // Headings
    if (stream.sol() && stream.match(/^=+\s/)) {
      stream.skipToEnd();
      return "heading";
    }
    
    // Hash functions and directives
    if (stream.match('#')) {
      // Keywords after #
      if (stream.match(/\b(import|include|let|set|show|if|else|for|while|break|continue|return)\b/)) {
        return "keyword";
      }
      // Function names after #
      if (stream.match(/[a-zA-Z_][a-zA-Z0-9_-]*/)) {
        return "function";
      }
      return "operator";
    }
    
    // Built-in keywords (without #)
    if (stream.match(/\b(let|set|show|import|include|if|else|for|while|break|continue|return|in|not|and|or|true|false|none|auto|with)\b/)) {
      return "keyword";
    }
    
    // Numbers with optional units
    if (stream.match(/\d+(\.\d+)?(pt|px|em|%|deg|rad|mm|cm|in|fr)?\b/)) {
      return "number";
    }
    
    // Content blocks []
    if (stream.match(/[\[\]]/)) {
      return "bracket";
    }
    
    // Code blocks {}
    if (stream.match(/[{}]/)) {
      return "brace";
    }
    
    // Function calls and parentheses
    if (stream.match(/[()]/)) {
      return "paren";
    }
    
    // Named parameters (key:)
    if (stream.match(/[a-zA-Z_][a-zA-Z0-9_-]*:/)) {
      return "propertyName";
    }
    
    // Variables and identifiers
    if (stream.match(/[a-zA-Z_][a-zA-Z0-9_-]*/)) {
      return "variableName";
    }
    
    // Operators
    if (stream.match(/[+\-*\/=<>!&|:;,\.]/)) {
      return "operator";
    }
    
    // Default
    stream.next();
    return null;
  }
});

/* -------------------------------------------------- */
/*  Official Typst Colors (Light Mode Only)           */
/* -------------------------------------------------- */
export const typstHighlightStyle = HighlightStyle.define([
  // Comments - grey
  { tag: t.lineComment, color: "#6a737d", fontStyle: "italic" },
  { tag: t.blockComment, color: "#6a737d", fontStyle: "italic" },
  
  // Keywords - RED like #import, #let, #show
  { tag: t.keyword, color: "#d73a49", fontWeight: "bold" },
  
  // Functions - PURPLE/BLUE
  { tag: t.function(t.variableName), color: "#6f42c1" },
  { tag: t.function(t.definition(t.variableName)), color: "#6f42c1" },
  
  // Strings - GREEN
  { tag: t.string, color: "#22863a" },
  
  // Numbers - BLUE
  { tag: t.number, color: "#005cc5" },
  
  // Headers - PURPLE
  { tag: t.heading, color: "#6f42c1", fontWeight: "bold" },
  
  // Variables - DARK
  { tag: t.variableName, color: "#24292e" },
  
  // Property names - BLUE
  { tag: t.propertyName, color: "#005cc5" },
  
  // Operators - RED
  { tag: t.operator, color: "#d73a49" },
  
  // Brackets - DARK
  { tag: t.bracket, color: "#24292e" },
  { tag: t.brace, color: "#24292e" },
  { tag: t.paren, color: "#24292e" },
]);

/* -------------------------------------------------- */
/*  Export syntax highlighting (Simple)               */
/* -------------------------------------------------- */
export const typstSyntax = () => [
  typstLanguage,
  syntaxHighlighting(typstHighlightStyle)
];