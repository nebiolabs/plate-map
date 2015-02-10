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
      /*
      now add data below the caption .. !!

      when multiple tiles are selected hroup them ...!!, Still have no idea how to group them.


      */
      _addBottomTableData: function() {

        if(this.allSelectedObjects.length == 1) {
          var selectedObj = this.allSelectedObjects[0];
          var selectedWellAttributes = selectedObj["selectedWellAttributes"];
          var captions = {"Plate ID": true};
          this.captionIds = {};
          $(".plate-setup-bottom-container").html("");
          //Creates a row
          this.bottomRow = this._createElement("<div></div>").addClass("plate-setup-bottom-row");

          for(var attr in selectedWellAttributes) {
              if(selectedWellAttributes[attr]) {
                captions[$("#" + attr).data("caption")] = true;
                this.captionIds[attr] = true;
                var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                                .html("<div>" + $("#" + attr).data("caption") + "</div>");
                $(this.bottomRow).append(singleField);
            }
          }

          var noOfFields = Object.keys(captions).length;

          if(noOfFields > 1) {
            // If there is atleast one field to show .
            var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                              .html("<div>" + "Plate ID" + "</div>");
            $(this.bottomRow).prepend(singleField);
            // Now we append all the captions at the place.
            $(this.bottomContainer).append(this.bottomRow);
            this.addDataToBottomTable(this.captionIds, noOfFields);
          }



          if(noOfFields * 150 > 1024) {
            $(this.bottomRow).css("width", (noOfFields) * 152 + "px");
          }

        } else {
          this._addForMultiselect();
        }
      },

      _addForMultiselect: function() {
        // When more than one fields are selected .. !
        // Look for implementations in engine, from selected objects we know differnt colors selected..!!
        var captions = {"Plate ID": true};
        this.captionIds = {};
        $(".plate-setup-bottom-container").html("");
        //Creates a row
        this.bottomRow = this._createElement("<div></div>").addClass("plate-setup-bottom-row");

        for(var tileIndex in this.colorIndices) {
          var selectedObj = this.allTiles[tileIndex];
          var selectedWellAttributes = selectedObj["selectedWellAttributes"];


          for(var attr in selectedWellAttributes) {
              if(! captions[$("#" + attr).data("caption")]) {
                captions[$("#" + attr).data("caption")] = true;
                this.captionIds[attr] = true;
                var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                                .html("<div>" + $("#" + attr).data("caption") + "</div>");
                $(this.bottomRow).append(singleField);
              }
          }
        }

        var noOfFields = Object.keys(captions).length;
        if(noOfFields > 1) {
          // If there is atleast one field to show .
          var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                            .html("<div>" + "Plate ID" + "</div>");
          $(this.bottomRow).prepend(singleField);
          // Now we append all the captions at the place.
          $(this.bottomContainer).append(this.bottomRow);
          this.addDataToBottomTable(this.captionIds, noOfFields);
        }

        if((noOfFields + 1) * 150 > 1024) {
          $(this.bottomRow).css("width", noOfFields * 152 + "px");
        }

      },

      addDataToBottomTable: function(captionIds, captionLength) {

        var tile;
        var length = captionLength;

        for(var tileIndex in this.colorIndices) {

          var row = this._createElement("<div></div>").addClass("plate-setup-bottom-row-data");
          tile = this.allTiles[tileIndex];
          var colorStops = tile.circle.colorStops;
          var plateIdDiv = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field-data");
          $(plateIdDiv).css("background", "-webkit-linear-gradient(left, "+ colorStops[0] +" , "+ colorStops[1] +")");
          $(row).append(plateIdDiv);

          for(var selected in captionIds) {
            var dataDiv = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field-data").
            html(tile["wellData"][selected] || "");
            $(row).append(dataDiv);
          }
          $(this.bottomContainer).append(row);
        }

        if((length) * 150 > 1024) {
          $(row).css("width", (length) * 152 + "px");
        }
      }

    };
  }
})(jQuery, fabric);
