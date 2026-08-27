# AGENTS.md

Guidance for any AI agent working in this repository. This file is meant to
stay evergreen — update it as the codebase changes. For the narrative of the
in-progress refactor (issue #119) — what's been decided, what's been built,
every bug found so far, and a self-critique of the test suite — see
[`REFACTOR_NOTES.md`](./REFACTOR_NOTES.md). Read that file first if you're
picking up refactor work; this file is the lasting reference, that one is
the handoff log.

## What this package is

`plate-map` (npm/GitHub: `nebiolabs/plate-map`) is a jQuery UI widget
(`DNA.plateMap`) for visualizing and editing scientific assay plate layouts
(8–1536 wells, commonly 96). It's built with the jQuery widget factory,
rendered as SVG via SVG.js v2, using select2 for dropdowns and jQuery UI for
the widget base. Built with Gulp + Babel into `dist/` for npm consumption.

**It is already embedded in production apps** (confirmed: `ebase`, a Rails
app that vendors a manually-copied pre-built single-file bundle via Rails 7
importmap — see `REFACTOR_NOTES.md` §3 for the full investigation). **The
public interface must never change** without an explicit, deliberate
decision — treat this as a hard constraint, not a guideline.

## Architecture: read this before touching `src/js/`

This is **not** 18 independent modules — it's one shared mutable object
assembled at runtime. Every file in `src/js/` does:
```js
var plateMapWidget = plateMapWidget || {};
plateMapWidget.someName = function(THIS) { return { /* methods, state */ }; };
```
and `plate-map.js`'s `_create()` does
`for (component in plateMapWidget) { $.extend(this, new plateMapWidget[component](this)); }`,
flattening every method and every piece of state from every file onto one
widget instance, in load order determined by alphabetical glob order
(`gulpfile.js`). There is no encapsulation between files — `check-box.js`
freely reads `this.fieldList` (built by `add-tab-data.js`), `this._colorMixer`
(built by `add-data-on-change.js`), etc., with no interface boundary. This is
*the* thing worth restructuring if/when the refactor proceeds (see
`REFACTOR_NOTES.md` for status).

Core state lives on the widget instance: `this.engine.derivative` (well data,
keyed by **numeric index**, not address), `this.engine.colorMap`/
`stackUpWithColor` (color-grouping results), `this.selectedIndices`,
`this.fieldList`/`this.fieldMap` (built once from `options.attributes.tabs`),
`this.undoRedoArray`/`this.actionPointer`.

**The public contract** (do not change without explicit sign-off): init
options `numRows`, `numCols`, `readOnly`, `attributes.tabs`,
`attributes.presets`, callbacks `created`/`updateWells`/`selectedWells`;
methods `loadPlate`, `getPlate`, `isReadOnly`, `isDisableAddDeleteWell`,
`setSelectedAddresses`, `getSelectedAddresses`. Everything else callable via
`.plateMap("methodName", ...)` (any non-underscore-prefixed property) is
almost certainly accidental surface, not intended API.

**README.md has one confirmed stale point**: it shows `loadPlate(data)`
wells as `{wellData: {fieldId: value}}`. The real shape (confirmed by
reading and running `add-data-on-change.js`'s `getPlate()` and
`load-plate.js`'s `sanitizeWell()`) is **flat**: `wells.A1 = {fieldId:
value}`. Trust the code over the README on this specific point; the README
checked out as accurate everywhere else it was tested (field-value shapes,
units, multiselect, multiplex).

## Testing

Jest (jsdom) + Playwright (real browser) is the chosen stack. As of this
writing: the Jest layer exists (`test/unit/`, run with
`npx jest --config jest.config.js`), Playwright does not yet.

**If you're adding to `test/unit/`, read `test/unit/setup.js` and
`test/unit/setupAfterEnv.js` first** — the harness has real, non-obvious
requirements:
- `src/js/*.js` files are plain scripts (not modules) that share state via
  top-level `var plateMapWidget = plateMapWidget || {}`. They're loaded via
  `global.eval(code)` (indirect eval, so top-level `var` lands on the true
  global) — `require()`-ing them directly would break the sharing.
- `select2`'s CommonJS export is a **factory function**:
  `require('select2')(window, jQuery)`, not just `require('select2')`.
- **Always clear `document.body` between tests in the same file** (already
  wired globally via `setupFilesAfterEnv`/`setupAfterEnv.js`). Several
  `src/js/` functions query the DOM globally instead of scoping to the
  widget's own container (`document.querySelectorAll('table.plate-setup-
  bottom-table tr')` in `plate-map.js`'s `selectObjectInBottomTab`, for
  one) — without cleanup, one test's leftover widget silently becomes a
  second "instance" for every later test in the file.
- jsdom does not implement `getScreenCTM()`, real layout, or select2's real
  dropdown rendering. **Anything involving mouse drag-select or real
  select2 UI behavior needs Playwright, not Jest** — do not try to fake it
  in jsdom.
- Known landmine (unresolved as of this writing, not yet fixed): calling
  `setSelectedAddresses`/`setSelectedIndices` on a widget before any real
  `loadPlate`/checkbox call has ever run throws a `TypeError` — the
  placeholder bottom-table row seeded at creation has no `<button>` in it.
  Load minimal data with at least one checkbox set first in any test that
  selects wells. See `test/unit/address-math.test.js`'s `loadMinimalData()`
  helper for the pattern.
- Also known (unresolved): `setSelectedAddresses` throws for **any** call
  with 2+ addresses (a real bug — see `REFACTOR_NOTES.md` §6 #1). Use
  `.plateMap('setSelectedIndices', [i, j], true)` directly if a test
  genuinely needs a multi-well selection.

Full list of currently-known, currently-**un**fixed real bugs (all
deliberately characterized as-is, not corrected) is in `REFACTOR_NOTES.md`
§6 — check there before assuming odd behavior you hit is a mistake in your
own test rather than existing, documented behavior.

## Conventions

- **Branch naming**: `<type>/#<issue>-<snake_case_description>`, e.g.
  `bug/#109-well_set_selector`, `feature/#88-product_lot_picker`,
  `refactor/#119-cleanup_and_reorganize`.
- **Commit trailer**: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
  on commits made by Claude Code (per this repo's session conventions).
- Large/structural work happens on its own branch; **never merge to
  `master` without explicit user approval**, even after opening a PR.

## Build / consumption model (know this before changing the build)

Gulp + Babel concatenates/transpiles/minifies `src/js/*.js` + `src/css/*.css`
into `dist/js/plate-map(.min).js` and `dist/css/plate-map(.min).css`. This
build step runs only on a maintainer's machine — **no consumer ever runs
it**. Confirmed (by reading a real consumer, `ebase`) that the built output
is loaded as one self-contained script with **zero unresolved `import`
statements**, reading jQuery/jQuery-UI/select2/SVG.js/ClipboardJS off
`window` as pre-existing globals, exactly as the README's "Include
dependencies" section describes. The public npm registry (stuck at v2.0.6,
several versions behind git) is not actually how real consumers get this
package — see `REFACTOR_NOTES.md` §3 for the full investigation. **Any
build-tool change must preserve**: single-file output at the same `dist/`
paths, zero unresolved imports, jquery/select2/jquery-ui/svg.js/clipboard
externalized (not bundled), and the current Babel browser-support target.
