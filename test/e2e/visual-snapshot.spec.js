const { test, expect } = require('@playwright/test');

/*
 * Modest visual/DOM snapshot coverage (the last item on REFACTOR_NOTES.md's
 * Playwright checklist). Two different kinds, deliberately:
 *
 * 1. A structured DOM snapshot (tile fill/complete state per well) --
 *    portable across machines/CI, since it doesn't depend on font
 *    rendering or GPU rasterization. This is the primary "did the rendered
 *    result change" check. SVG.js's own auto-generated element ids
 *    (`SvgjsSvg1234`, incrementing per-run) are deliberately excluded from
 *    what's captured -- they're never stable across runs/order and would
 *    make the snapshot noisy for no real signal.
 * 2. One small pixel screenshot, on a tightly-clipped, tiny (2x2) plate.
 *    Pixel snapshots are inherently tied to the OS/font-rendering/GPU of
 *    whatever machine first generates the baseline -- if this fails on a
 *    different machine (including CI) with only cosmetic-looking pixel
 *    diffs, regenerate the baseline there (`--update-snapshots`) rather
 *    than assuming a real regression.
 */

async function makeWidget(page, options) {
  return page.evaluate((opts) => window.PM.create(opts), options);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('structured snapshot: tile color/completion state after grouping matches the last known-good shape', async ({ page }) => {
  const containerId = await makeWidget(page, {
    numRows: 2,
    numCols: 3,
    attributes: { tabs: [{ name: 'Settings', fields: [{ id: 'sample', name: 'Sample', type: 'text', required: true }] }] },
  });
  await page.evaluate((id) => window.PM.instance(id).loadPlate({
    wells: { A1: { sample: 'foo' }, A2: { sample: 'foo' }, A3: { sample: 'bar' } }, // B1-B3 left empty
    checkboxes: ['sample'],
  }), containerId);

  const summary = await page.evaluate((id) => {
    const instance = window.PM.instance(id);
    return instance.allTiles.map((tile) => ({
      address: tile.address,
      colorGroup: instance.engine.colorMap.get(tile.index) ?? null,
      complete: tile.tile.hasClass('incomplete') ? false : true,
    }));
  }, containerId);

  expect(JSON.stringify(summary, null, 2)).toMatchSnapshot('tile-grouping-state.json');
});

test('pixel screenshot: a tiny 2x2 plate with one grouped pair renders consistently', async ({ page }) => {
  const containerId = await makeWidget(page, {
    numRows: 2,
    numCols: 2,
    attributes: { tabs: [{ name: 'Settings', fields: [{ id: 'sample', name: 'Sample', type: 'text' }] }] },
  });
  await page.evaluate((id) => window.PM.instance(id).loadPlate({
    wells: { A1: { sample: 'foo' }, A2: { sample: 'foo' } },
    checkboxes: ['sample'],
  }), containerId);

  await expect(page.locator(`#${containerId} svg`).first()).toHaveScreenshot('tiny-plate.png', {
    maxDiffPixelRatio: 0.05,
  });
});
