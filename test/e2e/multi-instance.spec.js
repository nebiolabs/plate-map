const { test, expect } = require('@playwright/test');

/*
 * Dedicated two-simultaneous-widget-instances test, explicitly called out
 * as missing in REFACTOR_NOTES.md's self-critique ("no test exists with
 * two simultaneous widget instances on one page -- exactly the scenario
 * that makes exportData, selectObjectInBottomTab, and readOnlyHandler's
 * unscoped document.querySelectorAll calls dangerous for a real embedder
 * running more than one widget per page"). Both findings below are NEW:
 * building this test turned the self-critique's abstract concern into two
 * concrete, easily-reproduced real bugs -- see REFACTOR_NOTES.md §6 #11.
 */

async function makeTwoWidgets(page) {
  return page.evaluate(() => {
    const fieldsA = [{ id: 'sample', name: 'Sample', type: 'text' }];
    const fieldsB = [{ id: 'other', name: 'Other', type: 'text' }];
    const a = window.PM.create({ numRows: 8, numCols: 12, attributes: { tabs: [{ name: 'Settings', fields: fieldsA }] } });
    const b = window.PM.create({ numRows: 8, numCols: 12, attributes: { tabs: [{ name: 'Settings', fields: fieldsB }] } });
    return [a, b];
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('BUG (new): loading data into ONE widget throws if a SECOND, completely ' +
     'untouched widget instance merely exists elsewhere on the page', async ({ page }) => {
  // plate-map.js's selectObjectInBottomTab does:
  //   let trs = document.querySelectorAll('table.plate-setup-bottom-table tr');
  //   for (let i = 1; i < trs.length; i++) { ... td.querySelector('button').innerHTML ... }
  // -- a document-wide query, not scoped to `this` widget's own container,
  // that skips exactly ONE row (meant to skip "the" header row). With two
  // widgets on the page this combines BOTH tables' <tr>s into one list, so
  // only the FIRST widget's header is skipped -- the second widget's own
  // header row (a <th>, with no <button> inside it at all) lands in the
  // loop as if it were a data row, and `.querySelector('button')` on it is
  // null, so `.innerHTML` throws. This fires on the very FIRST loadPlate/
  // checkbox call on ANY widget as soon as a second one exists anywhere on
  // the page, regardless of whether the second widget has ever been
  // interacted with.
  const [idA] = await makeTwoWidgets(page);

  await expect(page.evaluate((id) => {
    window.PM.instance(id).loadPlate({ wells: { A1: { sample: 'foo' } }, checkboxes: ['sample'] });
  }, idA)).rejects.toThrow(/reading 'innerHTML'/);
});

test('BUG (new): exportData on one widget silently includes bottom-table rows ' +
     'from an unrelated second widget elsewhere on the page', async ({ page }) => {
  // bottom-table.js's exportData does
  // `document.querySelectorAll("table tr")` -- not scoped to `this`
  // widget's own container, and not even scoped to
  // `table.plate-setup-bottom-table` the way selectObjectInBottomTab at
  // least attempts to. Every <table> on the whole page contributes rows.
  // Demonstrated here in the cold-start state specifically (no loadPlate
  // call on either widget) so this test doesn't depend on the separate
  // crash characterized above.
  const [idA] = await makeTwoWidgets(page);

  const clip = await page.evaluate((id) => window.PM.instance(id).exportData('clipboard'), idA);
  const groupHeaderLines = clip.split('\n').filter((line) => line.startsWith('Group'));
  // Correct (scoped) behavior would be exactly 1 -- widget A's own header.
  expect(groupHeaderLines.length).toBe(2);
});
