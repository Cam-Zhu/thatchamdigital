import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from 'node:fs';

const SRC_HTML = './src/index.html';
const CSS = './dist/style.css';
const STATIC = './src/static';
const OUT = './public';

const OPEN = '<!--build:css-->';
const CLOSE = '<!--/build:css-->';

const html = readFileSync(SRC_HTML, 'utf8');
const css = readFileSync(CSS, 'utf8');
const block = `${OPEN}<style>${css}</style>${CLOSE}`;

let out;

// 1. A previous build's marker block — replace it. This makes the script
//    idempotent, so a built file fed back in as source still works.
const markerRe = new RegExp(`${OPEN}[\\s\\S]*?${CLOSE}`);

// 2. A local stylesheet <link>, whatever path it points at.
//    Remote sheets (Google Fonts) are left alone.
const links = html.match(/<link\b[^>]*>/gi) || [];
const link = links.find((tag) => {
  if (!/rel\s*=\s*["']stylesheet["']/i.test(tag)) return false;
  const href = tag.match(/href\s*=\s*["']([^"']+)["']/i);
  return href && !/^(https?:)?\/\//i.test(href[1]);
});

// 3. A bare <style> block, i.e. an older build with no markers.
const bareStyleRe = /<style\b[^>]*>[\s\S]*?<\/style>/i;

if (markerRe.test(html)) {
  out = html.replace(markerRe, block);
  console.log('Refreshed the existing CSS block.');
} else if (link) {
  out = html.replace(link, block);
  console.log(`Inlined CSS, replacing: ${link}`);
} else if (bareStyleRe.test(html)) {
  out = html.replace(bareStyleRe, block);
  console.log('Replaced an unmarked <style> block (source looks like a built file).');
} else {
  console.error(`Nothing to replace in ${SRC_HTML}.`);
  console.error('Add this inside <head>:');
  console.error(`  <link rel="stylesheet" href="../dist/style.css">`);
  console.error(`\n<link> tags found (${links.length}):`);
  links.forEach((t) => console.error(`  ${t}`));
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/index.html`, out);
console.log(`Wrote ${OUT}/index.html (${(out.length / 1024).toFixed(1)} KB, ${(css.length / 1024).toFixed(1)} KB CSS)`);

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
