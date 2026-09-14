const { test, expect } = require('@playwright/test');

/*
 * Real select2 UI coverage (src/js/create-field.js) -- jsdom does not
 * render select2's actual dropdown/keyboard handling at all (see AGENTS.md's
 * testing section), so none of this is exercised by the Jest layer.
 *
 * DOM shape established by reading add-tab-data.js + create-field.js:
 * top-level (non-multiplex) fields get `full_id = data.id`, so a field
 * configured with id "pol" renders as `<select id="pol">`, with select2's
 * visible replacement UI as its next sibling `<span class="select2
 * select2-container">`. The real select2 dropdown itself is appended to
 * `document.body` while open (`.select2-container--open .select2-dropdown`),
 * not nested under the field.
 */

async function makeWidget(page, fields, extraOptions) {
  return page.evaluate(({ fields, extraOptions }) => window.PM.create(Object.assign({
    numRows: 2,
    numCols: 2,
    attributes: { tabs: [{ name: 'Settings', fields }] },
  }, extraOptions)), { fields, extraOptions });
}

async function getPlate(page, containerId) {
  return page.evaluate((id) => window.PM.instance(id).getPlate(), containerId);
}

// Works around a known, already-characterized bug (REFACTOR_NOTES.md §6
// #2): selecting wells before any real data/checkbox has ever been loaded
// throws a TypeError (bottomForFirstTime()'s placeholder bottom-table row
// has no <button> in it). Mirrors test/unit/address-math.test.js's own
// loadMinimalData() helper.
async function loadMinimalData(page, containerId, checkboxFieldId) {
  await page.evaluate(({ id, checkboxFieldId }) => {
    window.PM.instance(id).loadPlate({ wells: { A1: {} }, checkboxes: [checkboxFieldId] });
  }, { id: containerId, checkboxFieldId });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('single-select: choosing an option via the real select2 dropdown updates the field', async ({ page }) => {
  const containerId = await makeWidget(page, [
    { id: 'pol', name: 'Polymerase', type: 'select', options: [{ id: '234', text: 'Taq 1' }, { id: '123', text: 'Taq 2' }] },
  ]);
  await loadMinimalData(page, containerId, 'pol');

  // Select A1 so the field edit targets a real well.
  await page.evaluate((id) => window.PM.instance(id).setSelectedAddresses(['A1']), containerId);

  const select2Box = page.locator(`#${containerId} #pol + span.select2-container .select2-selection`);
  await select2Box.click();
  await expect(page.locator('.select2-dropdown')).toBeVisible();
  await page.locator('.select2-results__option', { hasText: 'Taq 2' }).click();

  await expect(select2Box).toContainText('Taq 2');
  const plate = await getPlate(page, containerId);
  expect(plate.wells.A1.pol).toBe('123');
});

test('multiselect: choosing two options via the real dropdown adds both as chips ' +
     'and both land in the well data', async ({ page }) => {
  const containerId = await makeWidget(page, [
    { id: 'tags', name: 'Tags', type: 'multiselect', options: [{ id: 'x', text: 'X opt' }, { id: 'y', text: 'Y opt' }, { id: 'z', text: 'Z opt' }] },
  ]);
  await loadMinimalData(page, containerId, 'tags');
  await page.evaluate((id) => window.PM.instance(id).setSelectedAddresses(['A1']), containerId);

  const select2Box = page.locator(`#${containerId} #tags + span.select2-container .select2-selection`);
  await select2Box.click();
  await page.locator('.select2-results__option', { hasText: 'X opt' }).click();

  // Multiselect dropdowns stay open after a choice in select2 -- reopen if needed.
  if (!(await page.locator('.select2-dropdown').isVisible())) {
    await select2Box.click();
  }
  await page.locator('.select2-results__option', { hasText: 'Y opt' }).click();
  await page.keyboard.press('Escape');

  const chips = await page.locator(`#${containerId} .select2-selection__choice`).allTextContents();
  expect(chips.map((c) => c.trim())).toEqual(expect.arrayContaining([expect.stringContaining('X opt'), expect.stringContaining('Y opt')]));

  const plate = await getPlate(page, containerId);
  expect(plate.wells.A1.tags.sort()).toEqual(['x', 'y'].sort());
});

test('REGRESSION/select2fix workaround: clicking a single-select\'s clear (×) button ' +
     'does NOT reopen the dropdown (a real select2 v4.0.8 bug create-field.js works around)', async ({ page }) => {
  const containerId = await makeWidget(page, [
    { id: 'pol', name: 'Polymerase', type: 'select', options: [{ id: '234', text: 'Taq 1' }, { id: '123', text: 'Taq 2' }] },
  ]);
  await loadMinimalData(page, containerId, 'pol');
  await page.evaluate((id) => window.PM.instance(id).setSelectedAddresses(['A1']), containerId);

  // The clear (x) button only renders once there's a real, non-placeholder
  // value to clear -- loadMinimalData leaves `pol` unset, so pick an option
  // via the real dropdown first.
  const select2Box = page.locator(`#${containerId} #pol + span.select2-container .select2-selection`);
  await select2Box.click();
  await page.locator('.select2-results__option', { hasText: 'Taq 1' }).click();

  const clearButton = page.locator(`#${containerId} .select2-selection__clear`);
  await expect(clearButton).toBeVisible();
  await clearButton.click();

  // Give select2 a moment to (mis)fire its normal reopen behavior if the
  // select2fix workaround weren't in place, then assert it stayed closed.
  await page.waitForTimeout(150);
  await expect(page.locator('.select2-container--open')).toHaveCount(0);
});
