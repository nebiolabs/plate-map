var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.checkBox = function() {
    // For those check boxes associated with every field in the tab
    return {

      checkBoxes: [], 
      globalSelectedAttributes: [],

      _addCheckBox: function(field, data) {
        var checkImage = $("<img>").attr("src", this._assets.dontImg).addClass("plate-setup-tab-check-box")
          .data("clicked", false); 
        checkImage.data("linkedFieldId", data.id);
        field.find(".plate-setup-tab-field-left-side").empty().append(checkImage);
        this._applyCheckboxHandler(checkImage); // Adding handler for change the image when clicked
        field.checkbox = checkImage;
        this.checkBoxes.push(checkImage); 
        return checkImage;
      },

      _applyCheckboxHandler: function(checkBoxImage) {
        // We add checkbox handler here, thing is it s not checkbox , its an image and we change
        // source
        var that = this;
        checkBoxImage.click(function(evt, machineClick) {
          var checkBox = $(this); 

          var changes = {}; 
          changes[checkBox.data("linkedFieldId")] = !checkBox.data("clicked");

          that.changeCheckboxes(changes); 
        });
      },

      changeCheckboxes: function (changes) {
        var gsa = []; 
        for (var i = 0; i < this.checkBoxes.length; i++) {
          var checkImage = this.checkBoxes[i];
          var fieldId = checkImage.data("linkedFieldId"); 
          var clicked = checkImage.data("clicked");
          if (fieldId in changes) {
            clicked = Boolean(changes[fieldId]);
          }
          checkImage.data("clicked", clicked);
          if (clicked) {
            gsa.push(fieldId);
            checkImage.attr("src", this._assets.doImg);
          } else {
            checkImage.attr("src", this._assets.dontImg);
          }
        }
        this.globalSelectedAttributes = gsa; 
        this._clearPresetSelection(); 
        this._colorMixer(false); 
      }, 

      setCheckboxes: function(fieldIds) {
        var gsa = []; 
        for (var i = 0; i < this.checkBoxes.length; i++) {
          var checkImage = this.checkBoxes[i];
          var fieldId = checkImage.data("linkedFieldId"); 
          var clicked = fieldIds.indexOf(fieldId) >= 0;
          checkImage.data("clicked", clicked);
          if (clicked) {
            gsa.push(fieldId);
            checkImage.attr("src", this._assets.doImg);
          } else {
            checkImage.attr("src", this._assets.dontImg);
          }
        }
        this.globalSelectedAttributes = gsa; 
        this._clearPresetSelection(); 
        this._colorMixer(false); 
      },

    };
  }
})(jQuery, fabric);