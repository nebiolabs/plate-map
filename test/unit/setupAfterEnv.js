/*
 * Runs once per test file, after the Jest test framework (describe/test/
 * beforeEach/afterEach) is installed -- unlike test/unit/setup.js (which
 * loads jQuery/select2/SVG.js/plate-map's own src before the framework
 * exists and can't use afterEach itself).
 *
 * Several src/js/*.js functions query the DOM globally instead of scoping to
 * the widget's own container (e.g. plate-map.js's selectObjectInBottomTab
 * does `document.querySelectorAll('table.plate-setup-bottom-table tr')` --
 * see architecture notes / test comments for the real bug this causes with
 * multiple instances). Without cleanup, widget containers created by one
 * test's makeWidget()-style helper stay in `document.body` for every
 * subsequent test in the same file, silently turning EVERY test into an
 * unintentional multi-instance scenario and producing misleading failures
 * that have nothing to do with what that test is actually characterizing.
 * Clearing the DOM after each test keeps tests isolated from each other,
 * the same way a real page reload would.
 */
afterEach(() => {
  document.body.innerHTML = '';
});
