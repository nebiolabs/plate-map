/**
 * Characterization tests for "common data" computation across multiple
 * selected wells: _buildCommonData / _getCommonData / _getCommonWell /
 * containsObject / decideSelectedFields (src/js/svg-events.js).
 *
 * Goal: pin down CURRENT real behavior (including bugs/surprises) as a
 * baseline before a later refactor touches src/js/. Nothing here should be
 * read as "this is how it SHOULD behave".
 *
 * TECHNIQUE USED, AND WHY:
 * Every case below uses `.plateMap('copyCriteria')` followed by reading
 * `widget.plateMap('instance').commonData` directly. This was chosen as the
 * primary (and, for most cases, only) technique because:
 *   - overlay.js's copyCriteria does exactly `this.commonData =
 *     this._getCommonData(wells)` -- reading `commonData` off the jQuery UI
 *     instance (via the standard `.plateMap('instance')` bridge, confirmed
 *     working empirically) observes the _getCommonData() return value with
 *     zero indirection, so it's the least-flaky option.
 *   - pasteCriteria + getPlate() readback was verified as a secondary,
 *     cross-check technique (see the "paste cross-check" tests below): it
 *     confirmed two important things copyCriteria+instance inspection alone
 *     can't show directly: (a) that a field ABSENT from commonData is simply
 *     never written to the target well by _addAllData/processWellData --
 *     the target's prior value for that field survives untouched, it is NOT
 *     nulled out -- and (b) that the commonData shape really is what gets
 *     applied on paste, not just an inspection artifact. It's used sparingly
 *     (not for every case) because copyCriteria+instance inspection alone is
 *     simpler and just as reliable for observing "what's in commonData".
 *
 * Both techniques require the same setup as address-math.test.js:
 *   - a real loadPlate(...) with checked fields BEFORE any selection call
 *     (see loadMinimalData()/loadWells() below), to dodge the cold-start
 *     selectObjectInBottomTab() bug described there.
 *   - .plateMap('setSelectedIndices', [i, j, ...], true) instead of
 *     setSelectedAddresses, since setSelectedAddresses throws for any call
 *     with 2+ addresses (a separate, already-documented bug).
 */

const fields = [
  { id: 'note', name: 'Note', type: 'text' },
  { id: 'volume', name: 'Volume', type: 'numeric', units: ['uL', 'mL'], defaultUnit: 'uL' },
  {
    id: 'pol', name: 'Polymerase', type: 'multiselect',
    options: [
      { id: '234', text: 'Taq 1' },
      { id: '123', text: 'Taq 2' },
      { id: '111', text: 'Taq 3' },
      { id: '555', text: 'Taq 4' }
    ]
  },
  {
    id: 'amplicon_id', name: 'Amplicon', type: 'multiplex',
    options: [
      { id: 'a', text: 'amplicon_a' },
      { id: 'b', text: 'amplicon_b' }
    ],
    multiplexFields: [
      { id: 'conc', name: 'Conc', type: 'numeric' }
    ]
  }
];

const attributes = { tabs: [{ name: 'Settings', fields }] };

function makeWidget(options) {
  const el = document.createElement('div');
  el.id = 'plate-map-' + Math.random().toString(36).slice(2);
  document.body.appendChild(el);
  const widget = window.jQuery(el);
  widget.plateMap(Object.assign({
    numRows: 8,
    numCols: 12,
    attributes,
    updateWells: () => {},
    selectedWells: () => {}
  }, options));
  return widget;
}

// Loads wells + checkboxes via a real loadPlate() call, which -- as
// documented in address-math.test.js's loadMinimalData() -- also replaces
// bottom-table's button-less placeholder row with real rows, dodging the
// cold-start selectObjectInBottomTab() TypeError that any selection call
// would otherwise hit on a freshly-created widget.
function loadWells(widget, wells) {
  widget.plateMap('loadPlate', {
    wells,
    checkboxes: ['note', 'volume', 'pol', 'amplicon_id', 'amplicon_id_conc']
  });
}

// Selects the given addresses (2+ addresses require setSelectedIndices --
// see file header) and returns a deep-cloned snapshot of the resulting
// commonData, via copyCriteria + instance.commonData.
function commonDataFor(widget, addresses) {
  const indices = addresses.map(a => widget.plateMap('addressToIndex', a));
  widget.plateMap('setSelectedIndices', indices, true);
  widget.plateMap('copyCriteria');
  const instance = widget.plateMap('instance');
  return JSON.parse(JSON.stringify(instance.commonData));
}

