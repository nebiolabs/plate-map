var plateLayOutWidget = plateLayOutWidget || {};

(function($) {

  plateLayOutWidget.colorManager = function() {

    return {
      // See these are color pairs for the gradient.
      colorPairs: [
        ["#e6e6e6", "#808080"],
        ["#66e8ff", "#0082c8"],
        ["#ff7fb1", "#e6194b"],
        ["#a2ffb1", "#3cb44b"],
        ["#f784ff", "#911eb4"],
        ["#ffe897", "#f58231"],
        ["#6666ff", "#0000FF"],
        ["#ffff7f", "#ffe119"],
        ["#acffff", "#46f0f0"],
        ["#ff98ff", "#f032e6"],
        ["#ffffa2", "#d2f53c"],
        ["#ffffff", "#fabebe"],
        ["#66e6e6", "#008080"],
        ["#ffffff", "#e6beff"],
        ["#ffd48e", "#aa6e28"],
        ["#e66666", "#800000"],
        ["#ffffff", "#aaffc3"],
        ["#e6e666", "#808000"],
        ["#ffffff", "#ffd8b1"],
        ["#66a9ef", "#004389"],
        ["#ff6672", "#a7000c"],
        ["#66db72", "#00750c"],
        ["#b866db", "#520075"],
        ["#ffa966", "#b64300"],
        ["#ffff66", "#c0a200"],
        ["#6dffff", "#07b1b1"],
        ["#ff66ff", "#b100a7"],
        ["#f9ff66", "#93b600"],
        ["#ffe5e5", "#bb7f7f"],
        ["#66a7a7", "#004141"],
        ["#ffe5ff", "#a77fc0"],
        ["#d19566", "#6b2f00"],
        ["#ffffef", "#c0bb89"],
        ["#d1ffea", "#6bc084"],
        ["#a7a766", "#414100"],
        ["#ffffd8", "#c09972"],
        ["#a5ffff", "#3fc1ff"],
        ["#ffbef0", "#ff588a"],
        ["#e1fff0", "#7bf38a"],
        ["#ffc3ff", "#d05df3"],
        ["#ffffd6", "#ffc170"],
        ["#a5a5ff", "#3f3fff"],
        ["#ffffbe", "#ffff58"],
        ["#ebffff", "#85ffff"],
        ["#ffd7ff", "#ff71ff"],
        ["#a5ffff", "#3fbfbf"],
        ["#ffffcd", "#e9ad67"],
        ["#ffa5a5", "#bf3f3f"],
        ["#ffffa5", "#bfbf3f"]
      ]
    }
  }

})(jQuery);