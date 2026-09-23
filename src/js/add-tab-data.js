var plateMapWidget = plateMapWidget || {};

(function($) {

  /**
   * Processes options.attributes.tabs into the actual fieldList/fieldMap
   * this.fieldList/this.fieldMap objects used throughout the widget:
   * builds each field's shared DOM skeleton, dispatches to _createField
   * (create-field-core.js) to render the actual input control, wires up
   * checkboxes (check-box.js), and (for multiplex fields) recursively
   * builds each subfield the same way. Also owns the required-field
   * bookkeeping (this.requiredField) and the field-type-specific
   * defaultWell seeding (null for scalars, [] for multiselect/multiplex
   * -- see tabs.js for defaultWell itself).
   */
  plateMapWidget.addTabData = function() {

    return {

      fieldList: [],
      fieldMap: {},
      autoId: 1,

      // Shared by _addTabData (top-level fields) and _makeSubField
      // (multiplex subfields): assigns an id/type when the field config
      // omits them, mutating the caller's config object in place.
      _autoAssignFieldIdAndType: function(data) {
        if (!data.id) {
          data.id = "Auto" + this.autoId++;
          console.log("Field autoassigned id " + data.id);
        }
        if (!data.type) {
          data.type = "text";
          console.log("Field " + data.id + " autoassigned type " + data.type);
        }
      },

      // Shared DOM skeleton used by _makeSubField/_makeRegularField/
      // _makeMultiplexField: the left/right/name/field-container
      // wrapper structure every field type is rendered into. Appends
      // the resulting wrapper to allDataTabs[tabPointer] and returns it.
      _createFieldWrapper: function(data, tabPointer) {
        let that = this;
        let wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        let wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        let wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side");
        let nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        let fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        wrapperDivRightSide.append(nameContainer);
        wrapperDivRightSide.append(fieldContainer);
        wrapperDiv.append(wrapperDivLeftSide);
        wrapperDiv.append(wrapperDivRightSide);
        that.allDataTabs[tabPointer].append(wrapperDiv);

        return wrapperDiv;
      },

      // Entry point called once per widget, from tabs.js's _createTabs.
      // Walks every tab's field configs, auto-assigns missing id/type,
      // dispatches each to _makeMultiplexField or _makeRegularField, and
      // seeds this.defaultWell/this.multipleFieldList/this.requiredField
      // accordingly.
      _addTabData: function() {
        // Here we may need more changes because attributes format likely to change
        let tabData = this.options.attributes.tabs;
        let that = this;
        this.requiredField = [];
        let multiplexFieldArray = [];
        tabData.forEach(function(tab, tabPointer) {
          if (tab["fields"]) {
            let tabFields = tab["fields"];
            let fieldArray = [];
            // Now we look for fields in the json
            for (var i = 0; i < tabFields.length; i++) {
              let data = tabFields[i];

              that._autoAssignFieldIdAndType(data);

              let field;
              if (data.type === "multiplex") {
                field = that._makeMultiplexField(data, tabPointer, fieldArray);
                that.defaultWell[field.id] = [];
                multiplexFieldArray.push(field);
              } else {
                field = that._makeRegularField(data, tabPointer, fieldArray, true);
                if (data.type === "multiselect") {
                  that.defaultWell[field.id] = [];
                  multiplexFieldArray.push(field);
                } else {
                  that.defaultWell[field.id] = null;
                }
              }
            }

            that.allDataTabs[tabPointer]["fields"] = fieldArray;
          } else {
            console.log("unknown format in field initialization");
          }
        });
        that.multipleFieldList = multiplexFieldArray;
      },

      // Builds one multiplex SUBFIELD's shell object (not rendered via
      // _createField itself -- that happens later, in
      // _makeMultiplexField's loop). full_id is namespaced under the
      // parent multiplex field's id so subfields with the same short id
      // across different multiplex fields don't collide in fieldMap.
      _makeSubField: function(mainField, data, tabPointer, fieldArray) {
        let that = this;
        that._autoAssignFieldIdAndType(data);
        let wrapperDiv = that._createFieldWrapper(data, tabPointer);

        let field = {
          id: data.id,
          full_id: mainField.id + "_" + data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required || false
        };

        fieldArray.push(field);
        that.fieldMap[field.full_id] = field;

        return field;
      },

      // Builds and renders one non-multiplex field (any type handled by
      // _createField's dispatcher): text/numeric/select/multiselect/
      // boolean. Adds a checkbox (check-box.js) when requested,
      // registers the field's own onChange handler which feeds edits
      // back through _addAllData (add-data-on-change.js).
      _makeRegularField: function(data, tabPointer, fieldArray, checkbox) {
        let that = this;
        let wrapperDiv = that._createFieldWrapper(data, tabPointer);

        let field = {
          id: data.id,
          full_id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required
        };

        if (field.required) {
          that.requiredField.push(field.id);
        }

        fieldArray.push(field);
        that.fieldList.push(field);
        that.fieldMap[field.full_id] = field;

        // Adding checkbox
        if (checkbox) {
          that._addCheckBox(field);
        }
        that._createField(field);

        field.onChange = function() {
          let v = field.getValue();
          let data = {};
          data[field.id] = v;
          that._addAllData(data);
        };
        return field;
      },

      // Builds and renders a multiplex field: the main field itself
      // (create-field-multiplex.js's _createMultiplexField), plus one
      // subfield per data.multiplexFields entry (via _makeSubField),
      // each with its own onChange that threads its edit back through
      // the main field's _changeMultiFieldValue (create-field-
      // multiselect.js) so a subfield edit updates the right entry in
      // the multiplex field's detailData array.
      _makeMultiplexField: function(data, tabPointer, fieldArray) {
        let that = this;
        let wrapperDiv = that._createFieldWrapper(data, tabPointer);

        let field = {
          id: data.id,
          full_id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required
        };

        fieldArray.push(field);
        that.fieldList.push(field);
        that.fieldMap[field.full_id] = field;

        let subFieldList = [];
        //create subfields
        let requiredSubField = [];
        for (let i = 0; i < data.multiplexFields.length; i++) {
          let subFieldData = data.multiplexFields[i];
          let subField = that._makeSubField(field, subFieldData, tabPointer, fieldArray);
          subFieldList.push(subField);

          // stores required  subField
          if (subFieldData.required) {
            requiredSubField.push(subField.id);
          }
        }

        //store required field
        if (field.required || requiredSubField.length) {
          this.requiredField.push({
            multiplexId: field.id,
            subFields: requiredSubField
          });
        }

        field.subFieldList = subFieldList;
        that._createField(field);
        that._addCheckBox(field);

        subFieldList.forEach(function(subfield) {
          subfield.mainMultiplexField = field;
          that._createField(subfield);
          that._addCheckBox(subfield);
          // overwrite subField setvalue
          subfield.onChange = function() {
            let v = subfield.getValue();
            let mainRefField = subfield.mainMultiplexField;
            let curId = mainRefField.singleSelectValue();
            //let curDataLs = mainRefField.detailData;
            let curVal = {};
            curVal[mainRefField.id] = curId;
            //append subfields
            curVal[subfield.id] = v;
            let returnVal = {
              id: curId,
              value: curVal
            };

            field._changeMultiFieldValue(returnVal, null);
            let curDataLs = mainRefField.detailData;
            if (curDataLs !== null) {
              curId = mainRefField.singleSelectValue();
              curDataLs = curDataLs.map(function(curData) {
                if (curData[mainRefField.id] === curId) {
                  curData[subfield.id] = v;
                }
                return curData;
              });
            }
            mainRefField.detailData = curDataLs;
          };

        });

        return field;
      }
    }
  }

})(jQuery);
