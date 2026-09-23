var plateMapWidget = plateMapWidget || {};

(function($) {

  /**
   * Manages the small checkbox glyph next to every field in the tab
   * panel -- checking a field marks it as one of the "grouping"
   * criteria used by engine.js's searchAndStack (this.globalSelectedAttributes)
   * to color/group wells by their shared values on checked fields.
   * Multiplex fields track checked SUBFIELDS separately
   * (this.globalSelectedMultiplexSubfield), since a multiplex field's
   * grouping key can be a subset of its subfields rather than the whole
   * field. this._assets.doImg/dontImg (image_assets.js) are the actual
   * checked/unchecked glyphs rendered.
   */
  plateMapWidget.checkBox = function() {
    // For those check boxes associated with every field in the tab
    return {

      globalSelectedAttributes: [],
      globalSelectedMultiplexSubfield: [],
      allCheckboxes: [],

      // Creates and wires up one field's checkbox glyph, placing it in
      // the field's left-side wrapper slot (see add-tab-data.js's
      // _createFieldWrapper).
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

      // Wires the click handler that toggles one checkbox's own
      // clicked/glyph state and feeds the change through changeCheckboxes.
      _applyCheckboxHandler: function(checkBoxImage) {
        let that = this;
        checkBoxImage.click(function() {
          let checkBox = $(this);

          let changes = {};
          changes[checkBox.data("linkedFieldId")] = !checkBox.data("clicked");

          that.changeCheckboxes(changes);
        });
      },

      // Public API (used by undo-redo-manager.js's createState/setData
      // round-trip too): returns the currently-checked field ids, with
      // multiplex subfields filtered to only those actually selected for
      // that specific multiplex field (this.globalSelectedMultiplexSubfield).
      getCheckboxes: function () {
        return this.allCheckboxes.filter(function (fieldId) {
          let field = this.fieldMap[fieldId];
          if (field.mainMultiplexField) {
            let subfields = this.globalSelectedMultiplexSubfield[field.mainMultiplexField.id] || [];
            // Was missing ">= 0" -- Array#filter coerces the raw indexOf
            // result to boolean, so a subfield at index 0 (falsy) was wrongly
            // excluded, and one not found (-1, truthy) was wrongly included.
            // See REFACTOR_NOTES.md §10.4 #3.
            return subfields.indexOf(field.id) >= 0;
          } else {
            return this.globalSelectedAttributes.indexOf(field.id) >= 0;
          }
        }, this);
      },

      // Applies partial checkbox-state `changes` to one multiplex
      // field's subfields (each subfield keeps its own prior state
      // unless overridden by `changes`), returning the list of subfield
      // ids that end up checked.
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

      // Applies a partial checkbox-state change (changes: {fieldId:
      // boolean}) across every field, re-derives
      // globalSelectedAttributes/globalSelectedMultiplexSubfield from
      // the result, clears any active preset-tab highlight (a manual
      // checkbox edit no longer matches a preset exactly), re-runs color
      // grouping, and records undo/redo history (unless noUndoRedo).
      // Used for individual checkbox clicks -- see setCheckboxes below
      // for the "replace the whole set at once" variant used by preset
      // selection and undo/redo replay.
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

      // setSubFieldCheckboxes's counterpart to setCheckboxes below:
      // checks exactly the subfields whose ids appear in fieldIds
      // (rather than merging with prior state, unlike
      // changeSubFieldsCheckboxes).
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

      // Public API (also used by preset.js's _selectPreset and undo/redo
      // replay via setData/load-plate.js): replaces the ENTIRE checked
      // set at once with exactly fieldIds, rather than merging changes
      // like changeCheckboxes does.
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