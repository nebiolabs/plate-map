/**
 * Characterization tests for the color-grouping engine (src/js/engine.js) and
 * its interaction with the color palette (src/js/color-manager.js) and tile
 * coloring (src/js/svg-create.js's setTileColor). Goal: pin down CURRENT real
 * behavior (including bugs/surprises) as a baseline before a later refactor
 * touches src/js/. Nothing here should be read as "this is how it SHOULD
 * behave".
 *
 * Relevant source read in full: src/js/engine.js, src/js/color-manager.js.
 * Relevant source skimmed: src/js/check-box.js (setCheckboxes/changeCheckboxes),
 * src/js/svg-create.js (setTileColor), src/js/load-plate.js (loadPlate/setData),
 * src/js/bottom-table.js (addBottomTableRow -- a second, independent wraparound
 * using this.colorPairs.length directly, for the bottom-table swatch), src/js/
 * overlay.js (overLayTextContainer).
 *
 * Access pattern: widget.plateMap('instance') (jQuery UI 1.9+ widget bridge)
 * returns the raw widget instance, giving direct access to internal state
 * (instance.engine.colorMap, instance.engine.stackUpWithColor,
 * instance.allTiles[i].colorIndex, instance.overLayTextContainer, etc.)
 * without having to scrape the bottom table DOM. Confirmed working via a
 * throwaway scratch test (deleted) before writing these.
 *
 * Key facts established by reading the code and confirmed by running it:
 *
 * - Grouping is driven entirely by which fields are *checked*
 *   (this.globalSelectedAttributes, set via setCheckboxes/changeCheckboxes),
 *   NOT by which fields are `required`. searchAndStack() builds a JSON
 *   string per well of only the checked fields' values and groups wells with
 *   identical JSON together. Wells whose checked-field JSON is empty (no
 *   value on any checked field, or no field checked at all) always land in
 *   this.engine.stackUpWithColor[0] -- color/group 0 is reserved for "no
 *   data on checked fields".
 *
 * - colorMap.set(index, color) in applyColors() records, per well index,
 *   which color/group number (an integer counting up from 0, NOT wrapped)
 *   it landed in.
 *
 * - color-manager.js's colorPairs array (the source palette) has EXACTLY 49
 *   entries (counted by hand, and cross-checked against
 *   instance.colorPairs.length / instance.wellColors.length at runtime
 *   below -- svg-create.js's _createSvg builds one SVG gradient per
 *   colorPairs entry into this.wellColors, so wellColors.length ===
 *   colorPairs.length === 49).
 *
 * - SURPRISING (confirmed empirically, not just read from source):
 *   svg-create.js's setTileColor does
 *     tile.colorIndex = parseInt(color);          // <-- BEFORE wrapping
 *     if (color > 0) { color = ((color - 1) % (wellColors.length - 1)) + 1; }
 *     tile.circle.fill(wellColors[color]);
 *   i.e. the wraparound formula is applied to a *local* variable used only
 *   to pick the SVG gradient fill -- it is applied AFTER tile.colorIndex has
 *   already been set to the raw, unwrapped group number. So
 *   tile.colorIndex does NOT wrap around: for 100 mutually-distinct values
 *   across a 10x10 plate, tile.colorIndex legitimately reaches 100. Only the
 *   *rendered fill color* (and, independently, the bottom-table swatch
 *   background in bottom-table.js's addBottomTableRow, which has its own
 *   copy of the same formula using this.colorPairs.length directly) wraps,
 *   cycling through wellColors[1..48] (48 = wellColors.length - 1) and
 *   never reusing wellColors[0], which stays reserved for the group-0 "no
 *   data" gray swatch.
 *
 * - Completion percentage NaN handling (applyColors()):
 *     wholePercentage = Math.floor(100 * wholePercentage / wholeNoTiles);
 *     if (isNaN(wholePercentage)) { ... "Completion Percentage: 0%" }
 *   wholeNoTiles is the count of tiles across ALL groups (including group 0)
 *   that were actually looped over in applyColors -- i.e. it is 0 only when
 *   this.engine.stackUpWithColor ends up completely empty, which happens
 *   only when this.engine.derivative itself is empty when searchAndStack()
 *   runs (e.g. loadPlate({wells: {}, ...}), or calling setCheckboxes on a
 *   freshly-created widget that has never had loadPlate called on it at
 *   all). In that case 100 * 0 / 0 is NaN, Math.floor(NaN) is still NaN, and
 *   the fallback text "Completion Percentage: 0%" is used.
 *   SURPRISING: this NaN/"0%" fallback text is NOT what you get merely by
 *   having "no required fields" (the scenario asked about) while data IS
 *   loaded. checkCompletion() does `if (req === fill) return 1;` -- with
 *   zero required fields, req and fill both stay 0 for every well, so
 *   req === fill trivially, and every well's completion is 1 (100%
 *   complete), regardless of whether it has any actual data. So loading
 *   real wells with an all-`required: false` field set produces
 *   "Completion Percentage: 100%", not the NaN/"0%" fallback -- the NaN
 *   fallback is reached only via a genuinely empty plate/derivative, an
 *   orthogonal condition to "no required fields".
 */

