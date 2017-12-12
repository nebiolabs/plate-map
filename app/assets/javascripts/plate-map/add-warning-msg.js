var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addWarningMsg = function () {
    // For those check boxes associated with every field in the tab
    return {
      fieldWarningMsg: function (field, text, include) {
        var that = this;
        var imgId = "fieldWarning" + field.id;
        var img = $("<img>").attr("src", that._assets.warningImg).attr("id", imgId).addClass("plate-field-warning-image");
        //field.root.find(".plate-setup-tab-name").append('<img id="theImg" src="theImg.png" />')
        if (include) {
          if (field.root.find("#" + imgId).length <= 0){
            field.root.find(".plate-setup-tab-name").text(" " + field.name);
            field.root.find(".plate-setup-tab-name").prepend(img);

            var popText = $("<div/>").addClass("pop-out-text");
            popText.text(text);
            field.root.find(".plate-setup-tab-name").append(popText);

            $("#" + imgId).hover(function (e) {
              popText[0].style.display = 'inherit';
            }, function () {
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

      removeWarningMsg: function (field, text, include) {
        var that = this;
        var imgId = "fieldWarning" + field.id;
        var img = $("<img>").attr("src", that._assets.warningImg).attr("id", imgId).addClass("plate-field-warning-image");
        //field.root.find(".plate-setup-tab-name").append('<img id="theImg" src="theImg.png" />')
        if (include) {
          field.root.find(".plate-setup-tab-name").append(img);

          var popText = $("<div/>").addClass("pop-out-text");
          popText.text(text);
          field.root.find(".plate-setup-tab-name").append(popText);

          $("#" + imgId).hover(function (e) {
            popText[0].style.display = 'inline-block';
          }, function () {
            popText.hide();
          });

        } else {
          $("#" + imgId).remove();
          if (field.root.find("#" + imgId).length > 0) {
            //field.root.find(".plate-setup-tab-name").remove(img);
            $("#" + imgId).remove();
          }
        }
      },

      applyFieldWarning: function(wells) {
        var that = this;
        var req = 0;
        var fill = 0;
        var fieldData = {};
        that.fieldList.forEach(function(field){
          fieldData[field.id] = [];
        });
        wells.forEach(function(well){
          if (!that.engine.wellEmpty(well)){
            for (fieldId in fieldData) {
              if (fieldId in well.wellData) {
                fieldData[fieldId].push(well.wellData[fieldId]);
              } else {
                fieldData[fieldId].push(null);
              }
            }
          }
        });
        for (var i = 0; i < that.fieldList.length; i++) {
          var field = that.fieldList[i];
          if (field.applyMultiplexSubFieldColor){
            field.applyMultiplexSubFieldColor(fieldData[field.id]);
          } else {
            if (field.required) {
              var include = false;
              fieldData[field.id].forEach(function(val){
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
})(jQuery, fabric);