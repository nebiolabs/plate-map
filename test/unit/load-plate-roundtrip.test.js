/**
 * Characterization tests for load-plate.js / getPlate() (add-data-on-change.js).
 *
 * These tests pin down CURRENT real behavior (bugs and all) as a "before"
 * baseline for a later refactor. They do not assert on what the behavior
 * "should" be -- only on what src/js/ actually does today, verified by
 * running it. Do not "fix" anything here if behavior looks wrong; document
 * it with a comment instead.
 *
 * Well-data shape is FLAT: wells.A1 = {fieldId: value}, per load-plate.js's
 * sanitizeWell() and add-data-on-change.js's getPlate() -- not the
 * `{wellData: {...}}` wrapper shown in README.md (README is stale on this
 * point; see smoke.test.js).
 */

const fields = [
  { required: false, id: 'notes', name: 'Notes', type: 'text' },
  {
    required: false,
    id: 'volume',
    name: 'Volume',
    type: 'numeric',
    placeholder: 'Volume',
    units: ['uL', 'mL'],
    defaultUnit: 'uL'
  },
  {
    required: false,
    id: 'pol',
    name: 'Polymerase',
    type: 'select',
    options: [
      { id: '234', text: 'Taq 1' },
      { id: '123', text: 'Taq 2' }
    ]
  },
  {
    required: false,
    id: 'tags',
    name: 'Tags',
    type: 'multiselect',
    options: [
      { id: 'a', text: 'Tag A' },
      { id: 'b', text: 'Tag B' },
      { id: 'c', text: 'Tag C' }
    ]
  }
];

const attributes = {
  tabs: [{ name: 'Settings', fields }]
};

function makeWidget() {
  const el = document.createElement('div');
  el.id = 'my-plate-map-' + Math.random().toString(36).slice(2);
  document.body.appendChild(el);
  const widget = window.jQuery(el);
  widget.plateMap({
    numRows: 8,
    numCols: 12,
    // NOTE: attributes.tabs mutates field config objects in place (adds
    // auto ids, etc.) and _addTabData reuses the *same* field objects
    // across widget instances if we reused a single `fields` array
    // reference, so give each widget its own deep-cloned attributes.
    attributes: JSON.parse(JSON.stringify(attributes)),
    updateWells: () => {},
    selectedWells: () => {}
  });
  return widget;
}

describe('basic round-trip idempotency', () => {
  test('text, numeric+units, select, and multiselect fields survive two loadPlate/getPlate cycles unchanged', () => {
    const widget = makeWidget();

    const data = {
      wells: {
        A1: {
          notes: 'hello world',
          volume: { value: '5', unit: 'mL' },
          pol: '234',
          tags: ['a', 'c']
        }
      },
      checkboxes: ['notes', 'volume'],
      selectedAddresses: ['A1']
    };

    widget.plateMap('loadPlate', data);
    const first = widget.plateMap('getPlate');

    // Sanity-check the shapes we expect per README's Data Types section.
    expect(first.wells.A1.notes).toBe('hello world');
    expect(first.wells.A1.volume).toEqual({ value: '5', unit: 'mL' });
    expect(first.wells.A1.pol).toBe('234');
    expect(first.wells.A1.tags).toEqual(['a', 'c']);

    // Round-trip: feed getPlate()'s own output back into loadPlate.
    widget.plateMap('loadPlate', first);
    const second = widget.plateMap('getPlate');

    expect(second).toEqual(first);
  });

  test('numeric field with units: {value, unit} shape is stable, and a unit-less value gets the defaultUnit', () => {
    const widget = makeWidget();

    widget.plateMap('loadPlate', {
      wells: {
        A1: { volume: { value: '10', unit: 'uL' } },
        // Passing a bare (non-object) value should apply the defaultUnit,
        // per _makeFieldUnits' field.parseValue "else" branch.
        B1: { volume: '20' }
      }
    });

    const plate = widget.plateMap('getPlate');
    expect(plate.wells.A1.volume).toEqual({ value: '10', unit: 'uL' });
    expect(plate.wells.B1.volume).toEqual({ value: '20', unit: 'uL' });

    widget.plateMap('loadPlate', plate);
    const plate2 = widget.plateMap('getPlate');
    expect(plate2).toEqual(plate);
  });
});

