var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.canvasCircles = function() {
    // This object contains circles
    return {

      tooManyColorsApplyed: false,

      _addColorCircle: function(tile) {
      // This method checks if given selection has circle.
        this.colorAdded = false;
        var job = this.engine.processChange(tile);
        switch(job.action) {

          case "New Circle":
            this.colorAdded = true;
            this._addCircleToCanvas(tile);
            break;

          case "New Color":
            var currentColor = (this.colorPointer + 1) * 2;
            var tempColors = {
                                0: this.colorPairs[currentColor - 1],
                                1: this.colorPairs[currentColor]
                              };

            this.colorAdded = true;
            var freeColor = this.engine._getFreeColor();

            if(freeColor) {
              // Incase there is a color left out when changing
              tempColors = { 0: freeColor,
                              1: this.colorPairObject[freeColor]
                            };
              this.colorAdded = false;
            }

            this._changeColoredCircle(tile, tempColors);
            break;

          case "Copy Color":
            if(tile.circle) {
              this._changeColoredCircle(tile, job.colorStops);
            } else {
              this._addCircleToCanvas(tile, job.colorStops);
              this._plusColor(job.colorStops);
            }
            break;

          case "Keep Color":
        }

        if(this.colorAdded) this.colorPointer ++;
      },

      _addCircleToCanvas: function(tileToAdd, colorStops) {
        // Adding circle to particular tile
        if(this.colorPointer > 5 ) { //(this.colorPairs.length / 2) - 1
          this.addCircle(8, tileToAdd); // 8 is the index of orenge gradient.
          if(! this.tooManyColorsApplyed) {
              this.applyTooManyColors();
              this.tooManyColorsApplyed = true;
          }
          return true;
        }

        if(colorStops) {
          this.addCircle(null, tileToAdd, colorStops);
          return true;
        }

        var freeColor = this.engine._getFreeColor();

        if(freeColor) {
          var colorObj = {
            0: freeColor,
            1: this.colorPairObject[freeColor]
          }
          this.addCircle(null, tileToAdd, colorObj);
          this._plusColor(colorObj);
          this.colorAdded = false;
          return true;
        }

        var currentColor = (this.colorPointer + 1) * 2;
        var firstColor = { 0: this.colorPairs[currentColor - 1] };
        this.addCircle(currentColor, tileToAdd);
        this._plusColor(firstColor);
      },

      addCircle: function(currentColor, tileToAdd, colorStops) {

        var colors = colorStops || { 0: this.colorPairs[currentColor - 1],
                                     1: this.colorPairs[currentColor]
                                   };
        var circle = new fabric.Circle({
          radius: 22,
          originX:'center',
          originY: 'center',
          top: tileToAdd.top,
          left: tileToAdd.left,
          shadow: 'rgba(0,0,0,0.3) 0 2px 2px',
          evented: false,
          colorStops: colors
        });

        this._setGradient(circle, colors);

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

        return true;
      },

      applyTooManyColors: function() {

          var colorStops =  {
            0: "#ffc100",
            1: "#ff6a00"
          };
          
          for(var i in this.engine.derivative) {
            this._setGradient(this.allTiles[i].circle, colorStops);
          }
      },

      _setGradient: function(circle, colorStops) {

        circle.setGradient("fill", {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: circle.height,
          colorStops: colorStops
        });
      },

      _changeColoredCircle: function(tile, colorObject) {

        this._minusColor(tile.circle.colorStops);
        tile.circle.colorStops = colorObject;
        this._plusColor(colorObject);
        this._setGradient(tile.circle, colorObject);
      },
      _plusColor: function(colorObject) {

        this.engine.colorCounter[colorObject[0]]  = this.engine.colorCounter[colorObject[0]] + 1 || 1;
        this.colorCounter[colorObject[0]]  = this.colorCounter[colorObject[0]] + 1 || 1;
      },

      _minusColor: function(colorObject) {

        this.engine.colorCounter[colorObject[0]]  = this.engine.colorCounter[colorObject[0]] - 1 || 0;
        this.colorCounter[colorObject[0]]  = this.colorCounter[colorObject[0]] - 1 || 0;
      }
    };
  }
})(jQuery, fabric)