function makeWidget(fields, options) {
  const attributes = {
    tabs: [{ name: 'Settings', fields }]
  };
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

const sampleField = [
  { required: false, id: 'sample', name: 'Sample', type: 'text', placeholder: 'Sample' }
];

describe('searchAndStack / applyColors grouping', () => {
  test('wells sharing an identical value on the checked field land in the same color group', () => {
    const widget = makeWidget(sampleField);
    const instance = widget.plateMap('instance');

    widget.plateMap('loadPlate', {
      wells: {
        A1: { sample: 'foo' },
        A2: { sample: 'foo' },
        A3: { sample: 'bar' }
      },
      checkboxes: ['sample']
    });

    const idxA1 = instance.addressToIndex('A1');
    const idxA2 = instance.addressToIndex('A2');
    const idxA3 = instance.addressToIndex('A3');

    const groupA1 = instance.engine.colorMap.get(idxA1);
    const groupA2 = instance.engine.colorMap.get(idxA2);
    const groupA3 = instance.engine.colorMap.get(idxA3);

    expect(groupA1).toBe(groupA2);
    expect(groupA3).not.toBe(groupA1);

    // Cross-check against stackUpWithColor directly.
    expect(instance.engine.stackUpWithColor[groupA1].sort()).toEqual([idxA1, idxA2].sort());
    expect(instance.engine.stackUpWithColor[groupA3]).toEqual([idxA3]);
  });

  test('three distinct values produce three distinct non-zero groups', () => {
    const widget = makeWidget(sampleField);
    const instance = widget.plateMap('instance');

    widget.plateMap('loadPlate', {
      wells: {
        A1: { sample: 'foo' },
        A2: { sample: 'bar' },
        A3: { sample: 'baz' }
      },
      checkboxes: ['sample']
    });

    const groups = ['A1', 'A2', 'A3'].map(a => instance.engine.colorMap.get(instance.addressToIndex(a)));
    // All three distinct.
    expect(new Set(groups).size).toBe(3);
    // None of them is the "no data" group.
    groups.forEach(g => expect(g).not.toBe(0));
  });

  test('bottom-table row swatch text (raw group number) matches colorMap for a well in that group', () => {
    // Secondary/cross-check source, per task instructions: the rendered
    // <button class="plate-setup-color-text"> text is the raw group number.
    const widget = makeWidget(sampleField);
    const instance = widget.plateMap('instance');

    widget.plateMap('loadPlate', {
      wells: { A1: { sample: 'foo' }, A2: { sample: 'foo' } },
      checkboxes: ['sample']
    });

    const idxA1 = instance.addressToIndex('A1');
    const group = instance.engine.colorMap.get(idxA1);

    const buttons = Array.from(document.querySelectorAll('button.plate-setup-color-text'))
      .map(b => Number(b.textContent));
    expect(buttons).toContain(group);
  });
});

describe('wells with no value on the checked field are bucketed into group 0', () => {
  test('a well with a value and a well without one land in genuinely different groups', () => {
    const widget = makeWidget(sampleField);
    const instance = widget.plateMap('instance');

    widget.plateMap('loadPlate', {
      wells: {
        A1: { sample: 'foo' },
        A2: {} // no `sample` key -> sanitizeWell -> field.parseValue(undefined) -> null
      },
      checkboxes: ['sample']
    });

    const idxA1 = instance.addressToIndex('A1');
    const idxA2 = instance.addressToIndex('A2');

    expect(instance.engine.colorMap.get(idxA2)).toBe(0);
    expect(instance.engine.colorMap.get(idxA1)).not.toBe(0);
    expect(instance.engine.stackUpWithColor[0]).toEqual([idxA2]);
  });

  test('a well with no value on ANY checked field lands in group 0 even when other fields have data', () => {
    const fields = [
      { required: false, id: 'sample', name: 'Sample', type: 'text', placeholder: 'Sample' },
      { required: false, id: 'volume', name: 'Volume', type: 'numeric', placeholder: 'Volume' }
    ];
    const widget = makeWidget(fields);
    const instance = widget.plateMap('instance');

    widget.plateMap('loadPlate', {
      wells: {
        // volume has data but it isn't checked, so it's irrelevant to grouping
        A1: { volume: '5' },
        A2: { sample: 'foo', volume: '5' }
      },
      checkboxes: ['sample'] // only `sample` is checked
    });

    const idxA1 = instance.addressToIndex('A1');
    const idxA2 = instance.addressToIndex('A2');

    expect(instance.engine.colorMap.get(idxA1)).toBe(0);
    expect(instance.engine.colorMap.get(idxA2)).not.toBe(0);
  });

  test('when NO field is checked at all, every well with data falls into group 0', () => {
    const widget = makeWidget(sampleField);
    const instance = widget.plateMap('instance');

    widget.plateMap('loadPlate', {
      wells: {
        A1: { sample: 'foo' },
        A2: { sample: 'bar' }
      },
      checkboxes: [] // nothing checked
    });

    const idxA1 = instance.addressToIndex('A1');
    const idxA2 = instance.addressToIndex('A2');
    expect(instance.engine.colorMap.get(idxA1)).toBe(0);
    expect(instance.engine.colorMap.get(idxA2)).toBe(0);
    expect(instance.engine.stackUpWithColor[0].sort()).toEqual([idxA1, idxA2].sort());
  });
});

describe('color palette size and wraparound', () => {
  test('colorPairs (and the derived wellColors) has exactly 49 entries', () => {
    const widget = makeWidget(sampleField);
    const instance = widget.plateMap('instance');
    expect(instance.colorPairs.length).toBe(49);
    expect(instance.wellColors.length).toBe(49);
  });

  test('tile.colorIndex is the RAW, UNWRAPPED group number -- it can exceed the 49-entry palette', () => {
    // 10x10 = 100 wells, each with a mutually distinct value on the checked
    // field -> 100 distinct non-zero groups (1..100), well past the 49-entry
    // palette. Verifying actual, real output rather than computing by hand.
    const widget = makeWidget(sampleField, { numRows: 10, numCols: 10 });
    const instance = widget.plateMap('instance');

    const wells = {};
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const addr = instance.locToAddress({ r, c });
        wells[addr] = { sample: 'val' + (r * 10 + c) };
      }
    }
    widget.plateMap('loadPlate', { wells, checkboxes: ['sample'] });

    // Groups are assigned in ascending well-index order (searchAndStack sorts
    // derivativeJson keys numerically before assigning stackPointer values),
    // so with 100 mutually-distinct values, well index N (0-based) lands in
    // group N+1. A1 (index 0) -> group 1 ... the 100th well -> group 100.
    expect(instance.engine.colorMap.get(0)).toBe(1);
    expect(instance.allTiles[0].colorIndex).toBe(1);

    expect(instance.engine.colorMap.get(99)).toBe(100);
    expect(instance.allTiles[99].colorIndex).toBe(100);

    // Groups 48, 49, 50, 97 straddle the 49-entry-palette / 48-cycle boundary.
    // colorIndex is unaffected by wraparound: it is exactly the raw group.
    expect(instance.allTiles[47].colorIndex).toBe(48);
    expect(instance.allTiles[48].colorIndex).toBe(49);
    expect(instance.allTiles[49].colorIndex).toBe(50);
    expect(instance.allTiles[96].colorIndex).toBe(97);
  });

  test('the RENDERED fill wraps with period 48 (wellColors.length - 1), skipping wellColors[0]', () => {
    // setTileColor: color = ((color - 1) % (wellColors.length - 1)) + 1 for color > 0.
    // wellColors.length === 49, so the cycle length is 48, and only indices
    // 1..48 of wellColors are ever used for a non-zero group -- index 0
    // stays reserved for the group-0 "no data" gray swatch.
    const widget = makeWidget(sampleField, { numRows: 10, numCols: 10 });
    const instance = widget.plateMap('instance');

    const wells = {};
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const addr = instance.locToAddress({ r, c });
        wells[addr] = { sample: 'val' + (r * 10 + c) };
      }
    }
    widget.plateMap('loadPlate', { wells, checkboxes: ['sample'] });

    function fillIdOf(index) {
      return instance.allTiles[index].circle.node.getAttribute('fill');
    }

    // group 1 (index 0) and group 49 (index 48) both wrap to wellColor1.
    expect(fillIdOf(0)).toBe('url(#wellColor1)');
    expect(fillIdOf(48)).toBe('url(#wellColor1)');
    // group 97 (index 96) also wraps to wellColor1 (97 - 1 - 48 - 48 = 0).
    expect(fillIdOf(96)).toBe('url(#wellColor1)');

    // group 48 (index 47) wraps to wellColor48 (the last non-reserved slot),
    // and group 96 (index 95) wraps there too.
    expect(fillIdOf(47)).toBe('url(#wellColor48)');
    expect(fillIdOf(95)).toBe('url(#wellColor48)');

    // group 2 (index 1) and group 50 (index 49) both wrap to wellColor2.
    expect(fillIdOf(1)).toBe('url(#wellColor2)');
    expect(fillIdOf(49)).toBe('url(#wellColor2)');
  });
});

