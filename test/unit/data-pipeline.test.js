/**
 * Characterization tests for the "write" pipeline in src/js/add-data-on-change.js
 * (_addAllData, processWellData, _getMultiData, getPlate), exercised through the
 * public widget API. These pin down CURRENT real behavior -- including
 * surprising/buggy bits -- as a baseline before a later refactor. Nothing here
 * should be read as "this is how it SHOULD behave"; several assertions
 * document surprising/buggy behavior on purpose, with a comment explaining why.
 *
 * Relevant source read in full: src/js/add-data-on-change.js.
 * Relevant call sites read: src/js/create-field.js (_createMultiSelectField's
 * multiOnChange/select2:select/select2:unselect handlers around lines 449-563,
 * and _createMultiplexField's multiOnChange/_changeMultiFieldValue around
 * lines 718-1018), src/js/add-tab-data.js (fieldMap construction, subfield
 * onChange), src/js/load-plate.js (loadPlate/setData/sanitizeWell), src/js/
 * engine.js (wellEmpty), src/js/plate-map.js (isDisableAddDeleteWell,
 * setSelectedIndices).
 *
 * ACCESS PATTERN (verified empirically in a throwaway scratch test, since
 * deleted, before writing this suite):
 *   widget.plateMap('instance') -> instance.fieldMap['fieldId']
 * fieldMap is keyed by `field.full_id`, which for TOP-LEVEL fields (regular,
 * multiselect, multiplex -- but NOT multiplex subfields) equals `field.id`,
 * i.e. exactly the fieldId used in getPlate()/loadPlate() well data. Calling
 * `fieldMap['tags'].multiOnChange(added, removed)` (or the multiplex
 * equivalent) reaches the exact same function real select2 UI events call,
 * and correctly drives _addAllData -> processWellData -> _getMultiData,
 * verified by checking getPlate() afterward.
 *
 * MULTI-WELL SELECTION WORKAROUND (also verified empirically): per
 * address-math.test.js, setSelectedAddresses(addresses) throws for any call
 * with 2+ addresses (a real bug in sanitizeAddresses/addressToIndex).
 * `.plateMap('setSelectedIndices', [i, j], true)` bypasses the broken
 * address-sanitizing path entirely (it takes raw indices, no
 * sanitizeAddresses involved) and was confirmed working via getSelectedAddresses().
 */

const fields = [
  { required: false, id: 'volume', name: 'Volume', type: 'numeric', placeholder: 'Volume' },
  {
    id: 'tags', name: 'Tags', type: 'multiselect',
    options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }]
  },
  {
    id: 'reagent', name: 'Reagent', type: 'multiplex',
    options: [{ id: 'r1', text: 'Reagent1' }, { id: 'r2', text: 'Reagent2' }],
    multiplexFields: [
      { id: 'conc', name: 'Concentration', type: 'text' }
    ]
  }
];

const attributes = {
  tabs: [{ name: 'Settings', fields }]
};

