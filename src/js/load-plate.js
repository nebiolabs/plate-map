var plateMapWidget = plateMapWidget || {};

/**
 * The public loadPlate() API and its input-sanitization helpers. This
 * is the "load a whole plate's worth of data" counterpart to
 * add-data-on-change.js's getPlate() -- converts the documented
 * consumer-facing shape (wells keyed by ADDRESS string, e.g.
 * {A1: {fieldId: value}}) into the internal index-keyed representation,
 * with every field value run through its own parseValue (the field
 * contract, see create-field-core.js) so malformed/legacy input fails
 * fast rather than silently corrupting internal state.
 */
plateMapWidget.loadPlate = function() {
  // Methods which look after data changes and stack up accordingly
  // Remember THIS points to plateMapWidget and 'this' points to engine
  return {

    // Public API. `data.wells` (if provided) replaces the whole plate's
    // data, converted from address-keyed to index-keyed and sanitized
    // per-field; omitting it leaves existing well data untouched.
    // Likewise `data.checkboxes` (if provided) replaces the checked
    // fields; omitting it preserves the current checked set.
    loadPlate: function(data) {
      //sanitize input
      let derivative;
      if (data.hasOwnProperty('wells')) {
        derivative = {};
        for (let address in data.wells) {
          let well = data.wells[address];
          let index = this.addressToIndex(address);
          derivative[index] = this.sanitizeWell(well);
        }
      } else {
        derivative = this.engine.derivative;
      }

      let checkboxes;
      if (data.hasOwnProperty('checkboxes')) {
        checkboxes = this.sanitizeCheckboxes(data.checkboxes);
      } else {
        checkboxes = this.getCheckboxes();
      }

      let sanitized = {
        "derivative": derivative,
        "checkboxes": checkboxes
      };

      this.setData(sanitized);
    },

    // Filters a raw list of field ids down to only real, known
    // checkbox-bearing field ids (this.allCheckboxes, populated in
    // check-box.js's _addCheckBox) -- drops anything unrecognized rather
    // than throwing.
    sanitizeCheckboxes: function(checkboxes) {
      checkboxes = checkboxes || [];
      return this.allCheckboxes.filter(fieldId => checkboxes.indexOf(fieldId) >= 0);
    },

    // Converts a list of address strings to sorted, deduplicated numeric
    // indices. Used by plate-map.js's setSelectedAddresses (the public
    // "select these wells" API).
    sanitizeAddresses: function(selectedAddresses) {
      selectedAddresses = selectedAddresses || [];
      // Wrap in an arrow rather than passing addressToIndex directly to
      // .map(): Array#map invokes its callback as (element, index, array),
      // so a bare method reference would receive the array index as
      // addressToIndex's `dimensions` parameter for every element past the
      // first. See REFACTOR_NOTES.md §6 #1.
      let indices = selectedAddresses.map(address => this.addressToIndex(address));
      // Explicit numeric comparator: default Array#sort() stringifies
      // elements, which sorts index 10 before index 2.
      indices.sort((a, b) => a - b);
      indices = indices.filter((index, i) => indices.indexOf(index) === i);
      return indices;
    },

    // Runs every one of a single well's raw field values through that
    // field's own parseValue (the field contract -- see create-field-
    // core.js) -- this is the one place external/legacy well data gets
    // validated and normalized into the shapes the rest of the widget
    // expects (e.g. converting a bare numeric-string value into the
    // {value, unit} shape for a field with units configured).
    sanitizeWell: function(well) {
      let newWell = {};
      this.fieldList.forEach(function (field) {
        newWell[field.id] = field.parseValue(well[field.id]);
      });
      return newWell;
    },

    // The actual state-replacement primitive used by loadPlate (above),
    // undo-redo-manager.js's setUndoRedo, and elsewhere: wholesale
    // replaces this.engine.derivative/checkboxes/selection, fires
    // "updateWells", and records undo/redo history unless `quiet` is set
    // (used for undo/redo replay itself, so undoing doesn't push a new
    // history entry).
    setData: function(data, quiet) {
      this.engine.derivative = data.derivative;
      this.setCheckboxes(data.checkboxes, true);
      this.setSelectedIndices(data.selectedIndices, true);
      this.derivativeChange();
      if (!quiet) {
        this.addToUndoRedo();
      }
    },

  }
};
