var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.canvasCircles = function() {
    // This object contains circles
    return {

      _addColorCircle: function() {
      // This method checks if given selection has circle.
        var colorAdded = false;
        if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
            if(this.allSelectedObjects[objectIndex].type == "tile") {
              var tile = this.allSelectedObjects[objectIndex];
              if(! tile.circle) {
                colorAdded = this._addCircleToCanvas(tile);
              }
            }
          }
          // incrementing color pointer should be out of for loop, only then the whole selected
          // tiles have one color.
          if(colorAdded) {
            console.log(this.colorPointer);
            this.colorPointer ++;
          }
        }
      },

      _addCircleToCanvas: function(tileToAdd) {
        // Adding circle to particular tile
        if(this.colorPointer > this.distinctColors.length - 1) {
          var newColor = this.getRandomColor();
          this.distinctColors.push(newColor);
        }

        var currentColor = (this.colorPointer + 1) * 2;
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
        this.mainFabricCanvas.add(circle);
        this.mainFabricCanvas.add(circleCenter);
        return true;
      },

      getRandomColor: function() {
        // This method generate a random color incase we run out of predefined color.
        // Again it checks if randomly generated color already exists in the array and if it is
        // generate some other color.
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        var colorCount = this.distinctColors.length;
        var colorIndex = 0;
        // Check if the generated color is already in the list
        while(colorIndex < colorCount) {
          if(this.distinctColors[colorIndex] === (color).toUpperCase()) {
            this.getRandomColor();
          }
          colorIndex ++;
        }
        return (color).toUpperCase();
      },

    };
  }
})(jQuery, fabric)
