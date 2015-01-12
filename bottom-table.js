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
          var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                            .html("Plate ID");
          $(this.bottomRow).append(singleField);
          // Now we append all the captions at the palce.
          $(this.bottomContainer).append(this.bottomRow);

          for(var attr in selectedWellattributes) {
              if(selectedWellattributes[attr]) {
                captions.push($("#" + attr).data("caption"));
                var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                                .html($("#" + attr).data("caption"));
                $(this.bottomRow).append(singleField);
            }
          }

          if((captions.length) * 150 > 1024) {
            $(this.bottomRow).css("width", (captions.length) * 150 + "px");
          }
          console.log($(this.bottomRow).width(), (captions.length - 1) * 150)
        }
      }
      // Implement bottom table here .. !!
    };
  }
})(jQuery, fabric);
