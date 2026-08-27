/*
 * Loads plate-map's runtime dependencies and its own src/js/*.js files into the
 * jsdom global scope, mirroring how a consuming app loads them via plain <script>
 * tags (see README "Include dependencies" + how ebase's Rails-importmap vendoring
 * works): jQuery/jQuery UI/select2/SVG.js/ClipboardJS become real globals, and
 * plate-map's own files share state through the top-level `var plateMapWidget`
 * pattern exactly as they do in the browser.
 *
 * IMPORTANT: src/js/*.js are plain (non-module) scripts, not CommonJS modules.
 * require()-ing them would wrap each in its own function scope and break the
 * `var plateMapWidget = plateMapWidget || {}` global-sharing convention every file
 * relies on. We instead read their source and execute it with vm.runInThisContext,
 * which runs code against the current global object -- inside Jest's jsdom test
 * environment, that IS the jsdom `window`, so top-level `var`/function declarations
 * land on `window` exactly as a <script> tag would produce.
 */
const fs = require('fs');
const path = require('path');

// jquery-ui-dist (and, historically, select2/svgjs) assume jQuery is already a
// bare global -- exactly as it would be after a real <script src="jquery.js">
// tag -- rather than only a CommonJS export, so publish it explicitly first.
global.jQuery = global.$ = require('jquery');
require('jquery-ui-dist/jquery-ui.js');
// select2's CommonJS branch exports a factory, not the attached plugin --
// invoking it is what actually registers $.fn.select2 (see its own header
// comment: "require('jQuery') returns a factory ... we normalize ...").
require('select2')(global.window, global.jQuery);
global.SVG = require('svgjs');
global.ClipboardJS = require('clipboard');

const srcDir = path.join(__dirname, '..', '..', 'src', 'js');
const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.js')).sort();

for (const file of files) {
  const filePath = path.join(srcDir, file);
  const code = fs.readFileSync(filePath, 'utf8');
  // Loaded via property-access ("indirect") eval, which per spec always runs in
  // global scope -- required so each file's top-level `var plateMapWidget = ...`
  // becomes a real global.window property shared across files, exactly as it
  // would if these were concatenated <script> tags in a browser.
  // eslint-disable-next-line no-eval
  global.eval(code);
}
