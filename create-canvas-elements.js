var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.createCanvasElements = function() {
    // this class manages creating all the elements within canvas
    return {

      spacing: 48,

      _canvas: function() {
        // Those 1,2,3 s and A,B,C s
        this._fixRowAndColumn();

        // All those circles in the canvas.
        this._putCircles();

      },

      _fixRowAndColumn: function() {

        // For column
        for(var i = 1; i<= this.columnCount; i++) {
          var tempFabricText = new fabric.IText(i.toString(), {
            fill: 'black',
            originX:'center',
            originY: 'center',
            fontSize: 12,
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
            fontSize: 12,
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
        // Indeed we are using rectangles as basic tile. Over the tile we are putting
        // not selected image and later the circle [When we select it].
        var rowCount = this.rowIndex.length;
        var tileCounter = 0;
        for( var i = 0; i < rowCount; i++) {

          for(var j = 0; j < 12; j++) {
            var tempCircle = new fabric.Rect({
              width: 48,
              height: 48,
              left: this.spacing + (j * this.spacing),
              top: this.spacing + (i * this.spacing),
              fill: '#f5f5f5',
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
              selectedWellAttributes: {}
              //selectable: false
            });

            this.allTiles.push(tempCircle);
            this.mainFabricCanvas.add(tempCircle);
          }
        }

        this._addImages();
      },

      _addImages: function() {
        // We load the image for once and then make copies of it
        // and add it to the tile we made in allTiles[]
        var that = this;
        var finishing = this.allTiles.length;

        fabric.Image.fromURL(this.imgSrc + "/background-pattern.png", function(backImg) {

          fabric.Image.fromURL(that.imgSrc + "/empty-well.png", function(img) {
            
            for(var runner = 0; runner < finishing; runner ++) {
              var imaging = $.extend({}, img);
              var backgroundImg = $.extend({}, backImg)
              var currentTile = that.allTiles[runner];
              imaging.top = backgroundImg.top = currentTile.top;
              imaging.left = backgroundImg.left = currentTile.left;
              imaging.parent = currentTile; // Pointing to tile
              imaging.originX = backgroundImg.originX = 'center';
              imaging.originY = backgroundImg.originY = 'center';
              imaging.hasControls = backgroundImg.hasControls = false;
              imaging.hasBorders = backgroundImg.hasBorders = false;
              imaging.lockMovementX = backgroundImg.lockMovementX = true;
              imaging.lockMovementY = backgroundImg.lockMovementY = true;
              imaging.evented = backgroundImg.evented = false;
              imaging.type = "image";
              backgroundImg.visible = false;
              that.allTiles[runner].notSelected = imaging; // Pointing to img
              that.allTiles[runner].backgroundImg = backgroundImg;
              that.mainFabricCanvas.add(backgroundImg, imaging);
            }

          });
          that._addLargeRectangleOverlay();
        });

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
