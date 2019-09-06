var plateLayOutWidget = plateLayOutWidget || {};

(function($) {

  plateLayOutWidget.addTabData = function() {

    return {

      fieldList: [],
      fieldMap: {},
      autoId: 1,

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
            for (let field in tabFields) {
              if (!tabFields.hasOwnProperty(field)) {
                continue;
              }
              let data = tabFields[field];

              if (!data.id) {
                data.id = "Auto" + that.autoId++;
                console.log("Field autoassigned id " + data.id);
              }
              if (!data.type) {
                data.type = "text";
                console.log("Field " + data.id + " autoassigned type " + data.type);
              }

              let field_val;
              if (data.type === "multiplex") {
                field_val = that._makeMultiplexField(data, tabPointer, fieldArray);
                multiplexFieldArray.push(field_val);
              } else {
                field_val = that._makeRegularField(data, tabPointer, fieldArray, true);
                if (data.type === "multiselect") {
                  multiplexFieldArray.push(field_val);
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

      _makeSubField: function(data, tabPointer, fieldArray) {
        let that = this;
        if (!data.id) {
          data.id = "Auto" + that.autoId++;
          console.log("Field autoassigned id " + data.id);
        }
        if (!data.type) {
          data.type = "text";
          console.log("Field " + data.id + " autoassigned type " + data.type);
        }
        let wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        let wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        let wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side");
        let nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        let fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        $(wrapperDivRightSide).append(nameContainer);
        $(wrapperDivRightSide).append(fieldContainer);
        $(wrapperDiv).append(wrapperDivLeftSide);
        $(wrapperDiv).append(wrapperDivRightSide);
        $(that.allDataTabs[tabPointer]).append(wrapperDiv);

        let field = {
          id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required || false
        };

        fieldArray.push(field);
        that.fieldMap[data.id] = field;

        return field;
      },

      _makeRegularField: function(data, tabPointer, fieldArray, checkbox) {
        let that = this;
        let wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        let wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        let wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        let nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        let fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        wrapperDivRightSide.append(nameContainer);
        wrapperDivRightSide.append(fieldContainer);
        wrapperDiv.append(wrapperDivLeftSide);
        wrapperDiv.append(wrapperDivRightSide);
        that.allDataTabs[tabPointer].append(wrapperDiv);

        let field = {
          id: data.id,
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
        that.fieldMap[field.id] = field;

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

      _makeMultiplexField: function(data, tabPointer, fieldArray) {
        let that = this;
        let wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        let wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        let wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        let nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        let fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        wrapperDivRightSide.append(nameContainer);
        wrapperDivRightSide.append(fieldContainer);
        wrapperDiv.append(wrapperDivLeftSide);
        wrapperDiv.append(wrapperDivRightSide);
        that.allDataTabs[tabPointer].append(wrapperDiv);

        let field = {
          id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required
        };

        fieldArray.push(field);
        that.fieldList.push(field);
        that.fieldMap[data.id] = field;

        let subFieldList = [];
        //create subfields
        let requiredSubField = [];
        for (let subFieldKey in data.multiplexFields) {
          if (!data.multiplexFields.hasOwnProperty(subFieldKey)) {
            continue;
          }
          let subFieldData = data.multiplexFields[subFieldKey];
          let subField = that._makeSubField(subFieldData, tabPointer, fieldArray);
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
          fieldArray.push(subfield);
          that._createField(subfield);
          that._addCheckBox(subfield);
          delete that.defaultWell[subfield.id];
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
