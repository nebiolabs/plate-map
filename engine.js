var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {
      engine: {

        derivative: {},

        colorCounter: {},

        processChange: function(tile) {

          if($.isEmptyObject(this.derivative)) {
            // this block is executed at the very first time.
            this.createDerivative(tile);
            return {
              "action": "New Circle"
            };
          }

          var derivativeLength = this.derivative.length;
          var wellData  = tile["wellData"];

          for(var i in this.derivative) {

            if(THIS.compareObjects(this.derivative[i], wellData)) {
              // createDerivative() may not be needed, but if we call this method here we have derivatives having
              // all the data about filled circles.
              this.createDerivative(tile);
              return {
                "action": "Copy Color",
                "colorStops": THIS.allTiles[i].circle.colorStops,
                "colorIndex": THIS.allTiles[i].circle.colorIndex
              };
            }
          }

          this.createDerivative(tile);

          if(tile.circle) {
            var color = tile.circle.colorStops[0];
            if(this.colorCounter[color] === THIS.colorCounter[color]) {
              return {
                "action": "Keep Color"
              };
            }
            return {
              "action": "New Color"
            };
          }

          return {
            "action": "New Circle"
          };

        },

        createDerivative: function(tile) {

          var tempDer = {};
          $.extend(true, tempDer, tile.wellData);
          this.derivative[tile.index] = tempDer;
        },

        _getFreeColor: function() {

          for(var color in this.colorCounter) {
            if(this.colorCounter[color] === 0) return color;
          }
          return false;
        },

        _getFreeColorAfterLimit: function() {

          for(var color in this.colorCounter) {
            if(this.colorCounter[color] === 0 && color.charAt(1) == "#") return color;
          }
          return false;
        },

        _checkRollBack: function() {

          var counter = 0;
          for(var i in this.colorCounter) {
            if(this.colorCounter[i] != 0) {
              counter ++;
              if(counter > THIS.limit) {
                return false;
              }
            }
          }
          return "rollback";
        },

        _rollBack: function() {
          // Here we roll back from numbers to color
          var colorAllocationObject = {};
          var allocationIndex = 0;
          for(var i in this.derivative) {
            //console.log(THIS.allTiles[i].circle.colorIndex);
            var colorIndex = THIS.allTiles[i].circle.colorIndex;
            var colorObject = {};

            if(colorAllocationObject[colorIndex]) {
              var currentColor = (colorAllocationObject[colorIndex]) * 2;
              colorObject = {
                                  0: THIS.colorPairs[currentColor - 1],
                                  1: THIS.colorPairs[currentColor]
                                }
            } else {
              colorAllocationObject[colorIndex] = ++allocationIndex;
              var currentColor = (colorAllocationObject[colorIndex]) * 2;
              colorObject = {
                                  0: THIS.colorPairs[currentColor - 1],
                                  1: THIS.colorPairs[currentColor]
                                }
                                console.log(colorAllocationObject)
              //allocationIndex = allocationIndex + 1;
            }
            THIS._setGradient(THIS.allTiles[i].circle, colorObject)
          }
          console.log(colorAllocationObject)
        },

      }
    }
  }
})(jQuery, fabric);
