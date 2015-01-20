var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.canvasCircles = function() {
    // This object contains circles
    return {

      tooManyColorsApplyed: false,

      _addColorCircle: function() {
      // This method checks if given selection has circle.
        var colorAdded = false;
        if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
            //if(this.allSelectedObjects[objectIndex].type == "tile") {
              var tile = this.allSelectedObjects[objectIndex];
              if(! tile.circle) {
                colorAdded = this._addCircleToCanvas(tile);
              }
            //}
          }
          // incrementing color pointer should be out of for loop, only then the whole selected
          // tiles have one color.
          if(colorAdded) {
            //console.log(this.colorPointer);
            this.colorPointer ++;
          }
        }
      },

      _addCircleToCanvas: function(tileToAdd) {
        // Adding circle to particular tile
        if(this.colorPointer > (this.colorPairs.length / 2) - 1) { // (this.colorPairs.length / 2) - 1
          this.addCircle(8, tileToAdd); // 8 is the index of orenge gradient.
          if(! this.tooManyColorsApplyed) {
              this.applyTooManyColors();
          }
        } else {
          var currentColor = (this.colorPointer + 1) * 2;
          this.addCircle(currentColor, tileToAdd);
        }
        return true;
      },

      addCircle: function(currentColor, tileToAdd) {

        var circle = new fabric.Circle({
          radius: 22,
          //fill: this.distinctColors[this.colorPointer],
          originX:'center',
          originY: 'center',
          top: tileToAdd.top,
          left: tileToAdd.left,
          shadow: 'rgba(0,0,0,0.3) 0 2px 2px',
          evented: false
        });

        circle.setGradient('fill', {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: circle.height,
          colorStops: {
            0: this.colorPairs[currentColor - 1],
            1: this.colorPairs[currentColor]
          }
        });

        var circleCenter = new fabric.Circle({
          radius: 14,
          fill: "white",
          originX:'center',
          originY: 'center',
          top: tileToAdd.top,
          left: tileToAdd.left,
          shadow: 'rgba(0,0,0,0.1) 0 -1px 0',
          evented: false
        });


        circle.parent = tileToAdd; // Linking the objects;
        tileToAdd.circle = circle;
        tileToAdd.circleCenter = circleCenter;
        this.mainFabricCanvas.add(circle);
        this.mainFabricCanvas.add(circleCenter);
        this.mainFabricCanvas.renderAll();
        return true;
      },

      applyTooManyColors: function() {

          var noOfTiles = this.allTiles.length;
          for(var i = 0; i < noOfTiles; i++ ) {
            if(this.allTiles[i].circle) {

              this.allTiles[i].circle.setGradient('fill', {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: this.allTiles[i].circle.height,
                colorStops: {
                  0: "#ffc100",
                  1: "#ff6a00"
                }
              });
            }
          }

          this.mainFabricCanvas.renderAll();
      }

    };
  }
})(jQuery, fabric)
