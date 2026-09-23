# Plate-Map Refactor — Session Log & Handoff (Issue #119)

**Read this whole file before doing anything else on this branch.** It is the
full narrative of how this branch got to its current state: the original
request, what was investigated, every decision the user made, what's actually
been built, every real bug found (none fixed), and — importantly — a
self-critique of the test suite's own limits that the user deliberately
pushed for. Do not assume the Jest suite is a sufficient "before" baseline
for the refactor until you've read the "Self-critique" section below.

- Branch: `refactor/#119-cleanup_and_reorganize`. Committed locally as of
  this writing; **not yet pushed to origin** — pending user review (some
  of this was built autonomously while the user was away; confirm they're
  comfortable with everything below before pushing).
- Base: `master` at `a0439cf` (post dependency-bump merges, pre-refactor).
- **Status**: git/issue cleanup done; a 100+-test Jest characterization
  layer done; a 31-test Playwright real-browser layer done (`test/e2e/`).
  **All 5 real bugs found across both test layers so far are now fixed**:
  bug #1 (`setSelectedAddresses` 2+ addresses) and 3 audit-found siblings
  (§6 #1), plus #10 (numeric field without units, §6 #10) and #11 (the
  two-instance crash + export leak, §6 #11) — both found and fixed in the
  same session. **The actual `src/js/` module refactor and build-tool
  modernization have NOT started.**
- **One question to the user is open** — see "Open questions to resume
  with" at the bottom. Ask before proceeding past this point.

## 1. Original request (paraphrased, three parts)

1. **Git cleanup**: stale branches (local/remote), stale worktrees.
2. **Issue triage**: close every open issue numbered below #95, with the
   comment "Closing stale issues, please reopen if this is still an issue."
   Explicitly keep #95, #100, and #119 open.
3. **A large refactor**, with hard constraints the user was emphatic about:
   - Do it entirely on its own branch, named per this repo's existing
     convention, referencing issue #119. **Stop before merging to master** —
     open a PR, do not merge it.
   - **Before any code changes**, deeply understand the codebase and propose
     a test plan covering backend logic (DB-lookup-equivalents, callbacks,
     state) and frontend/UI behavior, so "before" and "after" are provably
     equivalent from a user's standpoint.
   - **The public interface must not change at all** — this package is
     embedded in other apps already in production (e.g. ebase).
   - Add Claude-specific infrastructure to the repo on this branch: a memory
     setup, an `AGENTS.md`, and anything else relevant. (This file and
     `AGENTS.md` are that deliverable.)
   - The user asked to be told of any open questions along the way rather
     than have anything assumed.

## 2. Part 1 & 2: git cleanup and issue triage — DONE

**Local branches**: was on `bug/#109-well_set_selector` (already merged as
PR #110) — switched to `master`, fast-forwarded, deleted the local branch.
No stale worktrees existed (`git worktree prune -n -v` found nothing).

**Remote branches deleted** (all confirmed fully merged into `master`, zero
unique commits, verified with `git log origin/master..origin/<branch>`
returning empty, before deleting):
- `bug/#71`, `v2.0.3` (note: this name collided with a git *tag* of the same
  name — had to delete via `refs/heads/v2.0.3` explicitly), `develop`.

**Remote branches deleted after explicit user confirmation** (these had real
*unmerged* commits, self-described by their own authors as non-functional —
`feature/#88-product_lot_picker`, last commit 2022; `hb_product_lot_picker`,
last commit 2024, both attempts at issue #89 "Product/Lot picker"):
- User chose "Delete both" when asked (over "keep" or "tag then delete").

**Dependabot vulnerability note** (found in passing, not yet acted on): 2
open high-severity GitHub Dependabot alerts on `master`, both in the
transitive `immutable` package (hash-collision DoS, trie-overflow DoS) —
pulled in by the gulp/browser-sync toolchain, not a direct dependency. Worth
resolving as part of this refactor's dependency cleanup.

**Issues closed** (with "Closing stale issues, please reopen if this is
still an issue."): **#89, #50, #41, #19, #18**.
**Issues deliberately left open**: **#95, #100, #119** (per instruction).

**Branch created**: `refactor/#119-cleanup_and_reorganize`, off `master`,
following this repo's observed naming convention (`<type>/#<issue>-<snake_
case_description>`, e.g. `bug/#109-well_set_selector`,
`feature/#88-product_lot_picker`). User confirmed this name explicitly.

## 3. Investigation: architecture summary

Four parallel research agents read all 18 files in `src/js/` (~4,000 lines
total; `create-field.js` alone is 1,351 lines, over a third of the codebase)
plus `README.md` and `example/`. Full raw findings are not preserved
verbatim anywhere (they were agent tool-call results, not committed files) —
this is the distilled version. If you need more depth on a specific file,
re-read the source directly; it's not that large.

### The core architectural fact

This is **not really 18 modules** — it's one shared mutable object assembled
at runtime. Every file does:
```js
var plateMapWidget = plateMapWidget || {};
plateMapWidget.someName = function(THIS) { return { /* methods */ }; };
```
and `plate-map.js`'s `_create()` does:
```js
for (let component in plateMapWidget) {
  $.extend(this, new plateMapWidget[component](this));
}
```
flattening every method and every piece of state (`this.engine`,
`this.fieldList`, `this.selectedIndices`, `this.allTiles`, ...) onto one
widget instance, with load order determined by alphabetical glob order in
`gulpfile.js` and zero encapsulation between files. **This is the main
"discombobulation" #119 is about**, and the primary thing worth restructuring
into real modules with explicit imports/exports.

### The public contract (must not change)

- Init: `$(el).plateMap({ numRows, numCols, readOnly, attributes: { tabs,
  presets }, created, updateWells, selectedWells })`.
- Documented methods (README "Major Functions"): `loadPlate(data)`,
  `getPlate()`, `isReadOnly(flag)`, `isDisableAddDeleteWell(flag,
  defaultFields)`, `setSelectedAddresses(addresses)`, `getSelectedAddresses()`.
- Callbacks: `created(instance)`, `updateWells(event, instance)`,
  `selectedWells(event, {selectedAddress})`.
- There are ~30 *other* technically-callable methods (any non-underscore-
  prefixed property is invocable via the jQuery UI widget bridge, e.g.
  `setTileColor`, `tileAttrText`, `adjustFieldWidth`, `readOnlyHandler`) that
  look like accidental surface, not intended API. Treat the README-documented
  list above as the real contract unless the user says otherwise.

### Data flow (the core pipeline worth understanding before refactoring)

A field edit → `field.onChange()` → `_addAllData(data)`
(`add-data-on-change.js`) mutates `this.engine.derivative[wellIndex]` →
`decideSelectedFields()` (repopulates tab UI) → `_colorMixer()` →
`engine.searchAndStack()` + `engine.applyColors()` (`engine.js`) → repaints
SVG tile colors, rebuilds the bottom summary table, updates completion % →
back in `_addAllData`: `derivativeChange()` (fires the `updateWells`
callback) → `addToUndoRedo()` (pushes a full-state history snapshot).
Several other entry points (`clearCriteria`, `pasteCriteria`,
`changeCheckboxes`/`setCheckboxes`, `setData`/`loadPlate`) each hand-roll a
*slightly different* subset of this same sequence — see the bug list below
for where those differences actually bite.

### README.md is stale on one specific, important point

`getPlate()`/`loadPlate()`/`sanitizeWell()` use a **flat** well shape —
`wells.A1 = {fieldId: value}` — **not** the `{wellData: {fieldId: value}}`
wrapper the README's `loadPlate(data)` example shows. Confirmed by reading
`add-data-on-change.js`'s `getPlate()` and `load-plate.js`'s `sanitizeWell()`
directly and by running it. Everything *else* in the README (field-value
shapes: `{value, unit}` for units, arrays for multiselect, arrays-of-objects
for multiplex; the field-config shape for `attributes.tabs`) checked out as
accurate wherever it was tested.

### Consumption model (why a build-tool swap is lower risk than it looks)

Investigated by reading `/Users/jmiller/Documents/NEB/ebase` (a real
consumer, on branch `feature/#2108-product_consolidation` at the time, not
`master`):

- **The public npm registry is a red herring.** `npmjs.com/package/plate-map`
  is stuck at **v2.0.6**; this repo's `package.json` says **2.0.10** and
  there's an unpublished git tag **v2.1**. Nobody appears to be consuming
  the live registry.
- **ebase vendors a manually pre-built, single-file copy.**
  `vendor/javascript/plate-map.js` (a minified build, zero `import`/`export`
  statements) is pinned via Rails 7 importmap
  (`config/importmap.rb`: `pin 'plate-map', to: 'plate-map.js'`), with its
  own CSS copied to `app/assets/stylesheets/plate-map.css`. A single
  "checkpoint" commit added it — it is **not** kept in sync automatically;
  `importmap.rb`'s own header comment confirms the workflow is deliberate
  manual vendoring ("same workflow as gems"). A now-abandoned
  `package.json.backup` shows ebase used to depend on
  `github:nebiolabs/plate-map#v2.0.9` directly (bypassing the npm registry
  entirely) before migrating to the current vendoring approach.
- **jQuery 3.7.1, jQuery UI 1.14.0, select2 4.1.0-rc.0, and SVG.js 2.6.6 are
  all loaded as classic global `<script>` tags from CDNs** in
  `app/views/layouts/application.html.erb`, *before* the importmap tags.
  `app/javascript/js/plate_map_helper.js` explicitly comments "SVG.js is
  loaded globally via script tag in layout" and manually does
  `window.ClipboardJS = ClipboardJS` before `import 'plate-map'`, because
  the vendored bundle expects those as pre-existing globals, not resolvable
  imports.
- **Implication for a build-tool swap**: safe *if and only if* the new build
  still emits one self-contained script with zero unresolved `import`
  specifiers, reading jQuery/select2/jQuery-UI/SVG.js/ClipboardJS off
  `window` exactly as today — i.e. those must be marked `external` in
  whatever bundler is used, not inlined. Also must match today's Babel
  browser-support target (a modern bundler defaults to a newer target
  unless told otherwise). This generalizes to any consumer following the
  README's documented integration pattern, not just ebase specifically.

## 4. Decisions the user made (via clarifying questions)

1. **WIP branches** (`feature/#88-product_lot_picker`, `hb_product_lot_picker`):
   delete both. → Done.
2. **Test stack**: Jest + jsdom for logic/unit tests, Playwright for
   real-browser tests. → Confirmed; Jest layer done, Playwright not started.
3. **Build tooling**: modernize (replace Gulp/Babel), *with* the safeguards
   above (externalize jquery/select2/jquery-ui/svg.js/clipboard, match
   current browser-support target, verify via the eventual Playwright suite
   running against the actual built `dist/` output, not just `src/`).
   → Confirmed; **not started**.
4. **Branch name**: `refactor/#119-cleanup_and_reorganize`. → Confirmed, used.
5. **Version bump**: user's own suggestion, made when asked how to reconcile
   "keep the interface identical" with "this is a large internal rewrite" —
   bump to **3.0.0** on publish, since ebase's vendoring is manual/deliberate
   anyway so a major bump can't accidentally auto-break anyone; it's a clean
   signal to re-verify before re-vendoring. → Agreed as the right call.
   **Not yet executed** (package.json still says 2.0.10).

## 5. Work completed: Jest characterization-test layer

Zero tests existed before this branch. Built a Jest + jsdom harness and 100
passing tests across 7 files, in 3 commits (all pushed to `origin/refactor/
#119-cleanup_and_reorganize`):

- `af58d2f` — harness: `jest.config.js`, `test/unit/setup.js`,
  `test/unit/smoke.test.js`.
- `ca24d5e` — `address-math.test.js` (37), `undo-redo.test.js` (9),
  `load-plate-roundtrip.test.js` (11). Also added `test/unit/setupAfterEnv.js`
  (see harness gotchas below — required to fix real cross-test pollution).
- `8d654a6` — `engine-grouping.test.js` (12), `data-pipeline.test.js` (10),
  `common-data.test.js` (18).

### How the harness works (important if you extend it)

`test/unit/setup.js` (a Jest `setupFiles` entry, runs before the test
framework installs `describe`/`test`) loads jQuery/jQuery-UI/select2/SVG.js/
ClipboardJS as **real globals** on the jsdom `window`, then reads every
`src/js/*.js` file and runs it via **`global.eval(code)`** — deliberately an
*indirect* eval (property-access form), which per spec always executes in
global scope. This is required because these files are plain (non-module)
scripts sharing state via top-level `var plateMapWidget = plateMapWidget ||
{}` exactly like concatenated `<script>` tags — a normal `require()` would
wrap each in its own CommonJS function scope and break that sharing.
Several npm packages needed non-obvious handling to attach correctly:
`select2`'s CommonJS branch exports a **factory function**, not the plugin
itself — you must call `require('select2')(window, jQuery)`, not just
`require('select2')`.

`test/unit/setupAfterEnv.js` (a Jest `setupFilesAfterEnv` entry, runs once
the test framework exists) does `afterEach(() => { document.body.innerHTML
= ''; })`. This was **not** a nice-to-have — several `src/js/` functions
query the DOM globally instead of scoping to the widget's own container
(e.g. `plate-map.js`'s `selectObjectInBottomTab` does
`document.querySelectorAll('table.plate-setup-bottom-table tr')`), so
without this cleanup, widget instances left over from earlier tests in the
same file silently turned *every subsequent test* into an unintended
multi-instance scenario and produced confusing failures unrelated to what
was actually being tested. This was discovered the hard way (see git history
of `address-math.test.js` if you want the debugging trail) — do not remove
this cleanup.

## 6. Real bugs found and characterized

These are pinned down as tests asserting *actual current behavior*
(including where that behavior throws), with comments explaining each is a
known/possible bug, not a spec, except where marked FIXED below. Ranked
roughly by severity:

1. **FIXED** (this session). **`setSelectedAddresses(addresses)` used to
   throw for ANY call with 2+ addresses.** `load-plate.js`'s
   `sanitizeAddresses`: `selectedAddresses.map(this.addressToIndex, this)`.
   `Array#map` invokes its callback as `(element, index, array)`; passed as
   a bare method reference, `addressToIndex`'s second parameter
   (`dimensions`) received the **array index** instead of a real dimensions
   object. Index 0 is falsy so it happened to fall back to `this.dimensions`
   correctly — index 1+ is a truthy `Number`, so `dimensions.rows`/
   `dimensions.cols` were `undefined`, and the bounds check in `locToIndex`
   (`loc.r < dimensions.rows`, and `< undefined` is always `false`) failed
   and threw `"Row index N invalid"` for a perfectly valid, in-range
   address — a documented "Major Function" broken for its stated use case.
   **Fixed** by wrapping the call in an arrow (`selectedAddresses.map(address
   => this.addressToIndex(address))`) so `.map()`'s implicit index argument
   is never forwarded. The user was asked directly and chose to fix it now,
   as an isolated concern from the refactor. See `test/unit/
   address-math.test.js`'s "2+ addresses" describe block (tests rewritten
   from BUG-asserting to FIXED-asserting).

   **Fixing it surfaced a second, previously-masked bug in the same
   function** (also fixed in the same commit, at the user's direction):
   `sanitizeAddresses` also did `indices.sort()` with no comparator —
   default `Array#sort` stringifies elements, so index `10` sorted before
   index `2`. This could never fire before: the `.map()` bug above always
   threw first for any 2+-address call, so execution never reached
   `.sort()`. Fixed with an explicit numeric comparator
   (`indices.sort((a, b) => a - b)`).

   **Follow-up audit** (`/challenge`, same session) found the identical two
   bug shapes recurring in 3 more places, all now also fixed:
   - `bottom-table.js`'s `addBottomTableRow` click handler —
     `singleStack.map(that.indexToAddress, that)` (bare-reference `.map()`
     bug). Clicking a bottom-table color-group swatch with 2+ wells in the
     group threw. Live, everyday UI action. **Fixed** (arrow-wrapped).
   - `bottom-table.js`'s `exportData` — `colorLocIdxMap[colorIdx].map(
     this.indexToAddress, this)` (same bare-reference bug). CSV/clipboard
     export **silently wrote corrupted addresses** (no throw) into the
     "Location" column for any color group of 2+ wells — worse than the
     others because it's silent, wrong data in an exported file rather than
     a visible crash. **Fixed** (arrow-wrapped). Regression-tested in
     `test/unit/audit-bugfixes.test.js` (required a scoped `innerText`
     polyfill in that test file — jsdom does not implement `innerText` at
     all, since it depends on real layout; `exportData` reads
     `cols[j].innerText` to build export rows).
   - `svg-events.js`'s `getWellSetAddressWithData` — had **both** bug
     shapes in the same two lines: `Object.keys(this.engine.derivative)
     .map(Number).sort()` (comparator-less sort) feeding directly into
     `indices.map(this.indexToAddress, this)` (bare-reference map). Feeds
     `this.addressAllowToEdit` (`plate-map.js`), which nothing in `src/js/`
     currently reads back — inert internally today, but reachable by an
     external consumer reading the raw instance off the `created(instance)`
     callback. **Fixed** (explicit comparator + arrow-wrapped). Regression-
     tested in `test/unit/audit-bugfixes.test.js`.
   - `svg-events.js`'s `selectTiles` (the **drag-select** handler,
     `that.setSelectedIndices(indices.sort())`) — same comparator-less
     sort bug, on the single hottest interaction path in the widget: any
     mouse-drag selection spanning index ≥10 (any plate with ≥10 columns)
     got reordered lexicographically, feeding wrong order into
     `getSelectedAddresses()`, the `selectedWells` callback payload, and
     undo/redo history. **Fixed** (explicit comparator). **Not
     regression-tested** — `selectTiles` is a private closure inside
     `_svgEvents` that depends on `getMousePosition()`'s `getScreenCTM()`,
     which jsdom does not implement (per `AGENTS.md`'s testing section:
     drag-select needs Playwright, not Jest). Verified by code inspection
     only; add real-browser coverage when the Playwright layer is built.

   **Root cause, not yet addressed**: no wrapper convention anywhere in the
   codebase for passing a `this`-bound method into an array iterator — this
   exact bug shape is one `.map(this.x, this)` away from recurring anywhere
   else it's written the same way. A lint rule (or at minimum re-auditing
   after any future `src/js/` edit) would retire the risk class; this
   session's audit covered every `.map/.forEach/.filter/.reduce/.some/
   .every/.find/.sort()` call site as of the commit(s) above, not future
   ones.
2. **Selecting wells before any real data/checkbox has ever been loaded
   throws a `TypeError`.** `bottomForFirstTime()` (`bottom-table.js`) seeds
   one placeholder `<tr>` with no `<button>` in it. `selectObjectInBottomTab`
   (`plate-map.js`) unconditionally does `td.querySelector('button')
   .innerHTML` on every row after the header, including that placeholder —
   crashes on a completely fresh widget's first `setSelectedAddresses`/
   `setSelectedIndices` call.
3. **`loadPlate()` silently ignores `data.selectedAddresses`.** Despite the
   README showing it in the `loadPlate(data)` payload,
   `load-plate.js`'s `loadPlate()` only ever reads `data.wells` and
   `data.checkboxes`. The sanitized object handed to `setData()` has no
   `selectedIndices` key, so `setSelectedIndices(undefined, true)` falls
   into its "empty means select index 0" default. **Every `loadPlate()`
   call unconditionally resets selection to well A1**, no matter what (if
   anything) was passed as `selectedAddresses`.
4. **`commonData` (multi-well copy/paste, shared-field tab display) handles
   "not common" inconsistently by field kind.** A "not common" scalar or
   units field is **deleted from `commonData` entirely**. A "not common"
   array field (multiselect/multiplex) instead **stays present as `[]`**.
   Downstream, `_addAllData` only ever writes keys *present* in `commonData`
   during a paste — so a "not common" scalar field is left untouched on the
   paste target (never cleared), while a "not common" array field gets
   explicitly overwritten with `[]`/emptied. Also: pasting a `commonData`
   where every field ends up empty can delete the paste target well
   entirely (via `engine.wellEmpty()`), not just leave it with empty fields.
5. **`tile.colorIndex` does not actually wrap at the color-palette
   boundary** — only the *rendered* SVG gradient fill does.
   `svg-create.js`'s `setTileColor` sets `tile.colorIndex = parseInt(color)`
   (the raw, unbounded group number, confirmed up to 100+ on a large plate)
   *before* applying the wraparound formula
   `((color - 1) % (wellColors.length - 1)) + 1` to a local variable used
   only to pick which of the 49 (`color-manager.js`'s `colorPairs.length`)
   gradients to paint. Confirmed empirically: group 48 → `wellColor48`,
   group 49 → `wellColor1`, group 50 → `wellColor2`, group 97 → `wellColor1`.
6. **The "NaN completion %" fallback is unrelated to "no required fields
   configured."** `checkCompletion()` (`engine.js`) does
   `if (req === fill) return 1` — with zero required fields, `req===fill===0`
   trivially, so it reports **100% complete** regardless of actual data.
   The `"Completion Percentage: 0%"` NaN-fallback text (from
   `wholePercentage = Math.floor(100 * wholePercentage / wholeNoTiles)`,
   `wholeNoTiles` being 0) only fires when `engine.derivative` is genuinely
   empty when `searchAndStack()` runs (e.g. `loadPlate({wells: {}})`).
7. **Multiplex: re-adding an entry with an option id that already exists
   patches the existing array entry's sub-fields in place** rather than
   creating a duplicate array entry (`_getMultiData` matches on
   `val[fieldId] === multiplexId`).
8. **Debug `console.log` calls shipped in production**: `undo-redo-
   manager.js` logs the literal strings `"undo"`/`"redo"` on every call —
   harmless but a real "discombobulation" artifact worth cleaning up.
9. `add-tab-data.js` mutates the caller's field-config objects in place
   (`data.id = "Auto" + that.autoId++` when a field config omits `id`;
   `field.data = data` keeps that mutated object live for the field's
   entire lifetime) — not a user-facing bug, but see the self-critique
   below for why this matters to the test suite's own validity.
10. **FIXED** (found while building the Playwright layer, fixed the same
    session). A numeric field configured with NEITHER `units` NOR
    `defaultUnit` used to throw on every single edit and never save the
    typed value, silently, for the field's entire lifetime.
    `create-field.js`'s `_createNumericField` wires its own `"input"`
    handler as:
    ```js
    input.on("input", function() {
      let v = field.getRegularValue();   // <-- throws here
      ...
      field.onChange();                  // <-- never reached
    });
    ```
    `field.getRegularValue` used to be defined **only** by `_makeFieldUnits`
    (`create-field.js:100`), which `_handleFieldUnits` calls **only** when
    `units.length` ends up non-zero — true when *either* `units` or
    `defaultUnit` is configured (`defaultUnit` alone makes
    `units = [defaultUnit]`, see `_handleFieldUnits`, `create-field.js:62`–
    `89`). With **neither** configured, `getRegularValue` was never defined
    at all, so every keystroke threw `TypeError: field.getRegularValue is
    not a function` before `field.onChange()` ran — the value was silently
    lost, with no exception surfaced to the embedder (it was an in-page
    uncaught error inside a jQuery event handler, not a thrown/returned
    error from any public method).

    **Precisely scoped to numeric fields**: confirmed by reading
    `_createTextField`/`_createSelectField`/`_createBooleanField`/
    `_createMultiSelectField`'s own change handlers — none of them call
    `getRegularValue`.

    **Notably**: `example/example.js`'s own bundled demo has a multiplex
    subfield (`dilution_factor`) with its `defaultUnit` commented out —
    i.e. the shipped example already contained a field shaped exactly like
    this.

    **Fix**: `_createNumericField` now pre-sets `field.getRegularValue =
    field.getValue` right after defining `field.getValue`, giving a working
    fallback when no units are configured. A no-op when units ARE
    configured: `_makeFieldUnits` still overwrites `getRegularValue` with
    the same value anyway (it runs before it later overrides
    `field.getValue` itself). Characterized as FIXED in
    `test/e2e/field-editing.spec.js`, alongside the pre-existing positive
    control (numeric *with* units).
11. **FIXED** (found while writing the dedicated two-instances-on-one-page
    test §7 point 4 explicitly asked for, fixed the same session as found).
    Two widget instances on one page used to be unsafe together in two
    separate, concrete ways — the self-critique's abstract "unscoped
    `document.querySelectorAll` calls are dangerous for multi-instance
    embedders" concern, confirmed with real repros and a real stack trace:
    - **A crash, trivially reachable**: `selectObjectInBottomTab`
      (`plate-map.js:357`) used to do
      `document.querySelectorAll('table.plate-setup-bottom-table tr')` —
      page-wide, not scoped to `this` widget's own container — then
      `for (let i = 1; i < trs.length; i++)`, skipping exactly **one** row
      (meant to skip "the" header row). With two widgets on the page this
      combined both tables' `<tr>`s into one list; only the *first*
      widget's header was skipped, so the *second* widget's own header row
      (a `<th>`, no `<button>` inside it) was walked into as if it were a
      data row, and `td.querySelector('button').innerHTML` threw on the
      `null`. **This fired on the very first `loadPlate`/checkbox call on
      ANY widget as soon as a second widget instance merely existed
      anywhere on the page — the second widget never had to be touched at
      all.** Confirmed via a real stack trace: `selectObjectInBottomTab` →
      `applyColors` (`engine.js:153`) → `_colorMixer` →
      `setCheckboxes`/`changeCheckboxes` → `setData` → `loadPlate`. This
      was about as severe as anything in this list: it meant the widget
      wasn't merely "risky" with 2+ instances on a page, it was
      **guaranteed-broken** the moment a second instance existed and
      either one ever called `loadPlate`/changed a checkbox.
    - **Silent cross-instance data leakage, no crash**: `exportData`
      (`bottom-table.js`) used to do `document.querySelectorAll("table
      tr")` — even more unscoped than the above (every `<table>` on the
      whole page, not even limited to `.plate-setup-bottom-table`).
      Confirmed (in the cold-start state specifically, so this didn't
      depend on the crash above): calling `exportData('clipboard')` on ONE
      freshly-created widget while a second, completely untouched widget
      existed elsewhere on the page returned a clipboard string containing
      **both** widgets' `"Group"` header rows concatenated together.

    **Fix**: both scoped to `this.bottomTable[0]` (an instance property
    already set up in `bottom-table.js`'s `_bottomScreen`, carrying the
    `plate-setup-bottom-table` class) instead of `document`. Each widget
    now only ever sees its own bottom-table rows. Characterized as FIXED in
    `test/e2e/multi-instance.spec.js`.

    **Not fixed, and NOT covered by any test** — a related, still-open
    concern named in the self-critique alongside these two:
    `readOnlyHandler`'s `$('.multiple-field-manage-delete-button')`
    selector (`plate-map.js`) is *also* unscoped (a bare global jQuery
    selector, not even `document.querySelectorAll` scoped to an element).
    Left alone this session because, unlike the two above, it was never
    pinned down with an actual repro/test — worth auditing and fixing the
    same way if/when someone verifies a concrete failure mode for it.

## 7. Self-critique (`/challenge`) — read before trusting this suite

The user explicitly ran `/challenge` against this test suite rather than
answering the pending question, specifically because they wanted the next
session to inherit a healthy amount of skepticism about it, not just a
"100 tests passing ✅" headline. In the user's own words: *"I would like the
next agent to know that I've challenged you."* Full critique, condensed:

1. **The biggest gap: jsdom coverage is zero for the highest-risk surface.**
   All 100 tests run under `testEnvironment: 'jsdom'`, which doesn't
   implement `getScreenCTM()`, doesn't do real layout, and doesn't run
   select2's actual dropdown rendering/keyboard handling. **The entire
   mouse drag-select subsystem (`svg-events.js`), the "drag from the
   row/column label gutter selects the whole row" special case, and all
   real select2 UI behavior (including the `select2fix` workaround) have
   zero test coverage right now.** If the Playwright layer doesn't get
   built, "100 tests passing" will vastly overstate how safe the interface
   actually is to refactor.
2. **Test fixtures are shared by reference into the widget's live internal
   state, not cloned — a real cross-test contamination risk.**
   `add-tab-data.js:24-31` mutates the caller's field-config object in
   place (assigns an auto-generated `id` if missing); `add-tab-data.js:112`
   keeps that same object live as `field.data` for the field's entire
   lifetime. Test files mostly declare `const fields = [...]` once at
   module scope and reuse it across many `makeWidget()` calls in the same
   file. Probably benign today (fixtures all supply explicit `id`s), but
   it's not as isolated as it looks, and no write-site audit was done
   beyond that one confirmed mutation.
3. **The multiselect/multiplex pipeline tests bypass the DOM event
   marshaling layer.** `data-pipeline.test.js` calls
   `instance.fieldMap['fieldId'].multiOnChange(added, removed)` directly —
   reasonable for exercising `_getMultiData`'s logic, but it does not prove
   select2's real `select2:select`/`select2:unselect` handlers in
   `create-field.js` build the exact same argument shapes. That marshaling
   layer is untested; these 10 tests characterize `multiOnChange`'s
   contract, not "a user clicking a multiselect option in a browser."
4. **No test actually exercises the multi-instance DOM-query bugs as an
   embedder would hit them.** `setupAfterEnv.js`'s `document.body.innerHTML
   = ''` between every test makes the *symptom* (spurious crashes from
   stale DOM) go away, but as a side effect, **no test exists with two
   simultaneous widget instances on one page** — exactly the scenario that
   makes `exportData`, `selectObjectInBottomTab`, and `readOnlyHandler`'s
   unscoped `document.querySelectorAll` calls dangerous for a real embedder
   running more than one widget per page.
   **UPDATE**: this gap has since been closed (`test/e2e/
   multi-instance.spec.js`), and this concern turned out to be worse than
   "dangerous" — it's a guaranteed crash. See §6 #11.
5. **Minor**: no test covers widget teardown/recreate. There is no
   `_destroy` override anywhere in `src/js/`, so the `window`/
   `document.body` `cut`/`copy`/`paste`/`keyup` listeners registered in
   `interface.js` accumulate on repeated mount+unmount — real for any
   SPA-style embedder that mounts/unmounts the widget, not exercised
   anywhere in this suite.

**If only one thing could be fixed before trusting this as a refactor
baseline: build the Playwright layer, specifically drag-select and real
select2 UI, before touching any `src/` code.**

## 8. What is NOT done yet

- [x] **The interrupted question, answered**: bug #1 (`setSelectedAddresses`
      2+ addresses) — user chose to fix now, as an isolated concern from the
      refactor. Fixed, along with the sibling `.sort()` bug it exposed, plus
      3 more recurrences of the same two bug shapes found via a follow-up
      `/challenge` audit (bottom-table click handler, `exportData`,
      `getWellSetAddressWithData`, and the drag-select handler). See §6 #1
      for the full detail. Committed (`df58276`); not yet pushed to origin
      as of this writing — pending user review.
- [x] **Playwright real-browser test layer — done.** `test/e2e/`: a
      dependency-free static-file harness (`server.js` + `fixture.html`,
      loading real `src/js/*.js` as `<script>` tags in gulpfile.js's own
      dependency order — not a dist build), `playwright.config.js`
      (chromium only), and 31 tests across 9 spec files: `smoke.spec.js`
      (harness sanity), `drag-select.spec.js` (mouse drag-select, the
      row/column-gutter special case, §6 #1's sort-order regression),
      `select2-ui.spec.js` (real select2 dropdowns, the select2fix
      workaround), `tabs-and-bottom-table.spec.js` (tab switching, checkbox
      → grouping, §6 #1's click-to-select regression), `multiplex.spec.js`
      (add/switch/remove entries via the real UI), `field-editing.spec.js`
      (basic field edits + found §6 #10), `undo-redo-ui.spec.js` (real
      Ctrl+Z/Shift+Z/Y shortcuts, focus-gated), `multi-instance.spec.js`
      (the dedicated two-widget test — surfaced §6 #11, a real crash),
      `export.spec.js` (CSV download + clipboard content correctness).
      Plus `visual-snapshot.spec.js`: a portable structured-DOM snapshot
      (tile color/completion state) and one small pixel screenshot (2x2
      plate, tightly clipped, `maxDiffPixelRatio: 0.05`) — the pixel one is
      tied to this machine's rendering (filename suffix
      `-chromium-darwin`); regenerate its baseline with
      `--update-snapshots` on a different machine/CI rather than assuming
      a real regression from a cosmetic diff.

      **Net result of building this layer**: 2 new, previously-
      uncharacterized bugs found (§6 #10 numeric-fields-without-units, §6
      #11 the two-instance crash + export leak) — the user asked to tackle
      both directly (no separate fix-timing conversation needed for
      these), and **both are now fixed** in the same session, with their
      characterization tests flipped from BUG-asserting to
      FIXED-asserting. All 31 e2e tests + all 103 Jest tests pass as of
      this writing. Not yet pushed to origin.
      **Still not covered** (lower priority, didn't block calling this
      "done"): `readOnlyHandler`'s own unscoped
      `$('.multiple-field-manage-delete-button')` selector (related to §6
      #11 but never pinned down with a repro, so left alone),
      `.select2-container--open` edge cases beyond the basics, the
      `select2fix` workaround under multiselect specifically (only tested
      under single-select), and widget teardown/recreate (self-critique
      point 5 — still open, no `_destroy` exists to test against).
- [ ] The actual `src/js/` refactor: breaking the global-mixin
      (`plateMapWidget` + `$.extend`) pattern into real ES modules with
      explicit dependencies, while keeping the public API byte-identical.
- [ ] Build tooling modernization (replace Gulp/Babel), with the
      externals-as-globals + browser-target safeguards from section 3.
- [ ] Bumping `package.json` version to `3.0.0` (do this as part of/near the
      end of the refactor work, not before, per the user's reasoning).
- [ ] Trimming what actually gets published (no `files` field or
      `.npmignore` today — the npm package currently publishes `src/`,
      `example/`, `gulpfile.js`, `build/`, everything).
- [ ] Resolving the 2 open Dependabot high-severity alerts (`immutable`
      transitive dep).
- [ ] Opening the PR once the refactor is done. **Do not merge it** — the
      user was explicit that they want to review before anything lands on
      `master`.
- [x] Claude infrastructure (`AGENTS.md`, this file, and a memory pointer) —
      done in the same commit as this file.

## 9. Open questions — resolved; see §10 for what replaced them

The single question left here previously ("what to work on next") is
answered: the actual `src/js/` refactor, scoped per §10 below. This
section is kept only as a pointer — all currently-live open questions and
decisions live in §10.

## 10. Session 3: scoping the actual `src/js/` refactor (in progress — planning, not yet executed)

**This session has not written any code yet.** It is `/plan`-mode
scoping/research for the refactor itself, done because the user
deliberately does not want a blind "just start refactoring" — see the
project's whole test-first posture. Picking this up: no `src/js/` file has
been touched this session; everything below is decisions + research to
act on next.

### 10.1 The user's actual goal (clarified this session — read this before assuming "refactor" means "convert to ES modules")

The user was explicit, unprompted, that the earlier framing ("break the
global-mixin pattern into real ES modules with explicit dependencies,"
AGENTS.md's own wording) undersells what they actually want. Their words,
paraphrased faithfully:

- They want this package to work well as **two things at once**: (1) a
  self-contained, interactable thing *they themselves* can explore/poke at
  to understand its own features and scope future work (i.e. a good local
  dev/demo experience matters, not just the shipped artifact), and (2)
  something that installs cleanly into `ebase` and potentially other apps,
  **with zero behavior change anywhere it's already installed** — this is
  their single hardest constraint, stated again independently of the
  original issue's own "public interface must not change" framing.
- Their *primary* motivation, stated directly: **the source code itself is
  a mess** — "redundant, non-DRY, poorly documented" — from multiple
  people touching it over multiple years, with real "creep and bloat."
  Converting the file-loading mechanism to ES modules (the minimal
  version I first proposed) does **not** address this by itself — it only
  changes *how files find each other*, not the quality of what's inside
  them. The user confirmed explicitly: the goal is genuine internal
  cleanup (dead code, duplication, documentation, decomposing oversized
  files), using the ES-module conversion as the *vehicle/opportunity* to
  do that cleanup, not as the goal itself.
- They are explicit that they are **not deeply familiar with this part of
  JS tooling** — asked me to just propose an answer rather than present a
  menu, for the bundler choice specifically. Keep explanations concrete
  and avoid assuming JS-tooling fluency in any future write-ups for them.
- They are token/cost-conscious about how this gets executed (asked
  directly whether a full audit would burn a lot of budget up front) —
  worth continuing to be transparent about relative cost of different
  approaches rather than defaulting to "spend big" whenever there's a
  choice.

### 10.2 Decisions made this session

1. **Bundler: Vite** (not webpack, not raw Rollup). Rationale actually
   given to and accepted by the user: webpack is more powerful but far
   more config-heavy for someone new to this area, with no real payoff
   here; raw Rollup handles the "single self-contained file, externals
   mapped to existing globals" production build well (and is what Vite
   uses internally for this), but gives you *only* that — no interactive
   local dev experience out of the box. Vite gives both: a fast
   zero-config dev server (serves the "explore it myself" goal) and a
   "library mode" production build (`build.lib`, Rollup-powered
   underneath) that satisfies the AGENTS.md safeguards directly — single
   self-contained output file, `jquery`/`jquery-ui-dist`/`select2`/`svgjs`/
   `clipboard` marked external and read off existing globals exactly as
   today, configurable browser target. Note found while scoping this: the
   repo currently has **no explicit Babel/browserslist target anywhere**
   (`grep` for `.browserslistrc`/`browserslist` field/`.babelrc` all came
   back empty) — `@babel/preset-env` is invoked in `gulpfile.js` with no
   `targets`, so it's compiling to the *broadest possible* default target
   today. Whatever Vite `build.target` gets configured needs to be at
   least that broad unless a deliberate, separately-flagged decision is
   made to narrow it.
2. **Refactor depth: full internal cleanup, not just file-wiring** — per
   10.1. This is a **bigger scope and bigger risk surface** than the
   "Phase 1 only" version I originally proposed and REFACTOR_NOTES.md §8's
   checklist item description still reflects (that description is now
   stale/superseded — don't take its "explicit file wiring only" framing
   at face value; this section supersedes it). ES-module conversion is
   still part of the work (it's the natural container for splitting up
   oversized files like `create-field.js`), but cleanup — dead code,
   duplicated logic, documentation, decomposing bloated files — is
   in scope for this pass, not deferred to a hypothetical later one.
3. **Audit approach: full upfront audit**, not a rolling/incremental
   discover-as-you-go approach. Explicitly chosen over the cheaper rolling
   alternative after the user asked about relative token cost and I laid
   out the honest tradeoff (upfront = one full prioritized list before
   committing to anything, costs more up front; rolling = start
   immediately on the known-worst offender, cheaper up front, no full
   picture until most of the codebase is already touched). **Next concrete
   step, not yet started**: run that audit (systematic sweep for
   redundancy/dead code/non-DRY patterns/undocumented complexity across
   all 18 `src/js/` files, informed by the dependency map in §10.3 below),
   come back with a prioritized list, let the user pick what/in what
   order — mirroring exactly how the bug-hunt `/challenge` audit worked
   earlier in this project (found real, scoped, prioritized findings; user
   picked "fix all of them now"; worked well).

### 10.3 Cross-file dependency map (already researched — do not re-derive this from scratch)

A background research pass already read all 18 `src/js/` files in full
(plus targeted greps of the 1,362-line `create-field.js`) and cross-
referenced every `this.`/`that.`/`THIS.` reference against every file's
own definitions. This is exactly the input the cleanup audit and any
actual module-boundary design need — reuse it rather than re-reading
everything from zero.

**Headline findings:**

- **No genuine load-order dependencies between the 18 files, verified (not
  assumed).** The only place `plateMapWidget` (the shared global object)
  is ever read back is `plate-map.js`'s own mixin loop in `_create()`,
  which runs at widget-*instantiation* time — always after the entire
  script has finished loading, regardless of file order. No factory
  function's immediate return-object-literal computes anything from
  another file's state at *construction* time either (only `engine.js`
  uses its `THIS` parameter at all, and only inside method bodies called
  later, not at construction). **Practical implication**: today's
  alphabetical gulp-glob load order is incidental, not load-bearing — a
  real module refactor is free to reorder/reorganize files by logical
  concern rather than needing to preserve current order.
- **No true name collisions** across the 18 files' top-level
  properties/methods, nor between any mixin file and `plate-map.js`'s own
  widget methods (checked specifically: `readOnlyHandler`,
  `getSelectedAddresses`, `setSelectedIndices`, `addressToIndex`, etc. —
  all single-definition).
- **`plate-map.js` is not one of the 18 mixin files** — it never does
  `var plateMapWidget = plateMapWidget || {}`. It's the `$.widget(...)`
  host structure the mixin loop (`for (component in plateMapWidget) {
  $.extend(this, new plateMapWidget[component](this)); }`) lives inside,
  as one piece of its own `_create()` method. The loop's `new` is
  **vestigial**: every one of the 18 factories has the shape
  `function(THIS) { return {...}; }`, always explicitly returning an
  object literal — per JS semantics that discards whatever `new` would
  have allocated, and none of the 18 factories reference `this` (the
  constructor receiver) anywhere, only the explicit `THIS` parameter
  (used only by `engine.js`). A real ES-module version can call these as
  plain functions with zero behavior change.
- **A real, pre-existing latent ordering bug found while tracing
  `_create()`, not yet decided whether to fix or preserve**: if a widget
  is constructed with `options.readOnly: true`, `_create()` calls
  `this.isReadOnly(true)` **before** the mixin loop runs — so
  `readOnlyHandler()` (called from inside `isReadOnly`) reads
  `this.overLayButtonContainer` (from `overlay.js`, not yet mixed in) and
  calls `this.setFieldsDisabled` → `this.fieldList` (from `add-tab-data.js`
  via `_createInterface()`, which hasn't run yet either). This doesn't
  crash today only because `this.readOnly` defaults to `false` and this
  branch is skipped unless `options.readOnly` is explicitly `true` at
  construction — worth deciding explicitly (fix vs. faithfully preserve)
  rather than silently changing during the refactor.
- **Five specific "looks safe, isn't" coupling/ownership risk zones** to
  treat carefully in any module-boundary design (none are bugs today, all
  are implicit-shared-mutable-state patterns that a clean boundary should
  make explicit rather than silently carry forward):
  1. `field.onChange` / `field.detailData` / `field.checkMultiplexCompletion`
     / `field.applyMultiplexSubFieldColor` / `field.multiOnChange` — a
     shared mutable field-object contract split across exactly two files,
     `add-tab-data.js` (builds the object, assigns `onChange`) and
     `create-field.js` (assigns the rest, and *also* mutates
     `field.detailData` at runtime from inside a closure built in
     `add-tab-data.js`). Treat these two files as tightly coupled; they
     likely need to stay adjacent or share an explicit documented
     contract/type in the refactor, not be split casually.
  2. `undoRedoArray`/`actionPointer` — initialized in
     `undo-redo-manager.js`'s own returned object, but directly overwritten
     later by `plate-map.js`'s `isDisableAddDeleteWell`. Candidate for an
     explicit exported "reset" method instead of cross-file direct field
     poking.
  3. `defaultWell` — container defined in `tabs.js` (`{}`), populated
     key-by-key by `add-tab-data.js`, read everywhere else. Same "one
     owner defines the shell, another fills it, many consume it" pattern.
  4. `emptyWellWithDefaultVal` — set in `plate-map.js`
     (`isDisableAddDeleteWell`), consumed by `add-data-on-change.js` and
     `overlay.js`.
  5. `readOnlyHandler` — defined only in `plate-map.js`, called from
     `tabs.js` and `create-field.js`. Not a collision, but a cross-file
     call that must stay reachable however files get split.
  - Plus one confirmed **dead code** item ready to just delete during
    cleanup: `svg-events.js`'s `colorToIndex` — assigned `{}` at init,
    never read anywhere in `src/js/`.

**Full per-file defines/consumes table**: not reproduced here (long) but
was captured in this session's transcript before compaction — if it's not
recoverable, a re-run of the same research prompt against the 18 files
(with this section's headline findings as a starting hypothesis to verify
rather than rediscover from zero) should reproduce it faster the second
time.

### 10.4 Full cleanup audit — DONE (3 parallel passes, all 18 files)

Split: (A) `create-field.js` alone, (B) `plate-map.js`+`svg-events.js`+
`bottom-table.js`, (C) the remaining 14 smaller files.

**New bugs found (same family as §6's #1/#10/#11 — bare method
references, comparator-less sort, unscoped DOM queries/globals). All 5
are RESOLVED — user decided fix timing for each:**

1. `plate-map.js:339`, `isDisableAddDeleteWell` — `else` branch logs
   `"...key: " + key` but the loop var is `field`; `key` undefined in
   scope → `ReferenceError` whenever a caller's `emptyDefaultWell` names
   a field not in `this.defaultWell`. **Decision: fix now.**
2. `plate-map.js:313-320`, `readOnlyHandler` — `if`/`else` branches both
   execute the identical
   `$('.multiple-field-manage-delete-button').css("display","none")`.
   Investigated further: the button is only ever appended to the DOM
   inside a transient delete-confirmation dialog, and only
   `if (!that.readOnly)` at creation (`create-field.js:1283`) — removed
   again on dialog close. So this duplication rarely has a live target
   to act on; not worth guessing a "correct" rule with no spec/CSS to
   check against. **Decision: leave alone, just document it** (no
   behavior change).
3. `check-box.js:41`, `getCheckboxes()` — multiplex branch does
   `return subfields.indexOf(field.id)` instead of `...>= 0`. Same
   indexOf-as-boolean mistake as §6's already-fixed bugs, new location: a
   subfield at index 0 is wrongly excluded, one not found (-1, truthy) is
   wrongly included. Feeds undo/redo snapshots + getPlate/loadPlate
   round-trips. **Decision: fix now.**
4. `create-field.js:359`, `_createOpts`'s dead `config.ajax` branch —
   `opts.ajax = ajax` where `ajax` is an undefined free variable (2019
   select2-v4 migration left the rename unfinished, per git blame at
   `18781f5`). Throws if any caller ever sets `field.data.ajax` truthy;
   nothing in-repo does today. **Decision: fix the typo**
   (`opts.ajax = config.ajax`) rather than delete the branch, per
   explicit user choice — needs its own dedicated test since this branch
   has never been exercised by anything in 6+ years (so "suite stays
   green" alone wouldn't prove the fix correct).
5. `create-field.js:1307`, `window.onclick = function(event) {...}` —
   found during a follow-up module-level-mutable-state audit (see below).
   Assigns (not `addEventListener`s) the single global `window.onclick`
   slot every time the multiselect manage/delete dialog opens — same bug
   family as #11 (multi-instance interference), via a global handler slot
   instead of an unscoped DOM query. With two widget instances on a page,
   whichever one's dialog opened most recently silently steals the
   outside-click-to-close behavior from the other's open dialog.
   **Decision: fix now** (switch to `addEventListener`/
   `removeEventListener`, added on dialog open, removed on `killDialog()`).

All 5 land in **one commit** (mirroring §6's original 5-bug commit),
each with a regression test.

**Top cleanup findings** (each audit agent's full list is longer; this is
the priority cut that shaped the execution plan below):

- **`create-field.js` split**: 1,362 lines → proposed 7 modules (core +
  one per field type: text/numeric/select/multiselect/boolean/multiplex).
  `_createMultiplexField` alone is 519 lines doing ~10 jobs flattened
  into one function. `field.disabled` boilerplate duplicated 5-6x across
  field types. Dead: `field.parseMainFieldVal` (never called anywhere,
  confirmed via grep incl. built dist bundle), dead local `unitInput` in
  `_handleFieldUnits`. Cross-file API names that MUST survive any split
  unchanged (reached by name from other mixin files):
  `singleSelectValue`, `_changeMultiFieldValue`,
  `checkMultiplexCompletion`, `applyMultiplexSubFieldColor`.
- **Cross-file duplication**: `plate-map.js`'s `getWellsDifferences`
  (~125 lines) and `svg-events.js`'s `_buildCommonData`/`_getCommonData`
  independently reimplement "diff fields across all wells" — biggest
  de-dup target outside create-field.js. They're not byte-identical
  today (deleted-vs-`[]` handling differs between them) so unifying is a
  conscious decision, not a mechanical merge — needs characterization
  tests pinning both current behaviors on the disagreement case *before*
  any unification. Also: the known color-wraparound-formula duplication
  (`svg-create.js` vs `bottom-table.js`) is confirmed non-identical in
  its two copies — they divide by different array lengths
  (`wellColors.length` vs `colorPairs.length`) that only coincidentally
  match today.
- `plate-map.js:3` — dead `plateMapWidget: {}` property that also
  name-collides with the global `plateMapWidget` mixin registry the
  whole architecture depends on. Real trap for whoever writes the
  ES-module conversion.
- `add-tab-data.js` — DOM-skeleton block copy-pasted 3x near-verbatim
  across `_makeSubField`/`_makeRegularField`/`_makeMultiplexField`, plus
  a duplicated id/type-autoassignment block.
- Dead code: `add-warning-msg.js`'s `removeWarningMsg` (unreferenced
  anywhere, also inconsistent with its own name/behavior vs. the
  function that IS used, `fieldWarningMsg`).
- Tiny-file merge candidates: `image_assets.js` + `color-manager.js`
  (both pure static data, zero logic → could become one `constants.js`);
  `add-data-to-tabs.js` (19 lines, single method, only called from
  `svg-events.js` outside its own file group).
- A 6th coupling zone (supplementing §10.3's 5): `preset.js` ↔
  `check-box.js` call each other's `_`-prefixed "private" methods
  directly, undocumented.
- Documentation gaps: no method across ~30+ functions in these files
  carries a docblock; create-field.js's implicit 6-method "field"
  contract (`disabled`/`parseValue`/`getValue`/`setValue`/`getText`/
  `parseText`, re-established independently by every field-type
  constructor) is never written down anywhere.

### 10.5 `/challenge` on the initial staged plan — 5 real gaps found and closed

Ran `/challenge` against the first draft of the execution plan. All 5
findings were addressed (see the plan file, or the summary below):

1. **New shared-namespace risk**: the `create-field.js` split promotes
   module-scope-private helpers (`select2close`/`select2fix`/
   `select2setData`) to instance methods — this creates brand-new shared
   namespace surface never covered by §10.3's "zero collisions" finding
   (which only checked names that already existed). *Response*: any new
   method name the split introduces must be grepped against all files +
   jQuery UI's own `$.Widget` internals before being locked in.
2. **Dead-code deletions verified only via local-repo grep, not against
   real consumers** — directly contradicts the "will not break in any
   capacity whatsoever" hard constraint. *Response*: gate every deletion
   on cross-repo verification; downgrade to document-and-defer for
   anything unverifiable. (Since resolved — see §10.6.)
3. **Cross-file dedup could silently pick a winner** between
   `getWellsDifferences`/`_getCommonData`'s already-disagreeing
   implementations, and the existing suite might not exercise the exact
   disagreement case. *Response*: characterization tests targeting that
   case are now a hard prerequisite before any unification.
4. **The ajax-branch fix ships with zero test coverage** in either
   direction (branch never exercised in 6+ years) — "suite green" would
   prove nothing about whether the fix is correct. *Response*: a
   dedicated test is now required as part of the Stage 1 commit.
5. **The original Stage 3 was one atomic, non-bisectable step** covering
   module conversion AND both test-harness reworks at once — the
   highest-blast-radius part of the project, with a silent assumption
   that Vite's default transform (esbuild) matches current Babel
   behavior. *Response*: restructured into checkpointed sub-stages (see
   §10.7), explicit Babel-vs-esbuild decision grounded in inspecting real
   current build output, incremental file-by-file conversion, old
   pipeline kept shippable in parallel until the new one is verified.

### 10.6 Follow-up investigation — 5 more findings, all resolved or
### precisely scoped (this was NOT hypothetical — verified against real
### consumers)

After `/challenge`, asked "what else am I missing" and got 5 more
findings, all folded in. Two were closeable purely by reading code in
this session; two more turned out to be answerable by reading `ebase`'s
actual source directly (it's present locally at
`/Users/jmiller/Documents/NEB/ebase`) instead of staying hypothetical —
and that changed a **real** Stage 3 requirement, not just added a
caveat. The fifth genuinely needs a build to run, so it's now Stage 0.

**#1 — Module-level mutable state (same bug class as #11): CONFIRMED
CLEAN, one adjacent new bug found.** A dedicated audit read all 18 files
specifically for mutable state declared outside each factory's
per-instance closure (`new plateMapWidget[component](this)` creates a
fresh closure per widget instance, so state *inside* a factory is
instance-safe; state declared as a sibling to the factory, at
file/IIFE scope, would be shared across every instance on a page today —
same bug class as #11, but via JS state instead of DOM queries).
**Verdict: clean across all 18 files.** The only module-scope
declarations outside a factory anywhere are `create-field.js`'s
`select2close`/`select2fix`/`select2setData`, confirmed definitively
**stateless** (no closure variable persists across separate calls) — so
promoting them to instance methods during the split (per the audit
above) is a style choice, not a correctness fix, and carries no risk
either way. This audit is what surfaced bug #5 above
(`window.onclick`).

**#2 — CSS/asset bundling under Vite: RESOLVED, low-risk.** Checked the
actual current build: `gulpfile.js`'s `css` task already concatenates
`src/css/*.css` into a **separate** `dist/css/plate-map.css` + `.min.css`
(own sourcemap), fully independent of the JS bundle —
`package.json` even has distinct `"main"` and `"style"` fields. So
"single self-contained file" was never literally true even today — it's
"one JS file + one CSS file" — and Vite's default CSS-extraction
behavior is consistent with current practice, not a deviation. Only real
requirement: matching filenames/paths, since `ebase`'s own asset
pipeline (see `#4`) references `plate-map.css`/`plate-map.js` by those
exact names.

**#4 — Distribution/consumption mechanism: RESOLVED by directly reading
`ebase`'s source. This is the big one — it changed a concrete Stage 3
requirement, not just added a caveat:**

- `ebase` does **NOT** consume `plate-map` via npm. It vendors the
  *built* file directly into git at `vendor/javascript/plate-map.js` (+
  `plate-map.css`), wired through Rails **importmap**
  (`config/importmap.rb`: `pin 'plate-map', to: 'plate-map.js'`) and
  served via the Rails asset pipeline. Updates are **manual**:
  `importmap.rb`'s own header comment documents the workflow as
  `bin/importmap pin <package> --download`, review the diff, commit —
  same as bumping a vendored gem. Rollback path = `git revert` on that
  vendored file inside `ebase`'s own repo, not an npm version pin.
- **Sprockets does zero further processing** — per `importmap.rb`'s own
  comment, "does not compile, transpile, or bundle them." Whatever
  syntax/format ships in the new `dist/js/plate-map.js` is *exactly* what
  `ebase`'s users' browsers execute, no downstream safety net. This
  raises the browserslist/transform-target decision (§10.7, Stage 3a/3b)
  from "good practice" to "the only thing standing between this and a
  production breakage for older browsers."
- **`ebase` loads it via plain `import 'plate-map'`** (real
  browser-native ESM import, side-effect only — categorized in
  `importmap.rb` under "Vendor libraries," separately from the section
  explicitly labeled "ES Module compatible," which only covers
  `clipboard`/`underscore`/`google-palette`). `ebase`'s importmap has
  **zero entries** for `jquery`/`jquery-ui-dist`/`select2`/`svgjs`/
  `clipboard`. **This means Vite's production build must emit UMD or
  IIFE format (externals read off existing `window` globals) — NOT
  `format: 'es'`.** An `es`-format bundle would emit bare
  `import $ from "jquery"` for each externalized dep, and the browser
  would fail to resolve it (no importmap entry exists) — a hard,
  immediate breakage. Vite library mode fully supports UMD/IIFE with
  `output.globals` mapping, so this is achievable, but must be a
  deliberate config choice, not an accidental default.
- **A broader "public API" surface than previously scoped**: `ebase`'s
  own app code (`app/javascript/packs/well_set_wells_create_plate_map.js`,
  `ce_experiment_show.js`) reaches directly into plate-map-generated
  **DOM class names**, independent of the documented JS methods — e.g.
  `.plate-setup-tab-name`, `.plate-setup-tab-default-field`,
  `.plate-setup-tab-multiselect-field`,
  `.plate-setup-tab-unit-select-field`,
  `.plate-setup-tab-multiplex-single-select-field`,
  `.plate-setup-tab-input`, `.plate-setup-preset-tab`, and
  `.plate-setup-overlay-button-container` (used to inject a "Save"
  button), for a click-action-logging feature. **"Zero behavior change"
  now explicitly includes exact CSS class names/DOM structure, not just
  JS method signatures** — the `add-tab-data.js` DOM-skeleton
  de-duplication and the `create-field.js` split must preserve every one
  of these verbatim.
- Confirmed concrete JS API surface actually exercised by `ebase`:
  `.plateMap({numRows, numCols, attributes, updateWells, selectedWells})`
  constructor options, `.plateMap("loadPlate", data)`,
  `.plateMap("clearHistory")`.
- **Dead-code verification — now actually closed, not just policy.**
  Grepped `ebase`'s own app code (excluding its vendored copy of
  plate-map, which trivially contains the same symbols as the source
  being audited) for all 4 dead-code candidates
  (`parseMainFieldVal`/`removeWarningMsg`/`colorToIndex`/dead
  `plateMapWidget: {}`) plus the three select2 helpers: **zero
  references anywhere in `ebase`'s actual application code.** Cleared to
  delete. `ebase` is the only consumer we have direct access to — "and
  potentially other apps" isn't 100% closed if another consumer exists
  we can't see, but this is far stronger evidence than local-repo-only
  grep, and worth a quick check-in rather than blocking on it.

**#5 — No CI safety net: CONFIRMED.** `find .github -type f` in
`plate-map` returned nothing — no CI workflows exist. Every stage's "run
tests after each commit" is currently pure manual discipline. Recommend
adding a minimal GitHub Actions workflow (`npm test` +
`npm run test:e2e` on push/PR) — standalone, cheap, no dependencies on
anything else in this plan.

**#3 — Vite/externals wiring assumption: can't be resolved by reading
code, needs an actual build.** Turned from a vague "prototype it
eventually" into a precise, falsifiable test once `#4` was resolved —
now **Stage 0** (see §10.7): prove a throwaway Vite library-mode build,
in UMD/IIFE format with externals mapped to `window` globals, loads
correctly with zero importmap entries for those externals, exactly
matching `ebase`'s real setup. Pulled forward to run *before* Stage 2's
cleanup investment, since it's the load-bearing assumption behind the
whole Vite decision.

### 10.7 Stage 0 — DONE: Vite/UMD feasibility spike + CI

**Vite/UMD spike: confirmed working, exactly as needed.** Built a
throwaway library in an isolated scratch project (not committed to this
repo — Vite was never added as a dependency here): one entry file
`import $ from 'jquery'`, using it for a side effect (a jQuery plugin
registration, same shape as `$.widget(...)`), with `jquery` marked
`external` and `output.globals: {jquery: 'jQuery'}`, built via Vite's
library mode in `formats: ['umd']`. Inspected the output directly — a
genuine UMD wrapper with **zero** `import`/`export` syntax anywhere:
```
(function(e,i){typeof exports=="object"&&typeof module<"u"?i(require("jquery")):typeof define=="function"&&define.amd?define(["jquery"],i):(e=typeof globalThis<"u"?globalThis:e||self,i(e.jQuery))})(this,function(e){...});
```
Then executed it in a sandbox deliberately reproducing `ebase`'s exact
real setup (§10.6 #4): `jQuery` pre-set as a bare global, **zero**
importmap/module-resolution entries for it, `require()` wired to throw
if called (to catch an accidental wrong-branch execution), no
AMD `define`. Result: the browser-global branch ran correctly, read
`globalThis.jQuery` (which is `window.jQuery` in any real browser),
attached the plugin to the *same* external `jQuery` instance rather than
a separately bundled copy (`sameJQueryInstance: true`), no errors. This
directly de-risks the Vite decision before any Stage 2 cleanup investment
— confirmed the mechanism Stage 3 depends on actually works, not just
"should work in theory."

**CI: added.** `.github/workflows/test.yml` — `npm test` (Jest) +
`npm run test:e2e` (Playwright, Chromium) on push to `master` and on
every PR, with a report artifact uploaded on failure. Closes the gap
found in §10.6 #5 (no CI existed at all; every stage's "run the suite"
was pure manual discipline until now).

### 10.8 Approved execution plan (staged) — Stage 1 done, Stage 0 done

Full detail lives in the plan-mode file
`/Users/jmiller/.claude/plans/polished-cuddling-hippo.md` (approved by
the user; kept here as the durable summary in case that file isn't
resumable in a future session):

- **Stage 1 — DONE**: the 5-bug commit (`a374a6c`), each with a
  regression test. Full suite green (108 Jest + 31 Playwright).
- **Stage 0 — DONE**: Vite/UMD feasibility spike (confirmed — see 10.7)
  + minimal CI workflow added.
- **Stage 2 (next)** (in-place cleanup, still plain global-mixin scripts, zero
  test-harness rework needed since files stay non-ES-module — the mixin
  merge has no real load-order dependency, confirmed in §10.3): (1) dead
  code removal — cleared per §10.6; (2) mechanical intra-file
  de-duplication, CSS class names must survive byte-for-byte per §10.6's
  `#4` finding; (3) the `create-field.js` split, gated on the
  new-method-name collision check per §10.5; (4) cross-file de-dup
  (`getWellsDifferences`/`_getCommonData`, the color-wraparound formula),
  gated on characterization tests per §10.5; (5) tiny-file merges; (6)
  documentation pass. Each sub-step independently committable, full
  Jest+Playwright suite must pass after each.
- **Stage 3** (only after Stage 2 lands): ES modules + Vite, restructured
  into checkpointed sub-stages per §10.5's finding #5 — ground-truth
  current build output (3a), explicit Babel-vs-esbuild decision (3b),
  **UMD/IIFE output format required** per §10.6's `#4` finding (3b-2),
  incremental file-by-file conversion with the old pipeline kept
  shippable in parallel (3c), test-harness rework (3d — `test/unit/
  setup.js`'s `global.eval()` and `test/e2e/server.js`'s raw `<script>`
  serving both need reworking for real ES modules), Vite production
  config (3e), and a final manual smoke-test + dist-diff gate before
  retiring the old pipeline (3f).

### 10.9 Stage 2, sub-step (1) — DONE

Dead code removal completed and committed (`d21af01`): `svg-events.js`'s
`colorToIndex`, `create-field.js`'s dead local `unitInput` in
`_handleFieldUnits` plus dead `field.parseMainFieldVal`, `add-warning-
msg.js`'s `removeWarningMsg`, and `plate-map.js`'s dead `plateMapWidget:
{}` property. Full suite green after removal (108 Jest + 31 Playwright),
verified before and after the change. Pushed to origin.

### 10.10 Stage 2, sub-step (2) — DONE

Mechanical intra-file de-duplication in `add-tab-data.js` completed and
committed (`f0ff953`): extracted `_autoAssignFieldIdAndType(data)` (the
id/type-fallback block duplicated between `_addTabData` and
`_makeSubField`) and `_createFieldWrapper(data, tabPointer)` (the DOM
skeleton copy-pasted near-verbatim across `_makeSubField`/
`_makeRegularField`/`_makeMultiplexField`). No CSS class names or DOM
structure changed — the only literal differences removed were pure
no-ops (`_makeSubField`'s redundant `$(...)` re-wrapping of already-jQuery
objects, and a stray trailing space inside one class-literal string that
jQuery's `addClass` already ignores). Full suite green (108 Jest + 31
Playwright, incl. the pixel-diff visual-snapshot test) before and after.
Note: `create-field.js`'s own intra-file duplication (`field.disabled`
boilerplate repeated 5-6x across field types, per §10.4) was intentionally
left for Stage 2 sub-step (3)'s `create-field.js` split rather than
de-duped here, since that file's restructuring is its own dedicated step.

### 10.11 Stage 2, sub-step (3) — DONE: the create-field.js split

Split completed and committed as 7 sequential commits (`85b031f` through
`5f784f8`), matching the original audit's 7-module proposal exactly:
`create-field-core.js` (dispatcher, units add-on, `_createOpts`, and the
3 select2 helpers promoted from module-scope functions to instance
methods), `create-field-text.js`, `create-field-numeric.js`,
`create-field-select.js`, `create-field-multiselect.js` (plus the
delete-dialog trio, traced as multiselect-only despite living far from
`_createMultiSelectField` in the original file), `create-field-boolean.js`,
`create-field-multiplex.js`. The old `create-field.js` (1,368 lines) is
retired in the final commit.

Key implementation details worth knowing if this needs revisiting:
- The collision-check gate from §10.5 was run before locking in the
  promoted helper names (`select2close`/`select2fix`/`select2setData`):
  zero collisions anywhere in-repo, `jquery-ui-dist`, or `select2`.
- `select2close` is still registered as a **raw, unbound** event handler
  via `input.on('select2:unselecting', this.select2close)` inside
  `select2fix` — calling it as `this.select2close(...)`/
  `that.select2close(...)` directly would have rebound its internal
  `this` from the DOM element to the widget instance and broken it; this
  was deliberately preserved.
- All cross-file API names required to stay stable per §10.4
  (`singleSelectValue`, `_changeMultiFieldValue`,
  `checkMultiplexCompletion`, `applyMultiplexSubFieldColor`) are
  unchanged.
- `create-field.js`'s own intra-file duplication noted in §10.4/§10.10
  (`field.disabled` boilerplate repeated 5-6x across field types) was
  **not** de-duped as part of this split — it was explicitly scoped only
  as a file-boundary reorganization, not a behavior-preserving-refactor
  of the duplicated logic itself. That boilerplate still exists,
  duplicated across the new per-field-type files; it remains a candidate
  for a future pass (not currently scheduled in Stage 2's remaining
  sub-steps (4)-(6), which target different, already-identified
  duplication).
- Full suite verified green (108 Jest + 31 Playwright, incl. pixel-diff
  visual-snapshot and the select2fix-specific regression test) at the
  final cutover commit specifically, plus a real `gulp build.dist` run
  confirmed the built bundle contains every relocated method under its
  original name.

### 10.12 Stage 2, sub-step (4a) — DONE: getWellsDifferences was dead
### code, not a live duplicate — re-scoped and resolved

§10.4's original framing of `getWellsDifferences`/`_getCommonData` as
"two live, disagreeing implementations requiring characterization tests
before unification" turned out to be wrong once actually investigated
this session. `getWellsDifferences` (`plate-map.js`) had **zero callers**
anywhere — not in this repo's `src/js`, not in its tests, not in
`ebase`'s current app code. Git archaeology (both repos) confirmed why:
it was real, live functionality from 2018 (`ebase` called it via the
then-named `plateLayOut` widget to power a "generate sample names from
well differences" feature), survived the 2019 `plateLayOut`→`plateMap`
rename, but `ebase`'s own commit `6daccfcf7` ("move javascript back to
it's original spot, remove some files, and fix imports", Oct 13 2023)
deliberately deleted that feature's caller. No replacement caller was
ever added — it's been orphaned in `plate-map` for ~2 years.

Removed in commit `6790c73`, along with `containsObject` (used
exclusively by the now-gone `getWellsDifferences`; its only other
reference anywhere was already a dead, commented-out call) and that
stale comment. `_getCommonWell` was checked and kept — it has a separate
live caller (`svg-events.js:347`), unrelated to this cleanup. Full suite
green after removal (108 Jest + 31 Playwright).

**Lesson for future audit-derived work in this repo**: treat "two
implementations look like they duplicate the same logic" claims from a
static-read audit as a hypothesis to verify against actual call sites
(including the real consumer's current code and git history), not a
given — the actual finding here was much lower-risk (plain dead-code
deletion) than the audit's original framing (behavior-preserving merge
of two live, disagreeing paths) suggested.

### 10.13 Stage 2, sub-step (4b) — DONE: color-wraparound formula unified

Re-verified before touching anything (per §10.12's lesson): unlike
sub-step (4a), both call sites here ARE live — `svg-create.js`'s
`setTileColor` (tile fill, keyed off `wellColors.length`) and
`bottom-table.js`'s `addBottomTableRow` (swatch CSS gradient, keyed off
`colorPairs.length`). But the original audit's "confirmed
non-identical... only coincidentally match" framing was itself
incomplete: `wellColors` is built via `this.colorPairs.map(...)` in
`svg-create.js`'s `_createSvg`, so `wellColors.length ===
colorPairs.length` is a structural invariant of the code, not a runtime
coincidence — safe to unify.

Sequence: (1) added the missing characterization test for
`bottom-table.js`'s side first (`ec2556a`) — `svg-create.js`'s side
already had 3 tests in `test/unit/engine-grouping.test.js`, but the
bottom-table swatch had zero coverage; verified the exact wraparound
mapping empirically via a throwaway scratch test before writing the
real one. (2) Extracted `color-manager.js`'s `_wrapColorIndex(color)`
(that file already owns `colorPairs`, the natural home) and updated
both call sites to use it (`df095f0`). Pure de-dup, no formula/behavior
change. Full suite green: 109 Jest (108 + the new test) + 31 Playwright,
including the pixel-diff visual-snapshot test and the dedicated
bottom-table color-swatch click regression test.

This closes out all cross-file duplication originally flagged in §10.4
— both `getWellsDifferences`/`_getCommonData` (§10.12, turned out to be
dead code, not a live duplicate) and the color-wraparound formula
(§10.13, now unified) are resolved. Stage 2 sub-step (4) is complete.

### 10.14 Stage 2, sub-step (5) — `image_assets.js`+`color-manager.js`
### merge REJECTED after recheck; premise no longer holds

Re-checked the "both pure static data, zero logic" premise before
merging, as flagged in §10.13. It no longer holds: `color-manager.js`
now carries real logic (`_wrapColorIndex`, added in sub-step (4b)) with
its own cross-file callers (`svg-create.js`, `bottom-table.js`), while
`image_assets.js`'s `_assets` data has a completely different,
unrelated set of callers (`add-warning-msg.js`, `check-box.js` — warning
icons and checkbox glyphs, nothing to do with color/rendering). The two
files no longer share a "pure inert data bag" identity; merging them
into one `constants.js` would bundle unrelated concerns (warning-icon
HTML snippets + color-wrap logic) under a name that misrepresents both.
**Decision: skip this merge, leave both files as-is.** No source changes
made for this item — it's a no-op, correctly recorded here rather than
silently dropped.

### 10.15 Stage 2, sub-step (5) — DONE (both items resolved: one merge
### rejected, one merge completed)

Re-verified the `add-data-to-tabs.js` premise before merging, per
§10.13's lesson: still 19 lines, still one method
(`_addDataToTabFields`), still called exclusively from `svg-events.js`'s
`decideSelectedFields` (line 310) — unchanged since the original audit.
Folded the method into `svg-events.js` immediately after its sole call
site (commit `242ba2b`), deleted the now-empty `add-data-to-tabs.js`.
Pure relocation, no logic change. Full suite green: 109 Jest + 31
Playwright, plus a real `gulp build.dist` verified to succeed with the
bundle containing exactly the expected 2 references (definition + call
site) to the relocated method.

Combined with §10.14's rejected `image_assets.js`/`color-manager.js`
merge, this closes out Stage 2 sub-step (5) — both tiny-file-merge
candidates from the original audit have now been resolved (one
correctly rejected after its premise changed, one correctly executed
after its premise was reconfirmed).

### 10.16 Stage 2, sub-step (6) — DONE: documentation pass complete;
### Stage 2 is now fully complete

Added file-level and method-level docblocks/comments across all 24
`src/js/` files in one pass (single commit, per user decision), docs-
only with zero logic changes (commit `f0da41b`). Full suite verified
green both before starting and after finishing (109 Jest + 31
Playwright), plus a real `gulp build.dist` run confirmed the build
pipeline still succeeds cleanly with the new comments in place.

Key content added, worth knowing if extending this further:
- `create-field-core.js` now documents **THE FIELD CONTRACT** in full —
  the implicit 6-method contract (`disabled`/`parseValue`/`getValue`/
  `setValue`/`getText`/`parseText`) every field-type constructor
  independently re-establishes, flagged as missing documentation in
  §10.4. Also documents the units decorator
  (`_handleFieldUnits`/`_makeFieldUnits`) that wraps those 6 methods for
  units-configured fields.
- Every `create-field-*.js` file's header now states that field type's
  internal storage shape (e.g. numeric fields store a trimmed STRING,
  not an actual JS number; multiplex fields store an array of per-option
  entries with independent subfield values).
- `create-field-multiplex.js`'s 4 cross-file API names required to stay
  stable (`singleSelectValue`, `_changeMultiFieldValue`,
  `checkMultiplexCompletion`, `applyMultiplexSubFieldColor` — §10.4) are
  each individually annotated at their definition site explaining why
  the exact name matters, not just listed once in a header comment.
- `plate-map.js`'s header explains the address/loc/index coordinate
  systems used throughout the codebase (a genuinely load-bearing but
  previously-undocumented convention every other file relies on).
- `engine.js`'s header clarifies its specific `THIS` (capitalized, outer
  widget instance) vs `this` (the engine object itself) convention.
- `image_assets.js`/`color-manager.js` each cross-reference §10.14's
  rejected merge decision directly in their own file, so a future reader
  doesn't have to rediscover REFACTOR_NOTES.md to learn that merge was
  already considered and rejected.
- Every existing REFACTOR_NOTES.md-linked inline comment (bug
  explanations, characterization-test cross-references, etc.) was left
  untouched — this pass only ADDED documentation, never edited or
  removed an existing comment.

**This completes Stage 2 in full** (sub-steps (1) through (6), per the
staged plan in §10.8): dead code removal, intra-file de-dup, the
`create-field.js` split, cross-file de-dup, tiny-file merges, and now
documentation. The codebase is still plain global-mixin scripts (no
ES-module conversion has happened) but is meaningfully cleaner,
better-documented, and has zero known dead code or duplicated logic
left over from the original audit.

### 10.17 RESUME HERE (session paused at end of this day, nothing
### further done past this point)

Working tree is clean; everything through Stage 2 (all 6 sub-steps) is
committed on `refactor/#119-cleanup_and_reorganize` and pushed to
origin. Nothing merged to `master`; no PR opened (standing constraint:
don't, without explicit approval).

**Next action, not yet started**: Stage 3 — the actual ES-module + Vite
conversion, restructured into checkpointed sub-stages per §10.5's
finding #5 (see §10.8 for the full sub-stage breakdown): 3a (ground-truth
current build output), 3b (explicit Babel-vs-esbuild decision, **UMD/
IIFE output format required** per §10.6's `#4` finding), 3c (incremental
file-by-file conversion, old pipeline kept shippable in parallel), 3d
(test-harness rework — `test/unit/setup.js`'s `global.eval()` and
`test/e2e/server.js`'s raw `<script>` serving both need reworking for
real ES modules), 3e (Vite production config), 3f (final manual
smoke-test + dist-diff gate before retiring the old pipeline). This is
the highest-blast-radius part of the whole project (per §10.5's original
challenge finding) and deserves careful, deliberate planning at the
start of a fresh session rather than diving straight into 3a.

Nothing else is pending or half-finished — no open questions, no
uncommitted edits, no partially-applied fixes.
