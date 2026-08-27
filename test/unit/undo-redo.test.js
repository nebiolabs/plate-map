/**
 * Characterization tests for the undo/redo subsystem (undo-redo-manager.js),
 * exercised through the public widget API. These tests pin down CURRENT real
 * behavior -- including surprising/buggy bits -- as a "before" baseline ahead
 * of a later refactor. They intentionally do NOT fix anything in src/js/.
 *
 * Relevant source read in full: src/js/undo-redo-manager.js
 * Relevant call sites skimmed: src/js/add-data-on-change.js (_addAllData,
 * createState, getPlate), src/js/load-plate.js (loadPlate, setData),
 * src/js/check-box.js (changeCheckboxes, setCheckboxes), src/js/plate-map.js
 * (setSelectedAddresses, setSelectedIndices).
 *
 * Key facts established by reading the code (verified below by running it):
 *
 * - loadPlate() calls setData(sanitized) with `quiet` left undefined, so
 *   `!quiet` is true and setData ALWAYS calls addToUndoRedo() at the end --
 *   i.e. every loadPlate() call unconditionally records a history entry.
 *
 * - setData(data, quiet) ALWAYS calls setCheckboxes(data.checkboxes, true)
 *   and setSelectedIndices(data.selectedIndices, true) -- the `true` there is
 *   the *noUndoRedo* flag for those sub-calls, hardcoded regardless of
 *   setData's own `quiet` param. So checkbox/selection changes made *through*
 *   setData never themselves push separate history entries; only setData's
 *   own trailing addToUndoRedo() (when not quiet) records anything, and it
 *   captures the post-setCheckboxes/post-setSelectedIndices state via
 *   createState().
 *
 * - loadPlate()'s sanitized payload passed to setData only ever has
 *   `derivative` and `checkboxes` keys -- it never sets `selectedIndices`.
 *   So `data.selectedIndices` is undefined inside setData, and
 *   setSelectedIndices(undefined, true) falls back to `indices = [0]`
 *   (its own "empty means select index 0" default). Net effect: loadPlate()
 *   ALWAYS resets selection to well index 0 (address "A1"), and any
 *   `selectedAddresses` key in the data object passed to loadPlate() is
 *   silently ignored (loadPlate.js never reads data.selectedAddresses at
 *   all). This is real, current behavior -- confirmed by test below.
 *
 * - undo()/redo() call setUndoRedo(), which calls setData(state, true) --
 *   quiet=true -- so undo/redo themselves never push new history entries.
 *
 * - addToUndoRedo() truncates any "future" entries past the current
 *   actionPointer before pushing the new state and resetting actionPointer
 *   to null (meaning "pointer is the end of the array").
 *
 * - setUndoRedo() bounds-checks pointer < 0 or >= length and returns false
 *   without mutating state in that case; otherwise it mutates state and
 *   returns true. Whether that boolean survives jQuery UI's widget bridge
 *   through `.plateMap("undo")` is verified empirically below.
 */

const simpleFields = [
  { required: true, id: 'volume', name: 'Volume', type: 'numeric', placeholder: 'Volume' }
];

const attributes = {
  tabs: [{ name: 'Settings', fields: simpleFields }]
};

function makeContainer() {
  const el = document.createElement('div');
  el.id = 'my-plate-map';
  document.body.appendChild(el);
  return el;
}

function makeWidget() {
  const el = makeContainer();
  const widget = window.jQuery(el);
  widget.plateMap({
    numRows: 8,
    numCols: 12,
    attributes,
    updateWells: () => {},
    selectedWells: () => {}
  });
  return widget;
}

// Small, clearly-distinct plate states.
const stateA = {
  wells: { A1: { volume: '5' } },
  checkboxes: ['volume']
};

const stateB = {
  wells: { A1: { volume: '99' }, A2: { volume: '1' } },
  checkboxes: ['volume']
};

const stateC = {
  wells: { A1: { volume: '42' } },
  checkboxes: ['volume']
};

afterEach(() => {
  document.body.innerHTML = '';
});

test('basic undo/redo round trip through loadPlate states', () => {
  const widget = makeWidget();

  widget.plateMap('loadPlate', stateA);
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('5');
  expect(widget.plateMap('getPlate').wells.A2).toBeUndefined();

  widget.plateMap('loadPlate', stateB);
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('99');
  expect(widget.plateMap('getPlate').wells.A2.volume).toBe('1');

  widget.plateMap('undo');
  let plate = widget.plateMap('getPlate');
  expect(plate.wells.A1.volume).toBe('5');
  expect(plate.wells.A2).toBeUndefined();

  widget.plateMap('redo');
  plate = widget.plateMap('getPlate');
  expect(plate.wells.A1.volume).toBe('99');
  expect(plate.wells.A2.volume).toBe('1');
});