describe('checkboxes round-trip', () => {
  test('checkboxes reflect what was set, and unknown/unconfigured field ids are silently dropped', () => {
    const widget = makeWidget();

    widget.plateMap('loadPlate', {
      wells: { A1: { notes: 'x' } },
      // 'notFieldId' is not a configured field id (not in allCheckboxes) --
      // per sanitizeCheckboxes filtering against this.allCheckboxes, this
      // is dropped rather than throwing.
      checkboxes: ['notes', 'pol', 'notFieldId']
    });

    const plate = widget.plateMap('getPlate');
    expect(plate.checkboxes.sort()).toEqual(['notes', 'pol']);
    expect(plate.checkboxes).not.toContain('notFieldId');
  });

  test('omitting checkboxes from loadPlate data leaves current checkboxes as-is (uses getCheckboxes())', () => {
    const widget = makeWidget();

    widget.plateMap('loadPlate', {
      wells: { A1: { notes: 'x' } },
      checkboxes: ['notes', 'volume']
    });
    expect(widget.plateMap('getPlate').checkboxes.sort()).toEqual(['notes', 'volume']);

    // Second loadPlate call has no 'checkboxes' key at all.
    widget.plateMap('loadPlate', { wells: { A1: { notes: 'y' } } });
    expect(widget.plateMap('getPlate').checkboxes.sort()).toEqual(['notes', 'volume']);
  });
});

describe('selectedAddresses behavior', () => {
  test('loadPlate does NOT read/apply data.selectedAddresses -- selection always resets to the first well', () => {
    const widget = makeWidget();

    // Populate a real (button-containing) bottom-table row first. Without
    // this, setSelectedAddresses() below hits a separate, unrelated bug:
    // selectObjectInBottomTab() (plate-map.js) unconditionally reads
    // `.querySelector('button')` off every bottom-table row, but the
    // placeholder row bottomForFirstTime() seeds at widget creation has no
    // <button> in it -- so calling setSelectedAddresses() before any
    // loadPlate/checkbox call throws a TypeError. See address-math.test.js's
    // "BUG: on a freshly-created widget..." test for that one specifically;
    // it's not what this test is about, so we sidestep it here.
    widget.plateMap('loadPlate', { wells: { A1: { notes: 'seed' } }, checkboxes: ['notes'] });

    // Now, set a "prior" selection explicitly via the dedicated API.
    widget.plateMap('setSelectedAddresses', ['C3']);
    expect(widget.plateMap('getSelectedAddresses')).toEqual(['C3']);

    // Now loadPlate with a *different* selectedAddresses value in the data.
    widget.plateMap('loadPlate', {
      wells: { A1: { notes: 'x' } },
      checkboxes: [],
      selectedAddresses: ['B2']
    });

    // REAL BEHAVIOR: loadPlate's `sanitized` object passed to setData()
    // only ever has "derivative" and "checkboxes" keys (see load-plate.js
    // loadPlate()) -- it never calls sanitizeAddresses() or sets
    // "selectedIndices" from data.selectedAddresses at all, despite
    // sanitizeAddresses() existing as a method. setData() then calls
    // this.setSelectedIndices(data.selectedIndices, true) with
    // data.selectedIndices === undefined, and setSelectedIndices() treats
    // a falsy/empty indices arg as "select index 0" (address "A1").
    // So: data.selectedAddresses in the loadPlate() payload is silently
    // ignored -- both the neither the prior selection ('C3') NOR the
    // requested one ('B2') survive; selection always collapses to 'A1'.
    expect(widget.plateMap('getSelectedAddresses')).toEqual(['A1']);
    expect(widget.plateMap('getSelectedAddresses')).not.toEqual(['B2']);
    expect(widget.plateMap('getSelectedAddresses')).not.toEqual(['C3']);

    // getPlate().selectedAddresses reflects the (reset-to-A1) live
    // selection, not whatever was passed into the loadPlate call.
    expect(widget.plateMap('getPlate').selectedAddresses).toEqual(['A1']);
  });
});

