$.widget("DNA.plateLayOut", {

  plateLayOutWidget: {},

  options: {
    value: 0
  },

  allTiles: [], // All tiles containes all thise circles in the canvas

  addressToLoc: function (layoutAddress) {
    var m = /^([A-Z]+)(\d+)$/.exec(layoutAddress.trim().toUpperCase())
    if (m) {
      var row_v = m[1]; 
      var col = parseInt(m[2])-1;
      var row; 
      for (var i = 0; i < row_v.length; i++) {
        var c = row_v.charCodeAt(i) - 65; 
        if (i) {
            row += 1;
            row *= 26; 
            row += c ; 
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

  locToIndex: function (loc, dimensions) {
    if (!dimensions) {
      dimensions = this.dimensions;
    }
    if (loc.r < 0) {
      t
    }
    if (!(loc.r >= 0 && loc.r < dimensions.rows)) {
      throw "Row index " + (loc.r + 1) + " invalid"; 
    }
    if (!(loc.c >= 0 && loc.c < dimensions.cols)) {
      throw "Column index " + (loc.c + 1) + " invalid"; 
    }
    return loc.r*dimensions.cols + loc.c; 
  },

  addressToIndex: function (layoutAddress, dimensions) {
    var loc = this.addressToLoc(layoutAddress); 
    return this.locToIndex(loc, dimensions); 
  }, 

  _rowKey: function (i) {
    var c1 = i % 26;
    var c2 = (i - c1) / 26;
    var code = String.fromCharCode(65 + c1);
    if (c2 > 0) {
      code = String.fromCharCode(64 + c2) + code;
    }
    return code;
  }, 

  indexToLoc: function (index, dimensions) {
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

  locToAddress: function (loc) {
    return this._rowKey(loc.r) + (loc.c + 1).toString(10);
  },

  indexToAddress: function (index, dimensions) {
    var loc = this.indexToLoc(index, dimensions); 
    return this.locToAddress(loc); 
  },

  getDimensions: function () {
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
    if (this.options.readOnly){
      this.isReadOnly(true);
      this.readOnly = true;
    }

    for (var component in plateLayOutWidget) {
      // Incase some properties has to initialize with data from options hash,
      // we provide it sending this object.
      $.extend(this, new plateLayOutWidget[component](this));
    }

    this.imgSrc = this.options.imgSrc || "assets";

    this._createInterface();

    this._trigger("created", null, this);

    return this;
  },

  _init: function() {
    // This is invoked when the user use the plugin after _create is called.
    // The point is _create is invoked for the very first time and for all other
    // times _init is used.
  },

  addData: function() {
    alert("wow this is good");
  },

  // wellsData follows syntax: {0:{field1: val1, field2: val2}, 1:{field1: val1, field2: val2}}
  getTextDerivative: function(wellsData) {
    var textDerivative = {};
    var fieldMap = this.fieldMap;
    for (var idx in wellsData){
      var textValWell = {};
      var textFieldIdWell = {};
      var curWellData = wellsData[idx];
      for (var fieldId in curWellData){
        if (fieldId in this.fieldMap){
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
      textDerivative[idx] = {
        textVal: textValWell,
        textFieldVal: textFieldIdWell
      };
    }

    return textDerivative;
  },

  // wellsData follows syntax: {0:{field1: val1, field2: val2}, 1:{field1: val1, field2: val2}}
  getWellsDifferences: function(wellsData) {
    return this.getDifferentWellsVals(wellsData);
  },

  disableAllFields: function(){
    var numericFields = $('.plate-setup-tab-input, .plate-setup-tab-label-select-field, ' +
      '.plate-setup-tab-multiselect-field, .plate-setup-tab-select-field');
    for (var i = 0; i < numericFields.length; i++) {
      numericFields[i].disabled = true;
    }
    $(".plate-setup-tab-name-singleSelect").text("Select to inspect");
  },

  enableAllFields: function(){
    var numericFields = $('.plate-setup-tab-input, .plate-setup-tab-label-select-field, ' +
      '.plate-setup-tab-multiselect-field, .plate-setup-tab-select-field');
    for (var i = 0; i < numericFields.length; i++) {
      numericFields[i].disabled = false;
    }
    $(".plate-setup-tab-name-singleSelect").text("Select to Edit")
  },

  readOnly: null,
  isReadOnly: function(flag){
    if (flag){
      this.readOnly = true;
      this.readOnlyHandler = function(){
        $("#plate-map-control-button-container-id").css("display", "none");
        this.disableAllFields();
        $('.multiple-field-manage-delete-button').css("display", "none");
      };
    } else {
      this.readOnly = false;
      this.readOnlyHandler = function(){
        $("#plate-map-control-button-container-id").css("display", "flex");
        this.enableAllFields();
        $('.multiple-field-manage-delete-button').css("display", "none");
      };
    }
    this.readOnlyHandler();
  },

  disableAddDeleteWell: null,
  // column_with_default_val will be used to determine empty wells, format: {field_name: default_val}
  isDisableAddDeleteWell: function(flag, column_with_default_val){
    if (flag){
      this.disableAddDeleteWell = true;
      this.addressAllowToEdit = this.getWellSetAddressWithData();
      // configure undo redo action
      this.actionPointer = 0;
      this.undoRedoArray = [];
      this.undoRedoArray.push(this.createObject());
      if (column_with_default_val) {
        this.emptyWellWithDefaultVal = column_with_default_val;
      }
    } else {
      this.disableAddDeleteWell = false;
      this.enableAllFields();
      this.emptyWellWithDefaultVal = null;
    }
    this._fabricEvents();
  },

  getSelectedObject: function() {
    var selectedAddress = [];
    for (var i = 0; i < this.allSelectedObjects.length; i++){
      selectedAddress.push(this.allSelectedObjects[i].address);
    }
    var selectedObjects = {};
    var derivative = this.engine.derivative;
    for (var loc in derivative){
      var address = this.indexToAddress(loc);
      if (selectedAddress.indexOf(address) >= 0) {
        selectedObjects[address] = derivative[loc];
      }
    }
    return selectedObjects;
  },

  setSelectedWell: function(addressList) {
    var areas = [];
    var minRow = 999;
    var locMap = {};
    for (var id = 0; id < addressList.length; id++){
      var wellIdx = this.addressToIndex(addressList[id]);
      var loc = this.indexToLoc(wellIdx);
      areas.push({
        minCol: loc.c,
        minRow: loc.r,
        maxCol: loc.c,
        maxRow: loc.r
      });
      if (loc.r <= minRow) {
        minRow = loc.r;
        if (loc.r in locMap) {
          locMap[loc.r].push(loc.c);
        } else {
          locMap[loc.r] = [loc.c];
        }
      }
    }
    var focalWell = {
      row: minRow,
      col: Math.min.apply(null, locMap[minRow])
    };

    this.setSelection(areas, focalWell);
    this.mainFabricCanvas.renderAll();
  }

});