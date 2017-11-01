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
              } else {
                field_val = that._makeRegularField(data, tabPointer, fieldArray, true);
              };
            }

            that.allDataTabs[tabPointer]["fields"] = fieldArray;
          } else {
            console.log("unknown format in field initialization");
          }
        });
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
      var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
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
        required: data.required
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
          required: data.required
        };

        fieldArray.push(field);
        that.fieldList.push(field);
        that.fieldMap[data.id] = field;

        // Adding checkbox
        if (checkbox) {
          that._addCheckBox(field, data);
        }
        that._createField(field, data);

        field.onChange = function () {
          var v = field.getValue();
          that._addData(field.id, field.parseValue(v));
        };
        return field;
    },

    _makeMultiplexField: function (data, tabPointer, fieldArray){
        var that = this;
        var wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        var wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        var nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        var fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        $(wrapperDivRightSide).append(nameContainer);
        $(wrapperDivRightSide).append(fieldContainer);
        $(wrapperDiv).append(wrapperDivLeftSide);
        $(wrapperDiv).append(wrapperDivRightSide);

        // single select
        var nameContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-name-singleSelect").text(data.selectName);
        var fieldContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-field-container-singleSelect");
        $(wrapperDivRightSide).append(nameContainer1);
        $(wrapperDivRightSide).append(fieldContainer1);
        $(wrapperDiv).append(wrapperDivLeftSide);
        $(wrapperDiv).append(wrapperDivRightSide);

        $(that.allDataTabs[tabPointer]).append(wrapperDiv);

        var singleSelectData = {
          id: data.multiplexDiv,
          name: data.selectName,
          type: 'select',
          multiplexId: data.id,
          options: data.options
        };

        var singleSelectField = {
          id: singleSelectData.id,
          name: singleSelectData.name,
          root: wrapperDiv,
          data: singleSelectData,
          required: singleSelectData.required
        };

        var field = {
          id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required,
          singleSelectField: singleSelectField,
          singleSelectData: singleSelectData
        };

        fieldArray.push(field);
        that.fieldList.push(field);
        that.fieldMap[data.id] = field;

        var subFieldList = [];
        //create subfields
        for (var subFieldKey in data.multiplexFields) {
          var subFieldData = data.multiplexFields[subFieldKey];
          var subField = that._makeSubField(subFieldData, tabPointer, fieldArray);
          subFieldList.push(subField);
        }
        field.subFieldList = subFieldList;

        that._createField(field, data);
        that._addCheckBox(field, data);

        subFieldList.forEach(function (subfield) {
          subfield.mainMultiplexField = field;
          var subFieldData = subfield.data;

          fieldArray.push(subfield);
          that.fieldMap[subFieldData.id] = subfield;
          that._createField(subfield, subFieldData);

          // overwrite subField setvalue
          subfield.onChange = function () {
            var v = subfield.getValue();
            // append unit to value if exist
            var v = subfield.parseValue(v);
            var mainRefField = subfield.mainMultiplexField;
            var singleSelect = mainRefField.singleSelectField;
            var curDataLs = mainRefField.getMultiplexVal();
            //update curData with the value
            var updatedDataLs = curDataLs.map(function(curData) {
              if (curData[mainRefField.id] === singleSelect.getValue()) {
                curData[subfield.id] = v;
                return curData;
              } else {
                return curData;
              }
            });
            //
            mainRefField.detailData = updatedDataLs;
            that._addData(mainRefField.id, updatedDataLs);
          };
          subfield.setValue = function (v) {
            var selectedId = subfield.mainMultiplexField.singleSelectField.getValue();
            var multiselectField = subfield.mainMultiplexField;
            if (multiselectField.detailData && multiselectField.detailData.length === 0) {
                subfield.input.val(null);
                multiselectField.singleSelectField.input.prop("disabled", true);
                subfield.input.prop("disabled", true);

            }
          };

          subfield.setSubFieldValue = function (v) {
            if (typeof(v) === 'object' && v != null) {
              this.input.val(v.value);
              subfield.setUnit(v.unit);
            } else {
              subfield.setRegularValue(v);
            }
          };

          subfield.setMultiplexValue = function (v) {
            subfield.input.val(v);
          };
          // that._addCheckBox(subfield, subFieldData);
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

    };
  }



})(jQuery, fabric);

// change it to _createXXX