describe('sanity: instance bridge + copyCriteria wiring', () => {
  test('.plateMap("instance") returns the widget instance, and copyCriteria assigns .commonData on it', () => {
    const widget = makeWidget();
    loadWells(widget, { A1: { note: 'x' }, A2: { note: 'x' } });
    const instance = widget.plateMap('instance');
    expect(instance).toBeDefined();
    expect(instance.commonData).toBeUndefined(); // not set until copyCriteria runs
    widget.plateMap('setSelectedIndices', [0, 1], true);
    widget.plateMap('copyCriteria');
    expect(instance.commonData).toBeDefined();
    expect(instance.commonData.note).toBe('x');
  });
});

describe('1. scalar field (no units) -- identical vs differing across selection', () => {
  test('identical value across 2 selected wells is treated as common (present, unchanged)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { note: 'same-note' },
      A2: { note: 'same-note' }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect(commonData.note).toBe('same-note');
  });

  test('identical value across 3 selected wells is treated as common', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { note: 'same-note' },
      A2: { note: 'same-note' },
      A3: { note: 'same-note' }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2', 'A3']);
    expect(commonData.note).toBe('same-note');
  });

  test('BUG-ADJACENT/SURPRISING: differing value across selection deletes the field key ' +
       'entirely from commonData -- it is NOT set to null/undefined-but-present, the key ' +
       'itself is absent (`"note" in commonData` is false)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { note: 'foo' },
      A2: { note: 'bar' }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect('note' in commonData).toBe(false);
  });

  test('paste cross-check: a field absent from commonData is NOT written to the target well '  +
       'on paste -- the target well\'s own prior value for that field survives untouched ' +
       '(it is not cleared/nulled)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { note: 'foo' },
      A2: { note: 'bar' },
      A3: { note: 'existing-on-target' }
    });
    // A1 vs A2 differ on note -> commonData will have no "note" key.
    commonDataFor(widget, ['A1', 'A2']);
    // Paste onto A3, which already has its own distinct "note" value.
    widget.plateMap('setSelectedIndices', [widget.plateMap('addressToIndex', 'A3')], true);
    widget.plateMap('pasteCriteria');
    const plate = widget.plateMap('getPlate');
    expect(plate.wells.A3.note).toBe('existing-on-target');
  });
});

describe('2. field with units ({value, unit} shape) -- three sub-cases', () => {
  test('same value AND same unit across selection -> treated as common, full {value, unit} object preserved', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { volume: { value: '5', unit: 'uL' } },
      A2: { volume: { value: '5', unit: 'uL' } }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect(commonData.volume).toEqual({ value: '5', unit: 'uL' });
  });

  test('SUBTLE: same value but DIFFERENT unit -> the whole field is dropped from commonData ' +
       '(not "value kept with unit blanked" -- the entire {value, unit} entry is deleted, ' +
       'exactly like a fully differing scalar)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { volume: { value: '5', unit: 'uL' } },
      A2: { volume: { value: '5', unit: 'mL' } }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect('volume' in commonData).toBe(false);
  });

  test('differing value but same unit -> the whole field is also dropped from commonData', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { volume: { value: '5', unit: 'uL' } },
      A2: { volume: { value: '7', unit: 'uL' } }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect('volume' in commonData).toBe(false);
  });
});

describe('3. multiselect array field -- identical / partial-overlap / fully-disjoint', () => {
  test('fully identical arrays across selection -> preserved exactly (same elements, same order)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { pol: ['234', '123'] },
      A2: { pol: ['234', '123'] }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect(commonData.pol).toEqual(['234', '123']);
  });

  test('SURPRISING: partially-overlapping arrays -> the real result is a SET INTERSECTION ' +
       '(only elements present in both survive), not e.g. a union or a "not common" deletion. ' +
       'Order follows the first well processed, not the original option order.', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { pol: ['234', '123', '111'] },
      A2: { pol: ['123', '111', '555'] }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect(commonData.pol).toEqual(['123', '111']);
  });

  test('fully-disjoint arrays -> result is an empty array, NOT a deleted/absent key ' +
       '(unlike the scalar/units cases above, the field key stays present)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { pol: ['234', '123'] },
      A2: { pol: ['555'] }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect('pol' in commonData).toBe(true);
    expect(commonData.pol).toEqual([]);
  });

  test('3 selected wells: intersection narrows further with each additional well (fold-style, order-dependent)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { pol: ['234', '123', '111'] },
      A2: { pol: ['123', '111', '555'] },
      A3: { pol: ['555'] } // shares nothing with the running intersection ['123','111']
    });
    const commonData = commonDataFor(widget, ['A1', 'A2', 'A3']);
    expect(commonData.pol).toEqual([]);
  });
});

