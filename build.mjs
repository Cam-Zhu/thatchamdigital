import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from 'node:fs';

const SRC_HTML = './src/index.html';
const CSS = './dist/style.css';
const STATIC = './src/static';
const OUT = './public';

const html = readFileSync(SRC_HTML, 'utf8');
const css = readFileSync(CSS, 'utf8');

// Swap the external stylesheet link for the compiled CSS, inlined.
// For a single-page site this removes a render-blocking request entirely.
const out = html.replace(
  '<link rel="stylesheet" href="../dist/style.css">',
  `<style>${css}</style>`
);

if (out === html) {
  console.error(`Stylesheet link not found in ${SRC_HTML} — nothing inlined.`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/index.html`, out);
console.log(`Wrote ${OUT}/index.html (${(out.length / 1024).toFixed(1)} KB)`);

// Copy everything in src/static/ to the site root: images, og-image.png,
// robots.txt, favicon.ico, PDFs, anything the pages link to.
if (existsSync(STATIC)) {
  cpSync(STATIC, OUT, { recursive: true });
  const files = readdirSync(STATIC).filter((f) => !f.startsWith('.'));
  console.log(
    files.length
      ? `Copied ${files.length} static file(s): ${files.join(', ')}`
      : 'No static files to copy.'
  );
}
