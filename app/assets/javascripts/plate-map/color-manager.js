var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.colorManager = function() {

    return {
        // See these are color pairs for the gradient.
      colorPairs: [
        ["#b3b3b3", "#808080"],
        ["#33b5fb", "#0082c8"],
        ["#ff4c7e", "#e6194b"],
        ["#6fe77e", "#3cb44b"],
        ["#c451e7", "#911eb4"],
        ["#ffb564", "#f58231"],
        ["#3333ff", "#0000FF"],
        ["#ffff4c", "#ffe119"],
        ["#79ffff", "#46f0f0"],
        ["#ff65ff", "#f032e6"],
        ["#ffff6f", "#d2f53c"],
        ["#fff1f1", "#fabebe"],
        ["#33b3b3", "#008080"],
        ["#fff1ff", "#e6beff"],
        ["#dda15b", "#aa6e28"],
        ["#b33333", "#800000"],
        ["#ddfff6", "#aaffc3"],
        ["#b3b333", "#808000"],
        ["#ffffe4", "#ffd8b1"],
        ["#3376bc", "#004389"],
        ["#da333f", "#a7000c"],
        ["#33a83f", "#00750c"],
        ["#8533a8", "#520075"],
        ["#e97633", "#b64300"],
        ["#f3d533", "#c0a200"],
        ["#3ae4e4", "#07b1b1"],
        ["#e433da", "#b100a7"],
        ["#c6e933", "#93b600"],
        ["#eeb2b2", "#bb7f7f"],
        ["#337474", "#004141"],
        ["#dab2f3", "#a77fc0"],
        ["#9e6233", "#6b2f00"],
        ["#f3eebc", "#c0bb89"],
        ["#9ef3b7", "#6bc084"],
        ["#747433", "#414100"],
        ["#f3cca5", "#c09972"],
        ["#72f4ff", "#3fc1ff"],
        ["#ff8bbd", "#ff588a"],
        ["#aeffbd", "#7bf38a"],
        ["#ff90ff", "#d05df3"],
        ["#fff4a3", "#ffc170"],
        ["#7272ff", "#3f3fff"],
        ["#ffff8b", "#ffff58"],
        ["#b8ffff", "#85ffff"],
        ["#ffa4ff", "#ff71ff"],
        ["#72f2f2", "#3fbfbf"],
        ["#ffe09a", "#e9ad67"],
        ["#f27272", "#bf3f3f"],
        ["#f2f272", "#bfbf3f"]
      ]
    }
  }

})(jQuery, fabric);