var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and this points to engine
    return {
      engine: {

        derivative: [],

        processChange: function(tile) {
          // this method process change in values
          // Determines if we need to assign a new color or assign implemented colors
          // Now this place should decide which color to return..
          // color management should be here
          // extend comparison to units and checkboxes
          // Need to think about color management wen some colors are cleared using clear button

          var wellData  = tile["wellData"];
          if(this.derivative.length === 0) {
            this.derivative[0] = wellData;
            //console.log(this.derivative);
          } else {
            var derivativeLength = this.derivative.length;
            var va = false;
            for(var i = 0; i < derivativeLength; i ++) {
              if(THIS.compareObjects(this.derivative[i], wellData)) {
                // there is already a well with same configuration
                console.log("match found");
                return true
              }
            }
            console.log("No match , new entry");
            // if it has circle 
            this.derivative.push(wellData);
          }



        }

      }
    }
  }
})(jQuery, fabric);
