var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {
      engine: {

        derivative: {},
        stackUpWithColor: {},
        stackPointer: 2,

        createDerivative: function(tile) {

          var selectedValues = this.getSelectedValues(tile);
          var attrs  = $.extend(true, {}, THIS.globalSelectedAttributes);
          var units = this.getUnits(tile);
          // add unitData too.

          this.derivative[tile.index] = {
            "selectedValues": selectedValues,
            "attrs": attrs,
            "units": units
          }
        },

        getSelectedValues: function(tile) {

          var data = {};
          for(var attr in THIS.globalSelectedAttributes) {
            if(tile["wellData"][attr] && tile["wellData"][attr] != "NULL") {
              data[attr] = tile["wellData"][attr];
            }
          }

          return data;
        },

        getUnits: function(tile) {

          var data = {};
          for(var attr in THIS.globalSelectedAttributes) {
            if(tile.unitData[attr + "unit"]) {
              data[attr + "unit" ] = tile.unitData[attr + "unit"];
            }
          }
          
          return data;
        },

        searchAndStack: function(derivativeCopy) {

          this.stackUpWithColor = {};
          this.stackPointer = 2;
          while(! $.isEmptyObject(derivativeCopy)) {
            console.log("looping ......!")
            var refDerivativeIndex = Object.keys(derivativeCopy)[0];
            var referenceDerivative = derivativeCopy[refDerivativeIndex];
            var arr = [];

            if($.isEmptyObject(referenceDerivative.selectedValues)) {
              //
              if(this.stackUpWithColor[1]) {
                this.stackUpWithColor[1].push(refDerivativeIndex);
              } else {
                this.stackUpWithColor[1] = [refDerivativeIndex];
              }
              delete derivativeCopy[refDerivativeIndex];
            } else {
              // if its not an empty object
              for(data in derivativeCopy) {
                if(THIS.compareObjects(referenceDerivative.selectedValues, derivativeCopy[data].selectedValues)) {
                  if(THIS.compareObjects(referenceDerivative.units, derivativeCopy[data].units)) {
                    //console.log("Match Found", referenceDerivative.units, derivativeCopy[data].units);
                    arr.push(data);
                    this.stackUpWithColor[this.stackPointer] = arr;
                    delete derivativeCopy[data];
                  }
                }
              }
              // here u cud add applyColors , its a different implementation, but might be a performer.
              if(data.length > 0)
              this.stackPointer ++;
            }
          }

          //delete derivativeCopy[refDerivative];

          console.log(this.stackUpWithColor, this.stackPointer);

          console.log("_____________________________");

        },

        applyColors: function() {

          THIS.addBottomTableHeadings();
          for(color in this.stackUpWithColor) {
            THIS.addBottomTableRow(color, this.stackUpWithColor[color]);
            for(tileIndex in this.stackUpWithColor[color]) {

              tile = THIS.allTiles[this.stackUpWithColor[color][tileIndex]];
              if(!tile.circle) {
                this.addCircle(tile, color);
              } else {
                this.setGradient(tile.circle, color);
              }
            }
          }
        },

        addCircle: function(tileToAdd, color) {

          var circle = new fabric.Circle({
            radius: 22,
            originX:'center',
            originY: 'center',
            top: tileToAdd.top,
            left: tileToAdd.left,
            shadow: 'rgba(0,0,0,0.3) 0 2px 2px',
            evented: false
          });

          circle.colorIndex = color;



          var circleCenter = new fabric.Circle({
            radius: 14,
            fill: "white",
            originX:'center',
            originY: 'center',
            top: tileToAdd.top,
            left: tileToAdd.left,
            shadow: 'rgba(0,0,0,0.1) 0 -1px 0',
            evented: false,
          });

          var circleText = new fabric.IText(""+circle.colorIndex+"", {
              top: tileToAdd.top,
              left: tileToAdd.left,
              fill: 'black',
              evented: false,
              fontSize: 12,
              lockScalingX: true,
              lockScalingY: true,
              originX:'center',
              originY: 'center',
              visible: false
          });

          circle.parent = tileToAdd; // Linking the objects;
          tileToAdd.circle = circle;
          tileToAdd.circleCenter = circleCenter;
          tileToAdd.circleText = circleText;

          this.setGradient(circle, color);

          THIS.mainFabricCanvas.add(circle);
          THIS.mainFabricCanvas.add(circleCenter);
          THIS.mainFabricCanvas.add(circleText);
        },

        setGradient: function(circle, color) {

          var tile = circle.parent;
          tile.circleText.text = "" + parseInt(color) - 1 + "";

          if(this.stackPointer <= (THIS.colorPairs.length / 2) +1){
            colorStops = {
              0: THIS.valueToColor[color],
              1: THIS.colorPairObject[THIS.valueToColor[color]]
            };
            tile.circleText.setVisible(false);
          } else {
            tile.circleText.setVisible(true);
            var colorStops = {
                                0: "#ffc100",
                                1: "#ff6a00"
                              };
          }

          circle.setGradient("fill", {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: circle.height,
            colorStops: colorStops
          });

        },


      }
    }
  }
})(jQuery, fabric);
