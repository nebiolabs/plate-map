const { test, expect } = require('@playwright/test');

/*
 * Dedicated two-simultaneous-widget-instances test, explicitly called out
 * as missing in REFACTOR_NOTES.md's self-critique ("no test exists with
 * two simultaneous widget instances on one page -- exactly the scenario
 * that makes exportData, selectObjectInBottomTab, and readOnlyHandler's
 * unscoped document.querySelectorAll calls dangerous for a real embedder
 * running more than one widget per page"). Building this test originally
 * turned that abstract concern into two concrete, easily-reproduced real
 * bugs; both are now FIXED (selectObjectInBottomTab and exportData are
 * scoped to `this.bottomTable` instead of a page-wide
 * document.querySelectorAll) -- see REFACTOR_NOTES.md §6 #11.
 *
 * readOnlyHandler's own unscoped `$('.multiple-field-manage-delete-button')`
 * selector (named in the self-critique alongside the two above) is a
 * separate, still-uncharacterized concern -- not touched here since it was
 * never pinned down with an actual test/repro the way these two were.
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

test('FIXED (REFACTOR_NOTES.md §6 #11): loading data into ONE widget no longer throws ' +
     'when a SECOND, completely untouched widget instance merely exists elsewhere on the page', async ({ page }) => {
  // plate-map.js's selectObjectInBottomTab used to do:
  //   let trs = document.querySelectorAll('table.plate-setup-bottom-table tr');
  //   for (let i = 1; i < trs.length; i++) { ... td.querySelector('button').innerHTML ... }
  // -- a document-wide query, not scoped to `this` widget's own container,
  // that skips exactly ONE row (meant to skip "the" header row). With two
  // widgets on the page this combined BOTH tables' <tr>s into one list, so
  // only the FIRST widget's header was skipped -- the second widget's own
  // header row (a <th>, with no <button> inside it at all) landed in the
  // loop as if it were a data row, and `.querySelector('button')` on it was
  // null, so `.innerHTML` threw. This fired on the very FIRST loadPlate/
  // checkbox call on ANY widget as soon as a second one existed anywhere on
  // the page, regardless of whether the second widget had ever been
  // interacted with.
  //
  // Fixed by scoping the query to `this.bottomTable[0]` (an instance
  // property already set up in bottom-table.js's _bottomScreen) instead of
  // `document` -- each widget now only ever sees its own rows.
  const [idA] = await makeTwoWidgets(page);

  await page.evaluate((id) => {
    window.PM.instance(id).loadPlate({ wells: { A1: { sample: 'foo' } }, checkboxes: ['sample'] });
  }, idA);

  const selectedInA = await page.evaluate((id) => window.PM.instance(id).getSelectedAddresses(), idA);
  expect(selectedInA).toEqual(['A1']);
});

test('FIXED (REFACTOR_NOTES.md §6 #11): exportData on one widget no longer includes ' +
     'bottom-table rows from an unrelated second widget elsewhere on the page', async ({ page }) => {
  // bottom-table.js's exportData used to do
  // `document.querySelectorAll("table tr")` -- not scoped to `this`
  // widget's own container, and not even scoped to
  // `table.plate-setup-bottom-table` the way selectObjectInBottomTab at
  // least attempted to. Every <table> on the whole page contributed rows.
  // Demonstrated here in the cold-start state specifically (no loadPlate
  // call on either widget) so this test doesn't depend on the separate
  // crash characterized/fixed above.
  //
  // Fixed the same way: scoped to `this.bottomTable[0]` instead of
  // `document`.
  const [idA] = await makeTwoWidgets(page);

  const clip = await page.evaluate((id) => window.PM.instance(id).exportData('clipboard'), idA);
  const groupHeaderLines = clip.split('\n').filter((line) => line.startsWith('Group'));
  expect(groupHeaderLines.length).toBe(1); // widget A's own header only
});
