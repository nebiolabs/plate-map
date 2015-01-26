var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and this points to engine
    return {
      engine: {

        derivative: [],

        colorCounter: {},

        processChange: function(tile) {

          console.log(this.derivative);
          if(this.derivative.length === 0) {
            var substitute = {};
            $.extend(true, substitute, tile);
            this.derivative.push(substitute);

            return {
              "action": "New Circle"
            };
            //console.log(this.derivative);
          } else {
            var derivativeLength = this.derivative.length;
            var wellData  = tile["wellData"];

            for(var i = 0; i < derivativeLength; i ++) {
              if(THIS.compareObjects(this.derivative[i]["wellData"], wellData)) {
                // there is already a well with same configuration
                // Updating the entry
                //console.log("inside");
                //console.log("match found", wellData, this.derivative[i]["wellData"], this.derivative.length);
                var substitute = {};
                $.extend(true, substitute, THIS.allTiles[this.derivative[i].index]);
                this.derivative[i] = substitute;
                // change the color to matching tile
                return {
                  "action": "Copy Color",
                  "colorStops": this.derivative[i].circle.colorStops
                };
              }
            }
            console.log("No match , new entry");
            // if it has circle and no match is found just keep the color;
            var substitute = {};
            $.extend(true, substitute, tile);
            this.derivative.push(substitute);
            //console.log("deri", this.derivative);
            if(tile.circle) {
              var color = tile.circle.colorStops[0];
              console.log(this.colorCounter, THIS.colorCounter);
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

      }
    }
  }
})(jQuery, fabric);
