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
              that._addCheckBox(field, data);
              that._createField(field, data);
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