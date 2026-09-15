/**
 * Regression tests for the 5 bugs found and fixed in this session's full
 * cleanup audit (see REFACTOR_NOTES.md §10.4, "New bugs found"). Distinct
 * from test/unit/audit-bugfixes.test.js, which covers an earlier session's
 * 4-site audit (§6 #10) -- these 5 were found later, via the create-field.js/
 * plate-map.js/svg-events.js/bottom-table.js cleanup-audit pass and a
 * follow-up module-level-mutable-state check.
 *
 * Bug #2 (readOnlyHandler's identical if/else branch, plate-map.js:313-320)
 * has no test here -- the decision was "leave alone, just document it," not
 * a behavior fix (see the comment left in place at that line).
 */

function makeWidget(fields, options) {
  const attributes = {
    tabs: [{ name: 'Settings', fields }]
  };
  const el = document.createElement('div');
  el.id = 'plate-map-' + Math.random().toString(36).slice(2);
  document.body.appendChild(el);
  const widget = window.jQuery(el);
  widget.plateMap(Object.assign({
    numRows: 8,
    numCols: 12,
    attributes,
    updateWells: () => {},
    selectedWells: () => {}
  }, options));
  return widget;
}

const sampleField = [
  { required: false, id: 'sample', name: 'Sample', type: 'text', placeholder: 'Sample' }
];

describe('isDisableAddDeleteWell unknown field name (bug #1, plate-map.js:339)', () => {
  test('FIXED: an emptyDefaultWell key not in defaultWell logs the real field name instead of throwing a ReferenceError', () => {
    const widget = makeWidget(sampleField);
    const instance = widget.plateMap('instance');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // 'notARealField' is not a configured field id, so this hits the
    // `else` branch that used to reference the undefined `key` instead of
    // the loop variable `field`.
    expect(() => {
      widget.plateMap('isDisableAddDeleteWell', true, { notARealField: 'x' });
    }).not.toThrow();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('No field for key: notARealField')
    );
    // Execution continued past the console.log line to completion.
    expect(instance.disableAddDeleteWell).toBe(true);

    logSpy.mockRestore();
  });
});

describe('getCheckboxes multiplex subfield at index 0 (bug #3, check-box.js:41)', () => {
  test('FIXED: a checked multiplex subfield at index 0 of its subfield list is included, not excluded', () => {
    const fields = [
      {
        id: 'reagent', name: 'Reagent', type: 'multiplex',
        options: [{ id: 'r1', text: 'Reagent1' }],
        // Exactly one subfield -- when checked, globalSelectedMultiplexSubfield['reagent']
        // becomes ['conc'], so subfields.indexOf('conc') === 0, the exact
        // falsy-index case the old `return subfields.indexOf(...)` (no
        // `>= 0`) got backwards.
        multiplexFields: [{ id: 'conc', name: 'Concentration', type: 'text' }]
      }
    ];
    const widget = makeWidget(fields);

    widget.plateMap('loadPlate', {
      wells: { A1: {} },
      // 'reagent_conc' is the subfield's full_id (mainField.id + "_" + subfield.id).
      checkboxes: ['reagent_conc']
    });

    const checkboxes = widget.plateMap('getPlate').checkboxes;
    expect(checkboxes).toContain('reagent_conc');
  });

  test('a subfield NOT checked is still correctly excluded (guards against a trivial "always true" mis-fix)', () => {
    const fields = [
      {
        id: 'reagent', name: 'Reagent', type: 'multiplex',
        options: [{ id: 'r1', text: 'Reagent1' }],
        multiplexFields: [{ id: 'conc', name: 'Concentration', type: 'text' }]
      }
    ];
    const widget = makeWidget(fields);

    widget.plateMap('loadPlate', {
      wells: { A1: {} },
      checkboxes: [] // subfield NOT checked
    });

    const checkboxes = widget.plateMap('getPlate').checkboxes;
    expect(checkboxes).not.toContain('reagent_conc');
  });
});

describe('_createOpts ajax config (bug #4, create-field.js:359)', () => {
  test('FIXED: config.ajax is read from the actual config argument, not an undefined free variable', () => {
    const widget = makeWidget(sampleField);
    const instance = widget.plateMap('instance');

    const fakeAjaxConfig = { url: '/fake-endpoint', dataType: 'json' };
    let opts;
    expect(() => {
      opts = instance._createOpts({ ajax: fakeAjaxConfig });
    }).not.toThrow();

    expect(opts.ajax).toBe(fakeAjaxConfig);

    // NOTE (out of scope for this fix, flagging for awareness): a
    // config.ajax-only field (no config.options) would still throw later in
    // _createSelectField/_createMultiSelectField, both of which do
    // `opts.data.forEach(...)` unconditionally right after calling
    // _createOpts -- `opts.data` is only ever set from config.options.
    // This fix corrects the specific free-variable ReferenceError; it does
    // not make the ajax-based select2 configuration path fully render.
    // Not fixed here since the user's decision was scoped to the typo.
  });
});

describe('window.onclick multi-instance interference (bug #5, create-field.js:1307)', () => {
  test('FIXED: opening a second widget instance\'s manage/delete dialog no longer breaks the first instance\'s outside-click-to-close', () => {
    const widgetA = makeWidget(sampleField);
    const widgetB = makeWidget(sampleField);
    const instanceA = widgetA.plateMap('instance');
    const instanceB = widgetB.plateMap('instance');

    // _deleteDialog(field) works with a minimal/empty field object (it only
    // reads field.allSelectedMultipleVal/field.name, both optional) -- calling
    // it directly reaches the exact code path that registers the
    // outside-click handler, without needing to drive real select2 UI.
    instanceA._deleteDialog({});
    const dialogA = document.querySelectorAll('.plate-modal')[0];
    expect(dialogA).toBeDefined();

    // Before the fix, this overwrote the single global `window.onclick`,
    // silently disabling instance A's outside-click-to-close.
    instanceB._deleteDialog({});
    expect(document.querySelectorAll('.plate-modal').length).toBe(2);

    // Simulate an outside click targeting instance A's own dialog overlay.
    dialogA.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    // FIXED: instance A's own listener (registered via addEventListener,
    // not the single window.onclick slot) still fires and removes A's
    // dialog, regardless of B's dialog having opened afterward.
    expect(document.body.contains(dialogA)).toBe(false);
  });
});
