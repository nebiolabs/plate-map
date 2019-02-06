var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.wellArea = function(fabric) {

    return {

      _areasToTiles: function(areas) {
        //Convert areas to tiles
        var cols = this.dimensions.cols;
        var that = this;
        return areas.reduce(function(tiles, area) {
          if (area) {
            for (var r = area.minRow; r <= area.maxRow; r++) {
              for (var c = area.minCol; c <= area.maxCol; c++) {
                var tile = that.allTiles[c + cols * r];
                if (tiles.indexOf(tile) < 0) {
                  if (that.disableAddDeleteWell){
                    if(that.addressAllowToEdit.indexOf(tile.address) >= 0){
                      tiles.push(tile);
                    }
                  } else {
                    tiles.push(tile);
                  }
                }
              }
            }
          }
          return tiles;
        }, []);
      },

      _encodeArea: function(area) {
        //Encode area as string
        if ((area.minRow == area.maxRow) && (area.minCol == area.maxCol)) {
          return this.rowIndex[area.minRow] + area.minCol.toString(10);
        } else {
          return this.rowIndex[area.minRow] + area.minCol.toString(10) + ":" + this.rowIndex[area.maxRow] + area.maxCol.toString(10);
        }
      },

      _encodeAreas: function(areas) {
        //Encode an array of areas as a string
        var that = this;
        return areas.map(function(area) {
          return that._encodeArea(area);
        }).join(",");
      },

      _decodeWell: function(wellAddress) {
        var that = this;
        var adRx = new RegExp("^\\s*(" + that.rowIndex.join("|") + ")(\\d+)\\s*$")
        var rcRx = /^\s*R(\d+)C(\d+)\s*$/i;

        var match;
        match = wellAddress.match(adRx);
        if (match) {
          var row = that.rowIndex.indexOf(match[1]);
          if (row >= 0) {
            return {
              row: row,
              col: parseInt(match[2]) - 1
            };
          }
        }
        match = wellAddress.match(rcRx);
        if (match) {
          return {
            row: parseInt(match[1]) - 1,
            col: parseInt(match[2]) - 1
          };
        }

        throw "Invalid well address: " + wellAddress;
      },

      _decodeArea: function(areaAddress) {
        //Decode single area as string
        var that = this;
        var wells = areaAddress.split(":").map(function(wellAddress) {
          return that._decodeWell(wellAddress);
        })
        if (wells.length == 1) {
          return {
            minRow: wells[0].row,
            minCol: wells[0].col,
            maxRow: wells[0].row,
            maxCol: wells[0].col
          }
        } else if (wells.length == 2) {
          var minRow = Math.min(wells[0].row, wells[1].row)
          return {
            minRow: Math.min(wells[0].row, wells[1].row),
            minCol: Math.min(wells[0].col, wells[1].col),
            maxRow: Math.max(wells[0].row, wells[1].row),
            maxCol: Math.max(wells[0].col, wells[1].col)
          }
        } else {
          throw "Invalid address: " + areaAddress;
        }
      },

      _decodeAreas: function(areasAddress) {
        //Decode single area as string
        var that = this;
        return areasAddress.split(",").map(function(areaAddress) {
          return that._decodeArea(areaAddress);
        });
      },

      _wellToArea: function(well) {
        //Convert a well to an area
        return {
          minCol: well.col,
          minRow: well.row,
          maxCol: well.col,
          maxRow: well.row
        }
      },

      _wellInArea: function(well, area) {
        //Determine if a well lies within an area
        return well.row >= area.minRow && well.row <= area.maxRow && well.col >= area.minCol && well.col <= area.maxCol;
      },

      _coordsToRect: function(startCoords, endCoords) {
        //Convert two XY coords to a bounding box
        var left = Math.min(startCoords.x, endCoords.x);
        var top = Math.min(startCoords.y, endCoords.y);
        var height = Math.abs(endCoords.y - startCoords.y);
        var width = Math.abs(endCoords.x - startCoords.x);
        return {
          top: top,
          left: left,
          height: height,
          width: width
        };
      },

      _coordIndex: function(v, count) {
        var i;
        if (v < 0) {
          i = 0;
        } else if (v >= count) {
          i = count - 1;
        } else {
          i = Math.floor(v);
        }
        return i;
      },

      _coordsToWell: function(coord) {
        //Convert a coordinate to a well
        var cols = this.dimensions.cols;
        var rows = this.dimensions.rows;

        var w = this.sizes.spacing; 
        var m = this.sizes.label_spacing; 

        var x = (coord.x - m) / w;
        var y = (coord.y - m) / w;

        var row = this._coordIndex(y, rows);
        var col = this._coordIndex(x, cols);

        return {
          row: row,
          col: col,
        };
      },

      _wellToCoords: function(well, center) {
        //Convert a well to a coordinate
        var w = this.sizes.spacing; 
        var m = this.sizes.label_spacing; 
        var x = well.col * w + m;
        var y = well.row * w + m;
        if (center) {
          var hw = w/2;
          x = x + hw;
          y = y + hw;
        }

        return {
          x: x,
          y: y
        };
      },

      _areaToRect: function(area) {
        //Convert area to rectangle
        var rows = area.maxRow - area.minRow + 1;
        var cols = area.maxCol - area.minCol + 1;

        var w = this.sizes.spacing; 
        var m = this.sizes.label_spacing; 

        return {
          top: area.minRow * w + m,
          left: area.minCol * w + m,
          height: rows * w,
          width: cols * w
        }
      },

      _rectToArea: function(rect) {
        //Convert a rectangular region to an area
        var rows = this.dimensions.rows;
        var cols = this.dimensions.cols;

        var w = this.sizes.spacing; 
        var m = this.sizes.label_spacing; 

        var left = (rect.left - m) / w;
        var top = (rect.top - m) / w;
        var height = rect.height / w;
        var width = rect.width / w;
        var right = left + width;
        var bottom = top + height;

        //select whole row
        if (right < 0) {
          right = cols;
        }
        if (left >= cols) {
          left = 0;
        }
        //select whole col
        if (bottom < 0) {
          bottom = rows;
        }
        if (top <= 0) {
          top = 0;
        }

        return {
          minCol: this._coordIndex(left, cols),
          minRow: this._coordIndex(top, rows),
          maxCol: this._coordIndex(right, cols),
          maxRow: this._coordIndex(bottom, rows)
        };
      }

    }
  }
})(jQuery, fabric);