describe('malformed/invalid input throws', () => {
  test('numeric field with units given an unrecognized unit string throws a plain string', () => {
    const widget = makeWidget();

    // field.parseUnit throws `"Invalid unit " + unit + " for field " + full_id`
    // as a bare string (not an Error object) -- see create-field.js
    // _makeFieldUnits' field.parseUnit. full_id === field.id for
    // top-level (non-multiplex-subfield) fields, so "volume" here.
    let caught;
    try {
      widget.plateMap('loadPlate', {
        wells: { A1: { volume: { value: 5, unit: 'gallons' } } }
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBe('Invalid unit gallons for field volume');
    expect(typeof caught).toBe('string');
    expect(caught).not.toBeInstanceOf(Error);
  });

  test('select field given an option id not in its options list throws a plain string', () => {
    const widget = makeWidget();

    // field.parseValue (select) throws
    // `"Invalid value " + value + " for select field " + full_id` as a
    // bare string -- see create-field.js _createSelectField.
    let caught;
    try {
      widget.plateMap('loadPlate', {
        wells: { A1: { pol: 'not-a-real-option-id' } }
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBe('Invalid value not-a-real-option-id for select field pol');
    expect(typeof caught).toBe('string');
  });

  test('multiselect field given an option id not in its options list throws a plain string', () => {
    const widget = makeWidget();

    let caught;
    try {
      widget.plateMap('loadPlate', {
        wells: { A1: { tags: ['a', 'not-a-real-tag'] } }
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBe('Invalid value not-a-real-tag for multiselect field tags');
    expect(typeof caught).toBe('string');
  });

  test('these throw() calls use expect().toThrow() the same way, for cross-check', () => {
    const widget = makeWidget();

    expect(() =>
      widget.plateMap('loadPlate', {
        wells: { A1: { volume: { value: 5, unit: 'gallons' } } }
      })
    ).toThrow('Invalid unit gallons for field volume');

    expect(() =>
      widget.plateMap('loadPlate', {
        wells: { A1: { pol: 'nope' } }
      })
    ).toThrow('Invalid value nope for select field pol');
  });
});

describe('empty/missing well data', () => {
  test('loadPlate with empty wells/checkboxes/selectedAddresses does not throw and yields empty wells', () => {
    const widget = makeWidget();

    expect(() => {
      widget.plateMap('loadPlate', { wells: {}, checkboxes: [], selectedAddresses: [] });
    }).not.toThrow();

    const plate = widget.plateMap('getPlate');
    expect(plate.wells).toEqual({});
    expect(plate.checkboxes).toEqual([]);
  });
});

describe('multiple loadPlate calls replace rather than merge state', () => {
  test('a second loadPlate call with only A1 present drops A2 entirely (no merge)', () => {
    const widget = makeWidget();

    widget.plateMap('loadPlate', {
      wells: {
        A1: { notes: 'first-A1' },
        A2: { notes: 'first-A2' }
      }
    });
    let plate = widget.plateMap('getPlate');
    expect(Object.keys(plate.wells).sort()).toEqual(['A1', 'A2']);

    // Second call only specifies A1, with a different value.
    widget.plateMap('loadPlate', {
      wells: {
        A1: { notes: 'second-A1' }
      }
    });
    plate = widget.plateMap('getPlate');

    // REAL BEHAVIOR: loadPlate's `derivative = {}` reset (whenever
    // data.hasOwnProperty('wells')) fully replaces prior well state --
    // it does not merge new wells into the old ones. A2 is now gone.
    expect(Object.keys(plate.wells)).toEqual(['A1']);
    expect(plate.wells.A1.notes).toBe('second-A1');
    expect(plate.wells.A2).toBeUndefined();
  });
});
