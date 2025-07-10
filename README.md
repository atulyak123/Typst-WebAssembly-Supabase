# Typst Playground

A lightweight Typst playground in the browser — powered by Vite, CodeMirror, and WASM.

## ✨ Features

- 🔐 **Login via Magic Link using Supabase**
- 👤 **Authentication-protected Dashboard**
- ✍️ **Live Typst Editor** with instant SVG rendering
- 🧭 **React Router** based multi-page navigation (Login, Dashboard, Editor)
- 💨 Vite-powered fast dev server
- 🌓 Light/dark responsive 2-pane layout
- ⚡ Powered by WASM (`@myriaddreamin/typst-all-in-one.ts`)



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
### Create .env File

Add your Supabase credentials:
```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```
 
 ### Project Structure
 ```bash
Typst-WebAssembly-Supabase/
├── public/                      # Static assets (favicon, etc.)
├── src/
│   ├── auth/
│   │   ├── auth.ts              # Auth context logic
│   │   └── login.ts             # Magic link login UI logic
│   ├── dashboard/
│   │   └── dashboard.ts         # Protected dashboard page
│   ├── editor/
│   │   └── editor.ts            # Typst editor logic (WIP or live)
│   ├── lib/
│   │   ├── supabaseClient.ts    # Supabase client configuration
│   │   └── projectService.ts    # Utilities or API-related logic
│   ├── main.ts                  # Entry point (mounts app)
│   ├── style.css                # Tailwind/global styles
│   ├── typst.lang.ts            # Typst language configuration
│   ├── global.d.ts              # Global type declarations
│   └── vite-env.d.ts            # Vite-specific typings
├── .env                         # Supabase environment variables
├── .gitignore
├── index.html                   # HTML entrypoint
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.js
└── README.md

```



### ⚙️ Built With

 - Vite
 - CodeMirror 6
 - @myriaddreamin/typst-all-in-one.ts
 - TypeScript
 - Supabase


### Tip

The Typst WebAssembly bundle loads from the JSDelivr CDN. No extra setup is needed.
