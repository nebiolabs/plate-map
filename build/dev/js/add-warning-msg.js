var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.addWarningMsg = function() {
    // For those check boxes associated with every field in the tab
    return {
      fieldWarningMsg: function(field, text, include) {
        let that = this;
        let imgId = "fieldWarning" + field.full_id;
        let img = $("<span>").html(that._assets.warningImg).attr("id", imgId).addClass("plate-field-warning-image");
        if (include) {
          if (field.root.find("#" + imgId).length <= 0) {
            field.root.find(".plate-setup-tab-name").text(" " + field.name);
            field.root.find(".plate-setup-tab-name").prepend(img);

            let popText = $("<div/>").addClass("pop-out-text");
            popText.text(text);
            field.root.find(".plate-setup-tab-name").append(popText);

            $("#" + imgId).hover(function() {
              popText[0].style.display = 'flex';
            }, function() {
              popText.hide();
            });
          }


        } else {
          if (field.root.find("#" + imgId).length > 0) {
            field.root.find(".plate-setup-tab-name").text(field.name);
            $("#" + imgId).remove();
          }
        }
      },

      removeWarningMsg: function(field, text, include) {
        let that = this;
        let imgId = "fieldWarning" + field.full_id;
        if (include) {
          let img = $("<span>").html(that._assets.warningImg).attr("id", imgId).addClass("plate-field-warning-image");
          field.root.find(".plate-setup-tab-name").append(img);

          let popText = $("<div/>").addClass("pop-out-text");
          popText.text(text);
          field.root.find(".plate-setup-tab-name").append(popText);

          img.hover(function() {
            popText[0].style.display = 'inline-block';
          }, function() {
            popText.hide();
          });
        } else {
          $("#" + imgId).remove();
        }
      },

      applyFieldWarning: function(wells) {
        let that = this;
        let fieldData = {};
        that.fieldList.forEach(function(field) {
          fieldData[field.id] = [];
        });
        wells.forEach(function(well) {
          if (!that.engine.wellEmpty(well)) {
            for (let fieldId in fieldData) {
              if (fieldData.hasOwnProperty(fieldId)) {
                if (fieldId in well) {
                  fieldData[fieldId].push(well[fieldId]);
                } else {
                  fieldData[fieldId].push(null);
                }
              }
            }
          }
        });
        for (let i = 0; i < that.fieldList.length; i++) {
          let field = that.fieldList[i];
          if (field.applyMultiplexSubFieldColor) {
            field.applyMultiplexSubFieldColor(fieldData[field.id]);
          } else {
            if (field.required) {
              let include = false;
              fieldData[field.id].forEach(function(val) {
                // for multiselect
                if (val instanceof Array) {
                  if (val.length === 0) {
                    include = true;
                  }
                } else {
                  if (val === null) {
                    include = true;
                  }
                }
              });
              //field.root.find(".plate-setup-tab-name").css("background", color);
              that.fieldWarningMsg(field, "required field", include);
            }
          }
        }
      }
    }
  }
})(jQuery);