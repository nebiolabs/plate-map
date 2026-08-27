/**
 * Smoke test: confirms the jsdom + jQuery/select2/SVG.js harness is wired up
 * correctly and the widget can be created, loaded, read back, and destroyed.
 * If this file fails, something is wrong with test infrastructure, not with
 * plate-map's actual behavior -- fix this first before trusting any other test.
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

test('jQuery, select2, SVG, ClipboardJS globals are present', () => {
  expect(window.jQuery).toBeDefined();
  expect(window.jQuery.fn.select2).toBeDefined();
  expect(window.SVG).toBeDefined();
  expect(window.ClipboardJS).toBeDefined();
});

test('DNA.plateMap widget factory is registered', () => {
  expect(window.jQuery.fn.plateMap).toBeDefined();
});

test('widget can be created, loaded, and read back', () => {
  const el = makeContainer();
  const widget = window.jQuery(el);

  widget.plateMap({
    numRows: 8,
    numCols: 12,
    attributes,
    updateWells: () => {},
    selectedWells: () => {}
  });

  // NOTE: actual getPlate()/loadPlate()/sanitizeWell() (add-data-on-change.js,
  // load-plate.js) use a FLAT well shape -- `wells.A1 = {fieldId: value}` --
  // not the `{wellData: {...}}` wrapper shown in README.md. The README is
  // stale; this test pins down the real, current behavior.
  const data = {
    wells: {
      A1: { volume: '5' }
    },
    checkboxes: ['volume'],
    selectedAddresses: ['A1']
  };

  widget.plateMap('loadPlate', data);
  const readBack = widget.plateMap('getPlate');

  expect(readBack.wells.A1.volume).toBe('5');
});
