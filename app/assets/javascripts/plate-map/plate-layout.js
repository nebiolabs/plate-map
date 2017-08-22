$.widget("DNA.plateLayOut", {

  plateLayOutWidget: {},

  options: {
    value: 0
  },

  allTiles: [], // All tiles containes all thise circles in the canvas

  _create: function() {
    function rowKey(i) {
      var c1 = i % 26;
      var c2 = (i - c1) / 26;
      var code = String.fromCharCode(65 + c1);
      if (c2 > 0) {
        code = String.fromCharCode(64 + c2) + code
      }
      return code;
    };

    this.numRows = parseInt(this.options.numRows || 8);
    this.numCols = parseInt(this.options.numCols || 12);
    this.scaleFactor = Math.min(8 / this.numRows, 12 / this.numCols);
    this.rowIndex = [];
    for (var i = 0; i < this.numRows; i++) {
      this.rowIndex.push(rowKey(i));
    }


    // This is a little hack, so that we get the text of the outer container of the widget
    this.options.created = function(event, data) {
      data.target = (event.target.id) ? "#" + event.target.id : "." + event.target.className;
    };

    this._trigger("created", null, this);

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

    return this;
  },

  _init: function() {
    // This is invoked when the user use the plugin after _create is called.
    // The point is _create is invoked for the very first time and for all other
    // times _init is used.
  },

  addData: function() {
    alert("wow this is good");
  }
});