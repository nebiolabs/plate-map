const { test, expect } = require('@playwright/test');

/*
 * Real-browser coverage for undo/redo via actual keyboard shortcuts
 * (interface.js's _handleShortcuts): Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z
 * and Ctrl/Cmd+Y (redo). test/unit/undo-redo.test.js already covers the
 * underlying undo()/redo() methods directly in jsdom; this instead drives
 * the actual keydown path, which only fires when
 * `document.activeElement === document.body` (create-field.js's shortcut
 * handler checks this explicitly) -- so these tests also exercise that
 * focus precondition for real, which a direct method call can't.
 */

async function makeWidget(page) {
  return page.evaluate(() => window.PM.create({
    numRows: 2,
    numCols: 2,
    attributes: { tabs: [{ name: 'Settings', fields: [{ id: 'note', name: 'Note', type: 'text' }] }] },
  }));
}

async function loadMinimalData(page, containerId) {
  await page.evaluate((id) => {
    window.PM.instance(id).loadPlate({ wells: { A1: {} }, checkboxes: ['note'] });
    window.PM.instance(id).setSelectedAddresses(['A1']);
    window.PM.instance(id).clearHistory();
  }, containerId);
}

async function noteValue(page, containerId) {
  return page.evaluate((id) => window.PM.instance(id).getPlate().wells.A1.note, containerId);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Ctrl+Z undoes the last field edit, and Ctrl+Shift+Z redoes it', async ({ page }) => {
  const containerId = await makeWidget(page);
  await loadMinimalData(page, containerId);
  expect(await noteValue(page, containerId)).toBeNull();

  await page.locator(`#${containerId} #note`).fill('first');
  await page.locator(`#${containerId} #note`).blur();
  expect(await noteValue(page, containerId)).toBe('first');

  // _handleShortcuts only fires when document.activeElement === body --
  // .blur() alone already returns focus there (confirmed: don't also click
  // a tile here, since clicking a tile changes the selection, which pushes
  // its OWN separate undo/redo entry and would require an extra undo).
  await page.keyboard.press('Control+z');
  expect(await noteValue(page, containerId)).toBeNull();

  await page.keyboard.press('Control+Shift+z');
  expect(await noteValue(page, containerId)).toBe('first');
});

test('Ctrl+Y also redoes (the alternate shortcut alongside Ctrl+Shift+Z)', async ({ page }) => {
  const containerId = await makeWidget(page);
  await loadMinimalData(page, containerId);

  await page.locator(`#${containerId} #note`).fill('second');
  await page.locator(`#${containerId} #note`).blur();

  await page.keyboard.press('Control+z');
  expect(await noteValue(page, containerId)).toBeNull();

  await page.keyboard.press('Control+y');
  expect(await noteValue(page, containerId)).toBe('second');
});

test('undo/redo shortcuts do nothing while an input field has focus ' +
     '(_handleShortcuts requires document.activeElement === document.body)', async ({ page }) => {
  const containerId = await makeWidget(page);
  await loadMinimalData(page, containerId);

  await page.locator(`#${containerId} #note`).fill('first');
  await page.locator(`#${containerId} #note`).blur();
  await page.locator(`#${containerId} .tile`).nth(0).click();

  // Refocus the input (without blurring), then try to undo -- should be a no-op.
  await page.locator(`#${containerId} #note`).click();
  await page.keyboard.press('Control+z');
  expect(await noteValue(page, containerId)).toBe('first');
});