function makeWidget() {
  const el = document.createElement('div');
  el.id = 'plate-map-' + Math.random().toString(36).slice(2);
  document.body.appendChild(el);
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

// See address-math.test.js: calling setSelectedIndices/setSelectedAddresses on
// a widget before any real data/checkbox has been loaded throws (selectObjectInBottomTab
// hits a button-less placeholder row). Loading real data first avoids it.
function loadMinimalData(widget) {
  widget.plateMap('loadPlate', {
    wells: { A1: { volume: '1' } },
    checkboxes: ['volume']
  });
}

describe('scalar field overwrite (processWellData non-merging assignment)', () => {
  test('a second loadPlate call for the same well/field fully replaces the prior scalar value', () => {
    const widget = makeWidget();

    widget.plateMap('loadPlate', { wells: { A1: { volume: '5' } }, checkboxes: ['volume'] });
    expect(widget.plateMap('getPlate').wells.A1.volume).toBe('5');

    // Same well, same field, different value -- processWellData's scalar
    // branch (`curWell[id] = newVal`) is a direct, non-merging assignment.
    widget.plateMap('loadPlate', { wells: { A1: { volume: '99' } }, checkboxes: ['volume'] });
    expect(widget.plateMap('getPlate').wells.A1.volume).toBe('99');
  });
});

describe('multiselect add/remove via field.multiOnChange', () => {
  test('adding to an empty field produces [optionId], then a second add appends preserving insertion order', () => {
    const widget = makeWidget();
    loadMinimalData(widget);
    const tagsField = widget.plateMap('instance').fieldMap['tags'];

    expect(widget.plateMap('getPlate').wells.A1.tags).toBeNull();

    tagsField.multiOnChange({ id: 'a' }, null);
    expect(widget.plateMap('getPlate').wells.A1.tags).toEqual(['a']);

    tagsField.multiOnChange({ id: 'b' }, null);
    // Real, verified order: new items are appended (not sorted/re-ordered).
    expect(widget.plateMap('getPlate').wells.A1.tags).toEqual(['a', 'b']);
  });

  test('removing one of several selected options removes only that one, others keep their relative order', () => {
    const widget = makeWidget();
    widget.plateMap('loadPlate', {
      wells: { A1: { tags: ['a', 'b', 'c'] } },
      checkboxes: ['tags']
    });
    const tagsField = widget.plateMap('instance').fieldMap['tags'];

    tagsField.multiOnChange(null, { id: 'b' });
    expect(widget.plateMap('getPlate').wells.A1.tags).toEqual(['a', 'c']);
  });

  test('BUG/QUIRK: removing the last remaining option leaves the stored value as exactly null, not []', () => {
    const widget = makeWidget();
    // volume is also set here so the well isn't fully empty (per
    // engine.wellEmpty) once tags clears out -- otherwise the well itself
    // gets deleted by the empty-well-deletion path (see the dedicated
    // describe block below) and there'd be no well left to inspect.
    widget.plateMap('loadPlate', {
      wells: { A1: { volume: '1', tags: ['a'] } },
      checkboxes: ['tags', 'volume']
    });
    const tagsField = widget.plateMap('instance').fieldMap['tags'];

    tagsField.multiOnChange(null, { id: 'a' });
    // _getMultiData explicitly converts an empty array back to null:
    //   if (preData && (preData.length === 0)) { preData = null; }
    const tags = widget.plateMap('getPlate').wells.A1.tags;
    expect(tags).toBeNull();
    expect(tags).not.toEqual([]);
  });
});

describe('empty well deletion / disableAddDeleteWell mode', () => {
  test('default mode: clearing all fields on a well deletes it entirely from getPlate().wells', () => {
    const widget = makeWidget();
    widget.plateMap('loadPlate', { wells: { A1: { volume: '5' } }, checkboxes: ['volume'] });
    expect(widget.plateMap('getPlate').wells.A1).toBeDefined();

    const instance = widget.plateMap('instance');
    instance.setSelectedIndices([0], true);
    // Clear the only non-default field on the well -- volume/tags/reagent all
    // become null, so engine.wellEmpty(well) is true and (outside
    // disableAddDeleteWell mode) add-data-on-change.js deletes the derivative
    // entry entirely.
    instance._addAllData({ volume: null });

    const plate = widget.plateMap('getPlate');
    expect(plate.wells.hasOwnProperty('A1')).toBe(false);
    expect(plate.wells.A1).toBeUndefined();
  });

  test('disableAddDeleteWell(true, overrides): clearing a well resets it to emptyWellWithDefaultVal instead of deleting it', () => {
    const widget = makeWidget();
    widget.plateMap('loadPlate', { wells: { A1: { volume: '5' } }, checkboxes: ['volume'] });

    const instance = widget.plateMap('instance');
    // isDisableAddDeleteWell(flag, emptyDefaultWell): emptyDefaultWell lets
    // callers override the "default" value used per-field when a well is
    // reset instead of deleted (plate-map.js comment: "column_with_default_val
    // will be used to determine empty wells, format: {field_name: default_val}").
    // Here we override `volume`'s default to '0' and leave tags/reagent as
    // whatever this.defaultWell already has for them ([] for both, since
    // multiselect/multiplex fields default to an empty array -- see
    // add-tab-data.js _addTabData).
    widget.plateMap('isDisableAddDeleteWell', true, { volume: '0' });

    instance.setSelectedIndices([0], true);
    instance._addAllData({ volume: null });

    const plate = widget.plateMap('getPlate');
    // Well is NOT deleted -- it's still a real key in wells.
    expect(plate.wells.hasOwnProperty('A1')).toBe(true);
    // Reset to emptyWellWithDefaultVal: volume takes the overridden default
    // ('0'), tags/reagent take the plain defaultWell value ([]).
    expect(plate.wells.A1).toEqual({ volume: '0', tags: [], reagent: [] });
  });
});

describe('multiplex field add/edit/remove via field.multiOnChange', () => {
  test('add, same-id re-add patches in place (no duplicate entry), and remove-by-id leaves others intact', () => {
    const widget = makeWidget();
    loadMinimalData(widget);
    const reagentField = widget.plateMap('instance').fieldMap['reagent'];

    // Low-level multiOnChange shape for multiplex per _getMultiData/
    // _changeMultiFieldValue: added = {id, value}, where `value` must itself
    // include the multiplex field's own id key (field.id -> optionId) for the
    // stored entry to carry it -- see the BUG/QUIRK test below for what
    // happens when it's omitted.
    reagentField.multiOnChange({ id: 'r1', value: { reagent: 'r1', conc: '10' } }, null);
    expect(widget.plateMap('getPlate').wells.A1.reagent).toEqual([{ reagent: 'r1', conc: '10' }]);

    // Add a second, distinct entry.
    reagentField.multiOnChange({ id: 'r2', value: { reagent: 'r2', conc: '20' } }, null);
    expect(widget.plateMap('getPlate').wells.A1.reagent).toEqual([
      { reagent: 'r1', conc: '10' },
      { reagent: 'r2', conc: '20' }
    ]);

    // Real, verified behavior: adding again with the SAME option id (r1)
    // does NOT create a duplicate array entry. _getMultiData's multiplex
    // branch matches `val[fieldId] === multiplexId` against existing entries
    // and, on a match, patches that entry's sub-fields in place.
    reagentField.multiOnChange({ id: 'r1', value: { reagent: 'r1', conc: '99' } }, null);
    expect(widget.plateMap('getPlate').wells.A1.reagent).toEqual([
      { reagent: 'r1', conc: '99' },
      { reagent: 'r2', conc: '20' }
    ]);

    // Remove r2 by id -- only that entry disappears, r1's (patched) entry remains.
    reagentField.multiOnChange(null, { id: 'r2' });
    expect(widget.plateMap('getPlate').wells.A1.reagent).toEqual([{ reagent: 'r1', conc: '99' }]);
  });

  test('BUG/QUIRK: calling multiOnChange directly with a .value object missing the field\'s own id key stores an entry without it', () => {
    // The real select2/UI path always builds `value` including the
    // multiplex field's own id key (see create-field.js
    // _changeMultiFieldValue's "else" branch, and add-tab-data.js's
    // subfield.onChange, both of which explicitly set
    // curVal[mainRefField.id] = curId before calling through). But
    // multiOnChange itself does no such enforcement -- calling it directly
    // (as this low-level test-only access pattern does) with a `.value` that
    // omits the field's own id key silently stores an entry missing that key.
    const widget = makeWidget();
    loadMinimalData(widget);
    const reagentField = widget.plateMap('instance').fieldMap['reagent'];

    reagentField.multiOnChange({ id: 'r1', value: { conc: '5' } }, null);
    expect(widget.plateMap('getPlate').wells.A1.reagent).toEqual([{ conc: '5' }]);
  });

  test('selecting an option with no explicit value (mirrors a real select2:select event) creates an entry with null sub-fields', () => {
    const widget = makeWidget();
    loadMinimalData(widget);
    const reagentField = widget.plateMap('instance').fieldMap['reagent'];

    // This is the exact shape _createMultiSelectField's select2:select handler
    // sends (v = {id: optionId}, no .value) -- field.multiOnChange (the
    // multiplex override) fills in the field-id key and nulls for the rest.
    reagentField.multiOnChange({ id: 'r1' }, null);
    expect(widget.plateMap('getPlate').wells.A1.reagent).toEqual([{ reagent: 'r1', conc: null }]);
  });
});

describe('[ALL] bulk-edit sentinel', () => {
  // Verified empirically (via the setSelectedIndices([i, j], true) workaround)
  // that this genuinely works end-to-end without any browser/select2 UI
  // interaction -- _addAllData loops over every selected well index and
  // applies the same `data` patch to each, and _getMultiData's `doAll` branch
  // (triggered when added.id === '[ALL]') patches every existing entry in
  // that well's multiplex array regardless of id. So driving it directly
  // through field.multiOnChange with a real 2-well selection is reliable
  // and not flaky -- no need to skip this case.
  test('a sub-field edit made while [ALL] is the active choice fans out to every selected well', () => {
    const widget = makeWidget();
    widget.plateMap('loadPlate', {
      wells: {
        A1: { reagent: [{ reagent: 'r1', conc: '1' }] },
        A2: { reagent: [{ reagent: 'r1', conc: '2' }] }
      },
      checkboxes: ['reagent']
    });

    const instance = widget.plateMap('instance');
    instance.setSelectedIndices([0, 1], true);
    expect(widget.plateMap('getSelectedAddresses')).toEqual(['A1', 'A2']);

    const reagentField = instance.fieldMap['reagent'];
    reagentField.multiOnChange({ id: '[ALL]', value: { conc: '999' } }, null);

    const plate = widget.plateMap('getPlate');
    expect(plate.wells.A1.reagent).toEqual([{ reagent: 'r1', conc: '999' }]);
    expect(plate.wells.A2.reagent).toEqual([{ reagent: 'r1', conc: '999' }]);
  });
});