test('undo() at the earliest history point is a no-op', () => {
  const widget = makeWidget();

  // NOTE: widget creation itself seeds history with one entry (an empty
  // plate) via _configureUndoRedoArray() (interface.js -> undo-redo-manager.js).
  // So after a single loadPlate(), history is [initial-empty, A] -- the
  // earliest reachable point via undo() is that initial empty plate, not
  // stateA itself.
  widget.plateMap('loadPlate', stateA);

  widget.plateMap('undo'); // -> initial empty plate (real, valid undo)
  const emptyPlate = widget.plateMap('getPlate');
  expect(emptyPlate.wells.A1).toBeUndefined();

  // Now we're at the true earliest history point. Further undo() calls must
  // be no-ops (setUndoRedo's pointer < 0 bounds check returns false without
  // changing state).
  widget.plateMap('undo');
  const plateAfter = widget.plateMap('getPlate');
  expect(plateAfter.wells.A1).toBeUndefined();

  // Repeated undo() calls past the boundary remain no-ops.
  widget.plateMap('undo');
  widget.plateMap('undo');
  expect(widget.plateMap('getPlate').wells.A1).toBeUndefined();
});

test('redo() at the latest history point is a no-op', () => {
  const widget = makeWidget();

  widget.plateMap('loadPlate', stateA);
  widget.plateMap('loadPlate', stateB);

  const plateBefore = widget.plateMap('getPlate');
  widget.plateMap('redo'); // already at the latest entry -- should no-op
  const plateAfter = widget.plateMap('getPlate');

  expect(plateAfter.wells.A1.volume).toBe(plateBefore.wells.A1.volume);
  expect(plateAfter.wells.A2.volume).toBe(plateBefore.wells.A2.volume);
  expect(plateAfter.wells.A1.volume).toBe('99');
});

test('setUndoRedo boolean return value surfaces through the public .plateMap() bridge', () => {
  const widget = makeWidget();

  // History right after widget creation is [initial-empty]. loadPlate(stateA)
  // appends: [initial-empty, A].
  widget.plateMap('loadPlate', stateA);

  // A real undo is possible (back to the initial empty plate): true.
  const undoResult = widget.plateMap('undo');
  expect(undoResult).toBe(true);

  // Now at the true earliest entry: a further undo() must fail
  // (bounds check pointer < 0).
  const undoResult2 = widget.plateMap('undo');
  expect(undoResult2).toBe(false);

  // New change while sitting at the earliest entry: addToUndoRedo() sees
  // actionPointer === 0 (not null), truncates everything after index 0
  // (dropping stateA), and pushes stateB -> history becomes [initial-empty, B].
  widget.plateMap('loadPlate', stateB);
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('99');

  // Undo back to the initial empty plate: true.
  const undoResult3 = widget.plateMap('undo');
  expect(undoResult3).toBe(true);
  expect(widget.plateMap('getPlate').wells.A1).toBeUndefined();

  // Redo forward to stateB: true.
  const redoResult = widget.plateMap('redo');
  expect(redoResult).toBe(true);
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('99');

  // Now at the latest entry again; a further redo() must fail (pointer >= length).
  const redoResult2 = widget.plateMap('redo');
  expect(redoResult2).toBe(false);
});

test('branch truncation: a new change after undo() discards the redo-able future', () => {
  const widget = makeWidget();

  widget.plateMap('loadPlate', stateA); // history: [initial, A]
  widget.plateMap('loadPlate', stateB); // history: [initial, A, B]
  widget.plateMap('loadPlate', stateC); // history: [initial, A, B, C]

  widget.plateMap('undo'); // -> B
  widget.plateMap('undo'); // -> A
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('5');

  // New change while actionPointer is in the middle of history. Per
  // addToUndoRedo(), this truncates everything after the current pointer
  // (i.e. discards B and C) before pushing the new state.
  const stateD = { wells: { A1: { volume: '7' } }, checkboxes: ['volume'] };
  widget.plateMap('loadPlate', stateD); // history: [initial, A, D]

  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('7');

  // redo() should now be a no-op -- B is gone, there is nothing ahead of D.
  const redoResult = widget.plateMap('redo');
  expect(redoResult).toBe(false);
  const plateAfterRedo = widget.plateMap('getPlate');
  expect(plateAfterRedo.wells.A1.volume).toBe('7');
  // Confirm we truly cannot reach the discarded state B (A1 volume '99',
  // A2 present) via any further redo attempts.
  widget.plateMap('redo');
  expect(widget.plateMap('getPlate').wells.A2).toBeUndefined();

  // Undoing from D goes back to A (not to the discarded B/C branch).
  widget.plateMap('undo');
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('5');
});

