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
        units: ["uL", "mL"], 
        defaultUnit: "uL"
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
      tabs: [
        {
          name: "Settings",
          fields: fields 
        }
      ], 
    } //attributes

    $("#my-plate-layout").plateLayOut({

      numRows: 8,
      numCols: 12,
      imgSrc:  "css",
      attributes: attributes,

      updateWells: function(event, data) {
        //Run when data state changes
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
        field_1: "value 1",
        field_2: "value 2",
        field_3: {value: xxx, unit: "unit1"},       // field with unit
        field_4: "value 4 id",                      // single select field
        field_5: ["value 5 id1", "value 5 id2"],    // multiselect field
        field_6: [                                  // multiplex field with no multiplex unit sub fields
                  {
                    multiplex_field1: "multiplex field1 id1",
                    subfield_1: "value 1",
                    subfield_2: "value 2"
                  },
                  {
                    multiplex_field: "multiplex field1 id2",
                    subfield_1: "value 3"
                    subfield_2: "value 4"
                  }
                 ],
        field_7: [                                  // multiplex field with multiplex unit sub fields(subfield_4)
                  {
                    multiplex_field2: "multiplex field2 id1",
                    subfield_3: "value 1",
                    subfield_4: {value: "value 2", unit: "unit1"}    // numeric field with multiplex units
                  },
                  {
                    multiplex_field: "multiplex field2 id2",
                    subfield_3: "value 3",
                    subfield_4: {value: "value 2", unit: "unit1"}    // numeric field with multiplex units
                  }
                 ]


      }
    }
  }, 
  checkboxes: [ //activation of checkboxes
    "field_1", 
    "field_2",
    "field_3",
    "field_4",
    "field_5",
    "field_6",
    "field_7",
  ], 
  selectedAreas: [ //min and max rows and columns, inclusive
    {
      minRow: 0, 
      maxRow: 3, 
      minCol: 2, 
      maxCol: 3
    }
  ], 
  focalWell: { // position of current focal well
    row: 0,
    col: 2
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

Numeric fields only allow numeric values. If a non-numeric value is entered, the field will be rendered in red and not save the value. 

Numeric fields may optionally allow for units. You can specify the default unit if desired, otherwise the first unit will be used. 

```js
Volume: {
  required: true,
  id:       'volume',
  name:     'Volume',
  type:     'numeric',
  placeholder: "Volume",
  units: ["uL", "mL"], 
  defaultUnit: "uL"
}
```

see the units in the above object. Units will be a seperate dropdown and will be placed over the text box where we enter speed data.

when numeric field is used as a sub field for multiplex field, if the numeric field has multiplex units, the set up of the field will become:

```js
condition_amt: {
  required: false,
  id: 'raw_value',
  name: 'Amount',
  type: 'numeric',
  hasMultiplexUnit: true,
  units: ["unit1", "unit2", "unit3", "unit4", "unit5", "unit6"]
}
```

Note that `units` attribute is a list of all the possible options for `condition_amt` field.
More examples at the end of the page

#### Boolean Field

Name says it all, Just brought the select2 to show it.

#### Select

Selected single option using select2 dropdown.Options field lists options in order. 

```js
Polymerase: {
  required: true,
  id: 'pol',
  name: 'Polymerase',
  type: 'select',
  placeHolder: "Polymerase",
  options: [
    {
      id:   '234',
      name: 'Taq 1'
    },
    {
      id:   '123',
      name: 'Taq 2'
    }
  ]
}
```

#### Multiselect

Select multiple options using select2 picker. Options field lists options in order. 

```js
Polymerase: {
  required: true,
  id: 'pol',
  name: 'Polymerase',
  type: 'multiselect',
  placeHolder: "Polymerase",
  options: [
    {
      id:   '234',
      name: 'Taq 1'
    },
    {
      id:   '123',
      name: 'Taq 2'
    }
  ]
}
```

#### Multiplex

A special field type used to handle fields which contain multiple sub fields

creating a multiplex field will automatically generate a single select field with display name `Select to edit`, the single select field is for user to choose one multiplex value to inspect or update. multiplexFields can be used to specify sub fields, components of multiplexFields can be any of the basic field type shown above.

##### Example 1: multiplex field without sub field multiplex units
```js
Amplicon: {
  required: true,
  id: 'amplicon_id',
  name: "Amplicon",
  type: "multiplex",
  options: [
    {
      id: 'a',
      text: 'amplicon_a'
    },
    {
      id: 'b',
      text: 'amplicon_b'
    }
  ],
  multiplexFields: {
    template_ngul: {
      required: true,
      id: 'template_ngul',
      name: 'template conc',
      type: 'numeric',
      defaultUnit: 'ng/ul'
    },
    primer_umolarity: {
      required: true,
      id: 'primer_umolarity',
      name: 'Primer conc',
      type: 'numeric',
      placeHolder: "Primer",
      units: ['uM (final)', "unit1"],
      defaultUnit: 'uM (final)'
    },
    probe_umolarity: {
      required: true,
      id: 'probe_umolarity',
      name: 'Probe conc',
      type: 'numeric',
      placeHolder: "Probe",
      defaultUnit: 'uM (final)'
    },
    dilution_factor: {
      required: true,
      id: 'dilution_factor',
      name: 'Dilution factor',
      type: 'numeric',
      placeHolder: "Dilution factor",
      defaultUnit: 'X'
   }
  }
}
```

see the example above, Amplicon is a multiplex field contains sub fields: template concentration, primer concentration, probe concentration and dilution factor.

##### Example 2: multiplex field with multiplex unit sub fields

```js
experimental_conditions: {
  required: false,
  id: 'experimental_conditions',
  name: "Experimental Conditions",
  type: "multiplex",
  placeHolder: "Experimental Conditions",
  options: [
    {
      id: "a",
      unitOptions: {raw_value: ["unit1", "unit2"]},
      text: "experimental condition1"
    },
    {
      id: "b",
      unitOptions: {raw_value: ["unit3", "unit4"]},
      text: "experimental condition2"
    },
    {
      id: "c",
      unitOptions: {raw_value: ["unit5", "unit6"]},
      text: "experimental condition3"
    }
  ],
  multiplexFields: {
    condition_amt: {
      required: false,
      id: 'raw_value',
      name: 'Amount',
      type: 'numeric',
      units: ["unit1", "unit2", "unit3", "unit4", "unit5", "unit6"]
      hasMultiplexUnit: true
    },
    is_modulator: {
      required: false,
      id: 'is_modulator',
      name: 'Is Additive',
      type: 'select',
      options:[
        {id:'a',text: 'Is Modulator'},
        {id:'b',text: 'Not Modulator'}
      ]
    }
  }
}
```

In this case `experimental_conditions` is a multiplex field with subfields `condition_amt` and `is_modulator`. `condition_amt` is a subfield with multiplex units. In `experimental_conditions` field options, for each experimental condition there is a corresponding `unitOptions`. `unitOptions` is used to filter units upon choosing an experimental condition. For instance, if the user chooses option "a" in the single select field, the corresponding list of unit options for subfield id `raw_value` will be `["unit1", "unit2"]` , which is used to filter the unit options in the `condition_amt` field. `condition_amt` will only have unit options `["unit1", "unit2"]` after the filtering.
