import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const sourcePath = resolve(root, 'index.html');
const source = readFileSync(sourcePath, 'utf8');

const projects = [
  { id: 'minimoves', filename: 'project-minimoves.html', label: 'Mini Moves Matter' },
  { id: 'sustainable', filename: 'project-sustainable.html', label: 'Sustainable Waves' },
  { id: 'summerschool', filename: 'project-summerschool.html', label: 'Shanghai Summer School' },
];

function extractArticle(projectId) {
  const re = new RegExp(`<article class="project-inline-page" data-project-page="${projectId}"[\\s\\S]*?<\\/article>`);
  const match = source.match(re);
  if (!match) {
    throw new Error(`Unable to find article for ${projectId}`);
  }
  return match[0]
    .replace(/\shidden\b/g, '')
    .replace(/(src|href)="\.\//g, '$1="../');
}

function buildHtml(title, articleHtml) {
  return `<!DOCTYPE html>
<html lang="en" data-site-mode="figma3042">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - Figma Import</title>
  <link rel="stylesheet" href="../responsive.shared.css" />
  <style>
    html[data-site-mode="figma3042"],
    html[data-site-mode="figma3042"] body {
      overflow: auto !important;
      background: #f2f2f2 !important;
    }

    html[data-site-mode="figma3042"] .project-inline-shell.figma-export-shell {
      position: relative !important;
      inset: auto !important;
      min-height: 100vh;
      overflow: visible !important;
      padding-bottom: 56px !important;
    }

    html[data-site-mode="figma3042"] .project-inline-canvas {
      margin-top: var(--home-hero-offset-y-3042) !important;
    }

    html[data-site-mode="figma3042"] .project-inline-page {
      display: grid !important;
    }

    html[data-site-mode="figma3042"] .project-inline-page[hidden] {
      display: grid !important;
    }
  </style>
</head>
<body>
  <section class="project-inline-shell figma-export-shell" aria-hidden="false">
    <div class="project-inline-canvas">
      <h1 class="hero3042-title project-inline-home-title">gan studio</h1>
      ${articleHtml}
    </div>
  </section>
</body>
</html>
`;
}

for (const project of projects) {
  const article = extractArticle(project.id);
  const html = buildHtml(project.label, article);
  writeFileSync(resolve(root, 'figma-import', project.filename), html, 'utf8');
}

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Figma Import Pages</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 40px; }
    h1 { margin: 0 0 16px; }
    ul { margin: 0; padding-left: 20px; }
    li { margin-bottom: 10px; }
    a { color: #0a58ca; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Figma Import Pages</h1>
  <ul>
    <li><a href="./project-minimoves.html">Mini Moves Matter</a></li>
    <li><a href="./project-sustainable.html">Sustainable Waves</a></li>
    <li><a href="./project-summerschool.html">Shanghai Summer School</a></li>
  </ul>
</body>
</html>
`;
writeFileSync(resolve(root, 'figma-import', 'index.html'), indexHtml, 'utf8');

console.log('Generated figma-import pages:', projects.map((p) => p.filename).join(', '));
