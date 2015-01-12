var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.bottomTable = function() {
    // for bottom table
    return {
      _bottomScreen: function() {

        this.bottomContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-container");
        $(this.container).append(this.bottomContainer);
      },

      _addRemoveToBottamTable: function(field) {

        if(this.allSelectedObjects) {
          this._addBottomTableData();
        }
      },

      /*_add: function(addField) {
        // Adding a new field
        var fieldId = addField.data("linkedFieldId");
        var fieldCaption = $("#" + fieldId).data("caption");
      },

      _remove: function(removeField) {

        var fieldId = removeField.data("linkedFieldId");
        var fieldCaption = $("#" + fieldId).data("caption");
      },
      */
      
      _addBottomTableData: function() {

        if(this.allSelectedObjects.length == 1) {
          var selectedObj = this.allSelectedObjects[0];
          var selectedWellAttributes = selectedObj["selectedWellAttributes"];
          var captions = ["Plate ID"];
          $(".plate-setup-bottom-container").html("");
          //Creates a row
          this.bottomRow = this._createElement("<div></div>").addClass("plate-setup-bottom-row");

          for(var attr in selectedWellAttributes) {
              if(selectedWellAttributes[attr]) {
                captions.push($("#" + attr).data("caption"));
                var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                                .html("<div>" + $("#" + attr).data("caption") + "</div>");
                $(this.bottomRow).append(singleField);
            }
          }

          if(captions.length > 1) {
            // If there is atleast one field to show .
            var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                              .html("<div>" + "Plate ID" + "</div>");
            $(this.bottomRow).prepend(singleField);
            // Now we append all the captions at the place.
            $(this.bottomContainer).append(this.bottomRow);
          }

          if((captions.length) * 150 > 1024) {
            $(this.bottomRow).css("width", (captions.length) * 152 + "px");
          }
        }
      }

    };
  }
})(jQuery, fabric);
