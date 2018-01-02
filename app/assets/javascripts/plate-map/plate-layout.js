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

  getTextDerivative: function() {
    var derivative = this.engine.derivative;
    var textDerivative = {};
    var fieldMap = this.fieldMap;
    for (var idx in derivative){
      var textValWell = {};
      var textFieldIdWell = {};
      var curWellData = derivative[idx].wellData;
      for (var fieldId in curWellData){
        var field = this.fieldMap[fieldId];
        var textVal = field.parseText(curWellData[fieldId]);
        textFieldIdWell[field.name] = textVal;
        textValWell[fieldId] = textVal;
      }

      textDerivative[idx] = {
        textVal: textValWell,
        textFieldVal: textFieldIdWell
      };
    }

    return textDerivative;
  }
});