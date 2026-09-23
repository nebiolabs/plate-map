var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.createFieldMultiplex = function() {
    // Renders a multiplex field: builds on _createMultiSelectField
    // (this._createMultiSelectField(field), from create-field-multiselect.js)
    // plus a single-select "select to edit" sub-panel for per-entry
    // subfield values.
    //
    // Internal storage (field.detailData / getValue's return shape) is
    // an array of entries: [{[field.id]: optionId, subFieldId1: val1,
    // subFieldId2: val2, ...}, ...] -- one entry per selected option,
    // each carrying its own independent subfield values. The
    // multiselect widget underneath tracks which OPTIONS are selected;
    // this file layers per-entry subfield editing on top via the
    // "Select to edit" single-select (only one entry's subfields are
    // visible/editable at a time) plus a "[N well <field>]" combined
    // pseudo-option (id '[ALL]') for editing a subfield across every
    // selected well's shared entries at once.
    //
    // Cross-file API names that MUST stay stable (reached by name from
    // add-tab-data.js's per-subfield onChange handlers and engine.js's
    // checkCompletion -- see REFACTOR_NOTES.md §10.4): singleSelectValue,
    // _changeMultiFieldValue, checkMultiplexCompletion,
    // applyMultiplexSubFieldColor.
    return {

      _createMultiplexField: function(field) {
        let that = this;
        // make correct multiplex data
        this._createMultiSelectField(field);

        // single select
        let nameContainer1 = this._createElement("<div></div>").addClass("plate-setup-tab-name-singleSelect").text("Select to edit");
        let fieldContainer1 = this._createElement("<div></div>").addClass("plate-setup-tab-field-container-singleSelect");
        field.root.find(".plate-setup-tab-field-right-side").append(nameContainer1, fieldContainer1);

        field.singleSelect = this._createElement("<select/>").attr("id", field.full_id + "SingleSelect")
          .addClass("plate-setup-tab-multiplex-single-select-field");

        field.singleSelect.appendTo(fieldContainer1);
        let opts = {
          allowClear: false,
          placeholder: "select",
          minimumResultsForSearch: 10,
          data: []
        };
        field.singleSelect.select2(opts);
        that.select2fix(field.singleSelect);

        let multiselectSetValue = field.setValue;

        // Returns the currently-selected entry's option id from the
        // "Select to edit" single-select -- or the '[ALL]' sentinel if
        // the combined pseudo-option is selected. Reached by name from
        // add-tab-data.js's per-subfield onChange handler; must keep
        // this exact name.
        field.singleSelectValue = function() {
          let v = field.singleSelect.val();
          if (v === "") {
            return null;
          }
          if (v == null) {
            return null;
          }
          if (v == '[ALL]') {
            return v;
          }
          return field._parseOne(v)
        };

        let setSingleSelectOptions = function(data, selected) {
          data = data || [];

          if (field.allSelectedMultipleVal) {
            const count = Object.values(field.allSelectedMultipleVal).reduce(function (a, b) {return a + b}, 0);
            if (count) {
              const all_option = {
                id: '[ALL]',
                text: `[${count} well ${field.data.name}]`,
                forAll: true
              }
              data = [all_option].concat(data);
            }
          }

          if (!selected) {
            if (data.length) {
              selected = data[0].id;
            } else {
              selected = null;
            }
          }
          that.select2setData(field.singleSelect, data, selected);
          field.singleSelect.prop("disabled", data.length === 0);
          field.singleSelect.trigger("change.select2");
        };

        let singleSelectChange = function() {
          let v = field.singleSelectValue();

          field.updateSubFieldUnitOpts(v);

          let curSubField = null;
          if (v === '[ALL]') {
            curSubField = field.allSelectedMultipleData;
          } else {
            let curData = field.detailData || [];
            curData.forEach(function(val) {
              if (val[field.id] === v) {
                curSubField = val;
              }
            });
          }

          if (curSubField) {
            // setvalue for subfield
            field.subFieldList.forEach(function(subField) {
              subField.isDisabled = false;
              subField.setValue(curSubField[subField.id]);
            });
          } else {
            field.subFieldList.forEach(function(subField) {
              subField.isDisabled = true;
              subField.setValue(null);
            });
          }
          that.readOnlyHandler();
        };

        setSingleSelectOptions([]);
        field.singleSelect.on("change.select2", singleSelectChange);

        // Normalizes a subfield-originated add/remove event (`added`/
        // `removed`: either a bare option id or {id, value}) into the
        // full-entry {id, value} shape expected by field.multiOnChange
        // below, then delegates to it. Called from add-tab-data.js's
        // per-subfield onChange handler -- must keep this exact name.
        field._changeMultiFieldValue = function(added, removed) {
          let newSubFieldValue = {};
          for (let i = 0; i < field.subFieldList.length; i++) {
            let subFieldId = field.subFieldList[i].id;
            newSubFieldValue[subFieldId] = null;
          }

          let val;
          if (added) {
            if (added.value) {
              val = added.value;
            } else {
              newSubFieldValue[field.id] = added.id;
              val = newSubFieldValue;
            }
            added = {
              id: added.id,
              value: val
            };
          }

          if (removed) {
            if (removed.value) {
              val = removed.value;
            } else {
              newSubFieldValue[field.id] = removed.id;
              val = newSubFieldValue;
            }
            removed = {
              id: removed.id,
              value: val
            };
          }

          let data = {};
          data[field.id] = {
            multi: true,
            added: added,
            removed: removed
          };
          that._addAllData(data);
        };

        // Overrides the plain multiselect setValue (saved above as
        // multiselectSetValue) to also populate the "Select to edit"
        // panel: stores the full entry array (field.detailData),
        // updates the underlying multiselect's selected options from
        // just the entries' own field.id values, then refreshes the
        // single-select's own options/subfield display.
        field.setValue = function(v) {
          // used to keep track of initially loaded multiplex data
          field.detailData = v;
          let multiselectValues = null;
          if (v && v.length) {
            multiselectValues = v.map(val => val[field.id]);
          }

          multiselectSetValue(multiselectValues);
          let newOptions = field.input.select2('data') || [];
          setSingleSelectOptions(newOptions, field.singleSelectValue());
          singleSelectChange();
        };

        // Overrides multiselect's plain disabled to also disable every
        // subfield and swap the "Select to edit"/"Select to inspect"
        // label depending on state.
        field.disabled = function(bool) {
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          field.subFieldList.forEach(function(subField) {
            subField.disabled(bool);
          });
          if (bool) {
            nameContainer1.text("Select to inspect");
          } else {
            nameContainer1.text("Select to edit");
          }
          return bool;
        };

        // Recursively parses every entry's subfield values through each
        // subfield's own parseValue -- the field-contract entry point
        // for validating/normalizing external multiplex data (e.g. from
        // loadPlate).
        field.parseValue = function(value) {
          let v = value;
          if (v && v.length) {
            v = v.map(function(opt) {
              let valMap = {};
              valMap[field.id] = opt[field.id];
              for (let subFieldId in opt) {
                if (opt.hasOwnProperty(subFieldId)) {
                  field.subFieldList.forEach(function(subField) {
                    if (subField.id === subFieldId) {
                      valMap[subField.id] = subField.parseValue(opt[subFieldId]);
                    }
                  });
                }
              }
              return valMap;
            });
          } else {
            v = null;
          }
          return v;
        };

        // Re-applies the per-OPTION unit configuration (data.options[].
        // unitOptions) to every subfield that has hasMultiplexUnit set --
        // called whenever the selected entry's option changes, since
        // different options can offer different unit choices for the
        // same subfield.
        field.updateSubFieldUnitOpts = function(val) {
          let curOpts;
          field.data.options.forEach(function(opt) {
            if (opt.id === val) {
              curOpts = opt;
            }
          });
          field.subFieldList.forEach(function(subField) {
            if (subField.data.hasMultiplexUnit) {
              if (curOpts && curOpts.hasOwnProperty("unitOptions")) {
                subField.setUnitOpts(curOpts.unitOptions[subField.id]);
              } else {
                subField.setUnitOpts(null);
              }
            }
          })
        };

        // Overrides multiselect's plain multiOnChange: after the
        // underlying multiselect updates, rebuilds field.detailData's
        // full entry array to match (creating a fresh entry with
        // default/blank subfield values for a newly-added option,
        // preserving existing entries otherwise) and refreshes the
        // "Select to edit" panel to show the just-added/most-relevant
        // entry.
        field.multiOnChange = function(added, removed) {
          field._changeMultiFieldValue(added, removed);
          let v = field.getValue();
          let curData = field.detailData;
          let curIds = [];
          let curOpt = null;
          //reshape data for saveback
          if (curData) {
            curIds = curData.map(val => val[field.id]);
          }

          let newMultiplexVal = [];
          let selectList = [];
          if (v) {
            v.forEach(function(selectedVal) {
              if (curData) {
                curData.forEach(function(val) {
                  if (val[field.id] === selectedVal) {
                    newMultiplexVal.push(val)
                  }
                });
              }
              // cases when adding new data
              if (curIds.indexOf(selectedVal) < 0) {
                let newVal = {};
                newVal[field.id] = selectedVal;

                field.updateSubFieldUnitOpts(selectedVal);
                field.subFieldList.forEach(function(subfield) {
                  // special handling for subfield which has multiplexUnit
                  if (subfield.hasUnits) {
                    if (subfield.data.hasMultiplexUnit) {
                      subfield.disabled(false);
                      field.data.options.forEach(function(opt) {
                        if (opt.id === selectedVal) {
                          let val = {
                            value: null,
                            unit: subfield.units[0]
                          };
                          newVal[subfield.id] = subfield.parseValue(val);
                        }
                      });
                    } else {
                      if (subfield.data.units) {
                        if (subfield.data.units.length > 1) {
                          subfield.disabled(false);
                        }
                      }
                      let val = {
                        value: null,
                        unit: subfield.defaultUnit
                      };
                      newVal[subfield.id] = subfield.parseValue(val);
                    }
                  } else {
                    newVal[subfield.id] = subfield.parseValue(null);
                  }
                });
                newMultiplexVal.push(newVal);
              }
            });

            // make data for single select options
            v.forEach(function(selectVal) {
              field.data.options.forEach(function(opt) {
                if (opt.id === selectVal) {
                  selectList.push(opt);
                }
              });
            });

            let selected = field.singleSelectValue();
            for (let i = 0; i < v.length; i++) {
              if (added && (added.id === v[i])) {
                curOpt = v[i];
                break;
              } else if (i === 0) {
                curOpt = v[i];
              } else if (v[i] === selected) {
                curOpt = v[i];
              }
            }
          }

          field.detailData = newMultiplexVal;
          setSingleSelectOptions(selectList, curOpt);
          singleSelectChange();
        };

        // Renders each entry as "{option text, checked-subfield: value,
        // ...}", joined by ";" -- only includes subfields that are
        // themselves currently checked (that.globalSelectedMultiplexSubfield,
        // check-box.js), so the display text reflects exactly the
        // grouping criteria in use, not every subfield unconditionally.
        field.getText = function(v) {
          if (v === null) {
            return "";
          }
          // get subfields that is selected from the checkbox
          if (field.id in that.globalSelectedMultiplexSubfield) {
            let checkedSubfields = that.globalSelectedMultiplexSubfield[field.id];
            let returnVal = [];
            for (let valIdx in v) {
              if (!v.hasOwnProperty(valIdx)) {
                continue;
              }
              let subV = v[valIdx];
              let subText = [];
              for (let optId in field.data.options) {
                if (field.data.options.hasOwnProperty(optId)) {
                  let opt = field.data.options[optId];
                  if (opt.id === subV[field.id]) {
                    subText.push(opt.text);
                  }
                }
              }
              field.subFieldList.forEach(function(subField) {
                if (checkedSubfields.indexOf(subField.id) >= 0) {
                  let x = subField.getText(subV[subField.id]);
                  subText.push(subField.name + ": " + x);
                }
              });
              returnVal.push("{" + subText.join(", ") + "}");
            }
            return returnVal.join(";");
          }
        };

        // Similar to getText above, but includes EVERY subfield with a
        // non-empty value (not gated on the checked/grouping state), and
        // returns an array-of-arrays rather than a joined string --
        // used by plate-map.js's getTextDerivative.
        field.parseText = function(v) {
          if (v === null) {
            return "";
          } else {
            let returnVal = [];
            for (let valIdx in v) {
              if (!v.hasOwnProperty(valIdx)) {
                continue;
              }
              let subV = v[valIdx];
              let subText = [];
              for (let optId in field.data.options) {
                if (field.data.options.hasOwnProperty(optId)) {
                  let opt = field.data.options[optId];
                  if (opt.id === subV[field.id]) {
                    subText.push(opt.text);
                  }
                }
              }
              field.subFieldList.forEach(function(subField) {
                let x = subField.getText(subV[subField.id]);
                if (x) {
                  subText.push(x);
                }
              });
              returnVal.push(subText);
            }
            return returnVal;
          }
        };

        // Called from engine.js's checkCompletion instead of the base
        // required/filled check, since a multiplex field's completion
        // is an average across every entry's required-subfield fill
        // rate, not a single required/filled boolean. Reached by name
        // from engine.js (field.checkMultiplexCompletion truthy check)
        // -- must keep this exact name.
        field.checkMultiplexCompletion = function(valList) {
          let valCount = 0;
          let completionPct = 0;
          let include = false;

          function getSubfieldStatus(vals) {
            let req = 0;
            let fill = 0;
            for (let subFieldId in field.subFieldList) {
              if (!field.subFieldList.hasOwnProperty(subFieldId)) {
                continue;
              }
              let subField = field.subFieldList[subFieldId];
              let curVal = vals[subField.id];
              if (subField.required) {
                include = true;
                req++;
                if (typeof curVal === 'object' && curVal) {
                  if (curVal.value) {
                    fill++;
                  }
                } else if (curVal) {
                  fill++;
                }
              }
            }
            return fill / req;
          }

          // for cases has value in multiplex field
          if (valList) {
            if (valList.length > 0) {
              for (let idx in valList) {
                if (valList.hasOwnProperty(idx)) {
                  valCount++;
                  let vals = valList[idx];
                  completionPct += getSubfieldStatus(vals);
                }
              }
            } else if (field.required) {
              include = true;
              valCount = 1;
            }
          } else if (field.required) {
            include = true;
            valCount = 1;
          }

          return {
            include: include,
            completionPct: completionPct / valCount
          };
        };

        // Called from add-warning-msg.js's applyFieldWarning INSTEAD OF
        // fieldWarningMsg directly (multiplex fields are detected there
        // via `if (field.applyMultiplexSubFieldColor)`), since a
        // multiplex field's warning state is per-subfield across
        // potentially many entries, not a single scalar required-field
        // check. Reached by name -- must keep this exact name. Despite
        // the name, this sets WARNING state (via fieldWarningMsg), not
        // color -- name is historical/stale but load-bearing, not worth
        // renaming without also updating every reference.
        // valList contains all of the vals for selected val
        field.applyMultiplexSubFieldColor = function(valList) {
          function updateSubFieldWarningMap(vals) {
            for (let subFieldId in field.subFieldList) {
              if (!field.subFieldList.hasOwnProperty(subFieldId)) {
                continue;
              }
              let subField = field.subFieldList[subFieldId];
              // loop through each well's multiplexval list
              if (vals === null) {
                if (field.required && subField.required) {
                  subFieldWarningMap[subField.id].warningStatus.push(true);
                }
              } else if (typeof (vals) === "object") {
                if (vals.length === 0) {
                  if (field.required && subField.required) {
                    subFieldWarningMap[subField.id].warningStatus.push(true);
                  }
                } else {
                  for (let multiplexIdx in vals) {
                    if (!vals.hasOwnProperty(multiplexIdx)) {
                      continue;
                    }
                    let curVal = vals[multiplexIdx][subField.id];
                    if (subField.required) {
                      if (typeof (curVal) === 'object' && curVal) {
                        if (!curVal.value) {
                          subFieldWarningMap[subField.id].warningStatus.push(true);
                        } else {
                          subFieldWarningMap[subField.id].warningStatus.push(false);
                        }
                      } else if (!curVal) {
                        subFieldWarningMap[subField.id].warningStatus.push(true);
                      } else {
                        subFieldWarningMap[subField.id].warningStatus.push(false);
                      }
                    }
                  }
                }
              }
            }
          }

          let subFieldWarningMap = {};
          field.subFieldList.forEach(function(subField) {
            if (subField.required) {
              subFieldWarningMap[subField.id] = {
                field: subField,
                warningStatus: []
              };
            }
          });

          valList.forEach(function(multiplexVals) {
            updateSubFieldWarningMap(multiplexVals);
          });
          // turn off main field when all subfield are filled

          let mainFieldStatus = [];
          for (let subFieldId in subFieldWarningMap) {
            if (!subFieldWarningMap.hasOwnProperty(subFieldId)) {
              continue;
            }
            let subField = subFieldWarningMap[subFieldId].field;
            if (subFieldWarningMap[subFieldId].warningStatus.indexOf(true) >= 0) {
              let text = subField.name + " is a required subfield for " + field.name + ", please make sure all " + field.name + " have " + subField.name;
              if (field.required) {
                that.fieldWarningMsg(subField, text, true);
                mainFieldStatus.push(true);
              } else {
                that.fieldWarningMsg(subField, text, true);
                mainFieldStatus.push(true);
              }
            } else {
              that.fieldWarningMsg(subField, "none", false);
              mainFieldStatus.push(false);
            }
          }
          let mainFieldWarning = mainFieldStatus.indexOf(true) >= 0;
          let warningText;
          if (field.required) {
            warningText = field.name + " is a required field, please also fix missing required subfield(s) below";
          } else {
            warningText = field.name + " is not a required field, please fix missing required subfield(s) below or remove selected " + field.name;
          }
          that.fieldWarningMsg(field, warningText, mainFieldWarning);
        };
      },

    };
  }

})(jQuery);
