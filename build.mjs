import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from 'node:fs';

const SRC = './src';
const CSS = './dist/style.css';
const STATIC = './src/static';
const OUT = './public';

// Plausible analytics. Set to null to disable, or swap the domain for a
// client site. The outbound-links variant also records clicks on external
// links, which is how the booking button gets counted.
const ANALYTICS_DOMAIN = 'thatchamdigital.co.uk';
const ANALYTICS_TAG = ANALYTICS_DOMAIN
  ? `<script defer data-domain="${ANALYTICS_DOMAIN}" src="https://plausible.io/js/script.outbound-links.js"></script>`
  : '';

const OPEN = '<!--build:css-->';
const CLOSE = '<!--/build:css-->';

const css = readFileSync(CSS, 'utf8');
const block = `${OPEN}<style>${css}</style>${CLOSE}`;
const markerRe = new RegExp(`${OPEN}[\\s\\S]*?${CLOSE}`);
const bareStyleRe = /<style\b[^>]*>[\s\S]*?<\/style>/i;

function inline(html, file) {
  // 1. A previous build's marker block — keeps the script idempotent, so a
  //    built file fed back in as source still works.
  if (markerRe.test(html)) return html.replace(markerRe, block);

  // 2. A local stylesheet <link>, whatever path it points at.
  //    Remote sheets (Google Fonts) are left alone.
  const links = html.match(/<link\b[^>]*>/gi) || [];
  const link = links.find((tag) => {
    if (!/rel\s*=\s*["']stylesheet["']/i.test(tag)) return false;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    return href && !/^(https?:)?\/\//i.test(href[1]);
  });
  if (link) return html.replace(link, block);

  // 3. A bare <style> block, i.e. an older build with no markers.
  if (bareStyleRe.test(html)) return html.replace(bareStyleRe, block);

  console.error(`\nNothing to replace in ${SRC}/${file}.`);
  console.error('Add this inside <head>:');
  console.error('  <link rel="stylesheet" href="../dist/style.css">');
  console.error(`\n<link> tags found (${links.length}):`);
  links.forEach((t) => console.error(`  ${t}`));
  process.exit(1);
}

function analytics(html) {
  if (!ANALYTICS_TAG) return html;
  // Strip any tag from a previous build, then insert a fresh one.
  const stripped = html.replace(/\s*<script[^>]*plausible\.io[^>]*><\/script>/gi, '');
  if (!/<\/head>/i.test(stripped)) {
    console.warn('  ! no </head> found — analytics not added');
    return stripped;
  }
  return stripped.replace(/<\/head>/i, `${ANALYTICS_TAG}\n</head>`);
}

const pages = readdirSync(SRC).filter((f) => f.endsWith('.html'));

if (!pages.length) {
  console.error(`No .html files in ${SRC}/.`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

for (const file of pages) {
  const html = readFileSync(`${SRC}/${file}`, 'utf8');
  const out = analytics(inline(html, file));
  writeFileSync(`${OUT}/${file}`, out);
  console.log(`  ${file} → ${OUT}/${file} (${(out.length / 1024).toFixed(1)} KB)`);
}

console.log(`Built ${pages.length} page(s) with ${(css.length / 1024).toFixed(1)} KB of CSS.`);
console.log(ANALYTICS_DOMAIN ? `Analytics: Plausible (${ANALYTICS_DOMAIN}).` : 'Analytics: off.');

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
