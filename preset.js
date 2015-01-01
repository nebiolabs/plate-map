var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.preset = function(me) {
    // All the preset action goes here
    return {

      presetSettings: me.options.attributes.presets || {},

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
          .data("preset", preset).append(divText);
          $(this.presetTabContainer).append(presetArray[counter - 1]);

          var that = this;

          $(presetArray[counter - 1]).click(function() {
            that._presetClickHandler(this);
          });
        }
      },

      _presetClickHandler: function(clickedPreset) {
        if(this.allSelectedObjects) {
          if(this.previouslyClickedPreset) {
            $(this.previouslyClickedPreset).removeClass("plate-setup-prest-tab-selected")
            .addClass("plate-setup-prest-tab");
          }

          $(clickedPreset).addClass("plate-setup-prest-tab-selected");
          this.previouslyClickedPreset = clickedPreset;
        // Fill the checkboxes as prest array says.

          var currentPrestTab = $(clickedPreset).data("preset").toLowerCase();
          var currentPresetItems = this.presetSettings[currentPrestTab];
          var presetCount = this.presetSettings[currentPrestTab].length;
          var checkBoxImage;
          for(var i = 0; i < presetCount; i++) {
            // here we trigger the event which was defined in the check-box.js
            checkBoxImage = $("#" + currentPresetItems[i]).data("checkBox");
            $(checkBoxImage).data("clicked", false).trigger("click");
          }
        } else {
          // Incase no well is selected
          console.log("No WELL is selected, Please select atleast a WELL");
        }
      },

    };
  }
})(jQuery, fabric);
