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
          this._addForMultiselect();
        }
      },

      _addForMultiselect: function() {
        // When more than one fields are selected .. !
        // Look for implementations in engine, from selected objects we know differnt colors selected..!!
        var noOfFields;
        var captions = {"Plate ID": true};
        this.captionIds = [];
        $(".plate-setup-bottom-container").html("");
        //Creates a row
        this.bottomRow = this._createElement("<div></div>").addClass("plate-setup-bottom-row");

        for(var tileIndex in this.colorIndices) {

          var selectedObj = this.allTiles[tileIndex];
          var selectedWellAttributes = selectedObj["selectedWellAttributes"];


          for(var attr in selectedWellAttributes) {
            if(! captions[$("#" + attr).data("caption")]) {
              captions[$("#" + attr).data("caption")] = true;
              this.captionIds.push(attr);
              var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                              .html("<div>" + $("#" + attr).data("caption") + "</div>");
              $(this.bottomRow).append(singleField);
            }
          }
        }

        noOfFields = this.captionIds.length;
        if(noOfFields > 0) {
          // If there is atleast one field to show .
          var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                            .html("<div>" + "Plate ID" + "</div>");
          $(this.bottomRow).prepend(singleField);
          // Now we append all the captions at the place.
          $(this.bottomContainer).append(this.bottomRow);
          this.addDataToBottomTable(this.captionIds, noOfFields);
        }

        this.adjustFieldWidth(noOfFields, this.bottomRow);

      },

      addDataToBottomTable: function(captionIds, captionLength) {

        var tile;
        var length = captionLength;
        var row;
        for(var tileIndex in this.colorIndices) {

          var row = this._createElement("<div></div>").addClass("plate-setup-bottom-row-data");
          tile = this.allTiles[tileIndex];
          var colorStops = tile.circle.colorStops;
          var plateIdDiv = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field-data");
          $(plateIdDiv).css("background", "-webkit-linear-gradient(left, "+ colorStops[0] +" , "+ colorStops[1] +")");
          $(row).append(plateIdDiv);

          for(var selected = 0; selected< length; selected ++) {
            var dataDiv = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field-data").html("");
            if(tile.selectedWellAttributes[captionIds[selected]]) {
              $(dataDiv).html(tile["wellData"][captionIds[selected]] || "");
            }

            $(row).append(dataDiv);
          }
          $(this.bottomContainer).append(row);

          this.adjustFieldWidth(length, row);
          console.log( "_______________________________");
        }
      },

      adjustFieldWidth: function(length, row) {

        if((length + 1) * 150 > 1024) {
          $(row).css("width", (length +1) * 152 + "px");
        }
      }

    };
  }
})(jQuery, fabric);
