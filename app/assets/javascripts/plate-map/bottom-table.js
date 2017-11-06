var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.bottomTable = function() {
    // for bottom table
    return {
      _bottomScreen: function() {
        this.bottomContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-container");
        this.bottomTableContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-table-container");
        this.bottomTable = this._createElement("<table></table>").addClass("plate-setup-bottom-table");
        this.bottomTableContainer.append(this.bottomTable);
        this.bottomContainer.append(this.bottomTableContainer);
        this.container.append(this.bottomContainer);
      },

      addBottomTableHeadings: function() {

        this.bottomRow = this._createElement("<tr></tr>");

        var singleField = this._createElement("<th></th>")
          .text("Group");
        this.bottomRow.prepend(singleField);
        // Now we append all the captions at the place.
        this.bottomTable.empty(); 
        this.bottomTable.append(this.bottomRow);

        this.rowCounter = 1;

        for (var i = 0; i <  this.globalSelectedAttributes.length; i++) {
          var attr = this.globalSelectedAttributes[i]; 
          var field = this.fieldMap[attr]; 
          var singleField = this._createElement("<th></th>").text(field.name);
          this.bottomRow.append(singleField);
          this.rowCounter = this.rowCounter + 1;
        }

        this.adjustFieldWidth(this.bottomRow);
      },

      tileAttrText: function (tile, attr) {
        var well = this.engine.derivative[tile.index];
        var field = this.fieldMap[attr]; 
        return field.getText(well.wellData[attr]);
      }, 

      addBottomTableRow: function(color, singleStack) {

        var modelTile = this.allTiles[singleStack[0]];
        var row = this._createElement("<tr></tr>");
        var plateIdDiv = this._createElement("<td></td>").addClass("plate-setup-bottom-id");

        var numberText = this._createElement("<span/>");
        numberText.addClass("plate-setup-color-text");
        numberText.text(color);
        plateIdDiv.append(numberText);

        if (color > 0) {
          color = ((color - 1) % (this.colorPairs.length -1)) + 1;
        }
        var colorStops = this.colorPairs[color];

        plateIdDiv.css("background", "linear-gradient(to right, " + colorStops[0] + " , " + colorStops[1] + ")");

        row.append(plateIdDiv);

        for (var i = 0; i <  this.globalSelectedAttributes.length; i++) {
          var attr = this.globalSelectedAttributes[i]; 
          var text = this.tileAttrText(modelTile, attr); 
          var dataDiv = this._createElement("<td></td>").text(text);
          row.append(dataDiv);
        }

        this.bottomTable.append(row);
        this.adjustFieldWidth(row);
      },

      bottomForFirstTime: function() {
        this.addBottomTableHeadings();
        // This is executed for the very first time.. !
        var row = this._createElement("<tr></tr>");

        var colorStops = this.colorPairs[0];
        var plateIdDiv = this._createElement("<td></td>");
        plateIdDiv.css("background", "-webkit-linear-gradient(left, " + colorStops[0] + " , " + colorStops[1] + ")");
        row.append(plateIdDiv);
        this.bottomTable.append(row);
        this.createExportButton();
      },

      adjustFieldWidth: function(row) {

        var length = this.rowCounter;
        if ((length) * 150 > 1024) {
          row.css("width", (length) * 152 + "px");
        }
      },

      downloadCSV: function(csv, filename) {
      var csvFile;
      var downloadLink;

      // CSV file
      csvFile = new Blob([csv], {type: "text/csv"});

      // Download link
      downloadLink = document.createElement("a");

      // File name
      downloadLink.download = filename;

      // Create a link to the file
      downloadLink.href = window.URL.createObjectURL(csvFile);

      // Hide download link
      downloadLink.style.display = "none";

      // Add the link to DOM
      document.body.appendChild(downloadLink);

      // Click download link
      downloadLink.click();
    },

      exportData: function(format) {
      var data = [];
      var rows = document.querySelectorAll("table tr");
      var corToLocMap = $("#my-plate-layout").plateLayOut("createObject").colorToLoc;

      for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll("td, th");

        for (var j = 0; j < cols.length; j++) {
          var v = "";
          if (cols[j].innerText){
            if (format === "csv"){
              v = '"' + cols[j].innerText.replace(/"/g, '""') + '"';
            } else {
              v = cols[j].innerText;
            }
          }
          row.push(v);

          // add location column
          if (i === 0 && j === 0){
            if (format === "csv"){
              row.push ('"Location"');
            } else {
              row.push ("Location");
            }

          }
          if (i !== 0 && j === 0) {
            var loc = '';
            if (corToLocMap[parseInt(cols[j].innerText)]){
              if (format === "csv"){
                loc = '"' + corToLocMap[parseInt(cols[j].innerText)].join(",") + '"';
              } else {
                loc = corToLocMap[parseInt(cols[j].innerText)].join(",");
              }
            }
            row.push(loc);
          }
        }

        if (format === "csv"){
          data.push(row.join(","));
        } else {
          data.push(row.join("\t"));
          //data.push(row);   // for text type
        }

      }
      if (format === "csv"){
        // Download CSV file
        this.downloadCSV(data.join("\n"), 'table.csv');
      } else {
        //return formatTableToString(data);   // for text type
        return data.join("\n");
      }
    },

      createExportButton: function () {
        var that = this;
        var overlayContainer = $("<div>").addClass("plate-setup-bottom-control-container");

        var descriptionDiv = $("<div>").addClass("plate-setup-overlay-text-container");
        descriptionDiv.text("Bottom table control");
        overlayContainer.append(descriptionDiv);

        var buttonContainer = $("<div>").addClass("plate-setup-overlay-button-container");

        // create export csv option
        var exportButton = $("<button/>").addClass("plate-setup-button");
        exportButton.text("Export CSV");
        buttonContainer.append(exportButton);

        exportButton.click(function () {
          that.exportData('csv');
        });

        // ceat clipboard option, CLipboard is an external js file located in vendor/asset/javascripts
        new Clipboard('#copy-table-to-clipboard-button');
        var clipboard = new Clipboard('#copy-table-to-clipboard-button');
        clipboard.on('success', function(e) {
          console.info('Action:', e.action);
          console.info('Text:', e.text);
          console.info('Trigger:', e.trigger);
        });

        clipboard.on('error', function(e) {
          console.error('Action:', e.action);
          console.error('Trigger:', e.trigger);
        });

        var clipboardButton = $("<button/>").addClass("plate-setup-button").attr('id', 'copy-table-to-clipboard-button').attr('data-clipboard-text', that.exportData("clipboard"));

        clipboardButton.click(function() {
          var tableText = that.exportData("clipboard");
          clipboardButton.attr('data-clipboard-text', that.exportData("clipboard"));
        });

        clipboardButton.text("Copy To Clipboard");
        buttonContainer.append(clipboardButton);

        // other options
        var exportOtherButton = $("<button/>").addClass("plate-setup-button");
        exportOtherButton.text("Export Bottom Table");
        buttonContainer.append(exportOtherButton);

        overlayContainer.append(buttonContainer);
        $(".plate-setup-bottom-container").prepend(overlayContainer);
      }
    };
  }
})(jQuery, fabric);