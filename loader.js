(function(doc, script) {

  var fileArray = [];
  var fileArrayLength, arrayPointer = 0;

  loadScript = function() {
    script = doc.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = function(){

      if(arrayPointer < fileArray.length) {
        // Recursive call
        loadScript(arrayPointer);
      }
    };
    script.src = fileArray[arrayPointer ++] + ".js";
    doc.getElementsByTagName('script')[0].appendChild(script);
  }
  // So this array contains all the file names, whenever u add a new file just add it here
  // Make sure you follow the syntax or return an object from the file
  fileArray = ["libs/jquery-1.11.2.min", "libs/jquery-ui.min", "libs/fabric", "libs/select2","add-data-on-change",
  "add-data-to-tabs", "add-tab-data", "apply-well-data", "bottom-table", "canvas-circles",
  "canvas", "check-box", "create-canvas-elements", "create-field", "fabric-events", "interface", "menu",
  "plate-layout", "overlay", "preset", "tabs", "unit-data-field"];

  loadScript(arrayPointer);

})(document);
