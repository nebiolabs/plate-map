var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.applyWellData = function() {
    // This object adds all the data fields and unit data to all the tiles/wells
    return {

      // these methodes can be combined but leave it as it is for simplicity
      _addWellDataToAll: function() {
        // Here we are adding an object containing all the id s of fields in the right to tiles
        var noOfTiles = this.allTiles.length;
        for(var tileRunner = 0; tileRunner < noOfTiles; tileRunner ++) {
          this.allTiles[tileRunner]["wellData"] = $.extend({}, this.allWellData);
        }
      },

      _addUnitDataToAll: function() {
        // Here we are adding an object containing all the id s of units in the right to tiles
        var noOfTiles = this.allTiles.length;
        for(var tileRunner = 0; tileRunner < noOfTiles; tileRunner ++) {
          this.allTiles[tileRunner]["unitData"] = $.extend({}, this.allUnitData);
        }
      },

    };
  }
})(jQuery, fabric)
