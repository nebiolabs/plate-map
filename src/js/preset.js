var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.preset = function(me) {
    // All the preset action goes here
    return {

      presets: [],

      _placePresetTabs: function() {
        var presets = this.options.attributes.presets;

        if (presets && presets.length) {
          this.wellAttrContainer = this._createElement("<div></div>").addClass("plate-setup-well-attr-container")
            .text("Checkbox presets");
          this.tabContainer.append(this.wellAttrContainer);

          this.presetTabContainer = this._createElement("<div></div>").addClass("plate-setup-preset-container");
          this.tabContainer.append(this.presetTabContainer);

          for (var i = 0; i < presets.length; i++) {
            var preset = presets[i];
            var divText = this._createElement("<div></div>").addClass("plate-setup-preset-tab-div")
              .text(preset.title);

            var presetButton = this._createElement("<div></div>").addClass("plate-setup-preset-tab")
              .data("preset", preset.fields).append(divText);
            this.presetTabContainer.append(presetButton);

            var that = this;
            presetButton.click(function() {
              var preset = $(this);
              that._selectPreset(preset);
            });
            this.presets.push(presetButton);
          }
        }
      },

      _clearPresetSelection: function() {
        for (var j = 0; j < this.presets.length; j++) {
          var p = this.presets[j];
          p.removeClass("plate-setup-preset-tab-selected")
            .addClass("plate-setup-preset-tab");
        }
      },

      _selectPreset: function(preset) {
        this.setCheckboxes(preset.data("preset"));
        preset.removeClass("plate-setup-preset-tab")
          .addClass("plate-setup-preset-tab-selected");
      },
    };
  }
})(jQuery, fabric);