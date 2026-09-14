const { test, expect } = require('@playwright/test');

/*
 * Real-browser coverage for src/js/svg-events.js's mouse drag-select
 * handling (_svgEvents/selectTiles) -- entirely uncovered by the Jest/
 * jsdom layer (jsdom implements neither getScreenCTM() nor real layout;
 * see AGENTS.md's testing section).
 *
 * Mechanics established by reading svg-events.js + svg-create.js:
 * - Each well tile is a nested <svg class="tile"> element, appended in
 *   row-major order (see svg-create.js's _putCircles: outer loop rows,
 *   inner loop cols) -- so `.tile` locator's nth(index) matches
 *   addressToIndex's numeric index directly.
 * - Row/column labels are individual <text> elements inside a single
 *   <svg class="rowHead">/<svg class="colHead">, one per row/col, also in
 *   order -- `.rowHead text`/`.colHead text` nth(i) is row/col i's label.
 * - Selection extend/toggle ("secondary" mode) reads `evt.shiftKey` on
 *   mouseup (endDrag), not a ctrl-click -- distinct from bottom-table.js's
 *   click-to-select-by-color-group, which uses ctrlKey instead.
 * - Starting a drag from inside the row-label gutter (negative SVG x,
 *   which the rowHead/colHead nested <svg>s occupy) forces the selection
 *   to span every column in the dragged row range, regardless of where
 *   the drag ends horizontally (selectTiles's `pos0.x < 0` branch) --
 *   the "drag from the row/column label gutter selects the whole row"
 *   special case called out in REFACTOR_NOTES.md's self-critique.
 */

async function makeWidget(page, options) {
  return page.evaluate((opts) => window.PM.create(opts), options);
}

async function tileCenter(page, containerId, index) {
  const box = await page.locator(`#${containerId} .tile`).nth(index).boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function rowHeadCenter(page, containerId, rowIndex) {
  const box = await page.locator(`#${containerId} .rowHead text`).nth(rowIndex).boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function colHeadCenter(page, containerId, colIndex) {
  const box = await page.locator(`#${containerId} .colHead text`).nth(colIndex).boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function dragSelect(page, from, to, { shift = false } = {}) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 4 });
  if (shift) await page.keyboard.down('Shift');
  await page.mouse.up();
  if (shift) await page.keyboard.up('Shift');
}

async function selectedAddresses(page, containerId) {
  return page.evaluate((id) => window.PM.instance(id).getSelectedAddresses(), containerId);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('a plain click (no drag) selects exactly the one well under the cursor', async ({ page }) => {
  const containerId = await makeWidget(page, {
    numRows: 8, numCols: 12,
    attributes: { tabs: [{ name: 'Settings', fields: [] }] },
  });
  const b1 = await tileCenter(page, containerId, 12); // row1,col0 on a 12-col plate
  await dragSelect(page, b1, b1);
  expect(await selectedAddresses(page, containerId)).toEqual(['B1']);
});

test('dragging a rectangular box selects every well inside it', async ({ page }) => {
  const containerId = await makeWidget(page, {
    numRows: 8, numCols: 12,
    attributes: { tabs: [{ name: 'Settings', fields: [] }] },
  });
  const a1 = await tileCenter(page, containerId, 0);   // A1
  const b2 = await tileCenter(page, containerId, 13);  // B2
  await dragSelect(page, a1, b2);
  expect(await selectedAddresses(page, containerId)).toEqual(['A1', 'A2', 'B1', 'B2']);
});

test('shift-drag over new wells EXTENDS the existing selection', async ({ page }) => {
  const containerId = await makeWidget(page, {
    numRows: 8, numCols: 12,
    attributes: { tabs: [{ name: 'Settings', fields: [] }] },
  });
  const a1 = await tileCenter(page, containerId, 0);
  await dragSelect(page, a1, a1); // select A1 alone first
  expect(await selectedAddresses(page, containerId)).toEqual(['A1']);

  const c3 = await tileCenter(page, containerId, 26); // row2,col2 -> C3
  await dragSelect(page, c3, c3, { shift: true });
  expect(await selectedAddresses(page, containerId).then((a) => a.sort())).toEqual(['A1', 'C3']);
});

test('shift-drag back over an already-selected block DESELECTS it', async ({ page }) => {
  const containerId = await makeWidget(page, {
    numRows: 8, numCols: 12,
    attributes: { tabs: [{ name: 'Settings', fields: [] }] },
  });
  const a1 = await tileCenter(page, containerId, 0);
  const b2 = await tileCenter(page, containerId, 13);
  await dragSelect(page, a1, b2); // select A1,A2,B1,B2
  expect(await selectedAddresses(page, containerId).then((a) => a.sort())).toEqual(['A1', 'A2', 'B1', 'B2']);

  await dragSelect(page, a1, a1, { shift: true }); // shift-drag over just A1 again
  expect(await selectedAddresses(page, containerId).then((a) => a.sort())).toEqual(['A2', 'B1', 'B2']);
});

test('starting a drag inside the row-label gutter selects the ENTIRE row, ' +
     'regardless of where the drag ends horizontally', async ({ page }) => {
  const containerId = await makeWidget(page, {
    numRows: 8, numCols: 12,
    attributes: { tabs: [{ name: 'Settings', fields: [] }] },
  });
  const rowBGutter = await rowHeadCenter(page, containerId, 1); // row B's label
  const endInMiddleOfRowB = await tileCenter(page, containerId, /* B3 */ 14);
  await dragSelect(page, rowBGutter, endInMiddleOfRowB);

  const expected = Array.from({ length: 12 }, (_, c) => 'B' + (c + 1));
  expect(await selectedAddresses(page, containerId).then((a) => a.sort())).toEqual(expected.sort());
});

test('starting a drag inside the column-label gutter selects the ENTIRE column, ' +
     'regardless of where the drag ends vertically', async ({ page }) => {
  const containerId = await makeWidget(page, {
    numRows: 8, numCols: 12,
    attributes: { tabs: [{ name: 'Settings', fields: [] }] },
  });
  const col3Gutter = await colHeadCenter(page, containerId, 2); // column "3"'s label
  const endInMiddleOfCol3 = await tileCenter(page, containerId, /* D3 */ 38);
  await dragSelect(page, col3Gutter, endInMiddleOfCol3);

  const expected = ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3'];
  expect(await selectedAddresses(page, containerId).then((a) => a.sort())).toEqual(expected.sort());
});

test('REGRESSION (REFACTOR_NOTES.md §6 #1): drag-select spanning index >= 10 ' +
     'returns addresses in real reading order, not lexicographic-string order', async ({ page }) => {
  // Before this session's fix, svg-events.js's selectTiles did
  // `that.setSelectedIndices(indices.sort())` with no comparator, which
  // stringifies indices before comparing -- sorting index 10/11 before 2.
  // Dragging the entire first row of a 12-col plate spans indices 0-11.
  const containerId = await makeWidget(page, {
    numRows: 8, numCols: 12,
    attributes: { tabs: [{ name: 'Settings', fields: [] }] },
  });
  const a1 = await tileCenter(page, containerId, 0);
  const a12 = await tileCenter(page, containerId, 11);
  await dragSelect(page, a1, a12);

  const expectedInIndexOrder = Array.from({ length: 12 }, (_, c) => 'A' + (c + 1));
  // Intentionally NOT sorted before comparing -- order is the point.
  expect(await selectedAddresses(page, containerId)).toEqual(expectedInIndexOrder);
});
