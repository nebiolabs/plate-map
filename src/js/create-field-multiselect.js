var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.createFieldMultiselect = function() {
    // Renders a multiselect (select2) field, plus its "manage/delete
    // selected values" dialog -- the delete-dialog trio below is only
    // ever invoked from this field type, never from multiplex.
    //
    // Internal storage is an array of selected option ids (or null when
    // empty). See create-field-core.js's "THE FIELD CONTRACT" docblock
    // for what disabled/parseValue/getValue/setValue/getText/parseText
    // mean; this field type also attaches _parseOne/_parseMany (single-
    // value/array validation helpers) and multiOnChange (the add/remove
    // event shape consumed by add-data-on-change.js's _getMultiData) as
    // extensions beyond the base contract.
    return {

      _createMultiSelectField: function(field) {
        let full_id = field.full_id;
        let that = this;
        let input = this._createElement("<select/>").attr("id", full_id)
          .addClass("plate-setup-tab-multiselect-field");
        input.attr("multiple", "multiple");

        field.root.find(".plate-setup-tab-field-container").append(input);

        let opts = that._createOpts(field.data);
        opts.multiple = true;
        let optMap = {};
        opts.data.forEach(function(opt) {
          optMap[String(opt.id)] = opt;
        });
        input.select2(opts);
        that.select2fix(input);

        field.disabled = function(bool) {
          bool = field.isDisabled || bool;
          input.prop("disabled", bool);
          return bool;
        };

        field._parseOne = function(val) {
          val = String(val);
          if (val in optMap) {
            return optMap[val].id;
          } else {
            throw "Invalid value " + val + " for multiselect field " + full_id;
          }
        };

        field._parseMany = function(vals) {
          if (vals && vals.length) {
            vals = vals.map(field._parseOne, this);
          } else {
            vals = null;
          }
          return vals;
        };

        field.parseValue = function(value) {
          return field._parseMany(value);
        };

        field.getValue = function() {
          return field._parseMany(input.val());
        };

        field.setValue = function(v) {
          v = v || [];
          input.val(v);
          input.trigger("change.select2");
        };

        field.getText = function(v) {
          if (v == null) {
            return "";
          }
          if (v.length > 0) {
            return v.map(v => optMap[String(v)].text).join("; ");
          }
          return "";
        };

        field.multiOnChange = function(added, removed) {
          if (added) {
            added = added.id;
          }
          if (removed) {
            removed = removed.id;
          }
          let data = {};
          data[field.id] = {
            multi: true,
            added: added,
            removed: removed
          };
          that._addAllData(data);
        };

        field.parseText = function(value) {
          let v = value;
          if (v && v.length) {
            v = v.map(function(opt) {
              opt = String(opt);
              if (opt in optMap) {
                return optMap[opt].text;
              } else {
                throw "Invalid text value " + opt + " for multiselect field " + full_id;
              }
            });
          } else {
            v = null;
          }
          return v;
        };

        input.on("select2:select", function (e) {
          let v = field._parseOne(e.params.data.id);
          v = {id: v};
          field.multiOnChange(v, null);
        });

        input.on("select2:unselect", function (e) {
          let v = field._parseOne(e.params.data.id);
          v = {id: v};
          field.multiOnChange(null, v);
        });

        field.input = input;

        that._createDeleteButton(field);
      },

      // Opens the "manage/delete selected values" dialog: a table
      // listing every currently-selected option across the selection
      // (with per-option well counts, via field.allSelectedMultipleVal
      // -- see svg-events.js's _getAllMultipleVal) and checkboxes to
      // bulk-remove options from every selected well at once. Outside-
      // click-to-close is wired via addEventListener/removeEventListener
      // (not the single global window.onclick slot -- see the inline
      // comment on outsideDialogClickHandler for why that distinction
      // matters with multiple widget instances on one page).
      _deleteDialog: function(field) {
        let that = this;

        let valMap = field.allSelectedMultipleVal;
        let valToRemove;
        if (valMap) {
          valToRemove = Object.keys(valMap);
        } else {
          valToRemove = [];
        }


        let dialogDiv = $("<div/>").addClass("plate-modal");
        this.container.append(dialogDiv);

        function killDialog() {
          dialogDiv.hide();
          dialogDiv.remove();
          // Paired with the addEventListener below -- see the comment there
          // for why this can't just be `window.onclick = ...`.
          window.removeEventListener("click", outsideDialogClickHandler);
        }

        // Named (not the old `window.onclick = function(event) {...}`) so it
        // can be added/removed via addEventListener/removeEventListener
        // instead of clobbering the single global window.onclick slot. With
        // two widget instances on a page, whichever one's dialog opened most
        // recently used to silently steal the outside-click-to-close
        // behavior from the other's still-open dialog. See
        // REFACTOR_NOTES.md §10.4 #5.
        function outsideDialogClickHandler(event) {
          if (event.target === dialogDiv[0]) {
            killDialog();
          }
        }

        let dialogContent = $("<div/>").addClass("plate-modal-content").css('width', '550px').appendTo(dialogDiv);
        let tableArea = $("<div/>").appendTo(dialogContent);
        let buttonRow = $("<div/>").addClass("dialog-buttons").css("justify-content", "flex-end").appendTo(dialogContent);

        if (valToRemove.length > 0) {
          // apply CSS property for table
          $("<p/>").text(field.name + " in selected wells: choose items to delete and click the delete button below").appendTo(tableArea);

          let table = that._deleteDialogTable(field, valMap);
          table.appendTo(tableArea);
          table.addClass("plate-popout-table");
          table.find('td').addClass("plate-popout-td");
          table.find('th').addClass("plate-popout-th");
          table.find('tr').addClass("plate-popout-tr");
          if (!that.readOnly) {
            let deleteCheckedButton = $("<button class='multiple-field-manage-delete-button'>Delete Checked Items</button>");
            buttonRow.append(deleteCheckedButton);
            deleteCheckedButton.click(function() {
              table.find("input:checked").each(function() {
                let val = this.value;
                field.multiOnChange(null, {id: val});
              });
              // refresh selected fields after updating the multiplex field value
              that.decideSelectedFields();
              killDialog();
            });
          }

        } else {
          $("<p/>").text("No " + field.name + " in the selected wells").appendTo(tableArea);
        }

        let cancelButton = $("<button>Cancel</button>");
        buttonRow.append(cancelButton);
        cancelButton.click(killDialog);

        dialogDiv.show();

        window.addEventListener("click", outsideDialogClickHandler);
      },

      // Builds the table shown inside _deleteDialog above: one row per
      // currently-selected option, with its display text, well count,
      // and (unless read-only) a checkbox to mark it for deletion.
      _deleteDialogTable: function(field, valMap) {
        let that = this;
        let colName = [field.name, "Counts"]; //Added because it was missing... no idea what the original should have been
        if (!that.readOnly) {
          colName.push("Delete");
        }
        let table = $('<table/>');
        let thead = $('<thead/>').appendTo(table);
        let tr = $('<tr/>').appendTo(thead);

        tr.append(colName.map(function(text) {
          return $('<th/>').text(text);
        }));

        let tbody = $("<tbody/>").appendTo(table);

        field.data.options.forEach(function(opt) {
          if (opt.id in valMap) {
            let tr = $('<tr/>').appendTo(tbody);
            let checkbox = $("<input type='checkbox'>").prop("value", opt.id);
            $("<td/>").text(opt.text).appendTo(tr);
            $("<td/>").text(valMap[opt.id]).appendTo(tr);
            if (!that.readOnly) {
              $("<td/>").append(checkbox).appendTo(tr);
            }
          }
        });

        return table;
      },

      // Adds the "Manage <field name>..." button that opens _deleteDialog.
      _createDeleteButton: function(field) {
        let that = this;
        let deleteButton = $("<button/>").addClass("plate-setup-remove-all-button");
        deleteButton.id = field.id + "Delete";
        deleteButton.text("Manage " + field.name + "...");
        let buttonContainer = that._createElement("<div></div>").addClass("plate-setup-remove-all-button-container");
        buttonContainer.append(deleteButton);

        field.deleteButton = deleteButton;
        field.root.find(".plate-setup-tab-field-right-side").append(buttonContainer);

        deleteButton.click(function() {
          that._deleteDialog(field);
        });
      }

    };
  }

})(jQuery);
