var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.checkBox = function() {
    // For those check boxes associated with every field in the tab
    return {

      globalSelectedAttributes: [],
      globalSelectedMultiplexSubfield: [],
      allCheckboxes: [],

      _addCheckBox: function(field) {
        let checkImage = $("<span>").html(this._assets.dontImg).addClass("plate-setup-tab-check-box bg-light")
          .data("clicked", false);
        let linkedFieldId = field.full_id;
        checkImage.data("linkedFieldId", linkedFieldId);
        field.root.find(".plate-setup-tab-field-left-side").empty().append(checkImage);
        this._applyCheckboxHandler(checkImage); // Adding handler for change the image when clicked
        field.checkbox = checkImage;
        this.allCheckboxes.push(linkedFieldId);
      },

      _applyCheckboxHandler: function(checkBoxImage) {
        let that = this;
        checkBoxImage.click(function() {
          let checkBox = $(this);

          let changes = {};
          changes[checkBox.data("linkedFieldId")] = !checkBox.data("clicked");

          that.changeCheckboxes(changes);
        });
      },

      getCheckboxes: function () {
        return this.allCheckboxes.filter(function (fieldId) {
          let field = this.fieldMap[fieldId];
          if (field.mainMultiplexField) {
            let subfields = this.globalSelectedMultiplexSubfield[field.mainMultiplexField.id] || [];
            return subfields.indexOf(field.id);
          } else {
            return this.globalSelectedAttributes.indexOf(field.id) >= 0;
          }
        }, this);
      },

      changeSubFieldsCheckboxes: function(field, changes) {
        let that = this;
        let subFieldToInclude = [];

        field.subFieldList.forEach(function(subField) {
          let checkImage = subField.checkbox;
          let fieldId = checkImage.data("linkedFieldId");
          let clicked = checkImage.data("clicked");
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
        let gsa = [];
        let multiplexCheckedSubField = {};
        for (let i = 0; i < this.fieldList.length; i++) {
          let field = this.fieldList[i];
          if (field.checkbox) {
            if (field.subFieldList) {
              multiplexCheckedSubField[field.id] = this.changeSubFieldsCheckboxes(field, changes);
            }

            let checkImage = field.checkbox;
            let fieldId = checkImage.data("linkedFieldId");
            let clicked = checkImage.data("clicked");
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
        let that = this;
        let subFieldToInclude = [];
        field.subFieldList.forEach(function(subField) {
          let checkImage = subField.checkbox;
          let fieldId = checkImage.data("linkedFieldId");
          let clicked = fieldIds.indexOf(fieldId) >= 0;
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
        let gsa = [];
        let multiplexCheckedSubField = {};

        for (let i = 0; i < this.fieldList.length; i++) {
          let field = this.fieldList[i];
          if (field.checkbox) {
            // special handling for multiplex field
            if (field.subFieldList) {
              multiplexCheckedSubField[field.id] = this.setSubFieldCheckboxes(field, fieldIds);
            }

            let checkImage = field.checkbox;
            let fieldId = checkImage.data("linkedFieldId");
            let clicked = fieldIds.indexOf(fieldId) >= 0;
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