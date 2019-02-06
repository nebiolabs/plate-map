var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addTabData = function() {

    return {

      fieldList: [], 
      fieldMap: {},
      autoId: 1,

      _addTabData: function() {
          // Here we may need more changes because attributes format likely to change
          var tabData = this.options.attributes.tabs;
          var that = this;
          this.requiredField = [];
          var multiplexFieldArray = [];
          tabData.forEach(function (tab, tabPointer) {
            if (tab["fields"]) {
              var tabFields = tab["fields"];
              var fieldArray = [];
              var fieldArrayIndex = 0;
              // Now we look for fields in the json
              for (var field in tabFields) {
                var data = tabFields[field];

                if (!data.id) {
                  data.id = "Auto" + that.autoId++;
                  console.log("Field autoassigned id " + data.id);
                }
                if (!data.type) {
                  data.type = "text";
                  console.log("Field " + data.id + " autoassigned type " + data.type);
                }

                var field_val;
                if (data.type === "multiplex") {
                  field_val = that._makeMultiplexField(data, tabPointer, fieldArray);
                  multiplexFieldArray.push(field_val);
                } else {
                  field_val = that._makeRegularField(data, tabPointer, fieldArray, true);
                  if (data.type === "multiselect") {
                    multiplexFieldArray.push(field_val);
                  }
                };
              }

              that.allDataTabs[tabPointer]["fields"] = fieldArray;
            } else {
              console.log("unknown format in field initialization");
            }
          });
          that.multipleFieldList = multiplexFieldArray;
      },

      _makeSubField: function (data, tabPointer, fieldArray) {
        var that = this;
        if (!data.id) {
          data.id = "Auto" + that.autoId++;
          console.log("Field autoassigned id " + data.id);
        }
        if (!data.type) {
          data.type = "text";
          console.log("Field " + data.id + " autoassigned type " + data.type);
        }
        var wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        var wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side");
        var nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        var fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        $(wrapperDivRightSide).append(nameContainer);
        $(wrapperDivRightSide).append(fieldContainer);
        $(wrapperDiv).append(wrapperDivLeftSide);
        $(wrapperDiv).append(wrapperDivRightSide);
        $(that.allDataTabs[tabPointer]).append(wrapperDiv);

        var field = {
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

      _makeRegularField: function (data, tabPointer, fieldArray, checkbox){
          var that = this;
          var wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
          var wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
          var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
          var nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
          var fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

          wrapperDivRightSide.append(nameContainer);
          wrapperDivRightSide.append(fieldContainer);
          wrapperDiv.append(wrapperDivLeftSide);
          wrapperDiv.append(wrapperDivRightSide);
          that.allDataTabs[tabPointer].append(wrapperDiv);

          var field = {
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

          field.onChange = function () {
            var v = field.getValue();
            var data = {};
            data[field.id] = v;
            that._addAllData(data);
          };
          return field;
      },

      _makeMultiplexField: function (data, tabPointer, fieldArray) {
        var that = this;
        var wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        var wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        var nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        var fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        wrapperDivRightSide.append(nameContainer);
        wrapperDivRightSide.append(fieldContainer);
        wrapperDiv.append(wrapperDivLeftSide);
        wrapperDiv.append(wrapperDivRightSide);
        that.allDataTabs[tabPointer].append(wrapperDiv);

        var field = {
          id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required
        };

        fieldArray.push(field);
        that.fieldList.push(field);
        that.fieldMap[data.id] = field;

        var subFieldList = [];
        //create subfields
        var requiredSubField = [];
        for (var subFieldKey in data.multiplexFields) {
          var subFieldData = data.multiplexFields[subFieldKey];
          var subField = that._makeSubField(subFieldData, tabPointer, fieldArray);
          subFieldList.push(subField);

          // stores required  subField
          if (subFieldData.required) {
            requiredSubField.push(subField.id);
          }
        }

        //store required field
        if (field.required || requiredSubField.length) {
          this.requiredField.push ({
            multiplexId: field.id,
            subFields: requiredSubField
          });
        }

        field.subFieldList = subFieldList;
        that._createField(field);
        that._addCheckBox(field);

        subFieldList.forEach(function (subfield) {
          subfield.mainMultiplexField = field;
          fieldArray.push(subfield);
          that._createField(subfield);
          that._addCheckBox(subfield);
          delete that.defaultWell[subfield.id];
          // overwrite subField setvalue
          subfield.onChange = function () {
            var v = subfield.getValue();
            var mainRefField = subfield.mainMultiplexField;
            var curId = mainRefField.singleSelectValue();
            //var curDataLs = mainRefField.detailData;
            var curVal = {};
            curVal[mainRefField.id] = curId;
            //append subfields
            curVal[subfield.id] = v;
            var returnVal = {
              id: curId,
              value: curVal
            };

            field._changeMultiFieldValue(returnVal, null);
            var curDataLs = mainRefField.detailData;
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

        field.getValue = function(){
          var v = field.input.select2('data');
          if (v.length) {
            return v.map(function (i) {
              return i.id;
            });
          }
          return null;
        };

        return field;
      }
    }
  }

})(jQuery, fabric);
