var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.bottomTable = function() {
    // for bottom table
    return {
      _bottomScreen: function() {

        this.bottomContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-container");
        $(this.container).append(this.bottomContainer);
      },

      addBottomTableHeadings: function() {

        this.bottomRow = this._createElement("<div></div>").addClass("plate-setup-bottom-row");

        var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
          .html("<div>" + "Plate ID" + "</div>");
        $(this.bottomRow).addClass("plate-setup-bottom-row-seperate")
          .prepend(singleField);
        // Now we append all the captions at the place.
        $(this.bottomContainer).html(this.bottomRow);

        this.rowCounter = 1;

        for (var attr in this.globalSelectedAttributes) {

          var fieldName = $("#" + attr).data("caption");
          var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
            .html("<div>" + fieldName + "</div>");
          $(this.bottomRow).append(singleField);
          this.rowCounter = this.rowCounter + 1;
        }

        this.adjustFieldWidth(this.bottomRow);
      },

      addBottomTableRow: function(colors, singleStack) {

        var modelTile = this.allTiles[singleStack[0]];
        var row = this._createElement("<div></div>").addClass("plate-setup-bottom-row-data");
        var plateIdDiv = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field-data");

        if (this.engine.stackPointer <= (this.colorPairs.length / 2) + 1) {
          $(plateIdDiv).css("background", "-webkit-linear-gradient(left, " + this.valueToColor[color] + " , " + this.colorPairObject[this.valueToColor[color]] + ")");
        } else {
          $(plateIdDiv).html(colors);
        }

        $(row).append(plateIdDiv);

        for (var attr in this.globalSelectedAttributes) {
          var data = (modelTile.wellData[attr] == "NULL") ? "" : modelTile.wellData[attr];
          var dataDiv = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field-data").html(data);
          $(row).append(dataDiv);
        }

        $(this.bottomContainer).append(row);
        this.adjustFieldWidth(row);
      },

      bottomForFirstTime: function() {
        this.addBottomTableHeadings();
        // This is executed for the very first time.. !
        var row = this._createElement("<div></div>").addClass("plate-setup-bottom-row-data");

        var colorStops = {
          0: this.colorPairs[0],
          1: this.colorPairs[1]
        };
        var plateIdDiv = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field-data");
        $(plateIdDiv).css("background", "-webkit-linear-gradient(left, " + colorStops[0] + " , " + colorStops[1] + ")");
        $(row).append(plateIdDiv);
        $(this.bottomContainer).append(row);
      },

      adjustFieldWidth: function(row) {

        var length = this.rowCounter;
        if ((length) * 150 > 1024) {
          $(row).css("width", (length) * 152 + "px");
        }
      }

    };
  }
})(jQuery, fabric);