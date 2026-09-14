const { test, expect } = require('@playwright/test');

/*
 * Real-browser coverage for multiplex fields (create-field.js's
 * _createMultiplexField): a multiselect ("which entries are added") paired
 * with a "Select to edit" single-select that switches which added entry's
 * subfields are currently shown/editable. Entirely UI-driven (real select2
 * + real subfield inputs), which the Jest layer explicitly does NOT cover
 * (test/unit/data-pipeline.test.js calls `multiOnChange` directly instead,
 * bypassing this marshaling layer -- see its own header comment and
 * REFACTOR_NOTES.md's self-critique point 3).
 *
 * DOM shape established by reading create-field.js: a subfield's
 * `full_id = mainField.id + "_" + data.id` (_makeSubField), so a
 * multiplex field "amplicons" with a numeric subfield "conc" renders the
 * subfield as `<input id="amplicons_conc">`. The "Select to edit" dropdown
 * is `#<fieldId>SingleSelect`.
 */

const MULTIPLEX_FIELD = {
  id: 'amplicons',
  name: 'Amplicons',
  type: 'multiplex',
  options: [{ id: 'a', text: 'Amplicon A' }, { id: 'b', text: 'Amplicon B' }],
  multiplexFields: [
    // `defaultUnit` is required here, not just for realism: a numeric
    // field configured with NEITHER `units` NOR `defaultUnit` hits a
    // genuine bug (see field-editing.spec.js's "BUG (new...)" test) where
    // every edit throws and the typed value never saves at all.
    { id: 'conc', name: 'Conc', type: 'numeric', placeholder: 'Conc', defaultUnit: 'ng/ul' },
  ],
};

async function makeWidget(page) {
  return page.evaluate((field) => window.PM.create({
    numRows: 8,
    numCols: 12,
    attributes: { tabs: [{ name: 'Settings', fields: [field] }] },
  }), MULTIPLEX_FIELD);
}

async function loadMinimalData(page, containerId) {
  // Works around the already-characterized cold-start bug (REFACTOR_NOTES.md
  // §6 #2) -- see the identical helper in select2-ui.spec.js.
  await page.evaluate((id) => {
    window.PM.instance(id).loadPlate({ wells: { A1: {} }, checkboxes: ['amplicons'] });
    window.PM.instance(id).setSelectedAddresses(['A1']);
  }, containerId);
}

async function addMultiplexOption(page, containerId, optionText) {
  const box = page.locator(`#${containerId} #amplicons + span.select2-container .select2-selection`);
  await box.click();
  // select2's default closeOnSelect (true for a plain multi-select, no
  // `tags`/explicit override here) closes the dropdown right after a
  // choice -- no Escape needed, and pressing one here was actually
  // reopening it (leaving the next addMultiplexOption's box.click() toggling
  // it closed instead of open, timing out waiting for options that were
  // never re-shown).
  await page.locator('.select2-results__option', { hasText: optionText }).click();
}

function subFieldInput(page, containerId) {
  return page.locator(`#${containerId} #amplicons_conc`);
}

function singleSelectBox(page, containerId) {
  return page.locator(`#${containerId} #ampliconsSingleSelect + span.select2-container .select2-selection`);
}

async function getPlate(page, containerId) {
  return page.evaluate((id) => window.PM.instance(id).getPlate(), containerId);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('adding one multiplex entry enables its subfield, and a subfield edit lands in getPlate()', async ({ page }) => {
  const containerId = await makeWidget(page);
  await loadMinimalData(page, containerId);

  await addMultiplexOption(page, containerId, 'Amplicon A');

  await expect(subFieldInput(page, containerId)).toBeEnabled();
  await subFieldInput(page, containerId).fill('10');
  await subFieldInput(page, containerId).blur();

  const plate = await getPlate(page, containerId);
  expect(plate.wells.A1.amplicons).toEqual([{ amplicons: 'a', conc: { value: '10', unit: 'ng/ul' } }]);
});

test('adding a second entry lets "Select to edit" switch between entries, each keeping its own subfield value', async ({ page }) => {
  const containerId = await makeWidget(page);
  await loadMinimalData(page, containerId);

  await addMultiplexOption(page, containerId, 'Amplicon A');
  await subFieldInput(page, containerId).fill('10');
  await subFieldInput(page, containerId).blur();

  await addMultiplexOption(page, containerId, 'Amplicon B');
  // Adding the 2nd entry auto-switches "Select to edit" to it (setSingleSelectOptions
  // defaults `selected` to the first entry in `data`, and Amplicon B was just added).
  await subFieldInput(page, containerId).fill('20');
  await subFieldInput(page, containerId).blur();

  let plate = await getPlate(page, containerId);
  expect(plate.wells.A1.amplicons.sort((x, y) => x.amplicons.localeCompare(y.amplicons))).toEqual([
    { amplicons: 'a', conc: { value: '10', unit: 'ng/ul' } },
    { amplicons: 'b', conc: { value: '20', unit: 'ng/ul' } },
  ]);

  // Switch "Select to edit" back to Amplicon A and confirm its own value
  // is what's shown (not leaked/overwritten by Amplicon B's edit).
  await singleSelectBox(page, containerId).click();
  await page.locator('.select2-results__option', { hasText: 'Amplicon A' }).click();
  await expect(subFieldInput(page, containerId)).toHaveValue('10');
});

test('removing a multiplex entry (deselecting its chip) drops it from getPlate()', async ({ page }) => {
  const containerId = await makeWidget(page);
  await loadMinimalData(page, containerId);

  await addMultiplexOption(page, containerId, 'Amplicon A');
  await subFieldInput(page, containerId).fill('10');
  await subFieldInput(page, containerId).blur();
  await addMultiplexOption(page, containerId, 'Amplicon B');
  await subFieldInput(page, containerId).fill('20');
  await subFieldInput(page, containerId).blur();

  // Remove the "Amplicon A" chip via its own x button.
  const chipRemove = page.locator(`#${containerId} .select2-selection__choice`, { hasText: 'Amplicon A' })
    .locator('.select2-selection__choice__remove');
  await chipRemove.click();

  const plate = await getPlate(page, containerId);
  expect(plate.wells.A1.amplicons).toEqual([{ amplicons: 'b', conc: { value: '20', unit: 'ng/ul' } }]);
});
