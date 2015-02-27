var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.canvasCircles = function() {
    // this object contains circles
    return {

      addCircle: function(tileToAdd, color, stackPointer) {

        var circle = new fabric.Circle({
          radius: 22,
          originX:'center',
          originY: 'center',
          top: tileToAdd.top,
          left: tileToAdd.left,
          shadow: 'rgba(0,0,0,0.3) 0 2px 2px',
          evented: false
        });

        circle.colorIndex = color;

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
            visible: false
        });

        circle.parent = tileToAdd; // Linking the objects;
        tileToAdd.circle = circle;
        tileToAdd.circleCenter = circleCenter;
        tileToAdd.circleText = circleText;

        this.setGradient(circle, color, stackPointer);

        this.mainFabricCanvas.add(circle);
        this.mainFabricCanvas.add(circleCenter);
        this.mainFabricCanvas.add(circleText);
      },

      setGradient: function(circle, color, stackPointer) {

        var tile = circle.parent;
        tile.circleText.text = "" + parseInt(color) - 1 + "";

        if(stackPointer <= (this.colorPairs.length / 2) +1){
          var colorStops = {
            0: this.valueToColor[color],
            1: this.colorPairObject[this.valueToColor[color]]
          };

          tile.circleText.setVisible(false);
        } else {
          tile.circleText.setVisible(true);
          var colorStops = {
            0: "#ffc100",
            1: "#ff6a00"
          };
        }

        circle.setGradient("fill", {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: circle.height,
          colorStops: colorStops
        });
      },
      
    };
  }
})(jQuery, fabric)
