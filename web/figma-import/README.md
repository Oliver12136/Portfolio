# Figma Import Guide (3 Project Pages)

## Generated pages
- `figma-import/project-minimoves.html`
- `figma-import/project-sustainable.html`
- `figma-import/project-summerschool.html`

## Start a local server
Run from repo root:

```bash
python3 -m http.server 4173
```

Then these URLs are available:
- `http://localhost:4173/figma-import/project-minimoves.html`
- `http://localhost:4173/figma-import/project-sustainable.html`
- `http://localhost:4173/figma-import/project-summerschool.html`

## Import into Figma
Use your Figma MCP / HTML-to-Figma import flow and import each URL as one page/frame.

## Notes
- These pages use your current homepage typography/grid system (`responsive.shared.css`).
- Local image paths are rewritten for the `figma-import` folder, so assets resolve correctly.
- If you update project content in `index.html`, regenerate with:

```bash
node figma-import/export-project-pages.mjs
```
