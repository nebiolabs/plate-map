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

        if(field.data("clicked")) {
          this._add(field);
        } else {
          this._remove();
        }
      },

      _add: function(addField) {
        // Adding a new field
        var fieldId = addField.data("linkedFieldId");
        var fieldCaption = $("#" + fieldId).data("caption");
      },

      _remove: function(removeField) {

        var fieldId = removeField.data("linkedFieldId");
        var fieldCaption = $("#" + fieldId).data("caption");
      },

      _addBottomTableData: function() {

        if(this.allSelectedObjects.length == 1) {
          var selectedObj = this.allSelectedObjects[0];
          var selectedWellattributes = selectedObj["selectedWellattributes"];
          console.log(selectedWellattributes.length);
          var captions = ["Plate ID"];
          $(".plate-setup-bottom-container").html("");
          //Creates a row
          this.bottomRow = this._createElement("<div></div>").addClass("plate-setup-bottom-row");

          for(var attr in selectedWellattributes) {
            captions.push($("#" + attr).data("caption"));
            var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                              .html($("#" + attr).data("caption"));
            $(this.bottomRow).append(singleField);
            //$(".plate-setup-bottom-container").append($("#" + attr).data("caption"));
          }
          $(this.bottomContainer).append(this.bottomRow);
          //console.log(captions);
        }
      }
      // Implement bottom table here .. !!
    };
  }
})(jQuery, fabric);
