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
          this.colorCounter = {};
          THIS.afterLimitPointer = 0;
          THIS.tooManyColorsApplyed = false;
          THIS.colorPointer  = THIS.colorPointer - 1;
          var colorAllocationObject = {};
          var allocationIndex = 0;

          for(var i in this.derivative) {
            var colorIndex = THIS.allTiles[i].circle.colorIndex;

            if(! colorAllocationObject[colorIndex]) {
              colorAllocationObject[colorIndex] = ++allocationIndex;
            }

            var currentColor = (colorAllocationObject[colorIndex]) * 2;
            var colorObject = this._rollBackValues(THIS.allTiles[i], currentColor);
            THIS._setGradient(THIS.allTiles[i].circle, colorObject)
          }
        },

        _rollBackValues: function(tile, currentColor) {

          var colorObject = {
                          0: THIS.colorPairs[currentColor - 1],
                          1: THIS.colorPairs[currentColor]
                        };
          this.colorCounter[THIS.colorPairs[currentColor - 1]] = this.colorCounter[THIS.colorPairs[currentColor - 1]] + 1 || 1;
          tile.circle.colorStops = colorObject;
          tile.circle.colorIndex = THIS.colorIndexValues[colorObject[0]];
          tile.circleText.text = "" + THIS.colorIndexValues[colorObject[0]] + "";
          tile.circleText.setVisible(false);

          return colorObject;
        }

      }
    }
  }
})(jQuery, fabric);