describe('4. multiplex field (array of objects) -- identical entry / same option differing subfield / different option', () => {
  test('wells sharing an identical multiplex entry (same option id + same subfield values) -> preserved exactly', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { amplicon_id: [{ amplicon_id: 'a', conc: '10' }] },
      A2: { amplicon_id: [{ amplicon_id: 'a', conc: '10' }] }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect(commonData.amplicon_id).toEqual([{ amplicon_id: 'a', conc: '10' }]);
  });

  test('SUBTLE: same option id but DIFFERENT subfield value -> the entry survives (matched by ' +
       'option id) but the differing subfield key is dropped from it entirely -- leaving just ' +
       '{amplicon_id: "a"} with no "conc" key at all (same "delete the whole key" rule as ' +
       'scalar/units fields, applied per-subfield within the matched entry)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { amplicon_id: [{ amplicon_id: 'a', conc: '10' }] },
      A2: { amplicon_id: [{ amplicon_id: 'a', conc: '20' }] }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect(commonData.amplicon_id).toEqual([{ amplicon_id: 'a' }]);
    expect('conc' in commonData.amplicon_id[0]).toBe(false);
  });

  test('entirely different option ids -> no entry matches, result is an empty array ' +
       '(field key stays present, same "empty array, not absent" rule as multiselect)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { amplicon_id: [{ amplicon_id: 'a', conc: '10' }] },
      A2: { amplicon_id: [{ amplicon_id: 'b', conc: '99' }] }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']);
    expect('amplicon_id' in commonData).toBe(true);
    expect(commonData.amplicon_id).toEqual([]);
  });

  test('3 selected wells: once a subfield is dropped from the matched entry, it stays dropped ' +
       'even if a later well shares the original value -- the dropped key is never restored ' +
       '(subsequent comparisons only iterate the KEYS STILL PRESENT on the running common entry)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { amplicon_id: [{ amplicon_id: 'a', conc: '10' }] },
      A2: { amplicon_id: [{ amplicon_id: 'a', conc: '20' }] }, // drops "conc" at this step
      A3: { amplicon_id: [{ amplicon_id: 'a', conc: '10' }] }  // same conc as A1, but too late
    });
    const commonData = commonDataFor(widget, ['A1', 'A2', 'A3']);
    expect(commonData.amplicon_id).toEqual([{ amplicon_id: 'a' }]);
  });

  test('paste cross-check: an empty-array multiplex commonData (from disjoint option ids) really ' +
       'does overwrite the target well\'s multiplex field with an empty array on paste ' +
       '(note: a shared "note" value is included so the resulting well is not entirely empty -- ' +
       'a well that _addAllData/wellEmpty() considers fully empty gets DELETED from the plate ' +
       'entirely rather than merely written with empty/null fields; see the deletion test below ' +
       'for that behavior on its own)', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { note: 'shared', amplicon_id: [{ amplicon_id: 'a', conc: '10' }] },
      A2: { note: 'shared', amplicon_id: [{ amplicon_id: 'b', conc: '99' }] },
      A3: { amplicon_id: [{ amplicon_id: 'a', conc: '42' }] }
    });
    const commonData = commonDataFor(widget, ['A1', 'A2']); // amplicon_id -> [] (disjoint option ids)
    expect(commonData.note).toBe('shared');
    widget.plateMap('setSelectedIndices', [widget.plateMap('addressToIndex', 'A3')], true);
    widget.plateMap('pasteCriteria');
    const plate = widget.plateMap('getPlate');
    expect(plate.wells.A3.amplicon_id).toEqual([]);
    expect(plate.wells.A3.note).toBe('shared');
  });

  test('BUG-ADJACENT/SURPRISING: pasting a commonData where every field is null/empty deletes the ' +
       'target well from the plate entirely, rather than merely writing null/empty fields onto it ' +
       '-- because _addAllData deletes any well that engine.wellEmpty() considers empty after the ' +
       'merge', () => {
    const widget = makeWidget();
    loadWells(widget, {
      A1: { amplicon_id: [{ amplicon_id: 'a', conc: '10' }] },
      A2: { amplicon_id: [{ amplicon_id: 'b', conc: '99' }] },
      A3: { amplicon_id: [{ amplicon_id: 'a', conc: '42' }] }
    });
    commonDataFor(widget, ['A1', 'A2']); // every field ends up null/[] -- no shared "note" this time
    widget.plateMap('setSelectedIndices', [widget.plateMap('addressToIndex', 'A3')], true);
    widget.plateMap('pasteCriteria');
    const plate = widget.plateMap('getPlate');
    expect(plate.wells.A3).toBeUndefined();
  });
});
