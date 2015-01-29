var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.canvasCircles = function() {
    // This object contains circles
    return {

      tooManyColorsApplyed: false,

      _addColorCircle: function(tile) {
      // This method checks if given selection has circle.
        var colorAdded = false;
        var job = this.engine.processChange(tile);
        switch(job.action) {

          case "New Circle":
            this._addCircleToCanvas(tile);
            colorAdded = true;
            this.colorCounter[tile.circle.colorStops[0]] = this.colorCounter[tile.circle.colorStops[0]] + 1 || 1;
            break;

          case "New Color":
            var currentColor = (this.colorPointer + 1) * 2;
            var tempColors = {
                                0: this.colorPairs[currentColor - 1],
                                1: this.colorPairs[currentColor]
                              };
            colorAdded = true;

            var freeColor = this.engine._getFreeColor();
            if(freeColor) {
              // Incase there is a color left out when changing
              tempColors = {
                              0: freeColor,
                              1: this.colorPairObject[freeColor]
                            };
              colorAdded = false;
            }

            this.engine.colorCounter[tile.circle.colorStops[0]] = this.engine.colorCounter[tile.circle.colorStops[0]] - 1 || 0;
            this.colorCounter[tile.circle.colorStops[0]] = this.colorCounter[tile.circle.colorStops[0]] -1 || 0;
            tile.circle.colorStops = tempColors;
            this.engine.colorCounter[tempColors[0]] = this.engine.colorCounter[tempColors[0]] + 1 || 1;
            this.colorCounter[tempColors[0]] = this.colorCounter[tempColors[0]] + 1 || 1;
            this._changeGradient(tile, tempColors);
            break;

          case "Copy Color":
            if(tile.circle) {
              // Minusing changed color
              this.engine.colorCounter[tile.circle.colorStops[0]] = this.engine.colorCounter[tile.circle.colorStops[0]] - 1 || 0;
              this.colorCounter[tile.circle.colorStops[0]] = this.colorCounter[tile.circle.colorStops[0]] -1 || 0;

              tile.circle.colorStops = job.colorStops;

              this.engine.colorCounter[job.colorStops[0]] = this.engine.colorCounter[job.colorStops[0]] + 1 || 1;
              this.colorCounter[job.colorStops[0]] = this.colorCounter[job.colorStops[0]] + 1 || 1;

              this._changeGradient(tile, job.colorStops);
            } else {
              this._addCircleToCanvas(tile, job.colorStops);
              this.colorCounter[job.colorStops[0]] = this.colorCounter[job.colorStops[0]] + 1 || 1;
              this.engine.colorCounter[job.colorStops[0]] =  this.engine.colorCounter[job.colorStops[0]] + 1 || 1;
            }
            break;

          case "Keep Color":
            //console.log("just keep color");

        }
          //console.log(this.engine.colorCounter)
          if(colorAdded) {
            // Here check if color array has any zero values color
            this.colorPointer ++;
          }
      },

      _addCircleToCanvas: function(tileToAdd, colorStops) {
        // Adding circle to particular tile
        if(this.colorPointer > (this.colorPairs.length / 2) - 1) {
          this.addCircle(8, tileToAdd); // 8 is the index of orenge gradient.
          if(! this.tooManyColorsApplyed) {
              this.applyTooManyColors();
              this.tooManyColorsApplyed = true;
          }
          return true;
        }

        if(colorStops) {
          this.addCircle(false, tileToAdd, colorStops);
          return true;
        }

        var freeColor = this.engine._getFreeColor();
        var currentColor = (this.colorPointer + 1) * 2;
        var firstC = this.colorPairs[currentColor - 1];
        this.engine.colorCounter[firstC] =  this.engine.colorCounter[firstC] + 1 || 1;
        this.addCircle(currentColor, tileToAdd);

        return true;
      },

      addCircle: function(currentColor, tileToAdd, colorStops) {

        var colors = colorStops || {
                                      0: this.colorPairs[currentColor - 1],
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

        circle.setGradient('fill', {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: circle.height,
          colorStops: colors
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
      },

      _changeGradient: function(tile, colorStops) {
        tile.circle.setGradient('fill', {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: tile.circle.height,
          colorStops: colorStops
        });
      },
    };
  }
})(jQuery, fabric)
