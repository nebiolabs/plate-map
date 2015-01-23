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
          // this method process change in values
          // Determines if we need to assign a new color or assign implemented colors
          // Now this place should decide which color to return..
          // color management should be here
          // extend comparison to units and checkboxes
          // Need to think about color management wen some colors are cleared using clear button
          // think how to keep color data
          // what if we keep tiles in derivatives ??


          if(this.derivative.length === 0) {
            this.derivative[0] = $.extend({},tile);
            return {
              "action": "New Circle"
            };
            //console.log(this.derivative);
          } else {
            var derivativeLength = this.derivative.length;
            var wellData  = tile["wellData"];
            //var va = false;
            for(var i = 0; i < derivativeLength; i ++) {
              console.log(wellData, this.derivative[i]["wellData"], this.derivative.length);
              if(THIS.compareObjects(this.derivative[i]["wellData"], wellData)) {
                // there is already a well with same configuration
                // Updating the entry
                //console.log("inside");
                console.log("match found", wellData, this.derivative[i]["wellData"], this.derivative.length);
                this.derivative[i] = $.extend({}, THIS.allTiles[this.derivative[i].index]);

                // change the color to matching tile
                return {
                  "action": "Copy Color",
                  "colorStops": this.derivative[i].circle.colorStops
                };
              }
            }
            console.log("No match , new entry");
            // if it has circle and no match is found just keep the color;
            this.derivative.push($.extend({},tile));
            console.log("deri", this.derivative);
            if(tile.circle) {

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
