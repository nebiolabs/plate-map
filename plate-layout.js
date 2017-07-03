(function(doc, script, code) {

  var fileArray = [];
  var fileArrayLength, arrayPointer = 0;

  loadScript = function() {
    script = doc.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = function(){

      if(arrayPointer < fileArray.length) {
        // Recursive call
        loadScript(arrayPointer);
      } else {
        // once all the files are loaded execute the code to crete widget.
        code($, fabric);
      }
    };
    script.src = fileArray[arrayPointer ++] + ".js";
    doc.getElementsByTagName('script')[0].appendChild(script);
  }
  // So this array contains all the file names, whenever u add a new file just add it here
  // Make sure you follow the syntax or return an object from the file
  fileArray = ["libs/jquery-1.11.2.min", "libs/jquery-ui.min", "libs/fabric", "libs/select2","add-data-on-change",
  "add-data-to-tabs", "add-tab-data", "apply-well-data", "bottom-table", "canvas-circles",
  "canvas", "check-box", "color-manager", "create-canvas-elements", "create-field", "engine", "well-area", "fabric-events", "interface", "load-plate", "menu",
 "overlay", "preset", "redo", "tabs", "undo-redo-manager", "undo", "unit-data-field"];

  loadScript(arrayPointer);

}(document, "", function($, fabric){

   $.widget("DNA.plateLayOut", {

    plateLayOutWidget: {},

    options: {
      value: 0
    },

    columnCount: 12,

    rowIndex: ["A", "B", "C", "D", "E", "F", "G", "H"],

    allTiles: [], // All tiles containes all thise circles in the canvas

    _create: function() {

      // This is a little hack, so that we get the text of the outer container of the widget
      this.options.created = function(event, data) {
        data.target = (event.target.id) ? "#" + event.target.id : "." + event.target.className;
      };

      this._trigger("created", null, this);

      var that = this;

      window.addEventListener("keyup", function(e) {
        e.preventDefault();
        that._handleShortcuts(e);
      });
      // Import classes from other files.. Here we import it using extend and add it to this
      // object. internally we add to widget.DNA.getPlates.prototype.
      // Helpers are methods which return other methods and objects.
      // add Objects to plateLayOutWidget and it will be added to this object.
      for(var component in plateLayOutWidget) {
        // Incase some properties has to initialize with data from options hash,
        // we provide it sending this object.
        $.extend(this, new plateLayOutWidget[component](this));
      }

      this.imgSrc = this.options.imgSrc || "assets";

      this._createInterface();

      this._configureUndoRedoArray();

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
}));
