var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addTabData = function() {

    return {

      fieldList: [], 
      fieldMap: {}, 

      _addTabData: function() {
        // Here we may need more changes because attributes format likely to change
        var tabData = this.options.attributes.tabs;
        var that = this;
        var autoId = 1; 
        tabData.forEach(function (tab, tabPointer) {
          if (tab["fields"]) {
            var tabFields = tab["fields"];
            var fieldArray = [];
            var fieldArrayIndex = 0;
            // Now we look for fields in the json
            for (var field in tabFields) {
              var data = tabFields[field];

              if (!data.id) {
                data.id = "Auto" + autoId++;
                console.log("Field autoassigned id " + data.id);
              }
              if (!data.type) {
                data.type = "text";
                console.log("Field " + data.id + " autoassigned type " + data.type);
              }

              var field_val;
              if (data.type === "multiplexmultiselect") {
                [that, fieldArray, field_val] = createMultiplexField(autoId, data, that, tabPointer, fieldArray, true);
              } else {
                [that, fieldArray, field_val] = createRegularField(autoId, data, that, tabPointer, fieldArray, true);
              };
            }

            that.allDataTabs[tabPointer]["fields"] = fieldArray;
          } else {
            console.log("unknown format in field initialization");
          }
        });
      }

    };
  }
})(jQuery, fabric);


function createRegularField(autoId, data, that, tabPointer, fieldArray, checkbox){
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
  return [that,fieldArray, field];
}

function createMultiplexField(autoId, data, that, tabPointer, fieldArray, checkbox, subField){
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
  var nameContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-name-singleSelect").text(data.select_name);
  var fieldContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-field-container-singleSelect");
  $(wrapperDivRightSide).append(nameContainer1);
  $(wrapperDivRightSide).append(fieldContainer1);
  $(wrapperDiv).append(wrapperDivLeftSide);
  $(wrapperDiv).append(wrapperDivRightSide);

  $(that.allDataTabs[tabPointer]).append(wrapperDiv);

  var singleSelectData = {
    id: data.multiplexDiv,
    name: data.select_name,
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
  var subFieldDetailList = [];
  //create subfields
  Object.keys(data.multiplexFields).forEach(function (subFieldKey) {
    var subFieldData = data.multiplexFields[subFieldKey];
    var subFieldField;
    var subField = createSubFields(autoId, subFieldData, that, tabPointer, fieldArray);
    subFieldDetailList.push(subField);
    subFieldList.push(subField[1]);
  });
  field['subFieldList'] = subFieldList;

  that._createField(field, data);
  that._addCheckBox(field, data);

  subFieldDetailList.forEach(function (subField) {
    that = subField[0];
    var subfield = subField[1];
    subfield['mainMultiplexField'] = field;
    fieldArray = subField[2];
    var subFieldData = subField[3];

    fieldArray.push(subfield);
    that.fieldList.push(subfield);
    that.fieldMap[subFieldData.id] = subfield;
    //true is a subfield parameter
    that._createField(subfield, subFieldData);

    // overwrite subField setvalue
    subfield.onChange = function (that) {
      var v = subfield.getValue();
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
      that._addData(mainRefField.id, updatedDataLs);
    };
    subfield.setValue = function (v) {};
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


  return [that, fieldArray, field];
}

function createSubFields(autoId, data, that, tabPointer, fieldArray) {
  if (!data.id) {
    data.id = "Auto" + autoId++;
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
  that.fieldList.push(field);
  that.fieldMap[data.id] = field;

  return [that, field, fieldArray, data];
}