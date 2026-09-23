/**
 * DNA.plateMap -- the jQuery UI widget definition itself (see the jQuery
 * UI widget factory, `$.widget`). This file owns the widget's public
 * lifecycle (`_create`/`_init`) and the plate coordinate-system math
 * (address <-> {row, col} location <-> flat numeric index) that every
 * other src/js/*.js mixin file relies on. See AGENTS.md for how those
 * other files get merged onto this widget instance at creation time.
 *
 * Coordinate systems in play throughout the codebase:
 *   - "address": a human-readable well label, e.g. "A1", "H12", "AA3"
 *     for plates with >26 columns of rows.
 *   - "loc": {r, c} -- zero-based row/column pair.
 *   - "index": a single flat integer (r * numCols + c) -- this is the key
 *     used everywhere internally (this.engine.derivative, this.allTiles,
 *     etc.) instead of the address string, for performance and because
 *     Array/Map keys are simpler than parsing "A1"-style strings.
 */
$.widget("DNA.plateMap", {

  options: {
    value: 0
  },

  // Parses a well address string ("A1", "AA12", ...) into a zero-based
  // {r, c} location. Row letters follow spreadsheet-style base-26
  // encoding (A-Z, then AA-AZ, ...), NOT zero-padded base-26 -- see
  // _rowKey below for the encode side of this same scheme.
  addressToLoc: function(address) {
    let m = /^([A-Z]+)(\d+)$/.exec(address.trim().toUpperCase());
    if (m) {
      let row_v = m[1];
      let col = parseInt(m[2]) - 1;
      let row = 0;
      for (let i = 0; i < row_v.length; i++) {
        let c = row_v.charCodeAt(i) - 65;
        if (i) {
          row += 1;
          row *= 26;
          row += c;
        } else {
          row = c;
        }
      }
      return {
        r: row,
        c: col
      };
    } else {
      throw address + " not a proper plate address";
    }
  },

  // {r, c} location -> flat numeric index (r * numCols + c). Throws if
  // the location is out of bounds for the given (or current) dimensions.
  locToIndex: function(loc, dimensions) {
    if (!dimensions) {
      dimensions = this.dimensions;
    }
    if (!(loc.r >= 0 && loc.r < dimensions.rows)) {
      throw "Row index " + (loc.r + 1) + " invalid";
    }
    if (!(loc.c >= 0 && loc.c < dimensions.cols)) {
      throw "Column index " + (loc.c + 1) + " invalid";
    }
    return loc.r * dimensions.cols + loc.c;
  },

  // Well address string -> flat numeric index, in one step.
  addressToIndex: function(address, dimensions) {
    let loc = this.addressToLoc(address);
    return this.locToIndex(loc, dimensions);
  },

  // Zero-based row number -> spreadsheet-style row letter(s) (0->"A",
  // 25->"Z", 26->"AA", ...). Encode side of addressToLoc's decode.
  _rowKey: function(i) {
    let c1 = i % 26;
    let c2 = (i - c1) / 26;
    let code = String.fromCharCode(65 + c1);
    if (c2 > 0) {
      code = String.fromCharCode(64 + c2) + code;
    }
    return code;
  },

  // Zero-based column number -> 1-based column label (plain digits).
  _colKey: function (i) {
    return (i+1).toString(10);
  },

  // Flat numeric index -> {r, c} location. Throws if index is out of
  // bounds for the given (or current) dimensions.
  indexToLoc: function(index, dimensions) {
    if (!dimensions) {
      dimensions = this.dimensions;
    }

    if (index >= dimensions.rows * dimensions.cols) {
      throw "Index too high: " + index.toString(10);
    }
    let loc = {};
    loc.c = index % dimensions.cols;
    loc.r = (index - loc.c) / dimensions.cols;

    return loc;
  },

  // {r, c} location -> well address string (row letters + column digits).
  locToAddress: function(loc) {
    return this._rowKey(loc.r) + this._colKey(loc.c);
  },

  // Flat numeric index -> well address string, in one step.
  indexToAddress: function(index, dimensions) {
    let loc = this.indexToLoc(index, dimensions);
    return this.locToAddress(loc);
  },

  // Returns a defensive deep copy of {rows, cols} -- callers must not be
  // able to mutate the widget's own this.dimensions via the return value.
  getDimensions: function() {
    return $.extend(true, {}, this.dimensions);
  },

  // jQuery UI widget factory lifecycle hook: runs exactly once, the first
  // time .plateMap(options) is called on an element. Sets up dimensions,
  // then merges every plateMapWidget.* mixin factory (one per src/js/*.js
  // file) onto this instance -- see AGENTS.md for why this is a flat,
  // shared-namespace merge rather than encapsulated modules -- before
  // building the actual DOM interface.
  _create: function() {
    let rows = parseInt(this.options.numRows || 8);
    let cols = parseInt(this.options.numCols || 12);
    this.dimensions = {
      rows: rows,
      cols: cols
    };
    this.rowIndex = [];
    for (let i = 0; i < rows; i++) {
      this.rowIndex.push(this._rowKey(i));
    }

    this.target = (this.element[0].id) ? "#" + this.element[0].id : "." + this.element[0].className;

    // Import classes from other files.. Here we import it using extend and add it to this
    // object. internally we add to widget.DNA.getPlates.prototype.
    // Helpers are methods which return other methods and objects.
    // add Objects to plateMapWidget and it will be added to this object.
    // set read only well
    if (this.options.readOnly) {
      this.isReadOnly(true);
    }

    for (let component in plateMapWidget) {
      if (plateMapWidget.hasOwnProperty(component)) {
        // Incase some properties has to initialize with data from options hash,
        // we provide it sending this object.
        $.extend(this, new plateMapWidget[component](this));
      }
    }

    this._createInterface();

    this._trigger("created", null, this);

    return this;
  },

  _init: function() {
    // This is invoked when the user use the plugin after _create is called.
    // The point is _create is invoked for the very first time and for all other
    // times _init is used.
  },

  // wellsData follows syntax: {A1:{field1: val1, field2: val2}, A2:{field1: val1, field2: val2}}
  // Converts a wells hash (address -> {fieldId: rawValue}) into its
  // display-text form, via each field's own parseText -- used for
  // anything that needs human-readable values (e.g. the "differences"
  // UI flow) rather than the raw stored value shapes ({value, unit}
  // objects, multiplex arrays, etc.). Fields not found in fieldMap pass
  // their raw value through unconverted.
  getTextDerivative: function(wellsData) {
    let textDerivative = {};
    let fieldMap = this.fieldMap;
    for (let address in wellsData) {
      if (!wellsData.hasOwnProperty(address)) {
        continue;
      }
      let textValWell = {};
      let textFieldIdWell = {};
      let curWellData = wellsData[address];
      for (let fieldId in curWellData) {
        if (!curWellData.hasOwnProperty(fieldId)) {
          continue;
        }
        if (fieldId in fieldMap) {
          let field = fieldMap[fieldId];
          let textVal = field.parseText(curWellData[fieldId]);
          textFieldIdWell[field.name] = textVal;
          textValWell[fieldId] = textVal;
        } else {
          // do not convert if not a field
          textFieldIdWell[fieldId] = curWellData[fieldId];
          textValWell[fieldId] = curWellData[fieldId];
        }
      }
      textDerivative[address] = {
        textVal: textValWell,
        textFieldVal: textFieldIdWell
      };
    }

    return textDerivative;
  },

  // Enables/disables every rendered field's input control (the field's
  // own `disabled` method, established independently by each field type
  // in create-field-*.js -- see that file group's shared "field
  // contract" docblock).
  setFieldsDisabled: function(flag) {
    this.fieldList.forEach(function(field) {
      field.disabled(flag);
    });
  },

  // Sets the widget-wide read-only flag and immediately re-applies its
  // UI consequences via readOnlyHandler (hides/shows overlay buttons,
  // enables/disables field inputs).
  isReadOnly: function(flag) {
    this.readOnly = !!flag;
    this.readOnlyHandler();
  },

  readOnlyHandler: function() {
    // NOTE: both branches below hide .multiple-field-manage-delete-button
    // unconditionally -- looks like it should differ by readOnly state, but
    // investigated (REFACTOR_NOTES.md §10.4 #2) and left as-is: that button
    // is only ever appended to the DOM inside the transient multiselect
    // delete-confirmation dialog, and only `if (!that.readOnly)` at creation
    // time (create-field.js's _createDeleteButton) -- it's removed again
    // when the dialog closes. So this duplication rarely has a live target
    // to act on, and there's no spec/CSS to check a "correct" rule against.
    // Not touching it; documenting it instead.
    if (this.readOnly) {
      this.overLayButtonContainer.css("display", "none");
      $('.multiple-field-manage-delete-button').css("display", "none");
      this.setFieldsDisabled(true);
    } else {
      this.overLayButtonContainer.css("display", "flex");
      $('.multiple-field-manage-delete-button').css("display", "none");
      if (!this.disableAddDeleteWell) {
        this.setFieldsDisabled(false);
      }
    }
  },

  disableAddDeleteWell: null,

  // Enables/disables "restricted editing" mode: when flag is true,
  // wells can no longer be emptied out of existence by clearing all
  // their fields (they instead reset to emptyWellWithDefaultVal) and no
  // new wells can be added beyond the initially-loaded set
  // (this.addressAllowToEdit). emptyDefaultWell optionally overrides
  // individual field defaults used for that "reset" value.
  // column_with_default_val will be used to determine empty wells, format: {field_name: default_val}
  isDisableAddDeleteWell: function(flag, emptyDefaultWell) {
    if (flag) {
      let emptyWellWithDefaultVal = $.extend(true, {}, this.defaultWell);
      if (emptyDefaultWell) {
        for (let field in emptyDefaultWell) {
          if (emptyDefaultWell.hasOwnProperty(field)) {
            if (field in emptyWellWithDefaultVal) {
              emptyWellWithDefaultVal[field] = emptyDefaultWell[field]
            } else {
              // Was "+ key" -- `key` was never declared in this scope (the
              // loop variable is `field`), so this threw a ReferenceError
              // instead of logging, any time emptyDefaultWell named a field
              // not in this.defaultWell. See REFACTOR_NOTES.md §10.4 #1.
              console.log("No field for key: " + field + ", please contact support");
            }
          }
        }
      }
      this.disableAddDeleteWell = true;
      this.addressAllowToEdit = this.getWellSetAddressWithData();
      // configure undo redo action
      this.actionPointer = 0;
      this.undoRedoArray = [this.createState()];
      this.emptyWellWithDefaultVal = emptyWellWithDefaultVal;
    } else {
      this.disableAddDeleteWell = false;
      this.emptyWellWithDefaultVal = null;
    }
    this.readOnlyHandler();
  },

  // Highlights the bottom-table rows whose group/color matches the
  // currently selected wells (adds/removes the "selected" CSS class).
  selectObjectInBottomTab: function() {
    let colors = [];
    let selectedIndices = this.selectedIndices;
    for (let i = 0; i < selectedIndices.length; i++) {
      let index = selectedIndices[i];
      let well = this.engine.derivative[index];
      if (well) {
        let color = this.engine.colorMap.get(index);
        if (colors.indexOf(color) < 0) {
          colors.push(color);
        }
      }
    }
    // Scoped to this widget's own bottom table (this.bottomTable, set up in
    // bottom-table.js's _bottomScreen) -- NOT a page-wide
    // document.querySelectorAll. With two widget instances on one page, an
    // unscoped query combines both tables' <tr>s into one list, but this
    // loop only skips ONE row (meant to skip "the" header) -- the second
    // widget's own header row (a <th>, no <button> inside it) would get
    // walked into as if it were a data row and crash on the null
    // .querySelector('button') result. See REFACTOR_NOTES.md §6 #11.
    let trs = this.bottomTable[0].querySelectorAll('tr');
    for (let i = 1; i < trs.length; i++) { // start at 1 to skip the table headers
      let tr = trs[i];
      let td = tr.children[0];
      let isSelected = colors.indexOf(Number(td.querySelector('button').innerHTML)) >= 0;
      tr.classList.toggle("selected", isSelected);
    }
  },

  // Returns a defensive copy of the currently-selected well indices.
  getSelectedIndices: function() {
    return this.selectedIndices.slice();
  },

  // Public API: returns the currently-selected wells as address strings
  // (e.g. ["A1", "A2"]) rather than internal numeric indices.
  getSelectedAddresses: function() {
    return this.selectedIndices.map(function(index) {
      return this.allTiles[index].address;
    }, this);
  },

  // Public API: selects wells by address string. Addresses are
  // sanitized (deduped, sorted, converted to indices) via
  // sanitizeAddresses (load-plate.js) before delegating to
  // setSelectedIndices.
  setSelectedAddresses: function(addresses, noUndoRedo) {
    let indices = this.sanitizeAddresses(addresses);
    this.setSelectedIndices(indices, noUndoRedo);
  },

  // Public API: selects wells by numeric index (assumed already
  // sanitized by the caller -- see the "Indices should be sanitized"
  // comment below). Falls back to selecting index 0 if given an empty/
  // null selection (a plate always has at least one selected well).
  // Updates the tile-selection visuals, refreshes the tab fields to
  // reflect the new selection's common data, fires the "selectedWells"
  // callback, updates the bottom-table highlight, and records undo/redo
  // history unless noUndoRedo is set (used for history-replay itself).
  setSelectedIndices: function (indices, noUndoRedo) {
    if (!indices || indices.length === 0) {
      indices = [0];
    }
    // Indices should be sanitized
    this.setSelection(indices);
    //this._colorMixer();
    this.decideSelectedFields();
    this._trigger("selectedWells", null, {selectedAddress: this.getSelectedAddresses()});
    this.selectObjectInBottomTab();
    if (!noUndoRedo) {
      this.addToUndoRedo();
    }
  }

});
