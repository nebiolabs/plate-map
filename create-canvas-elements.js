var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.createCanvasElements = function() {
    // this class manages creating all the elements within canvas
    return {

      spacing: 48,

      _scale: function () {
        //Get a scale factor for rendering
        return this.spacing / 48; 
      },

      _canvas: function() {
        // Those 1,2,3 s and A,B,C s
        this._fixRowAndColumn();

        // All those circles in the canvas.
        this._putCircles();

      },

      _fixRowAndColumn: function() {
        var scale = this._scale(); 

        // For column
        for(var i = 1; i<= this.columnCount; i++) {
          var tempFabricText = new fabric.IText(i.toString(), {
            fill: 'black',
            originX:'center',
            originY: 'center',
            fontSize: 12*scale,
            top : 10,
            left: this.spacing + ((i - 1) * this.spacing),
            fontFamily: "Roboto",
            selectable: false,
            fontWeight: "400"
          });

          this.mainFabricCanvas.add(tempFabricText);
        }

        // for row
        var i = 0;
        while(this.rowIndex[i]) {
          var tempFabricText = new fabric.IText(this.rowIndex[i], {
            fill: 'black',
            originX:'center',
            originY: 'center',
            fontSize: 12*scale,
            left: 5,
            top: this.spacing + (i * this.spacing),
            fontFamily: "Roboto",
            selectable: false,
            fontWeight: "400"
          });

          this.mainFabricCanvas.add(tempFabricText);
          i ++;
        }
      },

      _putCircles: function() {
        var scale = this._scale(); 
        var rowCount = this.rowIndex.length;
        var colCount = this.columnCount; 
        var tileCounter = 0;
        for( var i = 0; i < rowCount; i++) {

          for(var j = 0; j < colCount; j++) {
            var tile = new fabric.Circle({
              width: this.spacing,
              height: this.spacing,
              left: this.spacing + (j * this.spacing),
              top: this.spacing + (i * this.spacing),
              radius: 22*scale,
              originX:'center',
              originY: 'center',
              name: "tile-" + i +"X"+ j,
              type: "tile",
              hasControls: false,
              hasBorders: false,
              lockMovementX: true,
              lockMovementY: true,
              index: tileCounter ++,
              wellData: {}, // now we use this to show the data in the tabs when selected
              selectedWellAttributes: {},
              selectable: false
            });

            tile.setGradient("fill", {
              type: "radial",
              y1: 2,
              y2: 2,
              r1: tile.radius-2,
              r2: tile.radius,
              colorStops: {
                0: 'rgba(0,0,0,0.1)',
                1: 'rgba(0,0,0,0.2)'
              }
            });

            var highlight = new fabric.Rect({
              width: this.spacing,
              height: this.spacing,
              left: this.spacing + (j * this.spacing),
              top: this.spacing + (i * this.spacing),
              originX:'center',
              originY: 'center',
              fill: "rgba(0,0,0,0.4)", 
              selectable: false,
              visible: false
            }); 

            tile.highlight = highlight; 

            this.allTiles.push(tile);
            this.mainFabricCanvas.add(tile);
            this.mainFabricCanvas.add(highlight); 
          }
        }

        this._addLargeRectangleOverlay();
        this._addWellDataToAll();
        this._addUnitDataToAll();
        this._fabricEvents();
      },

      _addLargeRectangleOverlay: function() {

        this.overLay = new fabric.Rect({
          width: 632,
          height: 482,
          left: 0,
          top: 0,
          opacity: 0.0,
          originX:'left',
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
