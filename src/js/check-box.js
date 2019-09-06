var plateLayOutWidget = plateLayOutWidget || {};

(function($) {

  plateLayOutWidget.checkBox = function() {
    // For those check boxes associated with every field in the tab
    return {

      globalSelectedAttributes: [],

      _addCheckBox: function(field) {
        var checkImage = $("<span>").html(this._assets.dontImg).addClass("plate-setup-tab-check-box bg-light")
          .data("clicked", false);
        checkImage.data("linkedFieldId", field.id);
        field.root.find(".plate-setup-tab-field-left-side").empty().append(checkImage);
        this._applyCheckboxHandler(checkImage); // Adding handler for change the image when clicked
        field.checkbox = checkImage;
      },

      _applyCheckboxHandler: function(checkBoxImage) {
        var that = this;
        checkBoxImage.click(function() {
          var checkBox = $(this);

          var changes = {};
          changes[checkBox.data("linkedFieldId")] = !checkBox.data("clicked");

          that.changeCheckboxes(changes);
        });
      },

      getCheckboxes: function () {
        var fieldIds = this.globalSelectedAttributes.slice();
        Object.values(this.globalSelectedMultiplexSubfield).forEach(function (subfieldIds) {
            fieldIds = fieldIds.concat(subfieldIds);
        });
        return fieldIds;
      },

      changeSubFieldsCheckboxes: function(field, changes) {
        var that = this;
        var subFieldToInclude = [];

        field.subFieldList.forEach(function(subField) {
          var checkImage = subField.checkbox;
          var fieldId = checkImage.data("linkedFieldId");
          var clicked = checkImage.data("clicked");
          if (fieldId in changes) {
            clicked = Boolean(changes[fieldId]);
          }
          checkImage.data("clicked", clicked);
          if (clicked) {
            checkImage.html(that._assets.doImg);
            subFieldToInclude.push(subField.id);
          } else {
            checkImage.html(that._assets.dontImg);
          }
        });
        return subFieldToInclude;
      },

      changeCheckboxes: function(changes, noUndoRedo) {
        var gsa = [];
        var multiplexCheckedSubField = {};
        for (var i = 0; i < this.fieldList.length; i++) {
          var field = this.fieldList[i];
          if (field.checkbox) {
            if (field.subFieldList) {
              multiplexCheckedSubField[field.id] = this.changeSubFieldsCheckboxes(field, changes);
            }

            var checkImage = field.checkbox;
            var fieldId = checkImage.data("linkedFieldId");
            var clicked = checkImage.data("clicked");
            if (fieldId in changes) {
              clicked = Boolean(changes[fieldId]);
            }
            checkImage.data("clicked", clicked);
            if (clicked) {
              gsa.push(fieldId);
              checkImage.html(this._assets.doImg);
            } else {
              checkImage.html(this._assets.dontImg);
            }
          }
        }
        this.globalSelectedMultiplexSubfield = multiplexCheckedSubField;
        this.globalSelectedAttributes = gsa;
        this._clearPresetSelection();
        this._colorMixer();
        if (!noUndoRedo) {
          this.addToUndoRedo();
        }
      },

      setSubFieldCheckboxes: function(field, fieldIds) {
        var that = this;
        var subFieldToInclude = [];
        field.subFieldList.forEach(function(subField) {
          var checkImage = subField.checkbox;
          var fieldId = checkImage.data("linkedFieldId");
          var clicked = fieldIds.indexOf(fieldId) >= 0;
          checkImage.data("clicked", clicked);
          if (clicked) {
            checkImage.html(that._assets.doImg);
            subFieldToInclude.push(subField.id);
          } else {
            checkImage.html(that._assets.dontImg);
          }
        });
        return subFieldToInclude;
      },

      setCheckboxes: function(fieldIds, noUndoRedo) {
        fieldIds = fieldIds || [];
        var gsa = [];
        var multiplexCheckedSubField = {};

        for (var i = 0; i < this.fieldList.length; i++) {
          var field = this.fieldList[i];
          if (field.checkbox) {
            // special handling for multiplex field
            if (field.subFieldList) {
              multiplexCheckedSubField[field.id] = this.setSubFieldCheckboxes(field, fieldIds);
            }

            var checkImage = field.checkbox;
            var fieldId = checkImage.data("linkedFieldId");
            var clicked = fieldIds.indexOf(fieldId) >= 0;
            checkImage.data("clicked", clicked);
            if (clicked) {
              gsa.push(fieldId);
              checkImage.html(this._assets.doImg);
            } else {

              checkImage.html(this._assets.dontImg);
            }
          }
        }
        this.globalSelectedMultiplexSubfield = multiplexCheckedSubField;
        this.globalSelectedAttributes = gsa;
        this._clearPresetSelection();
        this._colorMixer();
        if (!noUndoRedo) {
          this.addToUndoRedo();
        }
      }

    };
  }
})(jQuery);