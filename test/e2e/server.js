/*
 * Minimal static file server for the Playwright e2e layer, deliberately
 * dependency-free (no express/http-server) so this test layer doesn't add
 * new runtime deps to the package.
 *
 * Serves the repo root as-is, so the fixture page can reference real
 * on-disk paths exactly the way a browser would load them from a real
 * <script src="node_modules/...">/<script src="src/js/...">  layout --
 * no copying or bundling.
 *
 * `/` (or `/test/e2e/fixture.html`) is special-cased: instead of serving
 * fixture.html verbatim, its {{JS_TAGS}}/{{CSS_TAGS}} placeholders are
 * filled in from a live directory listing of src/js and src/css, sorted
 * alphabetically -- this mirrors gulpfile.js's `gulp.src(['src/js/*.js'])`
 * glob (a plain glob with no explicit order returns matches in alphabetical
 * order), so the fixture always reflects the CURRENT file set instead of a
 * list that could silently drift out of sync with src/js/ over time.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE_PATH = path.join(__dirname, 'fixture.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

// Same dependency load order as gulpfile.js's PATH.dependencies.js.
const DEPENDENCY_SCRIPTS = [
  'node_modules/jquery/dist/jquery.js',
  'node_modules/jquery-ui-dist/jquery-ui.js',
  'node_modules/select2/dist/js/select2.js',
  'node_modules/svgjs/dist/svg.js',
  'node_modules/clipboard/dist/clipboard.js',
];
const DEPENDENCY_CSS = ['node_modules/select2/dist/css/select2.css'];

function listSorted(dir, ext) {
  return fs
    .readdirSync(path.join(ROOT, dir))
    .filter((f) => f.endsWith(ext))
    .sort()
    .map((f) => `${dir}/${f}`);
}

function renderFixture() {
  const template = fs.readFileSync(FIXTURE_PATH, 'utf8');
  const cssFiles = DEPENDENCY_CSS.concat(listSorted('src/css', '.css'));
  const jsFiles = DEPENDENCY_SCRIPTS.concat(listSorted('src/js', '.js'));
  const cssTags = cssFiles.map((f) => `<link rel="stylesheet" href="/${f}">`).join('\n    ');
  const jsTags = jsFiles.map((f) => `<script src="/${f}"></script>`).join('\n    ');
  return template.replace('{{CSS_TAGS}}', cssTags).replace('{{JS_TAGS}}', jsTags);
}

function safeJoin(root, requestPath) {
  const resolved = path.normalize(path.join(root, requestPath));
  if (!resolved.startsWith(root)) {
    return null; // path traversal attempt
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (urlPath === '/' || urlPath === '/test/e2e/fixture.html') {
    const html = renderFixture();
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(html);
    return;
  }

  const filePath = safeJoin(ROOT, urlPath);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found: ' + urlPath);
    return;
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const port = process.env.PORT || 4173;
server.listen(port, () => {
  console.log(`e2e fixture server listening on http://localhost:${port}`);
});
