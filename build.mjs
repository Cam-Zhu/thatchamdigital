import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from 'node:fs';

const SRC_HTML = './src/index.html';
const CSS = './dist/style.css';
const STATIC = './src/static';
const OUT = './public';

const html = readFileSync(SRC_HTML, 'utf8');
const css = readFileSync(CSS, 'utf8');

// Find the local stylesheet <link>, whatever path it points at.
// Remote sheets (Google Fonts) are left alone.
const links = html.match(/<link\b[^>]*>/gi) || [];
const target = links.find((tag) => {
  if (!/rel\s*=\s*["']stylesheet["']/i.test(tag)) return false;
  const href = tag.match(/href\s*=\s*["']([^"']+)["']/i);
  return href && !/^(https?:)?\/\//i.test(href[1]);
});

if (!target) {
  console.error(`No local stylesheet <link> found in ${SRC_HTML}.`);
  console.error('Add this inside <head>:');
  console.error('  <link rel="stylesheet" href="../dist/style.css">');
  console.error(`\n<link> tags found (${links.length}):`);
  links.forEach((t) => console.error(`  ${t}`));
  process.exit(1);
}

const out = html.replace(target, `<style>${css}</style>`);

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/index.html`, out);
console.log(`Inlined ${(css.length / 1024).toFixed(1)} KB of CSS, replacing: ${target}`);
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
