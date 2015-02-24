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
          // add unitData too.

          this.derivative[tile.index] = {
            "selectedValues": selectedValues,
            "attrs": attrs
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

        searchAndStack: function(derivativeCopy) {
          this.stackUpWithColor = {};
          this.stackPointer = 2;
          while(! $.isEmptyObject(derivativeCopy)) {

            var refDerivativeIndex = Object.keys(derivativeCopy)[0];
            var referenceDerivative = derivativeCopy[refDerivativeIndex];
            var arr = [];

            if($.isEmptyObject(referenceDerivative.selectedValues)) {
              //console.log("wow", refDerivativeIndex);
              if(this.stackUpWithColor[1]) {
                this.stackUpWithColor[1].push(refDerivativeIndex);
              } else {
                this.stackUpWithColor[1] = [refDerivativeIndex];
              }
              delete derivativeCopy[refDerivativeIndex];
            } else {
              // if its not an empty object
              for(data in derivativeCopy) {
                if(THIS.compareObjectsOneWay(referenceDerivative.selectedValues, derivativeCopy[data].selectedValues)) {
                  console.log("Match Found", data);
                  arr.push(data);
                  this.stackUpWithColor[this.stackPointer] = arr;
                  delete derivativeCopy[data];
                }
              }
              if(data.length > 0)
              this.stackPointer ++;
            }
          }

          //delete derivativeCopy[refDerivative];

          console.log(this.stackUpWithColor, this.stackPointer);

          console.log("_____________________________");

        },

        applyColors: function() {

          for(color in this.stackUpWithColor) {
            console.log("colors", color);

            for(tileIndex in this.stackUpWithColor[color]) {
              //tile = THIS.allTiles[tileIndex];
              console.log(this.stackUpWithColor[color][tileIndex]);

              tile = THIS.allTiles[this.stackUpWithColor[color][tileIndex]];
              if(!tile.circle) {
                this.addCircle(tile, color);
              } else {
                console.log("tileIndex", tileIndex);
                var colGrad = {
                  0: THIS.valueToColor[color],
                  1: THIS.colorPairObject[THIS.valueToColor[color]]
                };
                this.setGradient(tile.circle, colGrad);
              }
            }
          }
        },

        addCircle: function(tileToAdd, color) {

          var colGrad = {
            0: THIS.valueToColor[color],
            1: THIS.colorPairObject[THIS.valueToColor[color]]
          };
          var circle = new fabric.Circle({
            radius: 22,
            originX:'center',
            originY: 'center',
            top: tileToAdd.top,
            left: tileToAdd.left,
            shadow: 'rgba(0,0,0,0.3) 0 2px 2px',
            evented: false,
            colorStops: colGrad
          });

          circle.colorIndex = color;

          this.setGradient(circle, colGrad);

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
          THIS.mainFabricCanvas.add(circle);
          THIS.mainFabricCanvas.add(circleCenter);
          THIS.mainFabricCanvas.add(circleText);
        },

        setGradient: function(circle, colorStops) {

          var colorStops =  colorStops || {
                                            0: "#ffc100",
                                            1: "#ff6a00"
                                          };
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
