var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {
      engine: {

        derivative: {},

        colorCounter: {},

        checkValues: {},

        unCheckedWell: null,

        unCheckedWellIndexes: {},

        processChange: function(tile) {
          // We have commands here, It is implemented like this so that we can undo/redo
          // actions. Implement it in some other file.... !!
          if(! $.isEmptyObject(THIS.globalSelectedAttributes)) {

            if($.isEmptyObject(this.derivative)) {
              // this block is executed at the very first time.
              this.createDerivative(tile);
              return {
                "action": "New Circle",
                "mode": "Checked"
              };
            }

            this._manageUnCheckedWellIndexes(tile);

            var wellD = this._getCheckedValues(tile) || tile["wellData"];

            for(var i in this.derivative) {
              if(THIS.compareObjects(this.derivative[i]["selectedWellAttributes"], THIS.globalSelectedAttributes)) {
                if(THIS.compareObjectsOneWay(this.derivative[i]["wellData"], wellD)) {
                  if(THIS.compareObjects(this.derivative[i]["unitData"], tile["unitData"])) {
                    this.createDerivative(tile);
                    return {
                      "action": "Copy Color",
                      "colorStops": THIS.allTiles[i].circle.colorStops,
                      "colorIndex": THIS.allTiles[i].circle.colorIndex,
                      "mode": "Checked"
                    };
                  }
                }
              }
            }

            this.createDerivative(tile);

            if(tile.circle) {
              var color = tile.circle.colorStops[0];
              if(this.colorCounter[color] === THIS.colorCounter[color]) {
                return {
                  "action": "Keep Color",
                  "mode": "Checked"
                };
              }
              return {
                "action": "New Color",
                "mode": "Checked"
              };
            }

            return {
              "action": "New Circle",
              "mode": "Checked"
            };
          } else {
            // We come to this place if there is no checked values
            return this._manageUncheckedTiles(tile);
          }

        },

        _manageUncheckedTiles: function(tile) {
          
          this.unCheckedWellIndexes[tile.index] = true;
          if($.isEmptyObject(this.derivative)) {
            this.createDerivative(tile);
            return {
              "action": "New Circle",
              "mode": "Unchecked"
            };
          }

          this.createDerivative(tile);

          if(this.unCheckedWell == null) {
            if(! tile.circle) {
              return {
                "action": "New Circle",
                "mode": "Unchecked"
              };
            } else {
              this.unCheckedWell = THIS.allTiles[tile.index];
            }
          }
          //console.log(this.unCheckedWell);
          return {
            "action": "Copy Color",
            "colorStops": THIS.allTiles[this.unCheckedWell.index].circle.colorStops,
            "colorIndex": THIS.allTiles[this.unCheckedWell.index ].circle.colorIndex
          };
        },

        createDerivative: function(tile) {

          this.derivative[tile.index] = {};

          this.derivative[tile.index]["wellData"] = ($.isEmptyObject(this.checkValues)) ?
                        $.extend(true, {}, tile.wellData) : $.extend(true, {}, this.checkValues);

          this.derivative[tile.index]["selectedWellAttributes"] = $.extend(true, {}, THIS.globalSelectedAttributes);
          this.derivative[tile.index]["unitData"] = $.extend(true, {}, tile.unitData);
          this.checkValues = {};
        },

        _getCheckedValues: function(tile) {

          if($.isEmptyObject(THIS.globalSelectedAttributes)) return false;

          var keys = Object.keys(THIS.globalSelectedAttributes);
          var length = keys.length;

          for(var i = 0; i < length; i ++) {
            this.checkValues[keys[i]] = THIS.allTiles[tile.index]["wellData"][keys[i]];
          }
          return this.checkValues;
        },

        _getFreeColor: function() {

          for(var color in this.colorCounter) {
            if(this.colorCounter[color] === 0) return color;
          }
          return false;
        },

        // This is not used -:)
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
          THIS.colorToIndex = {};
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

          THIS._selectTilesFromRectangle(0, 7, 11, this.CLICK);
          this.allSelectedObject = null;
          //THIS.mainFabricCanvas.renderAll();
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
        },

        _manageUnCheckedWellIndexes: function(tile) {

          if(this.unCheckedWellIndexes[tile.index]) {
            delete this.unCheckedWellIndexes[tile.index];
          }

          if($.isEmptyObject(this.unCheckedWellIndexes)) {
            this.unCheckedWell = null;
          } else {
            var keys = Object.keys(this.unCheckedWellIndexes);
            this.unCheckedWell = THIS.allTiles[keys[0]];
          }
        },
      }
    }
  }
})(jQuery, fabric);
