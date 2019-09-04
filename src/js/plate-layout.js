$.widget("DNA.plateLayOut", {

  plateLayOutWidget: {},

  options: {
    value: 0
  },

  addressToLoc: function(layoutAddress) {
    var m = /^([A-Z]+)(\d+)$/.exec(layoutAddress.trim().toUpperCase())
    if (m) {
      var row_v = m[1];
      var col = parseInt(m[2]) - 1;
      var row;
      for (var i = 0; i < row_v.length; i++) {
        var c = row_v.charCodeAt(i) - 65;
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
      throw layoutAddress + " not a proper layout address";
    }
  },

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

  addressToIndex: function(layoutAddress, dimensions) {
    var loc = this.addressToLoc(layoutAddress);
    return this.locToIndex(loc, dimensions);
  },

  _rowKey: function(i) {
    var c1 = i % 26;
    var c2 = (i - c1) / 26;
    var code = String.fromCharCode(65 + c1);
    if (c2 > 0) {
      code = String.fromCharCode(64 + c2) + code;
    }
    return code;
  },

  _colKey: function (i) {
    return (i+1).toString(10);
  },

  indexToLoc: function(index, dimensions) {
    if (!dimensions) {
      dimensions = this.dimensions;
    }

    if (index >= dimensions.rows * dimensions.cols) {
      throw "Index too high: " + index.toString(10);
    }
    var loc = {};
    loc.c = index % dimensions.cols;
    loc.r = (index - loc.c) / dimensions.cols;

    return loc;
  },

  locToAddress: function(loc) {
    return this._rowKey(loc.r) + this._colKey(loc.c);
  },

  indexToAddress: function(index, dimensions) {
    var loc = this.indexToLoc(index, dimensions);
    return this.locToAddress(loc);
  },

  getDimensions: function() {
    return $.extend(true, {}, this.dimensions);
  },

  _create: function() {
    var rows = parseInt(this.options.numRows || 8);
    var cols = parseInt(this.options.numCols || 12);
    this.dimensions = {
      rows: rows,
      cols: cols
    };
    this.rowIndex = [];
    for (var i = 0; i < rows; i++) {
      this.rowIndex.push(this._rowKey(i));
    }

    this.target = (this.element[0].id) ? "#" + this.element[0].id : "." + this.element[0].className;

    // Import classes from other files.. Here we import it using extend and add it to this
    // object. internally we add to widget.DNA.getPlates.prototype.
    // Helpers are methods which return other methods and objects.
    // add Objects to plateLayOutWidget and it will be added to this object.
    // set read only well
    if (this.options.readOnly) {
      this.isReadOnly(true);
    }

    for (var component in plateLayOutWidget) {
      // Incase some properties has to initialize with data from options hash,
      // we provide it sending this object.
      $.extend(this, new plateLayOutWidget[component](this));
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
  getTextDerivative: function(wellsData) {
    var textDerivative = {};
    var fieldMap = this.fieldMap;
    for (var address in wellsData) {
      var textValWell = {};
      var textFieldIdWell = {};
      var curWellData = wellsData[address];
      for (var fieldId in curWellData) {
        if (fieldId in this.fieldMap) {
          var field = this.fieldMap[fieldId];
          var textVal = field.parseText(curWellData[fieldId]);
          textFieldIdWell[field.name] = textVal;
          textValWell[fieldId] = textVal;
        } else {
          // do not convert if not a field (ex: layout_address)
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

  // wellsData follows syntax: {A1:{field1: val1, field2: val2}, A1:{field1: val1, field2: val2}}
  getWellsDifferences: function(wellsHash) {
    var wells = [];
    for (var wellId in wellsHash) {
      wells.push(wellsHash[wellId]);
    }
    var differentWellsVals = {};
    if (wells.length > 1) {
      var commonWell = this._getCommonWell(wells);
      var allFieldVal = {};
      for (var fieldIdx in wells[0]) {
        allFieldVal[fieldIdx] = [];
      }
      for (var address in wellsHash) {
        var diffWellVal = {};
        var curWellData = wellsHash[address];
        for (var fieldId in curWellData) {
          var commonVal = commonWell[fieldId];
          var curVal = curWellData[fieldId];
          var newVal = null;
          if (Array.isArray(curVal)) {
            // get uncommonVal
            newVal = [];
            for (var idx = 0; idx < curVal.length; idx++) {
              var curMultiVal = curVal[idx];
              // multiplex field
              if (curMultiVal && typeof (curMultiVal) === "object") {
                if (!this.containsObject(curMultiVal, commonVal)) {
                  newVal.push(curMultiVal);
                  if (!this.containsObject(curMultiVal, allFieldVal[fieldId])) {
                    allFieldVal[fieldId].push(curMultiVal);
                  }
                }
              } else {
                if (commonVal.indexOf(curMultiVal) < 0) {
                  newVal.push(curMultiVal);
                  if (!allFieldVal[fieldId].indexOf(curMultiVal) >= 0) {
                    allFieldVal[fieldId].push(curMultiVal);
                  }
                }
              }
            }
          } else if (curVal && typeof (curVal) === "object") {
            if (commonVal && typeof (commonVal) === "object") {
              if (!((curVal.value === commonVal.value) || (curVal.unit === commonVal.unit))) {
                newVal = curVal;
                if (!this.containsObject(curVal, allFieldVal[fieldId])) {
                  allFieldVal[fieldId].push(curVal);
                }
              }
            } else {
              newVal = curVal;
              if (!this.containsObject(curVal, allFieldVal[fieldId])) {
                allFieldVal[fieldId].push(curVal);
              }
            }
          } else if (curVal !== commonVal) {
            newVal = curVal;
            if (!allFieldVal[fieldId].indexOf(curVal) >= 0) {
              allFieldVal[fieldId].push(curVal);
            }
          }
          diffWellVal[fieldId] = newVal;
        }

        differentWellsVals[address] = diffWellVal;
      }

      // clean up step for fields that are empty
      for (var fieldId in allFieldVal) {
        if (allFieldVal[fieldId].length === 0) {
          for (var address in differentWellsVals) {
            delete differentWellsVals[address][fieldId];
          }
        }
      }

      return differentWellsVals;
    } else if (wells.length > 0) {
      var differentWellsVals = {};
      for (var address in wellsHash) {
        var diffWellVal = {};
        var curWellData = wellsHash[address];
        for (var fieldId in curWellData) {
          var curVal = curWellData[fieldId];
          if (Array.isArray(curVal)) {
            if (curVal.length > 0) {
              diffWellVal[fieldId] = curVal
            }
          } else if (curVal) {
            diffWellVal[fieldId] = curVal;
          }
        }
        differentWellsVals[address] = diffWellVal;
      }

      return differentWellsVals;
    }
  },

  setFieldsDisabled: function(flag) {
    this.fieldList.forEach(function(field) {
      field.disabled(flag);
    });
  },

  isReadOnly: function(flag) {
    if (flag) {
      this.readOnly = true;
    } else {
      this.readOnly = false;
    }
    this.readOnlyHandler();
  },

  readOnlyHandler: function() {
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
  // column_with_default_val will be used to determine empty wells, format: {field_name: default_val}
  isDisableAddDeleteWell: function(flag, column_with_default_val) {
    if (flag) {
      this.disableAddDeleteWell = true;
      this.addressAllowToEdit = this.getWellSetAddressWithData();
      // configure undo redo action
      this.actionPointer = 0;
      this.undoRedoArray = [this.createState()];
      if (column_with_default_val) {
        this.emptyWellWithDefaultVal = column_with_default_val;
      }
    } else {
      this.disableAddDeleteWell = false;
      this.setFieldsDisabled(false);
      this.emptyWellWithDefaultVal = null;
    }
  },

  selectObjectInBottomTab: function() {
    var colors = [];
    for (var index of this.selectedIndices) {
      var well = this.engine.derivative[index];
      if (well) {
        var color = this.engine.colorMap.get(index);
        if (colors.indexOf(color) < 0) {
          colors.push(color);
        }
      }
    }
    var trs = document.querySelectorAll('table.plate-setup-bottom-table tr');
    for (var i = 1; i < trs.length; i++) { // start at 1 to skip the table headers
      var tr = trs[i];
      var td = tr.children[0];
      var isSelected = colors.indexOf(Number(td.querySelector('button').innerHTML)) >= 0;
      tr.classList.toggle("selected", isSelected);
    }
  },

  getSelectedIndex: function() {
    return this.selectedIndices;
  },

  getSelectedAddresses: function() {
    return this.selectedIndices.map(function(index) {
      return this.allTiles[index].address;
    }, this);
  },

  setSelectedAddresses: function(addresses, noUndoRedo) {
    let indices = this.sanitizeAddresses(addresses);
    this.setSelectedIndices(indices, noUndoRedo);
  },

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
