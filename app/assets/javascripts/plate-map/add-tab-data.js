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
              };
            }

            that.allDataTabs[tabPointer]["fields"] = fieldArray;
          } else {
            console.log("unknown format in field initialization");
          }
        });
        that.multiplexFieldList = multiplexFieldArray;
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
      that._addCheckBox(field);
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
        that.fieldMap[field.id] = field;

        // Adding checkbox
        if (checkbox) {
          that._addCheckBox(field);
        }
        that._createField(field);

        field.onChange = function () {
          var v = field.getValue();
          var data = {
            wellData: {}
          };
          data.wellData[field.id] = v;
          that._addAllData(data);
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
      var nameContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-name-singleSelect").text("Select to edit");
      var fieldContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-field-container-singleSelect");
      $(wrapperDivRightSide).append(nameContainer1);
      $(wrapperDivRightSide).append(fieldContainer1);
      $(wrapperDiv).append(wrapperDivLeftSide);
      $(wrapperDiv).append(wrapperDivRightSide);

      $(that.allDataTabs[tabPointer]).append(wrapperDiv);

      var singleSelectData = {
        id: data.id + "SingleSelect",
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
        singleSelectField: singleSelectField
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

      that._createField(field);
      that._addCheckBox(field);

      subFieldList.forEach(function (subfield) {
        subfield.mainMultiplexField = field;
        fieldArray.push(subfield);
        that._createField(subfield);
        delete that.defaultWell.wellData[subfield.id];
        // overwrite subField setvalue
        subfield.onChange = function () {
          var v = subfield.getValue();
          var mainRefField = subfield.mainMultiplexField;
          var singleSelect = mainRefField.singleSelectField;
          //var curDataLs = mainRefField.detailData;
          var curVal = {};
          curVal[mainRefField.id] = singleSelect.getValue();
          //append subfields
          curVal[subfield.id] = v;
          var returnVal = {
            id: singleSelect.getValue(),
            value: curVal
          };

          field._changeMultiFieldValue(returnVal, null);
          var curDataLs = mainRefField.detailData;
          if (curDataLs !== null) {
            curDataLs = curDataLs.map(function(curData) {
              if (curData[mainRefField.id] === singleSelect.getValue()) {
                curData[subfield.id] = v;
              }
              return curData;
            });
          }
          mainRefField.detailData = curDataLs;
          //that._addData(mainRefField.id, curDataLs);
        };

        // that._addCheckBox(subfield);
      });

      // make multiselect subfield for removeALl
      var removeAllData = {
        id: data.id + "RemoveALl",
        name: data.name + " remove all",
        options: data.options,
        type: "multiselect"
      };

      var removeAllDataField = that._makeSubField(removeAllData, tabPointer, fieldArray);

      removeAllDataField._changeMultiFieldValue = function(added, removed) {
        var data = {
          wellData: {}
        };

        data.wellData[field.id] = {
          added: added,
          removed: removed
        };

        that._addAllData(data, 1);
      };

      var bottonContainer = $("<div>");
      var deleteAllButton = $("<button/>");
      deleteAllButton.text("delete");
      bottonContainer.append(deleteAllButton);

      deleteAllButton.click(function(){
        var valToRemove = removeAllDataField.getValue();
        var fieldId = field.id;
        if (valToRemove){
          for (var idx in valToRemove) {
            var val = valToRemove[idx];
            field.multiOnChange(null, {id: val})
          }
        }
        // refresh selected fields after updating the multiplex field value
        that.decideSelectedFields();
      });

      removeAllDataField.root.append(bottonContainer);

      that._createField(removeAllDataField);
      delete that.defaultWell.wellData[removeAllDataField.id];

      removeAllDataField.multiOnChange = function (added, removed) {};

      field.removeAllField = removeAllDataField;

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
