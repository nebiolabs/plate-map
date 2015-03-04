var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.loadPlate = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {

      getPlates: function(data) {

        this.loadDataToCircles(data);

        this.engine.derivative = $.extend(true, {}, data);

        this.loadCheckboxes(data);

        this._colorMixer(true);
      },

      loadDataToCircles: function(circleData) {

        for(var index in circleData) {
          this.allTiles[index].wellData = circleData[index].selectedValues;
        }
        
        this.globalSelectedAttributes = $.extend(true, {}, this.allTiles[index].attrs);
      },

      loadCheckboxes: function(data) {

      }
    }
  }
})(jQuery, fabric);
