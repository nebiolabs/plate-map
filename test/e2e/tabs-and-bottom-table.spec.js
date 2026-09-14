const { test, expect } = require('@playwright/test');

/*
 * Real-browser coverage for tab switching (src/js/tabs.js), checkbox ->
 * bottom-table grouping (src/js/check-box.js + src/js/bottom-table.js),
 * and a real-click regression check for this session's bottom-table
 * click-to-select fix (already covered via a synthetic dispatchEvent in
 * test/unit/audit-bugfixes.test.js -- this is the same behavior via an
 * actual mouse click, since jsdom's dispatchEvent isn't necessarily
 * identical to a real click in every respect).
 */

async function makeWidget(page, fields, tabs) {
  return page.evaluate(({ fields, tabs }) => window.PM.create({
    numRows: 8,
    numCols: 12,
    attributes: { tabs: tabs || [{ name: 'Settings', fields }] },
  }), { fields, tabs });
}

function fieldCheckbox(page, containerId, fieldName) {
  return page
    .locator(`#${containerId} .plate-setup-tab-default-field`, { has: page.locator('.plate-setup-tab-name', { hasText: fieldName }) })
    .locator('.plate-setup-tab-check-box');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('the first tab is selected automatically on creation', async ({ page }) => {
  const containerId = await makeWidget(page, null, [
    { name: 'Settings', fields: [{ id: 'a', name: 'A', type: 'text' }] },
    { name: 'Other', fields: [{ id: 'b', name: 'B', type: 'text' }] },
  ]);

  const tabs = page.locator(`#${containerId} .plate-setup-tab`);
  await expect(tabs.nth(0)).toHaveClass(/plate-setup-tab-selected/);
  await expect(tabs.nth(1)).not.toHaveClass(/plate-setup-tab-selected/);
});

test('clicking a second tab makes it the selected one and raises its data panel', async ({ page }) => {
  const containerId = await makeWidget(page, null, [
    { name: 'Settings', fields: [{ id: 'a', name: 'A', type: 'text' }] },
    { name: 'Other', fields: [{ id: 'b', name: 'B', type: 'text' }] },
  ]);

  const tabs = page.locator(`#${containerId} .plate-setup-tab`);
  await tabs.nth(1).click();

  await expect(tabs.nth(1)).toHaveClass(/plate-setup-tab-selected/);
  await expect(tabs.nth(0)).not.toHaveClass(/plate-setup-tab-selected/);

  const dataPanels = page.locator(`#${containerId} .plate-setup-data-div`);
  await expect(dataPanels.nth(1)).toHaveCSS('z-index', '1000');
  await expect(dataPanels.nth(0)).toHaveCSS('z-index', '0');
});

test('checking a field\'s checkbox groups wells by that field\'s value into bottom-table rows', async ({ page }) => {
  const containerId = await makeWidget(page, [
    { required: false, id: 'sample', name: 'Sample', type: 'text' },
  ]);

  await page.evaluate((id) => window.PM.instance(id).loadPlate({
    wells: { A1: { sample: 'foo' }, A2: { sample: 'foo' }, A3: { sample: 'bar' } },
  }), containerId);

  await fieldCheckbox(page, containerId, 'Sample').click();

  // One bottom-table row per distinct group (2 groups here: foo, bar),
  // beyond the header row.
  const rows = page.locator(`#${containerId} table.plate-setup-bottom-table tbody tr`);
  await expect(rows).toHaveCount(2);
});

test('REGRESSION (REFACTOR_NOTES.md §6 #1): a real click on a bottom-table color ' +
     'swatch with 2+ wells in the group selects all of them', async ({ page }) => {
  const containerId = await makeWidget(page, [
    { required: false, id: 'sample', name: 'Sample', type: 'text' },
  ]);

  await page.evaluate((id) => window.PM.instance(id).loadPlate({
    wells: { A1: { sample: 'foo' }, A2: { sample: 'foo' }, A3: { sample: 'bar' } },
  }), containerId);
  await fieldCheckbox(page, containerId, 'Sample').click();

  // Find the row whose group has 2 members (A1/A2's "foo" group) via the
  // real widget's own internal state, then click its actual rendered
  // swatch button -- a real mouse click, not a synthetic dispatchEvent.
  const group = await page.evaluate((id) => {
    const instance = window.PM.instance(id);
    return instance.engine.colorMap.get(instance.addressToIndex('A1'));
  }, containerId);

  const swatchButton = page.locator(`#${containerId} button.plate-setup-color-text`, { hasText: String(group) });
  await swatchButton.click();

  const selected = await page.evaluate((id) => window.PM.instance(id).getSelectedAddresses(), containerId);
  expect(selected.sort()).toEqual(['A1', 'A2'].sort());
});
