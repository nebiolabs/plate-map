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

## 6. Real bugs found and characterized — **none fixed**

These are pinned down as tests asserting *actual current behavior*
(including where that behavior throws), with comments explaining each is a
known/possible bug, not a spec. Ranked roughly by severity:

1. **`setSelectedAddresses(addresses)` throws for ANY call with 2+
   addresses.** `load-plate.js`'s `sanitizeAddresses`:
   `selectedAddresses.map(this.addressToIndex, this)`. `Array#map` invokes
   its callback as `(element, index, array)`; passed as a bare method
   reference, `addressToIndex`'s second parameter (`dimensions`) receives
   the **array index** instead of a real dimensions object. Index 0 is
   falsy so it happens to fall back to `this.dimensions` correctly — index
   1+ is a truthy `Number`, so `dimensions.rows`/`dimensions.cols` are
   `undefined`, and the bounds check in `locToIndex` (`loc.r < dimensions.rows`,
   and `< undefined` is always `false`) fails and throws `"Row index N
   invalid"` for a perfectly valid, in-range address. **This means a
   documented "Major Function" is currently broken for its stated use case**
   — any embedder calling it with 2+ addresses gets an exception. This is
   the one bug severe enough that the user was asked directly whether to
   patch it now, separately from the refactor — **that question was
   interrupted and never answered; see "Open questions" below.**
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

- [ ] **Answer the interrupted question**: how to handle bug #1
      (`setSelectedAddresses` 2+ addresses) — fix now as its own small
      commit, fix as part of the refactor, or leave it as-is. See "Open
      questions" below.
- [ ] Playwright real-browser test layer: drag-select mechanics (including
      the row/column-gutter special case), tab switching, checkbox → bottom
      table, multiplex add/remove dialogs, undo/redo via actual UI/keyboard
      shortcuts, a **dedicated two-instances-on-one-page test**, CSV/
      clipboard export, and some visual/DOM snapshot coverage.
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

1. **Bug #1 fix timing** (asked, not yet answered — the user interrupted
   with `/challenge` instead): fix `setSelectedAddresses` now as an
   isolated commit, fold the fix into the refactor, or leave it exactly
   as-is for now? Ask again before proceeding.
2. Whether to continue straight to the Playwright layer next, or the user
   wants to review the Jest suite / this documentation first.
