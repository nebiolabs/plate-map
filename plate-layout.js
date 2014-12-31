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
  "canvas", "check-box", "create-canvas-elements", "create-field", "fabric-events", "interface", "menu",
 "overlay", "preset", "tabs", "unit-data-field"];

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


    // Why we are pre-setting these colours ?. we can generally create randomn colours but there is high chance that
    // Colours having slight difference show up and we can hardly distinguish. Again we can go for
    // Hue Saturation Method but still there is a high chance that closer colors [in thr RGB] are likely to show up.
    // So we use some predefined 65 colors and if we need further we generate it randomnly.

    distinctColors: [
    '#00FF00',
    '#0000FF',
    '#FF0000',
    '#01FFFE',
    '#FFA6FE',
    '#FFDB66',
    '#006401',
    '#010067',
    '#95003A',
    '#007DB5',
    '#FF00F6',
    '#FFEEE8',
    '#774D00',
    '#90FB92',
    '#0076FF',
    '#D5FF00',
    '#FF937E',
    '#6A826C',
    '#FF029D',
    '#FE8900',
    '#7A4782',
    '#7E2DD2',
    '#85A900',
    '#FF0056',
    '#A42400',
    '#00AE7E',
    '#683D3B',
    '#BDC6FF',
    '#263400',
    '#BDD393',
    '#00B917',
    '#9E008E',
    '#001544',
    '#C28C9F',
    '#FF74A3',
    '#01D0FF',
    '#004754',
    '#E56FFE',
    '#788231',
    '#0E4CA1',
    '#91D0CB',
    '#BE9970',
    '#968AE8',
    '#BB8800',
    '#43002C',
    '#DEFF74',
    '#00FFC6',
    '#FFE502',
    '#620E00',
    '#008F9C',
    '#98FF52',
    '#7544B1',
    '#B500FF',
    '#00FF78',
    '#FF6E41',
    '#005F39',
    '#6B6882',
    '#5FAD4E',
    '#A75740',
    '#A5FFD2',
    '#FFB167',
    '#009BFF',
    '#E85EBE'],


    _create: function() {
      // Import classes from other files.. Here we import it using extend and add it to this
      // object. internally we add to widget.DNA.getPlates.prototype.
      // Helpers are methods which return other methods and objects.
      // add Objects to plateLayOutWidget and it will be added to this object.
      for(var component in plateLayOutWidget) {
        $.extend(this, new plateLayOutWidget[component]());
      }

      this.imgSrc = this.options.imgSrc || "assets",
      this._createInterface();
    },

    _init: function() {
      // This is invoked when the user use the plugin after _create is called.
      // The point is _create is invoked for the very first time and for all other
      // times _init is used.
    },

  });
}));
/*
// Plate Layout source code.
(function($, fabric){

  $.widget("DNA.plateLayOut", {

    plateLayOutWidget: {},

    options: {
      value: 0
    },

    columnCount: 12,

    rowIndex: ["A", "B", "C", "D", "E", "F", "G", "H"],

    allTiles: [], // All tiles containes all thise circles in the canvas


    // Why we are pre-setting these colours ?. we can generally create randomn colours but there is high chance that
    // Colours having slight difference show up and we can hardly distinguish. Again we can go for
    // Hue Saturation Method but still there is a high chance that closer colors [in thr RGB] are likely to show up.
    // So we use some predefined 65 colors and if we need further we generate it randomnly.

    distinctColors: [
    '#00FF00',
    '#0000FF',
    '#FF0000',
    '#01FFFE',
    '#FFA6FE',
    '#FFDB66',
    '#006401',
    '#010067',
    '#95003A',
    '#007DB5',
    '#FF00F6',
    '#FFEEE8',
    '#774D00',
    '#90FB92',
    '#0076FF',
    '#D5FF00',
    '#FF937E',
    '#6A826C',
    '#FF029D',
    '#FE8900',
    '#7A4782',
    '#7E2DD2',
    '#85A900',
    '#FF0056',
    '#A42400',
    '#00AE7E',
    '#683D3B',
    '#BDC6FF',
    '#263400',
    '#BDD393',
    '#00B917',
    '#9E008E',
    '#001544',
    '#C28C9F',
    '#FF74A3',
    '#01D0FF',
    '#004754',
    '#E56FFE',
    '#788231',
    '#0E4CA1',
    '#91D0CB',
    '#BE9970',
    '#968AE8',
    '#BB8800',
    '#43002C',
    '#DEFF74',
    '#00FFC6',
    '#FFE502',
    '#620E00',
    '#008F9C',
    '#98FF52',
    '#7544B1',
    '#B500FF',
    '#00FF78',
    '#FF6E41',
    '#005F39',
    '#6B6882',
    '#5FAD4E',
    '#A75740',
    '#A5FFD2',
    '#FFB167',
    '#009BFF',
    '#E85EBE'],


    _create: function() {
      // Import classes from other files.. Here we import it using extend and add it to this
      // object. internally we add to widget.DNA.getPlates.prototype.
      // Helpers are methods which return other methods and objects.
      // add Objects to plateLayOutWidget and it will be added to this object.
      for(var component in plateLayOutWidget) {
        $.extend(this, new plateLayOutWidget[component]());
      }

      this.imgSrc = this.options.imgSrc || "assets",
      this._createInterface();
    },

    _init: function() {
      // This is invoked when the user use the plugin after _create is called.
      // The point is _create is invoked for the very first time and for all other
      // times _init is used.
    },

  });
})(jQuery, fabric);
*/
