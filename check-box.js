var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.checkBox = function() {
    // For those check boxes associated with every field in the tab
    return {

      _addCheckBox: function(fieldArray, fieldArrayIndex, data) {

        var checkImage = $("<img>").attr("src", this.imgSrc + "/dont.png").addClass("plate-setup-tab-check-box")
        .data("clicked", false).data("linkedFieldId", data.id);
        $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-field-left-side").html(checkImage);
        this._applyCheckboxHandler(checkImage); // Adding handler for change the image when clicked
        fieldArray[fieldArrayIndex - 1].checkbox = checkImage;
        return checkImage;
      },

      _applyCheckboxHandler: function(checkBoxImage) {
        // We add checkbox handler here, thing is it s not checkbox , its an image and we change
        // source
        var that = this;
        $(checkBoxImage).click(function(evt) {
          if($(this).data("clicked")) {
            $(this).attr("src", that.imgSrc + "/dont.png");
          } else {
            $(this).attr("src", that.imgSrc + "/do.png");
          }

          $(this).data("clicked", !$(this).data("clicked"));
          // when we un/select values it should reflect to the tiles selected at the moment
          that._addRemoveSelection($(this));
        });
      },

      _addRemoveSelection: function(clickedCheckBox) {
        // This method is invoked when any of the checkbox is un/checked. And it also add the id of the
        // corresponding field to the tile. So now a well/tile knows if particular checkbox is checkd and
        // if checked whats the value in it. because we use the value id of the element,
        // which in turn passed through attribute.
        if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
            if(this.allSelectedObjects[objectIndex].type == "tile") {
              var selectionData = this.allSelectedObjects[objectIndex]["selectedWellattributes"];
              if(clickedCheckBox.data("clicked")) {
                selectionData[clickedCheckBox.data("linkedFieldId")] = true;
              } else {
                delete selectionData[clickedCheckBox.data("linkedFieldId")];
              }

            }
          }
        }
      },
      
    };
  }
})(jQuery, fabric);
