var plateMapWidget = plateMapWidget || {};

/**
 * Static inline-HTML glyphs used elsewhere: doImg/dontImg are the
 * checked/unchecked checkbox glyphs (check-box.js), warningImg is the
 * required-field warning icon (add-warning-msg.js's fieldWarningMsg).
 * Intentionally NOT merged with color-manager.js despite both being
 * small static-data files -- see REFACTOR_NOTES.md §10.14 for why that
 * merge was considered and rejected (color-manager.js picked up real
 * logic, and these two files' callers/concerns don't overlap).
 */
plateMapWidget.assets = function() {
  return {
    _assets: {
      doImg: '&#10003;',
      dontImg: '',
      warningImg: '&#9888;'
    }
  };
};
