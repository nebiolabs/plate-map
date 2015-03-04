var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.loadPlate = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {

      getPlates: function(data) {

        this.clearCrieteriaForAll(false);
        
        var derivativeData = JSON.parse(data)

        this.loadDataToCircles(derivativeData.derivative);

        this.engine.derivative = $.extend(true, {}, derivativeData.derivative);

        if($.isEmptyObject(derivativeData.checkboxes)) {
          this._colorMixer(true);
        } else {
          this.loadCheckboxes(derivativeData.checkboxes);
        }

      },

      loadDataToCircles: function(circleData) {

        for(var index in circleData) {
          this.allTiles[index].wellData = $.extend(true, {}, circleData[index].wellData);
        }
      },

      loadCheckboxes: function(checkboxes) {

        var checkBoxImage;

        for(var checkbox in checkboxes) {
          checkBoxImage = $("#" + checkbox).data("checkBox");
          $(checkBoxImage).data("clicked", false).trigger("click", true);
        }
      }
    }
  }
})(jQuery, fabric);
