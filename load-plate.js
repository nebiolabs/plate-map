var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.loadPlate = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {

      getPlates: function(data) {

        var derivativeData = JSON.parse(data);

        this.clearCheckBoxes();

        this.clearCrieteriaForAll(derivativeData.selectedObjects);

        this.loadDataToCircles(derivativeData.derivative);

        this.engine.derivative = $.extend(true, {}, derivativeData.derivative);

        if($.isEmptyObject(derivativeData.checkboxes)) {
          this._colorMixer(true);
        } else {
          this.loadCheckboxes(derivativeData.checkboxes);
        }

        if(derivativeData.selectedObjects.selectionRectangle) {
          this.createRectangle(derivativeData.selectedObjects.selectionRectangle, derivativeData.selectedObjects.click);
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
      },

      clearCheckBoxes: function() {

        var checkBoxImage;

        for(var checkbox in this.globalSelectedAttributes) {
          checkBoxImage = $("#" + checkbox).data("checkBox");
          $(checkBoxImage).data("clicked", true).trigger("click", true);
        }
      },

      createRectangle: function(rectData, click) {

        this.startX = rectData.left; // assigning these values so that they are used when creating rectangle.
        this.startY = rectData.top;

        if(rectData.type == "dynamicRect") {
          this.mouseMove = true;
          this._createDynamicRect();
          this.dynamicRect.setWidth(rectData.width);
          this.dynamicRect.setHeight(rectData.height);
        } else {
          this.mouseMove = false;
        }

        this.mainFabricCanvas.fire("mouse:up");
      }
    }
  }
})(jQuery, fabric);
