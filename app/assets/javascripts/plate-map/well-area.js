var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.wellArea = function(fabric) {

    return {

      _areasToTiles: function(areas) {
        //Convert areas to tiles
        var cols = this.numCols;
        var that = this;
        return areas.reduce(function(tiles, area) {
          if (area) {
            for (var r = area.minRow; r <= area.maxRow; r++) {
              for (var c = area.minCol; c <= area.maxCol; c++) {
                var tile = that.allTiles[c + cols * r];
                if (tiles.indexOf(tile) < 0) {
                  tiles.push(tile);
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
        var scale = this.scaleFactor;
        var spacing = this.spacing * scale;
        var cols = this.numCols;
        var rows = this.numRows;
        var colWidth = spacing;
        var rowHeight = spacing;
        var colMargin = colWidth / 2;
        var rowMargin = rowHeight / 2;

        var x = (coord.x - colMargin) / colWidth;
        var y = (coord.y - rowMargin) / rowHeight;

        var row = this._coordIndex(y, rows);
        var col = this._coordIndex(x, cols);

        return {
          row: row,
          col: col,
          index: col + row * cols
        };
      },

      _wellToCoords: function(well, center) {
        //Convert a well to a coordinate
        var scale = this.scaleFactor;
        var spacing = this.spacing * scale;
        var colWidth = spacing;
        var rowHeight = spacing;
        var colMargin = colWidth / 2;
        var rowMargin = rowHeight / 2;

        var x = well.col * colWidth + colMargin;
        var y = well.row * rowHeight + rowMargin;
        if (center) {
          x = x + colMargin;
          y = y + rowMargin;
        }

        return {
          x: x,
          y: y
        };
      },

      _areaToRect: function(area) {
        //Convert area to rectangle
        var scale = this.scaleFactor;
        var spacing = this.spacing * scale;
        var colWidth = spacing;
        var rowHeight = spacing;
        var colMargin = colWidth / 2;
        var rowMargin = rowHeight / 2;

        var rowCount = area.maxRow - area.minRow + 1;
        var colCount = area.maxCol - area.minCol + 1;

        return {
          top: area.minRow * rowHeight + rowMargin,
          left: area.minCol * colWidth + colMargin,
          height: rowCount * rowHeight,
          width: colCount * colWidth
        }
      },

      _rectToArea: function(rect) {
        //Convert a rectangular region to an area
        var cols = this.numCols;
        var rows = this.numRows;
        var scale = this.scaleFactor;
        var spacing = this.spacing * scale;
        var colWidth = spacing;
        var rowHeight = spacing;
        var colMargin = colWidth / 2;
        var rowMargin = rowHeight / 2;

        var left = (rect.left - colMargin) / colWidth;
        var top = (rect.top - rowMargin) / rowHeight;
        var height = rect.height / rowHeight;
        var width = rect.width / colWidth;
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
        if (top >= cols) {
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