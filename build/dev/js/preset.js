var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.preset = function() {
    // All the preset action goes here
    return {

      presets: [],

      _placePresetTabs: function() {
        let presets = this.options.attributes.presets;

        if (presets && presets.length) {
          this.wellAttrContainer = this._createElement("<div></div>").addClass("plate-setup-well-attr-container")
            .text("Checkbox presets");
          this.tabContainer.append(this.wellAttrContainer);

          this.presetTabContainer = this._createElement("<div></div>").addClass("plate-setup-preset-container");
          this.tabContainer.append(this.presetTabContainer);

          for (let i = 0; i < presets.length; i++) {
            let preset = presets[i];
            let divText = this._createElement("<div></div>").addClass("plate-setup-preset-tab-div")
              .text(preset.title);

            let presetButton = this._createElement("<div></div>").addClass("plate-setup-preset-tab")
              .data("preset", preset.fields).append(divText);
            this.presetTabContainer.append(presetButton);

            let that = this;
            presetButton.click(function() {
              let preset = $(this);
              that._selectPreset(preset);
            });
            this.presets.push(presetButton);
          }
        }
      },

      _clearPresetSelection: function() {
        for (let j = 0; j < this.presets.length; j++) {
          let p = this.presets[j];
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
})(jQuery);