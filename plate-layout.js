// Plate Layout source code.
(function($, fabric){

  $.widget("DNA.plateLayOut", {

    options: {
      value: 0
    },

    columnCount: 12,

    rowIndex: ["A", "B", "C", "D", "E", "F", "G", "H"],

    allTiles: [], // All tiles containes all thise circles in the canvas

    allTabs: [],
    // Why we are pre-setting these colours ?. we can generally create randomn colours but there is high chance that
    // Colours having slight difference show up and we can hardly distinguish. Again we can go for
    // Hue Saturation Method but still there is a high chance that closer colors [in thr RGB] are likely to show up.
    // So we use some predefined 65 colors and if we need further we generate it randomnly.

    distinctColors: [
    '#00FF00',
    '#0000FF',
    '#FF0000',
    '#01FFFE',
    '#FFA6FE',
    '#FFDB66',
    '#006401',
    '#010067',
    '#95003A',
    '#007DB5',
    '#FF00F6',
    '#FFEEE8',
    '#774D00',
    '#90FB92',
    '#0076FF',
    '#D5FF00',
    '#FF937E',
    '#6A826C',
    '#FF029D',
    '#FE8900',
    '#7A4782',
    '#7E2DD2',
    '#85A900',
    '#FF0056',
    '#A42400',
    '#00AE7E',
    '#683D3B',
    '#BDC6FF',
    '#263400',
    '#BDD393',
    '#00B917',
    '#9E008E',
    '#001544',
    '#C28C9F',
    '#FF74A3',
    '#01D0FF',
    '#004754',
    '#E56FFE',
    '#788231',
    '#0E4CA1',
    '#91D0CB',
    '#BE9970',
    '#968AE8',
    '#BB8800',
    '#43002C',
    '#DEFF74',
    '#00FFC6',
    '#FFE502',
    '#620E00',
    '#008F9C',
    '#98FF52',
    '#7544B1',
    '#B500FF',
    '#00FF78',
    '#FF6E41',
    '#005F39',
    '#6B6882',
    '#5FAD4E',
    '#A75740',
    '#A5FFD2',
    '#FFB167',
    '#009BFF',
    '#E85EBE'],

    allWellData: {}, // We create this array so that it contains all the field ids and value
    //of everything in tabs
    allDataTabs: [], // To hold all the tab contents. this contains all the tabs and its elements and elements
    // Settings as a whole. its very usefull, when we have units for a specific field.
    // it goes like tabs-> individual field-> units and checkbox
    allUnitData: {}, // Unit data saves all the units available in the tabs. now it contains id and value.

    _create: function() {

      // Import helper methodes form other files.. Here we import it using extend and add it to this
      // object. internally we add to widget.DNA.getPlates.prototype.
      // Helpers are methods which return other methods and objects
      $.extend(this, new plateLayOutWidget.interface());
      $.extend(this, new plateLayOutWidget.menu());

      this.imgSrc = this.options.imgSrc || "assets",
      this._createInterface();
    },

    _init: function() {

      // This is invoked when the user use the plugin after _create is called.
      // The point is _create is invoked for the very first time and for all other
      // times _init is used.
    },








    _bottomScreen: function() {

      this.bottomContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-container");
      $(this.container).append(this.bottomContainer);
    },

    // We have tabs content in options , and her we put it in those tabs which are already placed
    _addTabData: function() {

      // Here we may need more changes becuse attributes format likely to change
      var tabData = this.options["attributes"];
      var tabPointer = 0;
      var that = this;
      for(currentTab in tabData) {
        if(tabData[currentTab]["fields"]) {
          var fieldArray = [];
          var fieldArrayIndex = 0;
          // Now we look for fields in the json
          for(field in tabData[currentTab]["fields"]) {
            var data = tabData[currentTab]["fields"][field];
            var input = "";
            // Switch case the data type and we have for of them
            switch(data.type) {
              case "text":
                input = this._createTextField(data);
                break;

              case "numeric":
                input = this._createNumericField(data);
                break;

              case "multiselect":
                input = this._createMultiSelectField(data);
                break;

              case "boolean":
                input = this._createBooleanField(data);
                break;
            }

            if(data.id && data.type) {
              this.allWellData[data.id] = (data.type == "boolean") ? true : "";
            } else {
              console.log("Plz check the format of attributes provided");
            }
            // we save type so that it can be used when we update data on selecting a tile
            $(input).data("type", data.type);
            // Adding data to the main array so that programatically we can access later
            fieldArray[fieldArrayIndex ++] = this._createDefaultFieldForTabs();
            $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-name").html(data.name);
            $(this.allDataTabs[tabPointer]).append(fieldArray[fieldArrayIndex - 1]);
            // now we are adding the field which was collected in the switch case.
            $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-field-container").html(input);

            // Adding checkbox
            var checkImage = $("<img>").attr("src", this.imgSrc + "/dont.png").addClass("plate-setup-tab-check-box")
            .data("clicked", false).data("linkedFieldId", data.id);
            $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-field-left-side").html(checkImage);
            this._applyCheckboxHandler(checkImage); // Adding handler for change the image when clicked
            fieldArray[fieldArrayIndex - 1].checkbox = checkImage;
            // Here we add the checkImage reference to input so now Input knows which is its checkbox..!!
            $(input).data("checkBox", checkImage);

            if(data.type == "multiselect") {
              // Adding select2
              $("#" + data.id).select2({
                allowClear: true
              });

              $("#" + data.id).on("change", function(e, generated) {
                // we check if its user generated event or system generated , automatic is system generated
                if(generated != "Automatic") {
                  that._addData(e);
                }

              });

            } else if(data.type == "numeric") {
              // Adding prevention for non numeric keys, its basic. need to improve.
              // We use keyup and keydown combination to get only numbers saved in the object
              $(input).keydown(function(evt) {
                var charCode = (evt.which) ? evt.which : evt.keyCode
                if (charCode != 8 && charCode != 0 && (charCode < 48 || charCode > 57)) {
                  return false;
                }
              });

              $(input).keyup(function(evt) {
                var charCode = (evt.which) ? evt.which : evt.keyCode
                if (!(charCode != 8 && charCode != 0 && (charCode < 48 || charCode > 57))) {
                  that._addData(evt)
                }
              });
              // Now add the label which shows unit.
              var unitDropDown = this._addUnitDropDown(data);
              $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-field-container").append(unitDropDown);

              $("#" + data.id + "unit").select2({

              });
              // Now add data to allUnitData
              this.allUnitData[data.id + "unit"] = $("#" + data.id + "unit").val();
              // Now handler for change in the unit.
              $("#" + data.id + "unit").on("change", function(evt, generated) {
                if(generated != "Automatic") {
                  that._addUnitData(evt);
                }
              });

              fieldArray[fieldArrayIndex - 1].unit = unitDropDown;
              // Remember fieldArray has all the nodes from tab -> individual tab -> an Item in the tab -> and Its unit.
              // May be take it as a linked list

            } else if(data.type == "boolean") {
              // Applying select 2 to true/false drop down
              $("#" + data.id).select2({

              });

              $("#" + data.id).on("change", function(evt, generated) {
                if(generated != "Automatic") {
                  that._addData(evt);
                }
              });

            } else if(data.type == "text") {
              // we use keyup instead of blur. Blur fires event but canvas fire event even faster
              // so most likely our targeted tile changed, and value added to wrong tile.
              $("#" + data.id).keyup(function(evt) {
                that._addData(evt);
              });

            }

          }

          this.allDataTabs[tabPointer]["fields"] = fieldArray;
        } else {
          console.log("unknown format in field initialization");
        }
        tabPointer ++;
      }
    },

    /*
      Poor method just returns an input field. -:)
    */
    _createTextField: function(textData) {

      return this._createElement("<input>").addClass("plate-setup-tab-input").attr("id", textData.id);
    },

    /*
      creating a multiselect field. Nothibg serious, this method returns a select box
      which is having all the required fields in the options hash.
    */
    _createMultiSelectField: function(selectData) {

      // we create select field and add options to it later
      var selectField = this._createElement("<select></select>").attr("id", selectData.id)
        .addClass("plate-setup-tab-select-field");
      // Adding an empty option at the first
      var emptySelection = this._createElement("<option></option>").attr("value", "")
        .html("");
      $(selectField).append(emptySelection);
      // Look for all options in the json
      for(options in selectData.options) {
        var optionData = selectData.options[options];
        var optionField = this._createElement("<option></option>").attr("value", optionData.name)
        .html(optionData.name);
        // Adding options here.
        $(selectField).append(optionField);
      }

      return selectField;
    },

    /*
      Numeric field is one which we enter number besides
      it has a unit.
    */
    _createNumericField: function(numericFieldData) {

      var numericField = this._createElement("<input>").addClass("plate-setup-tab-input")
      .attr("placeholder", numericFieldData.placeholder || "").attr("id", numericFieldData.id);

      return numericField;
    },

    /*
      To have true of false field
    */
    _createBooleanField: function(boolData) {

      var boolField = this._createElement("<select></select>").attr("id", boolData.id)
      .addClass("plate-setup-tab-select-field");
      var trueBool = this._createElement("<option></option>").attr("value", true).html("true");
      var falseBool = this._createElement("<option></option>").attr("value", false).html("false");

      $(boolField).append(trueBool).append(falseBool);

      return boolField;
    },

    /*
      Dynamically making the dropdown and returning it.
      select2 can be applyed only after dropdown has been added to DOM.
    */
    _addUnitDropDown: function(unitData) {

      if(unitData.units) {

        var unitSelect = this._createElement("<select></select>").attr("id", unitData.id + "unit")
        .addClass("plate-setup-tab-label-select-field");
        for(unit in unitData.units) {

          var unitOption = this._createElement("<option></option>").attr("value", unitData.units[unit]).html(unitData.units[unit]);
          $(unitSelect).append(unitOption);
        }

        return unitSelect;
      }
    },

    /*
      We cant implement check box in the default way. So we use images
      and control the behavious , Look at the click handler.
    */
    _applyCheckboxHandler: function(checkBoxImage) {
      // We add checkbox handler here, thing is it s not checkbox , its an image and we change
      // source
      var that = this;
      $(checkBoxImage).click(function(evt) {
        if($(this).data("clicked")) {
          $(this).attr("src", that.imgSrc + "/dont.png");
        } else {
          $(this).attr("src", that.imgSrc + "/do.png");
        }

        $(this).data("clicked", !$(this).data("clicked"));
        // when we un/select values it should reflect to the tiles selected at the moment
        that._addRemoveSelection($(this));
      });

    },

    /*
      This method creates an outline and structure for a default field in the tab at the right side.
      it creates few divs and arrange it so that checkbox, caption and field can be put in them.
    */
    _createDefaultFieldForTabs: function() {

      var wrapperDiv = this._createElement("<div></div>").addClass("plate-setup-tab-default-field");
      var wrapperDivLeftSide = this._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
      var wrapperDivRightSide = this._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
      var nameContainer = this._createElement("<div></div>").addClass("plate-setup-tab-name");
      var fieldContainer = this._createElement("<div></div>").addClass("plate-setup-tab-field-container");

      $(wrapperDivRightSide).append(nameContainer);
      $(wrapperDivRightSide).append(fieldContainer);
      $(wrapperDiv).append(wrapperDivLeftSide);
      $(wrapperDiv).append(wrapperDivRightSide);

      return wrapperDiv;
    },


    /*****************************************************************************
            Canvas manipulations
            1) May be use rectangles as base object in canvas.
            2) Add Circle into the rectangle.
            3) when clicked show the circle turn off the background image.
            4) Look out for dragging.
            5) add all the elements under dragged to an array/object.
            6) Remember properties of the well/circle are all those things in the tabs.
              So go over the tabs and add that to all the wells.
            7) click it so that tabs come into action.
            8) Anything changed in the tab is reflected to the object/circle/well.
            9) Ultimately wells having the same values have same color.
            10) Now when a particular well is selected all the selected values are showed up
              in the table at the bottom.
            11) This is going to be done yay...!

    *****************************************************************************/
    allSelectedObjects: null, // Contains all the selected objets, when click and drag.

    allPreviouslySelectedObjects: null,

    colorPointer: 0,

    goldenRatio: 0.618033988749895,

    _canvas: function() {
      // Those 1,2,3 s and A,B,C s
      this._fixRowAndColumn();

      // All those circles in the canvas.
      this._putCircles();

    },

    _fixRowAndColumn: function() {

      // For column
      for(var i = 1; i<= this.columnCount; i++) {
        var tempFabricText = new fabric.IText(i.toString(), {
          fill: 'black',
          originX:'center',
          originY: 'center',
          fontSize: 12,
          top : 10,
          left: 50 + ((i - 1) * 50),
          fontFamily: "Roboto",
          selectable: false,
          fontWeight: "400"
        });

        this.mainFabricCanvas.add(tempFabricText);
      }

      // for row
      var i = 0;
      while(this.rowIndex[i]) {
        var tempFabricText = new fabric.IText(this.rowIndex[i], {
          fill: 'black',
          originX:'center',
          originY: 'center',
          fontSize: 12,
          left: 5,
          top: 50 + (i * 50),
          fontFamily: "Roboto",
          selectable: false,
          fontWeight: "400"
        });

        this.mainFabricCanvas.add(tempFabricText);
        i ++;
      }
    },

    _putCircles: function() {
      // Indeed we are using rectangles as basic tile. Over the tile we are putting
      // not selected image and later the circle [When we select it].
      var rowCount = this.rowIndex.length;
      var tileCounter = 0;
      for( var i = 0; i < rowCount; i++) {

        for(var j = 0; j < 12; j++) {
          var tempCircle = new fabric.Rect({
            width: 48,
            height: 48,
            left: 50 + (j * 50),
            top: 50 + (i * 50),
            fill: '#f5f5f5',
            originX:'center',
            originY: 'center',
            name: "tile-" + i +"X"+ j,
            type: "tile",
            hasControls: false,
            hasBorders: false,
            lockMovementX: true,
            lockMovementY: true,
            index: tileCounter ++,
            wellData: {}, // now we use this to show the data in the tabs when selected
            selectedWellattributes: {}
            //selectable: false
          });

          this.allTiles.push(tempCircle);
          this.mainFabricCanvas.add(tempCircle);
        }
      }

      this._addNotYetSelectedImage();
    },

    _addNotYetSelectedImage: function() {
      // We load the image for once and then make copies of it
      // and add it to the tile we made in allTiles[]
      var that = this;
      var finishing = this.allTiles.length;
      fabric.Image.fromURL(this.imgSrc + "/Percent-Complete-3-1_03.png", function(img) {

        for(var runner = 0; runner < finishing; runner ++) {
          var imaging = $.extend({}, img);
          var currentTile = that.allTiles[runner];
          imaging.top = currentTile.top;
          imaging.left = currentTile.left;
          imaging.parent = currentTile; // Pointing to tile
          imaging.originX = 'center';
          imaging.originY = 'center';
          imaging.hasControls = false;
          imaging.hasBorders = false;
          imaging.lockMovementX = true;
          imaging.lockMovementY = true;
          imaging.evented = false;
          imaging.type = "image";
          that.allTiles[runner].notSelected = imaging; // Pointing to img
          that.mainFabricCanvas.add(imaging);
        }
      });
      this._addWellDataToAll();
      this._addUnitDataToAll();
      this._fabricEvents();
    },

    _addWellDataToAll: function() {
      // Here we are adding an object containing all the id s of fields in the right to tiles
      var noOfTiles = this.allTiles.length;
      for(var tileRunner = 0; tileRunner < noOfTiles; tileRunner ++) {
        this.allTiles[tileRunner]["wellData"] = $.extend({}, this.allWellData);
      }
    },

    _addUnitDataToAll: function() {
      // Here we are adding an object containing all the id s of units in the right to tiles
      var noOfTiles = this.allTiles.length;
      for(var tileRunner = 0; tileRunner < noOfTiles; tileRunner ++) {
        this.allTiles[tileRunner]["unitData"] = $.extend({}, this.allUnitData);
      }
    },

    _fabricEvents: function() {

      var that = this;
      // When we ckick and drag
      this.mainFabricCanvas.on("object:selected", function(selectedObjects) {

        that.mainFabricCanvas.deactivateAllWithDispatch(); // We clear the default selection by canvas
        //Deselect already selected tiles
        that._deselectSelected();
        // Adding newly selected group
        that.allSelectedObjects = selectedObjects.target._objects || [selectedObjects.target];
        console.log(that.allSelectedObjects);
        // Select tile/s
        that._selectTiles();
        that._applyValuesToTabs();
        that.mainFabricCanvas.renderAll();
      });

    },

    _deselectSelected: function() {
      // Putting back fill of previously selected group
      if(this.allSelectedObjects) {
        var noOfSelectedObjects = this.allSelectedObjects.length;
        for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex ++) {
          var currentObj = this.allSelectedObjects[objectIndex];
          if(currentObj.circle) {
            if(currentObj.type == "tile") {
              currentObj.setFill("#f5f5f5");
              currentObj.notSelected.setVisible(false);
            }
          } else {

            if(currentObj.type == "tile") {
              currentObj.setFill("#f5f5f5");
              currentObj.notSelected.setVisible(true);
            }
          }
        }
      }
    },

    _selectTiles: function() {
      // Here we select tile/s from the selection or click
      var noOfSelectedObjects = this.allSelectedObjects.length;
      for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
        var currentObj = this.allSelectedObjects[objectIndex];
        if(currentObj.type == "image"){
          currentObj.setVisible(false);
          currentObj.parent.setFill("#cceffc");
        } else if(currentObj.type == "tile") {
          currentObj.notSelected.setVisible(false);
          currentObj.setFill("#cceffc");
        }
      }
    },

    _addColorCircle: function() {
    // This method checks if given selection has circle.
      var colorAdded = false;
      if(this.allSelectedObjects) {
        var noOfSelectedObjects = this.allSelectedObjects.length;
        for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
          if(this.allSelectedObjects[objectIndex].type == "tile") {
            var tile = this.allSelectedObjects[objectIndex];
            if(! tile.circle) {
              colorAdded = this._addCircleToCanvas(tile);
            }
          }
        }
        // incrementing color pointer should be out of for loop, only then the whole selected
        // tiles have one color.
        if(colorAdded) {
          this.colorPointer ++;
        }
      }
    },

    _addCircleToCanvas: function(tileToAdd) {
      // Adding circle to particular tile
      if(this.colorPointer > this.distinctColors.length - 1) {
        var newColor = this.getRandomColor();
        this.distinctColors.push(newColor);
      }

      var circle = new fabric.Circle({
        radius: 20,
        fill: "white",
        originX:'center',
        originY: 'center',
        top: tileToAdd.top,
        left: tileToAdd.left,
        strokeWidth: 8,
        stroke: this.distinctColors[this.colorPointer],//this.colours[this.colorPointer],
        evented: false
      });

      circle.parent = tileToAdd; // Linking the objects;
      tileToAdd.circle = circle;
      this.mainFabricCanvas.add(circle);
      return true;
    },

    getRandomColor: function() {
      // This method generate a random color incase we run out of predefined color.
      // Again it checks if randomly generated color already exists in the array and if it is
      // generate some other color.
      var letters = '0123456789ABCDEF'.split('');
      var color = '#';
      for (var i = 0; i < 6; i++ ) {
          color += letters[Math.floor(Math.random() * 16)];
      }
      var colorCount = this.distinctColors.length;
      var colorIndex = 0;
      // Check if the generated color is already in the list
      while(colorIndex < colorCount) {
        if(this.distinctColors[colorIndex] === (color).toUpperCase()) {
          this.getRandomColor();
        }
        colorIndex ++;
      }
      return (color).toUpperCase();
    },

    _addData: function(e, boolean) {
      // Method to add data when something changes in the tabs. Its going to be tricky , just starting.
      if(this.allSelectedObjects) {
        var noOfSelectedObjects = this.allSelectedObjects.length;
        for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
          if(this.allSelectedObjects[objectIndex].type == "tile") {
            var wellData = this.allSelectedObjects[objectIndex]["wellData"];
            if(boolean) {
              var boolVal = (e.target.value == "true" || e.target.value == true) ? true : false;
              wellData[e.target.id]
            }
            wellData[e.target.id] = e.target.value;
          }
        }
        this._addColorCircle();
        var data = {
          "value": this.allTiles
        };
        // here we triggergetPlates , so that when ever something change with any of the well, it is fired
        this._trigger("getPlates", null, data);
      }
    },

    _addUnitData: function(e) {
      // This method add/change data when unit of some numeric field is changed
      if(this.allSelectedObjects) {
        var noOfSelectedObjects = this.allSelectedObjects.length;
        for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
          if(this.allSelectedObjects[objectIndex].type == "tile") {
            var unitData = this.allSelectedObjects[objectIndex]["unitData"];
            unitData[e.target.id] = e.target.value;
          }
        }
      }
    },

    _addRemoveSelection: function(clickedCheckBox) {
      // This method is invoked when any of the checkbox is un/checked. And it also add the id of the
      // corresponding field to the tile. So now a well/tile knows if particular checkbox is checkd and
      // if checked whats the value in it. because we use the value id of the element,
      // which in turn passed through attribute.
      if(this.allSelectedObjects) {
        var noOfSelectedObjects = this.allSelectedObjects.length;
        for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
          if(this.allSelectedObjects[objectIndex].type == "tile") {
            var selectionData = this.allSelectedObjects[objectIndex]["selectedWellattributes"];
            if(clickedCheckBox.data("clicked")) {
              selectionData[clickedCheckBox.data("linkedFieldId")] = true;
            } else {
              delete selectionData[clickedCheckBox.data("linkedFieldId")];
            }

          }
        }
      }
    },
    // Next thing is to show correct data when a tile or a group of tiles are selected.
    // use wellData in the tile to do that... :)
    _applyValuesToTabs: function() {
      // Here we look for the values on the well and apply it to tabs.
      if(this.allSelectedObjects.length === 1) {
        // Incase there is only one well selected.
        this._addDataToTabFields();
      } else {
        // Here we check if all the values are same
        // if yes apply those values to tabs
        // else show empty value in tabs
        // we take first tile as reference object
        var referenceTile =  this.allSelectedObjects[0];
        var referenceFields = referenceTile["wellData"];
        var referenceUnits = referenceTile["unitData"];
        var referenceSelectedFields = referenceTile["selectedWellattributes"];
        var equalWellData = true;
        var equalUnitData = true;
        var equalSelectData = true;
        // Looking for same well data
        for(var i = 0; i < this.allSelectedObjects.length; i++) {
          if(this.allSelectedObjects[i]["type"] == "tile") {
            equalWellData = this.compareObjects(this.allSelectedObjects[i]["wellData"], referenceFields);
            equalUnitData = this.compareObjects(this.allSelectedObjects[i]["unitData"], referenceUnits);
            equalSelectData = this.compareObjects(this.allSelectedObjects[i]["selectedWellattributes"], referenceSelectedFields);

            if(!equalWellData || !equalUnitData || !equalSelectData) {

              this._clearAllFields(referenceFields);
              return true;
            }
          }
        }

        //if(equalWellData || equalUnitData || equalSelectData) {
          this._addDataToTabFields();
        //}
      }
    },

    _addDataToTabFields: function() {
      // Configure how data is added to tab fields
      var values = this.allSelectedObjects[0]["wellData"];
      for(var id in values) {
        this._applyFieldData(id, values);
      }
      // Now changing the unit values
      var units = this.allSelectedObjects[0]["unitData"];
      for(var unitId in units) {
        this._applyUnitData(unitId, units);
      }
      // Now put back selected fields
      var selectedFields = this.allSelectedObjects[0]["selectedWellattributes"];
      for(var selectedFieldId in selectedFields) {
        checkBoxImage = $("#" + selectedFieldId).data("checkBox");
        $(checkBoxImage).attr("src", this.imgSrc + "/do.png").data("clicked", true);
      }
    },

    _applyFieldData: function(id, values) {
      // This method directly add a value to corresponding field in the tab
      switch($("#" + id).data("type")) {

        case "multiselect":
          $("#" + id).val(values[id]).trigger("change", "Automatic");
          // Automatic means its system generated.
        break;

        case "text":
          $("#" + id).val(values[id]);
        break;

        case "numeric":
          $("#" + id).val(values[id]);
        break;

        case "boolean":
          // select box provide bool value as text,
          // so we need a minor tweek to admit "true" and "false"
          var boolText = (values[id] == true || values[id] == "true") ? "true" : "false";
          $("#" + id).val(boolText).trigger("change", "Automatic");
        break;
      }
      // Clear previously selected checkboxes
      checkBoxImage = $("#" + id).data("checkBox");
      $(checkBoxImage).attr("src", this.imgSrc + "/dont.png").data("clicked", false);
    },

    _applyUnitData: function(unitId, units) {
      // Method to add unit data to the tabs.
      $("#" + unitId).val(units[unitId]).trigger("change", "Automatic");
    },

    compareObjects:function(object, reference) {
      // Compare 2 objects
      for(var ref in reference) {
        if(reference[ref] !== object[ref] ) {
          return false;
        }
      }

      for(var ref in object) {
        if(object[ref] !== reference[ref]) {
          return false;
        }
      }

      return true;
    },

    _clearAllFields: function(allFields) {
      // Clear all the fields
      var fakeAllFields = $.extend({}, allFields);
      for(var field in fakeAllFields) {
        if($("#" + field).data("type") == "boolean") {
          fakeAllFields[field] = true;
        } else {
          fakeAllFields[field] = "";
        }

        this._applyFieldData(field, fakeAllFields);
      }
    },

    plateLayOutgetPlates: function() {
      console.log("okay m doing great");
    }
    // Things to do
    // refactor code
    // have an eye on selected field and change colours and group for having same value and same select boxes
    // add field as soon as select box is clicked , at the bottom of the screen
    // redo undo -: refactor should make it easy.
  });

})(jQuery, fabric);