test('clearHistory() collapses history to a single (current) entry', () => {
  const widget = makeWidget();

  widget.plateMap('loadPlate', stateA);
  widget.plateMap('loadPlate', stateB);
  widget.plateMap('loadPlate', stateC);
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('42');

  widget.plateMap('clearHistory');

  // undo() must be a no-op: the only entry left is the current one.
  const undoResult = widget.plateMap('undo');
  expect(undoResult).toBe(false);
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('42');

  // A fresh change now starts a clean two-entry history from that point.
  widget.plateMap('loadPlate', stateA);
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('5');
  widget.plateMap('undo');
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('42');
});

test('undo() and redo() are quiet: they do not themselves push history entries', () => {
  const widget = makeWidget();

  widget.plateMap('loadPlate', stateA); // history: [initial, A]
  widget.plateMap('loadPlate', stateB); // history: [initial, A, B], pointer at B (null/end)

  widget.plateMap('undo'); // pointer -> A
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('5');

  // If undo() had (incorrectly) pushed a new history entry via setData's
  // quiet=true path, calling undo() again would move to yet another distinct
  // state rather than hitting the "initial empty plate" boundary predictably.
  // Real behavior: undo() calls setData(state, true) -- quiet -- so no entry
  // is pushed, and the history array is still exactly [initial, A, B].
  // A second undo() moves from A to the initial (pre-loadPlate) empty state.
  const secondUndoResult = widget.plateMap('undo');
  expect(secondUndoResult).toBe(true);
  const initialPlate = widget.plateMap('getPlate');
  expect(initialPlate.wells.A1).toBeUndefined();

  // A third undo() now hits the real boundary (index 0) and is a no-op.
  const thirdUndoResult = widget.plateMap('undo');
  expect(thirdUndoResult).toBe(false);

  // redo() twice should walk forward through exactly A then B, proving the
  // stack was never corrupted/extended by the earlier undo() calls.
  widget.plateMap('redo');
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('5');
  widget.plateMap('redo');
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('99');

  // And we're back at the true latest entry: one more redo() is a no-op.
  const finalRedoResult = widget.plateMap('redo');
  expect(finalRedoResult).toBe(false);
});

test('setSelectedAddresses pushes a history entry, and undo() reverts the selection', () => {
  const widget = makeWidget();

  widget.plateMap('loadPlate', stateB); // wells A1, A2; selection resets to A1 (index 0)
  expect(widget.plateMap('getSelectedAddresses')).toEqual(['A1']);

  // Change selection (default noUndoRedo is falsy -> this pushes a new
  // history entry, per plate-map.js setSelectedIndices).
  widget.plateMap('setSelectedAddresses', ['A2']);
  expect(widget.plateMap('getSelectedAddresses')).toEqual(['A2']);
  // The well data itself is untouched by a pure selection change.
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('99');

  const undoResult = widget.plateMap('undo');
  expect(undoResult).toBe(true);

  // Selection reverts to what it was in the snapshot taken at loadPlate(stateB)
  // time (A1), because state snapshots include selectedIndices.
  expect(widget.plateMap('getSelectedAddresses')).toEqual(['A1']);
  // Well data is unaffected either way.
  expect(widget.plateMap('getPlate').wells.A1.volume).toBe('99');

  const redoResult = widget.plateMap('redo');
  expect(redoResult).toBe(true);
  expect(widget.plateMap('getSelectedAddresses')).toEqual(['A2']);
});

test('BUG/QUIRK: loadPlate() ignores data.selectedAddresses entirely and always resets selection to A1', () => {
  const widget = makeWidget();

  // First put selection somewhere else and make sure it sticks.
  widget.plateMap('loadPlate', stateB);
  widget.plateMap('setSelectedAddresses', ['A2']);
  expect(widget.plateMap('getSelectedAddresses')).toEqual(['A2']);

  // Now call loadPlate() again, explicitly requesting A2 be selected via the
  // documented-looking `selectedAddresses` key. load-plate.js's loadPlate()
  // never reads data.selectedAddresses (only data.wells / data.checkboxes),
  // and setData()'s call to setSelectedIndices(data.selectedIndices, true)
  // always sees `undefined` for that key, which the "empty means index 0"
  // fallback turns into [0] ("A1"). So real behavior is: selection is always
  // silently reset to A1 after any loadPlate() call, regardless of what
  // (if anything) is passed as selectedAddresses.
  widget.plateMap('loadPlate', {
    wells: { A1: { volume: '1' }, A2: { volume: '2' } },
    checkboxes: ['volume'],
    selectedAddresses: ['A2']
  });

  expect(widget.plateMap('getSelectedAddresses')).toEqual(['A1']);
});
