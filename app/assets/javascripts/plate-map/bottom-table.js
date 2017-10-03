var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.bottomTable = function() {
    // for bottom table
    return {
      _bottomScreen: function() {
        this.bottomContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-container");
        this.bottomTable = this._createElement("<table></table>").addClass("plate-setup-bottom-table");
        this.bottomContainer.append(this.bottomTable)
        this.container.append(this.bottomContainer);
      },

      addBottomTableHeadings: function() {

        this.bottomRow = this._createElement("<tr></tr>");

        var singleField = this._createElement("<th></th>")
          .text("Color");
        this.bottomRow.prepend(singleField);
        // Now we append all the captions at the place.
        this.bottomTable.empty(); 
        this.bottomTable.append(this.bottomRow);

        this.rowCounter = 1;

        for (var i = 0; i <  this.globalSelectedAttributes.length; i++) {
          var attr = this.globalSelectedAttributes[i]; 
          var field = this.fieldMap[attr]; 
          var singleField = this._createElement("<th></th>").text(field.name);
          this.bottomRow.append(singleField);
          this.rowCounter = this.rowCounter + 1;
        }

        this.adjustFieldWidth(this.bottomRow);
      },

      tileAttrText: function (tile, attr) {
        var well = this.engine.derivative[tile.index];
        var field = this.fieldMap[attr]; 
        return field.getText(well.wellData[attr], well.unitData[attr]); 
      }, 

      addBottomTableRow: function(color, singleStack) {

        var modelTile = this.allTiles[singleStack[0]];
        var row = this._createElement("<tr></tr>");
        var plateIdDiv = this._createElement("<td></td>").addClass("plate-setup-bottom-id");

        if (this.engine.stackPointer <= (this.colorPairs.length / 2) + 1) {
          plateIdDiv.css("background", "-webkit-linear-gradient(left, " + this.valueToColor[color] + " , " + this.colorPairObject[this.valueToColor[color]] + ")");
        } else {
          plateIdDiv.text(color);
        }

        row.append(plateIdDiv);

        for (var i = 0; i <  this.globalSelectedAttributes.length; i++) {
          var attr = this.globalSelectedAttributes[i]; 
          var text = this.tileAttrText(modelTile, attr); 
          var dataDiv = this._createElement("<td></td>").text(text);
          row.append(dataDiv);
        }

        this.bottomTable.append(row);
        this.adjustFieldWidth(row);
      },

      bottomForFirstTime: function() {
        this.addBottomTableHeadings();
        // This is executed for the very first time.. !
        var row = this._createElement("<tr></tr>");

        var colorStops = {
          0: this.colorPairs[0],
          1: this.colorPairs[1]
        };
        var plateIdDiv = this._createElement("<td></td>");
        plateIdDiv.css("background", "-webkit-linear-gradient(left, " + colorStops[0] + " , " + colorStops[1] + ")");
        row.append(plateIdDiv);
        this.bottomTable.append(row);
      },

      adjustFieldWidth: function(row) {

        var length = this.rowCounter;
        if ((length) * 150 > 1024) {
          row.css("width", (length) * 152 + "px");
        }
      }

    };
  }
})(jQuery, fabric);