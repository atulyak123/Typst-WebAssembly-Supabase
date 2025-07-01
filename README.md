# Typst Playground

A lightweight Typst playground in the browser — powered by Vite, CodeMirror, and WASM.

## ✨ Features

- CodeMirror-based live Typst editor
- Instant SVG rendering from Typst source
- Dark/light mode toggle (with localStorage preference)
- Responsive 2-pane layout with divider
- Vite-powered fast dev server

---

## 🚀 Getting Started

###  Clone or unzip the project

```bash
cd typst-playground
```

### Install dependencies
 ```bash 
 pnpm install
 ```
 
 ### Start the dev server
 ``` bash
 pnpm dev
 ```
 
 ### Project Structure
 ```bash
 typst-playground/
├── index.html             # Main HTML entry
├── src/
│   ├── main.ts            # CodeMirror + Typst logic
│   └── style.css          # Layout and dark/light styles
├── vite.config.ts         # Vite config
├── package.json
└── README.md
```
### ⚙️ Built With

 - Vite
 - CodeMirror 6
 - @myriaddreamin/typst-all-in-one.ts
 - TypeScript

 ### Theme Toggle

Click the 🌙 or ☀ icon in the top right to toggle theme. Preference is saved locally.

### Tip

The Typst WebAssembly bundle loads from the JSDelivr CDN. No extra setup is needed.