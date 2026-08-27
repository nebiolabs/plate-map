/**
 * Characterization tests for the address/index/loc math in src/js/plate-map.js.
 *
 * Goal: pin down CURRENT real behavior (including bugs) as a baseline before a
 * later refactor touches src/js/. Nothing here should be read as "this is how
 * it SHOULD behave" -- several assertions below document surprising/buggy
 * behavior on purpose, with a comment explaining why.
 *
 * All access goes through the jQuery UI widget bridge, exactly like smoke.test.js:
 *   widget.plateMap('methodName', ...args)
 * returns the actual return value of the underlying instance method.
 */

const simpleFields = [
  { required: true, id: 'volume', name: 'Volume', type: 'numeric', placeholder: 'Volume' }
];

const attributes = {
  tabs: [{ name: 'Settings', fields: simpleFields }]
};

function makeWidget(options) {
  const el = document.createElement('div');
  el.id = 'plate-map-' + Math.random().toString(36).slice(2);
  document.body.appendChild(el);
  const widget = window.jQuery(el);
  widget.plateMap(Object.assign({
    attributes,
    updateWells: () => {},
    selectedWells: () => {}
  }, options));
  return widget;
}

describe('addressToLoc', () => {
  const widget = makeWidget({ numRows: 8, numCols: 12 });

  test('parses simple addresses', () => {
    expect(widget.plateMap('addressToLoc', 'A1')).toEqual({ r: 0, c: 0 });
    expect(widget.plateMap('addressToLoc', 'H12')).toEqual({ r: 7, c: 11 });
    expect(widget.plateMap('addressToLoc', 'B2')).toEqual({ r: 1, c: 1 });
  });

  test('lowercase addresses are accepted (input is upper-cased before parsing)', () => {
    expect(widget.plateMap('addressToLoc', 'a1')).toEqual({ r: 0, c: 0 });
    expect(widget.plateMap('addressToLoc', 'h12')).toEqual({ r: 7, c: 11 });
  });

  test('leading/trailing whitespace is trimmed', () => {
    expect(widget.plateMap('addressToLoc', '  A1  ')).toEqual({ r: 0, c: 0 });
  });

  test('malformed addresses throw a plain string (not an Error object)', () => {
    // The source does `throw address + " not a proper plate address"` -- a
    // string, not `new Error(...)`. Characterizing that exact throw value.
    let caught;
    try {
      widget.plateMap('addressToLoc', 'AB');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBe('AB not a proper plate address');
  });

  test('addresses with no digits throw', () => {
    expect(() => widget.plateMap('addressToLoc', 'AB')).toThrow();
  });

  test('addresses with no letters throw', () => {
    expect(() => widget.plateMap('addressToLoc', '12')).toThrow();
  });

  test('empty string throws', () => {
    expect(() => widget.plateMap('addressToLoc', '')).toThrow();
  });

  test('letters-after-digits (trailing garbage) throws', () => {
    expect(() => widget.plateMap('addressToLoc', 'A1B')).toThrow();
  });

  test('column "0" parses to a negative column with no bounds check here', () => {
    // addressToLoc itself does NOT consult this.dimensions -- it happily
    // returns c: -1 for column "0". Bounds are only enforced later, in
    // locToIndex/addressToIndex.
    expect(widget.plateMap('addressToLoc', 'A0')).toEqual({ r: 0, c: -1 });
  });

  test('row letters beyond the configured numRows are still parsed (no dimensions check)', () => {
    // Row "Z" (index 25) is out of range for an 8-row plate, but addressToLoc
    // does not check dimensions -- only addressToIndex/locToIndex do.
    expect(widget.plateMap('addressToLoc', 'Z1')).toEqual({ r: 25, c: 0 });
  });
});

describe('addressToLoc row-letter overflow past Z (multi-letter rows)', () => {
  // Only exercised on a plate configured with >= 27 rows, since normal 8x12
  // plates never need a second row letter.
  const widget = makeWidget({ numRows: 30, numCols: 12 });

  test('single letters for rows 0-25', () => {
    expect(widget.plateMap('addressToLoc', 'A1')).toEqual({ r: 0, c: 0 });
    expect(widget.plateMap('addressToLoc', 'Z1')).toEqual({ r: 25, c: 0 });
  });

  test('double letters for rows 26+ (spreadsheet-style bijective base-26)', () => {
    expect(widget.plateMap('addressToLoc', 'AA1')).toEqual({ r: 26, c: 0 });
    expect(widget.plateMap('addressToLoc', 'AB1')).toEqual({ r: 27, c: 0 });
    expect(widget.plateMap('addressToLoc', 'AD1')).toEqual({ r: 29, c: 0 });
  });

  test('locToAddress produces the matching double-letter rows (round trip)', () => {
    expect(widget.plateMap('locToAddress', { r: 26, c: 0 })).toBe('AA1');
    expect(widget.plateMap('locToAddress', { r: 27, c: 0 })).toBe('AB1');
    expect(widget.plateMap('locToAddress', { r: 29, c: 0 })).toBe('AD1');
  });

  test('addressToLoc / locToAddress round-trip through the overflow boundary', () => {
    for (const addr of ['Y1', 'Z1', 'AA1', 'AB1', 'AC1', 'AD1']) {
      const loc = widget.plateMap('addressToLoc', addr);
      expect(widget.plateMap('locToAddress', loc)).toBe(addr);
    }
  });
});

describe('locToIndex / indexToLoc', () => {
  const widget = makeWidget({ numRows: 8, numCols: 12 });

  test('locToIndex is row-major: index = r * cols + c', () => {
    expect(widget.plateMap('locToIndex', { r: 0, c: 0 })).toBe(0);
    expect(widget.plateMap('locToIndex', { r: 0, c: 11 })).toBe(11);
    expect(widget.plateMap('locToIndex', { r: 1, c: 0 })).toBe(12);
    expect(widget.plateMap('locToIndex', { r: 7, c: 11 })).toBe(95);
  });

  test('indexToLoc is the inverse of locToIndex (round trip)', () => {
    for (const index of [0, 1, 11, 12, 13, 50, 95]) {
      const loc = widget.plateMap('indexToLoc', index);
      expect(widget.plateMap('locToIndex', loc)).toBe(index);
    }
  });

  test('locToIndex throws for a row at or beyond numRows', () => {
    expect(() => widget.plateMap('locToIndex', { r: 8, c: 0 })).toThrow('Row index 9 invalid');
  });

  test('locToIndex throws for a negative row', () => {
    expect(() => widget.plateMap('locToIndex', { r: -1, c: 0 })).toThrow('Row index 0 invalid');
  });

  test('locToIndex throws for a column at or beyond numCols', () => {
    expect(() => widget.plateMap('locToIndex', { r: 0, c: 12 })).toThrow('Column index 13 invalid');
  });

  test('locToIndex throws for a negative column', () => {
    expect(() => widget.plateMap('locToIndex', { r: 0, c: -1 })).toThrow('Column index 0 invalid');
  });

  test('indexToLoc throws when index is at or beyond rows*cols', () => {
    expect(() => widget.plateMap('indexToLoc', 96)).toThrow('Index too high: 96');
  });

  test('indexToLoc does NOT throw for a negative index -- it silently produces garbage', () => {
    // Characterizing an actual bug: indexToLoc only guards the upper bound
    // (`index >= rows*cols`). A negative index passes straight through the
    // modulo math. In JS, -1 % 12 === -1 (sign follows the dividend), so:
    //   loc.c = -1 % 12 = -1
    //   loc.r = (-1 - (-1)) / 12 = 0
    // giving a nonsensical {r: 0, c: -1} instead of throwing.
    expect(widget.plateMap('indexToLoc', -1)).toEqual({ r: 0, c: -1 });
  });
});

describe('addressToIndex / indexToAddress', () => {
  const widget = makeWidget({ numRows: 8, numCols: 12 });

  test('round trip is consistent with row-major locToIndex/indexToLoc', () => {
    const cases = [
      ['A1', 0],
      ['A12', 11],
      ['B1', 12],
      ['H12', 95]
    ];
    for (const [address, index] of cases) {
      expect(widget.plateMap('addressToIndex', address)).toBe(index);
      expect(widget.plateMap('indexToAddress', index)).toBe(address);
    }
  });

  test('addressToIndex throws when the parsed row is out of range for this plate', () => {
    // "Z1" parses fine via addressToLoc (r: 25) but is out of range for an
    // 8-row plate, so the bounds check inside locToIndex (called by
    // addressToIndex) throws.
    expect(() => widget.plateMap('addressToIndex', 'Z1')).toThrow('Row index 26 invalid');
  });

  test('addressToIndex throws when the parsed column is out of range for this plate', () => {
    expect(() => widget.plateMap('addressToIndex', 'A13')).toThrow('Column index 13 invalid');
  });
});

describe('locToAddress round trip with addressToLoc', () => {
  test('8x12 plate', () => {
    const widget = makeWidget({ numRows: 8, numCols: 12 });
    for (const address of ['A1', 'A12', 'D6', 'H1', 'H12']) {
      const loc = widget.plateMap('addressToLoc', address);
      expect(widget.plateMap('locToAddress', loc)).toBe(address);
    }
  });

  test('small 2x3 plate', () => {
    const widget = makeWidget({ numRows: 2, numCols: 3 });
    for (const address of ['A1', 'A3', 'B1', 'B3']) {
      const loc = widget.plateMap('addressToLoc', address);
      expect(widget.plateMap('locToAddress', loc)).toBe(address);
    }
  });
});

describe('getDimensions', () => {
  test('reflects numRows/numCols init options for a default 8x12 plate', () => {
    const widget = makeWidget({ numRows: 8, numCols: 12 });
    expect(widget.plateMap('getDimensions')).toEqual({ rows: 8, cols: 12 });
  });

  test('reflects numRows/numCols init options for a large 30-row plate', () => {
    const widget = makeWidget({ numRows: 30, numCols: 12 });
    expect(widget.plateMap('getDimensions')).toEqual({ rows: 30, cols: 12 });
  });

  test('reflects numRows/numCols init options for a small 2x3 plate', () => {
    const widget = makeWidget({ numRows: 2, numCols: 3 });
    expect(widget.plateMap('getDimensions')).toEqual({ rows: 2, cols: 3 });
  });

  test('returns a copy -- mutating the returned object does not affect internal dimensions', () => {
    const widget = makeWidget({ numRows: 8, numCols: 12 });
    const dims = widget.plateMap('getDimensions');
    dims.rows = 999;
    dims.cols = 999;
    expect(widget.plateMap('getDimensions')).toEqual({ rows: 8, cols: 12 });
  });
});

// bottomForFirstTime() (bottom-table.js) seeds one placeholder <tr> whose
// <td> has NO <button> inside it. Real rows (with a
// `<button class="plate-setup-color-text">`) only appear once
// engine.applyColors() -> addBottomTableRow() has run at least once, which
// only happens via _colorMixer() (triggered by loadPlate/setCheckboxes/etc).
// selectObjectInBottomTab() (plate-map.js) is called unconditionally at the
// end of every setSelectedIndices() call and does
// `td.querySelector('button').innerHTML` on every row after the header --
// including that button-less placeholder -- so on a freshly-created widget
// this throws a TypeError. Loading any data first (with a checked field)
// replaces the placeholder with real button rows and avoids it -- this
// helper exists so tests that aren't specifically about that bug can get
// past it.
function loadMinimalData(widget) {
  widget.plateMap('loadPlate', {
    wells: { A1: { volume: '1' } },
    checkboxes: ['volume']
  });
}

describe('setSelectedAddresses / getSelectedAddresses', () => {
  test('BUG: on a freshly-created widget (before any loadPlate/checkbox call), ' +
       'setSelectedAddresses throws a TypeError -- even for a single address or an empty array', () => {
    const widget = makeWidget({ numRows: 8, numCols: 12 });
    expect(() => widget.plateMap('setSelectedAddresses', ['A1'])).toThrow(TypeError);
    expect(() => widget.plateMap('setSelectedAddresses', [])).toThrow(TypeError);
  });

  test('empty array defaults the selection to index 0 -> ["A1"] (once past the cold-start bug above)', () => {
    const widget = makeWidget({ numRows: 8, numCols: 12 });
    loadMinimalData(widget);
    widget.plateMap('setSelectedAddresses', []);
    expect(widget.plateMap('getSelectedAddresses')).toEqual(['A1']);
  });

  test('single address round trip (once past the cold-start bug above)', () => {
    const widget = makeWidget({ numRows: 8, numCols: 12 });
    loadMinimalData(widget);
    widget.plateMap('setSelectedAddresses', ['C5']);
    expect(widget.plateMap('getSelectedAddresses')).toEqual(['C5']);
  });

  describe('2+ addresses: a second, independent, severe bug', () => {
    // sanitizeAddresses (load-plate.js) does:
    //   let indices = selectedAddresses.map(this.addressToIndex, this);
    // Array#map invokes its callback as (element, index, array). Passed
    // directly as a bare method reference, addressToIndex's second
    // parameter (`dimensions`) receives the ARRAY INDEX instead of a real
    // dimensions object. For array index 0 that's falsy (0), so it happens
    // to fall back to `this.dimensions` correctly -- but for index 1+ it's
    // a truthy Number, so `dimensions.rows`/`dimensions.cols` are
    // `undefined`, and locToIndex's bounds check (`loc.r < dimensions.rows`,
    // and `< undefined` is always false) fails and throws "Row index N
    // invalid" for a perfectly valid, in-range address. This means the
    // documented public API method setSelectedAddresses(addresses) --
    // listed in README's "Major Functions" -- is CURRENTLY BROKEN for any
    // call with 2 or more addresses, regardless of validity/order/duplicates.
    test('BUG: throws for entirely in-range, in-order addresses', () => {
      const widget = makeWidget({ numRows: 8, numCols: 12 });
      loadMinimalData(widget);
      expect(() => widget.plateMap('setSelectedAddresses', ['A1', 'A2', 'A3']))
        .toThrow('Row index 1 invalid');
    });

    test('BUG: throws even when one address is a duplicate', () => {
      const widget = makeWidget({ numRows: 8, numCols: 12 });
      loadMinimalData(widget);
      expect(() => widget.plateMap('setSelectedAddresses', ['B2', 'B2', 'A1']))
        .toThrow();
    });

    test('the lexicographic Array#sort() bug in the same function is real but ' +
         'currently unreachable through the public API', () => {
      // sanitizeAddresses also does `indices.sort()` with no comparator
      // (default Array#sort stringifies elements, so e.g. index 10 sorts
      // before index 2) -- a second, independent bug in the same function.
      // In practice it can never be observed through setSelectedAddresses
      // today: the map() bug above always throws first for any 2+-address
      // call, before execution ever reaches .sort(). Documenting that
      // precisely rather than asserting ordering behavior that isn't
      // actually reachable from the public API today.
      const widget = makeWidget({ numRows: 8, numCols: 12 });
      loadMinimalData(widget);
      expect(() => widget.plateMap('setSelectedAddresses', ['B8', 'A11', 'A10', 'A3', 'A2']))
        .toThrow(/Row index \d+ invalid/);
    });
  });
});
