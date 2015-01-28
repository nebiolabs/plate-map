var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and this points to engine
    return {
      engine: {

        derivative: {},

        colorCounter: {},

        processChange: function(tile) {

          if($.isEmptyObject(this.derivative)) {
            this.createDerivative(tile);
            return {
              "action": "New Circle"
            };

          } else {
            var derivativeLength = this.derivative.length;
            var wellData  = tile["wellData"];

            for(var i in this.derivative) {

              if(THIS.compareObjects(this.derivative[i], wellData)) {
                // This may not be needed, but if we call this method here we have derivatives having
                // all the data about filled circles.
                this.createDerivative(tile);
                return {
                  "action": "Copy Color",
                  "colorStops": THIS.allTiles[i].circle.colorStops
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

            } else {

              return {
                "action": "New Circle"
              };

            }
          }
        },

        createDerivative: function(tile) {
          var tempDer = {};
          var indexing = {};
          $.extend(true, tempDer, tile.wellData);
          this.derivative[tile.index] = tempDer;
          //console.log("Wow", this.derivative);
        }

      }
    }
  }
})(jQuery, fabric);
