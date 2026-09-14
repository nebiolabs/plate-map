const { test, expect } = require('@playwright/test');

/*
 * Dedicated CSV/clipboard export coverage (bottom-table.js's exportData/
 * downloadCSV), single-widget (no cross-instance contamination -- that's
 * covered separately in multi-instance.spec.js). Real innerText (no jsdom
 * polyfill needed here, unlike test/unit/audit-bugfixes.test.js), so this
 * doubles as a real-browser cross-check of this session's exportData
 * bugfix (REFACTOR_NOTES.md §6 #1).
 */

async function makeWidget(page) {
  return page.evaluate(() => window.PM.create({
    numRows: 8,
    numCols: 12,
    attributes: { tabs: [{ name: 'Settings', fields: [{ id: 'sample', name: 'Sample', type: 'text' }] }] },
  }));
}

async function loadGroupedData(page, containerId) {
  await page.evaluate((id) => window.PM.instance(id).loadPlate({
    wells: { A1: { sample: 'foo' }, A2: { sample: 'foo' }, A3: { sample: 'bar' } },
    checkboxes: ['sample'],
  }), containerId);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('clipboard export: Location column lists the real, correct addresses for a 2+-well group', async ({ page }) => {
  const containerId = await makeWidget(page);
  await loadGroupedData(page, containerId);

  const group = await page.evaluate((id) => {
    const instance = window.PM.instance(id);
    return instance.engine.colorMap.get(instance.addressToIndex('A1'));
  }, containerId);

  const clip = await page.evaluate((id) => window.PM.instance(id).exportData('clipboard'), containerId);
  const lines = clip.split('\n');
  // Column order is Group, Location, <checked fields...> -- exportData
  // pushes the Location value immediately after column 0 (the group
  // number), before any of the field-value columns.
  expect(lines[0]).toBe('Group\tLocation\tSample');

  const groupRow = lines.find((line) => line.startsWith(group + '\t'));
  expect(groupRow).toBeDefined();
  const [, location, sampleText] = groupRow.split('\t');
  expect(sampleText).toBe('foo');
  expect(location.split(',').sort()).toEqual(['A1', 'A2'].sort());
});

test('CSV export triggers a real file download with the same Location data', async ({ page }) => {
  const containerId = await makeWidget(page);
  await loadGroupedData(page, containerId);

  const group = await page.evaluate((id) => {
    const instance = window.PM.instance(id);
    return instance.engine.colorMap.get(instance.addressToIndex('A1'));
  }, containerId);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate((id) => window.PM.instance(id).exportData('csv'), containerId),
  ]);

  expect(download.suggestedFilename()).toBe('table.csv');
  const path = await download.path();
  const content = require('fs').readFileSync(path, 'utf8');
  const lines = content.split('\n');
  // CSV values are quoted, including the group-number column itself (see
  // exportData: `v = '"' + ... + '"'` applies to every column).
  const groupLine = lines.find((line) => line.startsWith(`"${group}",`));
  expect(groupLine).toBeDefined();
  expect(groupLine).toContain('"A1,A2"');
});
