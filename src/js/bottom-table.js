var plateMapWidget = plateMapWidget || {};

(function ($) {
  /**
   * The bottom table: one row per color/group (built by engine.js's
   * applyColors, one addBottomTableRow call per group), showing the
   * group's swatch color, the checked fields' shared values, and a
   * clickable group-number button that selects every well in that
   * group. Also owns the CSV/clipboard export feature at the bottom of
   * the table.
   */
  plateMapWidget.bottomTable = function () {
    // for bottom table
    return {
      // Builds the bottom table's static DOM skeleton (container/table/
      // thead/tbody) -- called once from interface.js's _createInterface.
      _bottomScreen: function () {
        this.bottomContainer = this._createElement("<div></div>").addClass(
          "plate-setup-bottom-container",
        );
        this.bottomTableContainer = this._createElement("<div></div>").addClass(
          "plate-setup-bottom-table-container",
        );
        this.bottomTable = this._createElement("<table></table>").addClass(
          "plate-setup-bottom-table",
        );
        this.bottomTableHead = this._createElement("<thead></thead>");
        this.bottomTableBody = this._createElement("<tbody></tbody>");
        this.bottomTable.append(this.bottomTableHead);
        this.bottomTable.append(this.bottomTableBody);
        this.bottomTableContainer.append(this.bottomTable);
        this.bottomContainer.append(this.bottomTableContainer);
        this.container.append(this.bottomContainer);
      },

      // Rebuilds the table header row (one column per checked field,
      // plus "Group"), and clears the table body -- called at the start
      // of every applyColors run (engine.js) since the checked-field set
      // may have changed since the last render.
      addBottomTableHeadings: function () {
        let row = this._createElement("<tr></tr>");

        let singleField = this._createElement("<th></th>").text("Group");
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

      // Returns one well's display text for a given checked field --
      // used to fill in each bottom-table row's data columns.
      tileAttrText: function (tile, attr) {
        let well = this.engine.derivative[tile.index];
        let field = this.fieldMap[attr];
        return field.getText(well[attr]);
      },

      // Renders one bottom-table row for a single color/group: the
      // swatch (color-manager.js's _wrapColorIndex-wrapped gradient --
      // same wraparound period as svg-create.js's setTileColor, kept in
      // sync via that shared helper), the clickable group-number button
      // (click selects every well in singleStack; Ctrl-click extends
      // the current selection instead of replacing it), and one data
      // column per checked field showing that group's shared value.
      addBottomTableRow: function (color, singleStack) {
        let that = this;
        let modelTile = this.allTiles[singleStack[0]];
        let row = this._createElement("<tr></tr>");
        let plateIdDiv = this._createElement("<td></td>").addClass(
          "plate-setup-bottom-id",
        );
        let numberText = this._createElement("<button/>");
        numberText.addClass("plate-setup-color-text");
        numberText.text(color);
        plateIdDiv.append(numberText);

        numberText.click(function (evt) {
          // Arrow wrapper, not a bare `that.indexToAddress` reference: .map()
          // invokes its callback as (element, index, array), so a bare
          // method reference would receive the array index as
          // indexToAddress's `dimensions` parameter for every element past
          // the first. See REFACTOR_NOTES.md §6 #1 / #10.
          let addressToSelect = singleStack.map(index => that.indexToAddress(index));
          if (evt.ctrlKey) {
            that.getSelectedAddresses().forEach(function (val) {
              if (addressToSelect.indexOf(val) < 0) {
                addressToSelect.push(val);
              }
            });
          }
          that.setSelectedAddresses(addressToSelect);
        });

        color = this._wrapColorIndex(color);
        let colorStops = this.colorPairs[color];

        plateIdDiv.css(
          "background",
          "linear-gradient(to right, " +
            colorStops[0] +
            " , " +
            colorStops[1] +
            ")",
        );

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

      // Renders the initial placeholder bottom-table row (the group-0
      // "no data" gray swatch, colorPairs[0]) before any real data/
      // grouping has happened -- called once from interface.js's
      // _createInterface, before the first real applyColors run. Also
      // appends the export-buttons row (createExportButton).
      bottomForFirstTime: function () {
        this.addBottomTableHeadings();
        // This is executed for the very first time.. !
        let row = this._createElement("<tr></tr>");

        let colorStops = this.colorPairs[0];
        let plateIdDiv = this._createElement("<td></td>");
        plateIdDiv.css(
          "background",
          "-webkit-linear-gradient(left, " +
            colorStops[0] +
            " , " +
            colorStops[1] +
            ")",
        );
        row.append(plateIdDiv);
        this.bottomTableBody.append(row);
        this.createExportButton();
      },

      // Widens a row if there are enough checked-field columns to
      // overflow the table's default width (a simple horizontal-scroll
      // accommodation, not a full responsive layout).
      adjustFieldWidth: function (row) {
        let length = this.rowCounter;
        if (length * 150 > 1024) {
          row.css("width", length * 152 + "px");
        }
      },

      // Triggers a browser file download of `csv` content as `filename`
      // via a throwaway <a> element -- the actual mechanics behind the
      // "Export CSV" button (createExportButton/exportData below).
      downloadCSV: function (csv, filename) {
        let csvFile;
        let downloadLink;

        // CSV file
        csvFile = new Blob([csv], {
          type: "text/csv",
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

      // Scrapes the currently-rendered bottom table's DOM into either a
      // CSV string (triggers a download via downloadCSV) or a
      // tab-delimited string (returned, for the clipboard button to
      // copy). Adds a synthesized "Location" column (the well addresses
      // for each group, from this.engine.stackUpWithColor) not present
      // in the rendered table itself.
      exportData: function (format) {
        let data = [];
        // Scoped to this widget's own bottom table -- NOT a page-wide
        // document.querySelectorAll("table tr"), which picked up every
        // <table> on the whole page (any other widget instance's bottom
        // table included) and silently mixed their rows into this export.
        // See REFACTOR_NOTES.md §6 #11.
        let rows = this.bottomTable[0].querySelectorAll("tr");

        let colorLocMap = {};
        let colorLocIdxMap = this.engine.stackUpWithColor;
        for (let colorIdx in colorLocIdxMap) {
          if (colorLocIdxMap.hasOwnProperty(colorIdx)) {
            // Arrow wrapper, not a bare `this.indexToAddress` reference --
            // see the identical fix/comment in addBottomTableRow above.
            colorLocMap[colorIdx] = colorLocIdxMap[colorIdx].map(
              index => this.indexToAddress(index),
            );
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
              } else if (format === "clipboard") {
                row.push("Location");
              }
            }
            if (i !== 0 && j === 0) {
              let loc = "";
              if (colorLocMap[parseInt(cols[j].innerText)]) {
                if (format === "csv") {
                  loc =
                    '"' +
                    colorLocMap[parseInt(cols[j].innerText)].join(",") +
                    '"';
                } else if (format === "clipboard") {
                  loc = colorLocMap[parseInt(cols[j].innerText)].join(",");
                }
              }
              row.push(loc);
            }
          }

          if (format === "csv") {
            data.push(row.join(","));
          } else if (format === "clipboard") {
            data.push(row.join("\t"));
            //data.push(row);   // for text type
          }
        }
        if (format === "csv") {
          // Download CSV file
          this.downloadCSV(data.join("\n"), "table.csv");
        } else if (format === "clipboard") {
          //return formatTableToString(data);   // for text type
          return data.join("\n");
        }
      },

      // Builds the "Color groups" / "Export CSV" / "Copy To Clipboard"
      // control row shown just above the bottom table (ClipboardJS is
      // the external vendored clipboard library -- see README's "Include
      // dependencies").
      createExportButton: function () {
        let that = this;
        let overlayContainer = $("<div>").addClass(
          "plate-setup-bottom-control-container",
        );

        let descriptionDiv = $("<div>").addClass(
          "plate-setup-overlay-text-container",
        );
        descriptionDiv.text("Color groups");
        overlayContainer.append(descriptionDiv);

        let buttonContainer = $("<div>").addClass(
          "plate-setup-overlay-bottom-button-container",
        );

        // create export csv option
        let exportButton = $("<button/>").addClass("plate-setup-button");
        exportButton.text("Export CSV");
        buttonContainer.append(exportButton);

        exportButton.click(function () {
          that.exportData("csv");
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
          text: function () {
            return that.exportData("clipboard");
          },
        });

        clipboard.on("success", function () {
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

        clipboard.on("error", function () {
          clipboardButton.text(
            "Failed to copy table to clipboard: browser may be incompatible",
          );
          setTimeout(resetClipboardText, 3000);
        });

        overlayContainer.append(buttonContainer);
        this.bottomContainer.prepend(overlayContainer);
      },
    };
  };
})(jQuery);
