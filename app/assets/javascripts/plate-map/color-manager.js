var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.colorManager = function() {

    return {
      // See these are color pairs for the gradient.
      colorPairs: [
        ["#e10404", "#500000"], // 0 empty reference value
        ["#f8666c", "#970e10"], // 1 first in series
        ["#ff9600", "#ff3600"],
        ["#ffc100", "#ff6a00"],
        ["#ffd5ed", "#ffb1df"], 
        ["#ffe735", "#ffaa0e"], //5
        ["#fff77a", "#ffe021"],
        ["#dbfa89", "#bcf61f"],
        ["#a9eac9", "#2eb146"], 
        ["#376a00", "#254800"], 
        ["#84f0ff", "#5feaff"], //10
        ["#2ea2be", "#113d55"],
        ["#003d7d", "#001021"],
        ["#a316e7", "#750edb"],
        ["#a70075", "#5e0040"], 
        ["#ee11ee", "#c803c8"], //15
        ["#5c5c5c", "#423a42"],
        ["#a3a3a3", "#6f6f6f"]  //17
      ]
    }
  }

})(jQuery, fabric);