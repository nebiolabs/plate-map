var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.preset = function() {
    // All the preset action goes here
    return {

      _placePresetTabs: function() {

        this.presetTabContainer = this._createElement("<div></div>").addClass("plate-setup-preset-container");
        $(this.tabContainer).append(this.presetTabContainer);

        var wellAttrData = {
          "Preset 1": {

          },

          "Preset 2": {

          },

          "Preset 3": {

          },

          "Preset 4": {

          }
        }

        var presetArray = [];
        var counter = 0;
        for(var preset in wellAttrData) {
          var divText = this._createElement("<div></div>").html(preset)
          .addClass("plate-setup-prest-tab-div");
          presetArray[counter ++] = this._createElement("<div></div>").addClass("plate-setup-prest-tab")
          .append(divText);
          $(this.presetTabContainer).append(presetArray[counter - 1]);

          var that = this;

          $(presetArray[counter - 1]).click(function() {
            that._presetClickHandler(this);
          });
        }
      },

      _presetClickHandler: function(clickedPreset) {

        if(this.previouslyClickedPreset) {
          $(this.previouslyClickedPreset).removeClass("plate-setup-prest-tab-selected")
          .addClass("plate-setup-prest-tab");
        }

        $(clickedPreset).addClass("plate-setup-prest-tab-selected");
        this.previouslyClickedPreset = clickedPreset;
        // What does preset tabs do ??
      },

    };
  }
})(jQuery, fabric);
