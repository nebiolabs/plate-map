const { test, expect } = require('@playwright/test');

/*
 * Real-browser coverage for basic (non-select2) field editing: typing into
 * a field's real <input> and confirming the edit lands in getPlate().
 * jsdom CAN run these (no layout/CTM dependency), but they're included
 * here because building this suite surfaced a genuinely new bug (see the
 * last test below) that's worth a real-browser characterization test
 * alongside the others, and because a small positive-control set is cheap
 * insurance that the fixture harness handles plain text/numeric input
 * correctly before anything more complex is built on top of it.
 */

async function makeWidget(page, fields) {
  return page.evaluate((fields) => window.PM.create({
    numRows: 2,
    numCols: 2,
    attributes: { tabs: [{ name: 'Settings', fields }] },
  }), fields);
}

async function loadMinimalData(page, containerId, checkboxFieldId) {
  await page.evaluate(({ id, checkboxFieldId }) => {
    window.PM.instance(id).loadPlate({ wells: { A1: {} }, checkboxes: [checkboxFieldId] });
    window.PM.instance(id).setSelectedAddresses(['A1']);
  }, { id: containerId, checkboxFieldId });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('text field: typing a value lands in getPlate()', async ({ page }) => {
  const containerId = await makeWidget(page, [{ id: 'note', name: 'Note', type: 'text' }]);
  await loadMinimalData(page, containerId, 'note');

  await page.locator(`#${containerId} #note`).fill('hello');
  await page.locator(`#${containerId} #note`).blur();

  const plate = await page.evaluate((id) => window.PM.instance(id).getPlate(), containerId);
  expect(plate.wells.A1.note).toBe('hello');
});

test('numeric field WITH units configured: typing a value lands in getPlate() (positive control)', async ({ page }) => {
  const containerId = await makeWidget(page, [
    { id: 'volume', name: 'Volume', type: 'numeric', units: ['uL', 'mL'], defaultUnit: 'uL' },
  ]);
  await loadMinimalData(page, containerId, 'volume');

  await page.locator(`#${containerId} #volume`).fill('42');
  await page.locator(`#${containerId} #volume`).blur();

  const plate = await page.evaluate((id) => window.PM.instance(id).getPlate(), containerId);
  expect(plate.wells.A1.volume).toEqual({ value: '42', unit: 'uL' });
});

test('FIXED (REFACTOR_NOTES.md §6 #10): a numeric field configured with ' +
     'NEITHER `units` NOR `defaultUnit` now saves edits instead of throwing', async ({ page }) => {
  // create-field.js's _createNumericField wires its own "input" handler as:
  //   input.on("input", function() {
  //     let v = field.getRegularValue();   // create-field.js:625ish
  //     ...
  //     field.onChange();
  //   });
  // `field.getRegularValue` used to be defined ONLY by _makeFieldUnits,
  // which _handleFieldUnits only calls when `units.length` ends up
  // non-zero -- true when EITHER `units` or `defaultUnit` is configured.
  // With neither configured, `getRegularValue` was never defined at all,
  // so every keystroke's "input" handler threw a TypeError BEFORE reaching
  // `field.onChange()` -- silently losing the typed value, forever.
  //
  // Fixed by having _createNumericField pre-set field.getRegularValue to
  // its own plain field.getValue right after defining it -- a no-op when
  // units ARE configured (_makeFieldUnits overwrites it with the same
  // value anyway, before it later overrides field.getValue itself), and a
  // working fallback when they aren't.
  //
  // Notably, example/example.js's own bundled demo has a multiplex
  // subfield ("dilution_factor") with its `defaultUnit` commented out --
  // i.e. the shipped example already contained a field shaped exactly
  // like this.
  //
  // Scoped precisely to numeric fields: _createTextField/_createSelectField/
  // _createBooleanField/_createMultiSelectField's own change handlers do
  // NOT call getRegularValue (confirmed by reading each), so this never
  // affected those field types.
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const containerId = await makeWidget(page, [
    { id: 'plainNum', name: 'PlainNum', type: 'numeric' }, // no units, no defaultUnit
  ]);
  await loadMinimalData(page, containerId, 'plainNum');

  await page.locator(`#${containerId} #plainNum`).fill('42');
  await page.locator(`#${containerId} #plainNum`).blur();

  expect(errors).toEqual([]);
  const plate = await page.evaluate((id) => window.PM.instance(id).getPlate(), containerId);
  expect(plate.wells.A1.plainNum).toBe('42');
});
