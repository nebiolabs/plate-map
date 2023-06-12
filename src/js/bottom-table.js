var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.bottomTable = function() {
    // for bottom table
    return {
      _bottomScreen: function() {
        this.bottomContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-container");
        this.bottomTableContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-table-container");
        this.bottomTable = this._createElement("<table></table>").addClass("plate-setup-bottom-table");
        this.bottomTableHead = this._createElement("<thead></thead>");
        this.bottomTableBody = this._createElement("<tbody></tbody>");
        this.bottomTable.append(this.bottomTableHead);
        this.bottomTable.append(this.bottomTableBody);
        this.bottomTableContainer.append(this.bottomTable);
        this.bottomContainer.append(this.bottomTableContainer);
        this.container.append(this.bottomContainer);
      },

      addBottomTableHeadings: function() {

        let row = this._createElement("<tr></tr>");

        let singleField = this._createElement("<th></th>")
          .text("Group");
        row.html(singleField);

        this.rowCounter = 1;

        for (let i = 0; i < this.globalSelectedAttributes.length; i++) {
          let attr = this.globalSelectedAttributes[i];
          let field = this.fieldMap[attr];
          let singleField = this._createElement("<th></th>").text(field.name);
          row.append(singleField);
          this.rowCounter = this.rowCounter + 1;
        }

        // Now we append all the captions at the place.
        this.bottomTableBody.empty();
        this.bottomTableHead.empty();
        this.bottomTableHead.append(row);
        this.adjustFieldWidth(row);
      },

      tileAttrText: function(tile, attr) {
        let well = this.engine.derivative[tile.index];
        let field = this.fieldMap[attr];
        return field.getText(well[attr]);
      },

      addBottomTableRow: function(color, singleStack) {
        let that = this;
        let modelTile = this.allTiles[singleStack[0]];
        let row = this._createElement("<tr></tr>");
        let plateIdDiv = this._createElement("<td></td>").addClass("plate-setup-bottom-id");
        let numberText = this._createElement("<button/>");
        numberText.addClass("plate-setup-color-text");
        numberText.text(color);
        plateIdDiv.append(numberText);

        numberText.click(function(evt) {
          let addressToSelect = singleStack.map(that.indexToAddress, that);
          if (evt.ctrlKey) {
            that.getSelectedAddresses().forEach(function(val) {
              if (addressToSelect.indexOf(val) < 0) {
                addressToSelect.push(val);
              }
            })
          }
          that.setSelectedAddresses(addressToSelect);
        });

        if (color > 0) {
          color = ((color - 1) % (this.colorPairs.length - 1)) + 1;
        }
        let colorStops = this.colorPairs[color];

        plateIdDiv.css("background", "linear-gradient(to right, " + colorStops[0] + " , " + colorStops[1] + ")");

        row.append(plateIdDiv);

        for (let i = 0; i < this.globalSelectedAttributes.length; i++) {
          let attr = this.globalSelectedAttributes[i];
          let text = this.tileAttrText(modelTile, attr);
          let dataDiv = this._createElement("<td></td>").text(text);
          row.append(dataDiv);
        }
        this.bottomTableBody.append(row);
        this.adjustFieldWidth(row);
      },

      bottomForFirstTime: function() {
        this.addBottomTableHeadings();
        // This is executed for the very first time.. !
        let row = this._createElement("<tr></tr>");

        let colorStops = this.colorPairs[0];
        let plateIdDiv = this._createElement("<td></td>");
        plateIdDiv.css("background", "-webkit-linear-gradient(left, " + colorStops[0] + " , " + colorStops[1] + ")");
        row.append(plateIdDiv);
        this.bottomTableBody.append(row);
        this.createExportButton();
      },

      adjustFieldWidth: function(row) {

        let length = this.rowCounter;
        if ((length) * 150 > 1024) {
          row.css("width", (length) * 152 + "px");
        }
      },

      downloadCSV: function(csv, filename) {
        let csvFile;
        let downloadLink;

        // CSV file
        csvFile = new Blob([csv], {
          type: "text/csv"
        });

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
        let data = [];
        let rows = document.querySelectorAll("table tr");

        let colorLocMap = {};
        let colorLocIdxMap = this.engine.stackUpWithColor;
        for (let colorIdx in colorLocIdxMap) {
          if (colorLocIdxMap.hasOwnProperty(colorIdx)) {
            colorLocMap[colorIdx] = colorLocIdxMap[colorIdx].map(this.indexToAddress, this);
          }
        }

        for (let i = 0; i < rows.length; i++) {
          let row = [],
            cols = rows[i].querySelectorAll("td, th");

          for (let j = 0; j < cols.length; j++) {
            let v = "";
            if (cols[j].innerText) {
              if (format === "csv") {
                v = '"' + cols[j].innerText.replace(/"/g, '""') + '"';
              } else {
                v = cols[j].innerText;
              }
            }
            row.push(v);

            // add location column
            if (i === 0 && j === 0) {
              if (format === "csv") {
                row.push('"Location"');
              } else if (format === 'clipboard') {
                row.push("Location");
              }

            }
            if (i !== 0 && j === 0) {
              let loc = '';
              if (colorLocMap[parseInt(cols[j].innerText)]) {
                if (format === "csv") {
                  loc = '"' + colorLocMap[parseInt(cols[j].innerText)].join(",") + '"';
                } else if (format === 'clipboard') {
                  loc = colorLocMap[parseInt(cols[j].innerText)].join(",");
                }
              }
              row.push(loc);
            }
          }

          if (format === "csv") {
            data.push(row.join(","));
          } else if (format === 'clipboard') {
            data.push(row.join("\t"));
            //data.push(row);   // for text type
          }

        }
        if (format === "csv") {
          // Download CSV file
          this.downloadCSV(data.join("\n"), 'table.csv');
        } else if (format === 'clipboard') {
          //return formatTableToString(data);   // for text type
          return data.join("\n");
        }
      },

      createExportButton: function() {
        let that = this;
        let overlayContainer = $("<div>").addClass("plate-setup-bottom-control-container");

        let descriptionDiv = $("<div>").addClass("plate-setup-overlay-text-container");
        descriptionDiv.text("Color groups");
        overlayContainer.append(descriptionDiv);

        let buttonContainer = $("<div>").addClass("plate-setup-overlay-bottom-button-container");

        // create export csv option
        let exportButton = $("<button/>").addClass("plate-setup-button");
        exportButton.text("Export CSV");
        buttonContainer.append(exportButton);

        exportButton.click(function() {
          that.exportData('csv');
          exportButton.text("Exported");
          exportButton[0].classList.remove("plate-setup-button");
          exportButton.addClass("plate-setup-clicked-button");
          setTimeout(resetExportText, 3000);
        });

        function resetExportText() {
          exportButton.text("Export CSV");
          exportButton[0].classList.remove("plate-setup-clicked-button");
          exportButton.addClass("plate-setup-button");
        }

        // creat clipboard option, CLipboard is an external js file located in vendor/asset/javascripts
        let clipboardButton = $("<button/>").addClass("plate-setup-button");
        clipboardButton.text("Copy To Clipboard");
        buttonContainer.append(clipboardButton);

        let clipboard = new ClipboardJS(clipboardButton.get(0), {
          text: function() {
            return that.exportData("clipboard");
          }
        });

        clipboard.on('success', function() {
          clipboardButton.text("Copied as tab-delimited format");
          clipboardButton[0].classList.remove("plate-setup-button");
          clipboardButton.addClass("plate-setup-clicked-button");
          setTimeout(resetClipboardText, 3000);
        });

        function resetClipboardText() {
          clipboardButton.text("Copy To Clipboard");
          clipboardButton[0].classList.remove("plate-setup-clicked-button");
          clipboardButton.addClass("plate-setup-button");
        }

        clipboard.on('error', function() {
          clipboardButton.text("Failed to copy table to clipboard: browser may be incompatible");
          setTimeout(resetClipboardText, 3000);
        });

        overlayContainer.append(buttonContainer);
        this.bottomContainer.prepend(overlayContainer);
      }
    };
  }
})(jQuery);