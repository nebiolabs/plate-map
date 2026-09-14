# Plate-Map Refactor — Session Log & Handoff (Issue #119)

**Read this whole file before doing anything else on this branch.** It is the
full narrative of how this branch got to its current state: the original
request, what was investigated, every decision the user made, what's actually
been built, every real bug found (none fixed), and — importantly — a
self-critique of the test suite's own limits that the user deliberately
pushed for. Do not assume the Jest suite is a sufficient "before" baseline
for the refactor until you've read the "Self-critique" section below.

- Branch: `refactor/#119-cleanup_and_reorganize`, pushed to `origin`.
- Base: `master` at `a0439cf` (post dependency-bump merges, pre-refactor).
- **No `src/js/` file has been modified. No bug has been fixed. No build
  tooling has changed. The refactor itself has not started.** Everything so
  far is: git/issue cleanup (done), a Jest characterization-test layer
  (done), and this documentation (in progress).
- **One question to the user was left unanswered** when they interrupted to
  run `/challenge` instead — see "Open questions to resume with" at the
  bottom. Ask it again before proceeding past this point.

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
10. **NEW, found while building the Playwright layer (not previously
    known/characterized): a numeric field configured with NEITHER `units`
    NOR `defaultUnit` throws on every single edit and NEVER saves the typed
    value, silently, for the field's entire lifetime.** `create-field.js`'s
    `_createNumericField` wires its own `"input"` handler
    (`create-field.js:618`) as:
    ```js
    input.on("input", function() {
      let v = field.getRegularValue();   // <-- throws here
      ...
      field.onChange();                  // <-- never reached
    });
    ```
    `field.getRegularValue` is defined **only** by `_makeFieldUnits`
    (`create-field.js:100`), which `_handleFieldUnits` calls **only** when
    `units.length` ends up non-zero — true when *either* `units` or
    `defaultUnit` is configured (`defaultUnit` alone makes
    `units = [defaultUnit]`, see `_handleFieldUnits`, `create-field.js:62`–
    `89`). With **neither** configured, `getRegularValue` is never defined
    at all, so every keystroke throws `TypeError: field.getRegularValue is
    not a function` before `field.onChange()` runs — the value is silently
    lost, with no exception surfaced to the embedder (it's an in-page
    uncaught error inside a jQuery event handler, not a thrown/returned
    error from any public method).

    **Precisely scoped to numeric fields**: confirmed by reading
    `_createTextField`/`_createSelectField`/`_createBooleanField`/
    `_createMultiSelectField`'s own change handlers — none of them call
    `getRegularValue`.

    **Notably**: `example/example.js`'s own bundled demo has a multiplex
    subfield (`dilution_factor`) with its `defaultUnit` commented out —
    i.e. the shipped example already contains a field shaped exactly like
    this. Nothing in the repo currently proves anyone has typed into that
    particular demo field and noticed the silent failure.

    Characterized (not fixed) in `test/e2e/field-editing.spec.js`, plus a
    positive control (numeric *with* units, which works). This one hasn't
    been discussed with the user yet — raise it and ask about fix timing
    the same way bug #1 was handled, rather than assuming.
11. **NEW, found while writing the dedicated two-instances-on-one-page test
    §7 point 4 explicitly asked for (not previously known/characterized):
    two widget instances on one page are currently unsafe together in two
    separate, concrete ways** — the self-critique's abstract "unscoped
    `document.querySelectorAll` calls are dangerous for multi-instance
    embedders" concern, now with real repros and a real stack trace:
    - **A crash, trivially reachable**: `selectObjectInBottomTab`
      (`plate-map.js:357`) does
      `document.querySelectorAll('table.plate-setup-bottom-table tr')` —
      page-wide, not scoped to `this` widget's own container — then
      `for (let i = 1; i < trs.length; i++)`, skipping exactly **one** row
      (meant to skip "the" header row). With two widgets on the page this
      combines both tables' `<tr>`s into one list; only the *first*
      widget's header is skipped, so the *second* widget's own header row
      (a `<th>`, no `<button>` inside it) is walked into as if it were a
      data row, and `td.querySelector('button').innerHTML` throws on the
      `null`. **This fires on the very first `loadPlate`/checkbox call on
      ANY widget as soon as a second widget instance merely exists
      anywhere on the page — the second widget never has to be touched at
      all.** Confirmed via a real stack trace: `selectObjectInBottomTab` →
      `applyColors` (`engine.js:153`) → `_colorMixer` →
      `setCheckboxes`/`changeCheckboxes` → `setData` → `loadPlate`. This is
      about as severe as anything in this list: it means the widget is not
      merely "risky" with 2+ instances on a page, it is **currently
      guaranteed-broken** the moment a second instance exists and either
      one ever calls `loadPlate`/changes a checkbox.
    - **Silent cross-instance data leakage, no crash**: `exportData`
      (`bottom-table.js`) does `document.querySelectorAll("table tr")` —
      even more unscoped than the above (every `<table>` on the whole
      page, not even limited to `.plate-setup-bottom-table`). Confirmed
      (in the cold-start state specifically, so this doesn't depend on the
      crash above): calling `exportData('clipboard')` on ONE freshly-
      created widget while a second, completely untouched widget exists
      elsewhere on the page returns a clipboard string containing **both**
      widgets' `"Group"` header rows concatenated together.

    Both characterized (not fixed) in `test/e2e/multi-instance.spec.js`.
    Not yet discussed with the user — raise alongside bug #10 above.

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
- [x] Playwright real-browser test layer, mostly: drag-select mechanics
      (including the row/column-gutter special case and regression coverage
      for the §6 #1 drag-select sort fix), real select2 UI (including the
      select2fix workaround), tab switching, checkbox → bottom table,
      multiplex add/remove dialogs, undo/redo via actual keyboard shortcuts,
      and a **dedicated two-instances-on-one-page test** (which surfaced §6
      #11, a real crash). Found one more new bug along the way (§6 #10,
      numeric fields without units). **Still missing**: CSV/clipboard
      *download* specifically (clipboard export via `exportData('clipboard')`
      is exercised as a side effect of the multi-instance test, but no
      dedicated export-correctness test exists yet), and any visual/DOM
      snapshot coverage. Also not committed to origin yet — same as above.
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

## 9. Open questions to resume with

Both prior open questions are now answered: bug #1 (and its audit-found
siblings) fixed now, per §6 #1 above; next step is the Playwright layer
(confirmed by the user, not yet started). No open questions remain as of
this update — pick up with Playwright.
