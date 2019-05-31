var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.createCanvasElements = function() {
    // this class manages creating all the elements within canvas
    return {

      scaleFactor: 1,

      baseSizes: {
        spacing: 48,
        tile_radius: 22,
        center_radius_complete: 10,
        center_radius_incomplete: 14,
        label_size: 14,
        label_spacing: 24,
        text_size: 13,
        stroke: 0.5,
        gap: 2
      },

      _setCanvasArea: function(w, h) {
        this.scaleFactor = Math.min(
          h / (this.dimensions.rows * this.baseSizes.spacing + this.baseSizes.label_spacing),
          w / (this.dimensions.cols * this.baseSizes.spacing + this.baseSizes.label_spacing));

        var sizes = {};
        for (var prop in this.baseSizes) {
          sizes[prop] = this.baseSizes[prop] * this.scaleFactor;
        }
        this.sizes = sizes;
      },

      _canvas: function() {
        // Those 1,2,3 s and A,B,C s
        this._fixRowAndColumn();

        // All those circles in the canvas.
        this._putCircles();
      },

      _fixRowAndColumn: function() {
        var cols = this.dimensions.cols;
        var rows = this.dimensions.rows;

        var spacing = this.sizes.spacing;
        var d1 = this.sizes.label_spacing / 2;
        var d2 = this.sizes.label_spacing + this.sizes.spacing / 2;
        var fontSize = this.sizes.label_size;

        // For column
        var top = d1;
        var left = d2;
        for (var i = 1; i <= cols; i++) {
          var tempFabricText = new fabric.IText(i.toString(), {
            fill: 'black',
            originX: 'center',
            originY: 'center',
            fontSize: fontSize,
            top: top,
            left: left,
            fontFamily: '"Roboto", "Arial", sans-serif',
            selectable: false,
            fontWeight: "400"
          });
          left += spacing;

          this.mainFabricCanvas.add(tempFabricText);
        }

        // for row
        top = d2;
        left = d1;
        for (var i = 1; i <= rows; i++) {
          var tempFabricText = new fabric.IText(this.rowIndex[i - 1], {
            fill: 'black',
            originX: 'center',
            originY: 'center',
            fontSize: fontSize,
            top: top,
            left: left,
            fontFamily: '"Roboto", "Arial", sans-serif',
            selectable: false,
            fontWeight: "400"
          });
          top += spacing;

          this.mainFabricCanvas.add(tempFabricText);
        }
      },

      _putCircles: function() {
        var cols = this.dimensions.cols;
        var rows = this.dimensions.rows;

        var tileCounter = 0;
        for (var row = 0; row < rows; row++) {
          for (var col = 0; col < cols; col++) {
            var index = this.allTiles.length;
            var tile = this._createTile(row, col);
            tile.index = tileCounter++;
            this.allTiles.push(tile);
            this.mainFabricCanvas.add(tile.background);
            this.mainFabricCanvas.add(tile.highlight);
            this.mainFabricCanvas.add(tile.circle);
            this.mainFabricCanvas.add(tile.circleCenter);
            this.mainFabricCanvas.add(tile.circleText);
          }
        }

        this._addLargeRectangleOverlay();
        this._fabricEvents();
      },

      _createTile: function(row, col) {
        var tile = {};

        tile.visible = false;
        tile.colorIndex = null;
        tile.row = row;
        tile.col = col;
        tile.address = this.rowIndex[row] + (col + 1);

        var top = (row + 1) * this.sizes.spacing;
        var left = (col + 1) * this.sizes.spacing;

        tile.background = new fabric.Circle({
          top: top,
          left: left,
          radius: this.sizes.tile_radius,
          originX: 'center',
          originY: 'center',
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          evented: false,
        });

        tile.background.setGradient("fill", {
          type: "radial",
          x1: this.sizes.tile_radius,
          x2: this.sizes.tile_radius,
          y1: this.sizes.tile_radius + this.sizes.gap,
          y2: this.sizes.tile_radius + this.sizes.gap,
          r1: this.sizes.tile_radius - this.sizes.gap,
          r2: this.sizes.tile_radius,
          colorStops: {
            0: 'rgba(0,0,0,0.1)',
            1: 'rgba(0,0,0,0.2)'
          }
        });

        tile.highlight = new fabric.Rect({
          originX: 'center',
          originY: 'center',
          top: top,
          left: left,
          width: this.sizes.spacing,
          height: this.sizes.spacing,
          fill: "rgba(0,0,0,0.4)",
          evented: false,
          visible: false
        });

        tile.circle = new fabric.Circle({
          originX: 'center',
          originY: 'center',
          top: top,
          left: left,
          radius: this.sizes.tile_radius,
          stroke: 'gray',
          strokeWidth: this.sizes.stroke,
          evented: false,
          visible: false
        });

        tile.circleCenter = new fabric.Circle({
          originX: 'center',
          originY: 'center',
          top: top,
          left: left,
          radius: this.sizes.center_radius_incomplete,
          fill: "white",
          stroke: 'gray',
          strokeWidth: this.sizes.stroke,
          evented: false,
          visible: false
        });

        tile.circleText = new fabric.IText("", {
          originX: 'center',
          originY: 'center',
          top: top,
          left: left,
          fill: 'black',
          fontFamily: '"Roboto", "Arial", sans-serif',
          fontSize: this.sizes.text_size,
          lockScalingX: true,
          lockScalingY: true,
          evented: false,
          visible: false
        });

        return tile;
      },

      setTileComplete: function(tile, complete) {
        if (complete) {
          tile.circleCenter.radius = this.sizes.center_radius_complete;
          tile.circleText.fill = "black";
          tile.circleText.fontWeight = 'normal';
        } else {
          tile.circleCenter.radius = this.sizes.center_radius_incomplete;
          tile.circleText.fill = "red";
          tile.circleText.fontWeight = 'bold';
        }
      },

      setTileVisible: function(tile, visible) {
        tile.visible = visible;
        tile.circle.visible = tile.visible;
        tile.circleCenter.visible = tile.visible;
        tile.circleText.visible = tile.visible;
      },

      setTileColor: function(tile, color) {
        this.setTileVisible(tile, true);
        tile.colorIndex = parseInt(color);
        tile.circleText.text = String(tile.colorIndex);

        if (color > 0) {
          color = ((color - 1) % (this.colorPairs.length - 1)) + 1;
        }
        var colorStops = this.colorPairs[color];

        tile.circle.setGradient("fill", {
          y2: 2 * this.sizes.tile_radius,
          colorStops: colorStops
        });
      },

      _addLargeRectangleOverlay: function() {

        this.overLay = new fabric.Rect({
          width: 632,
          height: 482,
          left: 0,
          top: 0,
          opacity: 0.0,
          originX: 'left',
          originY: 'top',
          lockMovementY: true,
          lockMovementX: true,
          selectable: false
        });

        this.mainFabricCanvas.add(this.overLay);
      }
    };
  }
})(jQuery, fabric);
