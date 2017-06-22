# JavaScript Plate Layout
JavaScript Plate Layout is an open source tool developed collaboratively by [Chai Biotechnologies](www.chaibio.com) and [New England Biolabs](www.neb.com) for visualizing and editing the layout of scientific assay plates.

Many scientific instruments such as PCR thermocyclers, DNA sequencers, and microplate readers use plates ranging from 8 to 1536 wells, with 96 well plates being particularly common. It is usually necessary to set data attributes for each of the wells, both so that the instrument can properly configure itself, and so that results can be properly analyzed. Correctness of the layout is critical for the integrity of results, but not always easy to obtain given the number of wells and data attributes to be assigned.

JavaScript Plate Layout provides a tool for visualizing the plate layout using a few dimensions at a time, to better comprehend the layout they have created. It provides extensive plate editing capabilities and is designed to be easily utilized in the context of a larger scientific software application.

## Features
* Assign and edit up to roughly 25 data attributes to plates ranging from 8 to 96 wells
* Incrementially save plate layouts to server via JavaScript callback interface
* Colorfully visualize the layout using user-selected data dimensions
* Assign attributes to multiple wells at once
* Supports multiple units of measure for numeric attributes
* Undo / redo support
* Import plate templates
* Plate and well completion status indication

## Usage
Embed code similar to the below to add the plate layout tool to your application. See Configuration Options for all available settings.

```html
<head>
	<script type="text/javascript" src="javascripts/plate-layout.js"></script>
	<script type="text/javascript">
	window.onload = function() {

		//Define fields to hold data
		var fields = {
			Volume: {
			  required: true,
			  id:       'volume',
			  name:     'Volume',
			  type:     'numeric',
			  placeholder: "Volume",
			  units: {
			    1: "uL",
			    2: "mL"
			  }
			},
			Polymerase: {
			  required: true,
			  id: 'pol',
			  name: 'Polymerase',
			  type: 'multiselect',
			  placeHolder: "Polymerase",
			  options: {
			    'Taq 1': {
			          id:   '234',
			          name: 'Taq 1'
			    },
			    'Taq 2': {
			          id:   '123',
			          name: 'Taq 2'
			    }
			  }
			}
		}; 

		// Define presentation attributes
		var attributes = {
			presets: { // Define quick pick of different combinations of checked fields
				"preset 1": ['volume', 'pol'],
				"preset 2": ["pol"]
			},
			tabs: {
				"Settings": {
					fields: fields 
				}
			}, 
		} //attributes

		$("#my-plate-layout").plateLayOut({

			numRows:          '8',
			numCols:          '12',
			imgSrc:           "css",
			attributes:       attributes,

			updateWells: function(event, data) {
				//this function should save the provided wells to the server
				//and call either updateWellsSuccessful() or updateWellsFailed()
				//on completion
			}
		});

		//You can trigger the load of plateData at any time, 
		//including initializing, using the getPlates method
		$("#my-plate-layout").plateLayOut("getPlates", plateData);

		//You can retrieve the current state at any time using the createObject method
		$("#my-plate-layout").plateLayOut("createObject"); 
	}
	</script>
</head>

<body>
    <div id="my-plate-layout"></div>
</body>
```

## Attribute Specification
More detailed explanation of the example attribute definition provided above to come.

## JavaScript API
### User-Provided Callback Functions
The following callback function must be implemented by the user and provided to the init function.

#### updateWells(event, data)
Anytime the user makes changes, this callback will be invoked with the current state of the data, 
allowing the developer to respond to changes.

### Major functions
The following functions may be called at any time to interact with the UI.  
Typically you will invoke these functions using `$("#mylayout").plateLayOut("function", ...args)` form. 

#### getPlates(data)
This function may be called at any time to load data. Well data should be passed in the following form:

```js
{
	derivative: {
		"0": { //row-major index of well
			wellData: {
				field_1: "value 1"
				field_2: "value 2"
			}, 
			units: {
				field_1unit: "value 1 unit"
			}
		}
	}, 
	checkboxes: { //activation of checkboxes
		field_1: true, 
		field_2: false
	}, 
	selectedObjects: { //selection
		startingTileIndex: 0, // row-major index of first well
		columnCount: 1,       // number of cols -1
		rowCount: 2           // number of rows -1
	}
}
```
#### createObject()
This function will return the current state of the UI. The form of the data will be as documented for getPlates. 

###Data Types.

We have four data types which can be used to initialize tabs in the right hand side. They are text, numeric, boolean and multichoice.

#### Text

Text field are the normal and basic text field which holds a text value inside. Nothing specific.

#### Numeric

When we have numeric data which has some unit we use numeric data type. Sometime we should be using volume like quantities, So we provide an extra field to hand over units too.

```js
Volume: {
  required: true,
  id:       'volume',
  name:     'Volume',
  type:     'numeric',
  placeholder: "Volume",
  units: {
    1: "uL",
    2: "mL"
  }
}
```

see the units in the above object. Units will be a seperate dropdown and will be placed over the text box where we enter speed data.

#### Boolean Field

Name says it all, Just brought the select2 to show it.

#### Multiselect

Normal select box but we bring select2 to modify it. Look at the example object here.

```
Polymerase: {
  required: true,
  id: 'pol',
  name: 'Polymerase',
  type: 'multiselect',
  placeHolder: "Polymerase",
  options: {
    'Taq 1': {
      id:   '234',
      name: 'Taq 1'
    },
    'Taq 2': {
      id:   '123',
      name: 'Taq 2'
    }
  }
}
```

Here options are going to be the values in the dropdown.

