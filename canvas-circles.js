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
            //this.engine.colorCounter[tile.circle.colorStops[0]] = this.engine.colorCounter[tile.circle.colorStops[0]] + 1 || 1;
            break;

          case "New Color":
            console.log("new color");
            var currentColor = (this.colorPointer + 1) * 2;
            var tempColors = {
                                0: this.colorPairs[currentColor - 1],
                                1: this.colorPairs[currentColor]
                              };
                              console.log(tempColors);
            this.engine.colorCounter[tile.circle.colorStops[0]] = this.engine.colorCounter[tile.circle.colorStops[0]] - 1 || 0;
            this.colorCounter[tile.circle.colorStops[0]] = this.colorCounter[tile.circle.colorStops[0]] -1 || 0;
            tile.circle.colorStops = tempColors;
            this.engine.colorCounter[tempColors[0]] = this.engine.colorCounter[tempColors[0]] + 1 || 1;
            this.colorCounter[tempColors[0]] = this.colorCounter[tempColors[0]] + 1 || 1;
            this._changeGradient(tile, tempColors);
            colorAdded = true;
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
              //this.engine.colorCounter[job.colorStops[0]] = this.engine.colorCounter[job.colorStops[0]] + 1 || 1;
              this.colorCounter[job.colorStops[0]] = this.colorCounter[job.colorStops[0]] + 1 || 1;
            }
            break;

          case "Keep Color":
            console.log("just keep color");

        }
        //this._addCircleToCanvas(tile);
        /*if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
            var tile = this.allSelectedObjects[objectIndex];
            if(! tile.circle) {
              this.engine.processChange(tile);
              colorAdded = this._addCircleToCanvas(tile);
            } else {
              //console.log("change color");
            }
          }*/
          // incrementing color pointer should be out of for loop, only then the whole selected
          // tiles have one color.
          if(colorAdded) {
            //console.log(this.colorPointer);
            this.colorPointer ++;
          }
        //}
      },

      _addCircleToCanvas: function(tileToAdd, colorStops) {
        // Adding circle to particular tile
        if(this.colorPointer > (this.colorPairs.length / 2) - 1) { // (this.colorPairs.length / 2) - 1
          this.addCircle(8, tileToAdd); // 8 is the index of orenge gradient.
          if(! this.tooManyColorsApplyed) {
              this.applyTooManyColors();
              this.tooManyColorsApplyed = true;
          }
        } else if(colorStops) {
          this.addCircle(false, tileToAdd, colorStops);
          this.engine.colorCounter[colorStops[0]] =  this.engine.colorCounter[colorStops[0]] + 1 || 1;
        }else {
          var currentColor = (this.colorPointer + 1) * 2;
          var firstC = this.colorPairs[currentColor - 1];
          this.engine.colorCounter[firstC] =  this.engine.colorCounter[firstC] + 1 || 1;
          this.addCircle(currentColor, tileToAdd);
        }
        return true;
      },

      addCircle: function(currentColor, tileToAdd, colorStops) {

        var colors = colorStops || {
                                      0: this.colorPairs[currentColor - 1],
                                      1: this.colorPairs[currentColor]
                                    };
        var circle = new fabric.Circle({
          radius: 22,
          //fill: this.distinctColors[this.colorPointer],
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
        //console.log("boom", colorStops);
        tile.circle.setGradient('fill', {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: tile.circle.height,
          colorStops: colorStops
        });
      }

    };
  }
})(jQuery, fabric)
