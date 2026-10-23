# Mosaic Notes PWA

Mosaic is an offline-first visual notes application. It helps users remember ideas through mood, colour, tags, pinning, search, and grid/timeline views.

## Features

- Create, edit, pin, search, filter, and delete notes
- Mood and colour cues for visual recall
- Responsive desktop and mobile layouts
- Grid and timeline views
- Automatic browser storage using `localStorage`
- Installable PWA manifest, icons, and service worker
- No account or backend required

## Technology

- React 19
- TypeScript
- Vinext / Next-compatible app structure
- Tailwind CSS 4
- Shadcn UI primitives
- Lucide icons

## Run locally

Requirements: Node.js 22.13 or later.

```bash
npm ci
npm run dev
```

Open the local address displayed in the terminal (normally `http://localhost:5173`).

The commands work in Windows PowerShell, Command Prompt, Git Bash, macOS, and Linux.

## Production build

```bash
npm run build
npm run start
```

## Main files

- `app/page.tsx` — notes interface and application logic
- `app/globals.css` — responsive visual system
- `app/layout.tsx` — metadata and PWA configuration
- `public/manifest.webmanifest` — install settings
- `public/sw.js` — offline caching service worker

## Data storage

Notes are stored only in the current browser and device. Clearing browser data removes them. Cloud synchronization is intentionally outside this first version.
