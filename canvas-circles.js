var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.canvasCircles = function() {
    // This object contains circles
    return {

      tooManyColorsApplyed: false,
      limit: 0,

      _addColorCircle: function(tile) {
      // This method checks if given selection has circle.
        this.colorAdded = false;
        this.limit = (this.colorPairs.length - 1) / 2;
        var job = this.engine.processChange(tile);
        if(this.colorPointer > this.limit) {
          this._handleOverLimit(tile, job);
          return true;
        }

        switch(job.action) {

          case "New Circle":
            if(this.colorPointer === this.limit && ! this.engine._getFreeColor()) {
              // This is a special case, Just after we reach the limit and we want a new color circle
              this.afterLimitPointer = this.colorPointer + 1;
              this._handleOverLimit(tile, job);
              this.colorPointer ++;
              return true;
            }
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
            colorIndex = this.colorPointer + 1;
            var freeColor = this.engine._getFreeColor();

            if(freeColor) {
              // Incase there is a color left out when changing
              tempColors = { 0: freeColor,
                              1: this.colorPairObject[freeColor]
                            };
              this.colorAdded = false;
              colorIndex = this.colorIndexValues[freeColor];
            }

            this._changeColoredCircle(tile, tempColors, colorIndex);
            break;

          case "Copy Color":
            if(tile.circle) {
              this._changeColoredCircle(tile, job.colorStops, job.colorIndex);
            } else {
              this._addCircleToCanvas(tile, job.colorStops, job.colorIndex);
              this._plusColor(job.colorStops);
            }
            break;

          case "Keep Color":
        }

        if(this.colorAdded) this.colorPointer ++;
      },

      _addCircleToCanvas: function(tileToAdd, colorStops, colorIndex) {
        // Adding circle to particular tile
        if(colorStops) {
          this.addCircle(null, tileToAdd, colorStops, colorIndex);
          return true;
        }

        var freeColor = this.engine._getFreeColor();

        if(freeColor) {
          var colorObj = {
            0: freeColor,
            1: this.colorPairObject[freeColor]
          }
          colorIndex = this.colorIndexValues[freeColor];
          this.addCircle(null, tileToAdd, colorObj, colorIndex);
          this._plusColor(colorObj);
          this.colorAdded = false;
          return true;
        }

        var currentColor = (this.colorPointer + 1) * 2;
        var firstColor = { 0: this.colorPairs[currentColor - 1] };
        this.addCircle(currentColor, tileToAdd);
        this._plusColor(firstColor);
      },

      addCircle: function(currentColor, tileToAdd, colorStops, colorIndex) {

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

        circle.colorIndex = (colorIndex) ? colorIndex : this.colorPointer + 1;

        this._setGradient(circle, colors);

        var circleCenter = new fabric.Circle({
          radius: 14,
          fill: "white",
          originX:'center',
          originY: 'center',
          top: tileToAdd.top,
          left: tileToAdd.left,
          shadow: 'rgba(0,0,0,0.1) 0 -1px 0',
          evented: false,
        });

        var circleText = new fabric.IText(""+circle.colorIndex+"", {
            top: tileToAdd.top,
            left: tileToAdd.left,
            fill: 'black',
            evented: false,
            fontSize: 12,
            lockScalingX: true,
            lockScalingY: true,
            originX:'center',
            originY: 'center',
        });

        circle.parent = tileToAdd; // Linking the objects;
        tileToAdd.circle = circle;
        tileToAdd.circleCenter = circleCenter;
        tileToAdd.circleText = circleText;
        this.mainFabricCanvas.add(circle);
        this.mainFabricCanvas.add(circleCenter);
        this.mainFabricCanvas.add(circleText);

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

      _changeColoredCircle: function(tile, colorObject, colorIndex) {

        this._minusColor(tile.circle.colorStops);
        tile.circle.colorStops = colorObject;
        tile.circle.colorIndex = colorIndex;
        tile.circleText.text = "" + colorIndex + "";
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
      },

      _handleOverLimit: function(tileToAdd, job) {
          console.log(job);
          this.afterLimitPointerAdded = false;
          switch(job.action) {

            case "New Circle":
              this.afterLimitPointerAdded = true;
              this.addCircle(8, tileToAdd, null, this.afterLimitPointer); // 8 is the index of orenge gradient.
              break;

            case "New Color":
              break;

            case "Copy Color":
              if(tileToAdd.circle) {

              } else {
                this.addCircle(8, tileToAdd, null, job.colorIndex);
              }

              break;
          }

          if(! this.tooManyColorsApplyed) {
              this.applyTooManyColors();
              this.tooManyColorsApplyed = true;
          }

          if(this.afterLimitPointerAdded) this.afterLimitPointer ++;
      },

     };
  }
})(jQuery, fabric)