describe('completion percentage NaN handling', () => {
  test('a genuinely empty plate (wells: {}) with all-optional fields produces the NaN fallback text', () => {
    const widget = makeWidget(sampleField); // sample field is required: false
    const instance = widget.plateMap('instance');

    widget.plateMap('loadPlate', { wells: {}, checkboxes: ['sample'] });

    expect(instance.engine.stackUpWithColor).toEqual({});
    expect(instance.overLayTextContainer.text()).toBe('Completion Percentage: 0%');
  });

  test('calling setCheckboxes on a freshly-created widget (never loadPlate-d) also hits the NaN fallback, ' +
       'and does NOT trigger the known selectObjectInBottomTab cold-start crash', () => {
    // This is safe (unlike setSelectedAddresses/setSelectedIndices on a cold
    // widget) because selectedIndices defaults to [] and setCheckboxes's own
    // applyColors() -> addBottomTableHeadings() replaces the button-less
    // placeholder row with a real (button-having, but here empty) tbody
    // before selectObjectInBottomTab ever runs.
    const widget = makeWidget(sampleField);
    const instance = widget.plateMap('instance');

    expect(() => widget.plateMap('setCheckboxes', ['sample'])).not.toThrow();
    expect(instance.overLayTextContainer.text()).toBe('Completion Percentage: 0%');
  });

  test('SURPRISING: loading real data with an all-required:false field set produces 100%, ' +
       'not the NaN/"0%" fallback -- checkCompletion() trivially returns 1 when req === fill === 0', () => {
    const widget = makeWidget(sampleField); // sample field is required: false, the only field
    const instance = widget.plateMap('instance');

    widget.plateMap('loadPlate', {
      wells: { A1: { sample: 'x' }, A2: { sample: 'y' } },
      checkboxes: ['sample']
    });

    expect(instance.overLayTextContainer.text()).toBe('Completion Percentage: 100%');
  });
});
