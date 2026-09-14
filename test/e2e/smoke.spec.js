const { test, expect } = require('@playwright/test');

/*
 * Harness smoke test: confirms the fixture page loads real dependencies +
 * src/js/*.js correctly and a basic widget renders, before any of the
 * feature-specific spec files below try to build on top of it.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('fixture page loads plate-map and jQuery/select2 globals with no console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const globalsPresent = await page.evaluate(() => ({
    jquery: typeof window.jQuery === 'function',
    select2: typeof window.jQuery.fn.select2 === 'function',
    svg: typeof window.SVG === 'function',
    clipboard: typeof window.ClipboardJS === 'function',
    plateMapWidgetFactory: typeof window.jQuery.fn.plateMap === 'function',
  }));

  expect(globalsPresent).toEqual({
    jquery: true,
    select2: true,
    svg: true,
    clipboard: true,
    plateMapWidgetFactory: true,
  });
  expect(errors).toEqual([]);
});

test('a minimal widget renders an 8x12 grid of tiles', async ({ page }) => {
  const containerId = await page.evaluate(() => {
    return window.PM.create({
      numRows: 8,
      numCols: 12,
      attributes: { tabs: [{ name: 'Settings', fields: [] }] },
    });
  });

  // svg-create.js renders 4 <circle> elements per well (a shadow, the
  // colored fill tile itself, and 2 completion-ring circles) -- the fill
  // tile specifically carries the `circle` class (see setTileColor).
  const tileCount = await page.locator(`#${containerId} svg circle.circle`).count();
  expect(tileCount).toBe(96);
});
