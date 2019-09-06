# Introduction
<!-- remember to update badges [version, licence] when needed because they are static -->
![version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg?style=flat-square&v=1.0)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![GitHub issues](https://img.shields.io/github/issues/nebiolabs/plate-map.svg?style=flat-square&v=1.0)](https://github.com/nebiolabs/plate-map/issues)
[![dependencies Status](https://david-dm.org/nebiolabs/plate-map/status.svg?style=flat-square&v=1.0)](https://david-dm.org/nebiolabs/plate-map)
[![devDependencies Status](https://david-dm.org/nebiolabs/plate-map/dev-status.svg?style=flat-square&v=1.0)](https://david-dm.org/nebiolabs/plate-map?type=dev)

**JavaScript Plate Layout** is an open source tool developed collaboratively by [Chai Biotechnologies](www.chaibio.com) 
and [New England Biolabs](www.neb.com) for visualizing and editing the layout of scientific assay plates.

Many scientific instruments such as PCR thermocyclers, DNA sequencers, and microplate readers use plates ranging from 8 
to 1536 wells, with 96 well plates being particularly common. It is usually necessary to set data attributes for each of
the wells, both so that the instrument can properly configure itself, and so that results can be properly analyzed. 
Correctness of the layout is critical for the integrity of results, but not always easy to obtain given the number of 
wells and data attributes to be assigned.

JavaScript Plate Layout provides a tool for visualizing the plate layout using a few dimensions at a time, to better 
comprehend the layout they have created. It provides extensive plate editing capabilities and is designed to be easily 
utilized in the context of a larger scientific software application.

# Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Usage](#usage)
- [User-Provided Callback Functions](#user-provided-callback-functions)
- [Major Functions](#major-functions)
- [Data Types](#data-types)
- [Example 1](#example-1-multiplex-field-without-sub-field-multiplex-units)
- [Example 2](#example-2-multiplex-field-with-multiplex-unit-sub-fields)
- [How to contribute](#how-to-contribute)

# Features
- Assign and edit up to roughly 25 data attributes to plates ranging from 8 to 96 wells
- Incrementially save plate layouts to server via JavaScript callback interface
- Colorfully visualize the layout using user-selected data dimensions
- Assign attributes to multiple wells at once
- Supports multiple units of measure for numeric attributes
- Undo / redo support
- Import plate templates
- Plate and well completion status indication
- Read only plate map
- Edit only mode to disable add new wells and delete existing wells.

# Usage

## Install
<!-- todo : This package is available on [NPM_Link] -->
The standard way to integrate this library in your project is to use `npm`.

> If you are new to _NPM_, you can get to know it better here 
[What-Is-NPM?](https://docs.npmjs.com/getting-started/what-is-npm).

To install this package:
```bash
npm install plate-map --save
```

## Include dependencies
After installing this package, _NPM_ creates a `node_modules` directory in the root of your project. This directory 
contains all the required dependencies to make use of our package. You need therefore to include all these dependencies 
in your project to use this package.

You need to include the following dependencies: 
<!-- todo: change plate-map paths to correspond to the real npm package when released plate-map/dist/css, ... -->
- Stylesheets: 
    ```
    'node_modules/bootstrap/dist/css/bootstrap.min.css'
    'node_modules/select2/select2.css'
    'node_modules/plate-map/dist/package/css/plate-map.min.css'
    ```
- Javascript:
    ```
    'node_modules/jquery/dist/jquery.min.js'
    'node_modules/bootstrap/dist/js/bootstrap.min.js'
    'node_modules/select2/select2.js'
    'node_modules/jquery-ui-dist/jquery-ui.min.js'
    'node_modules/svgjs/dist/svg.js'
    'node_modules/clipboard/dist/clipboard.min.js'
    'node_modules/plate-map/dist/package/js/plate-map.min.js'
    ``` 

## Quick start
Embed code similar to the below to add the plate layout tool to your project: 
```html
<div id="my-plate-map"></div>
```
The source file `src/js/example.js` (shown below) initializes the plate layout tool. See Configurations Options
for all available settings. **Note** that this source file is not included in the npm package, but it is available on 
the Github repository. 
```js
  window.onload = function() {
    //Define fields to hold data
    let fields = [
      {
        required: true,
        id:       'volume',
        name:     'Volume',
        type:     'numeric',
        placeholder: "Volume",
        units: ["uL", "mL"], 
        defaultUnit: "uL"
      },
      {
        required: true,
        id: 'pol',
        name: 'Polymerase',
        type: 'multiselect',
        placeHolder: "Polymerase",
        options: [
          {
                id:   '234',
                text: 'Taq 1'
          },
          {
                id:   '123',
                text: 'Taq 2'
          }
        ]
      }
    ]; 

    // Define presentation attributes
    let attributes = {
      presets: {// Define quick pick of different combinations of checked fields
        "preset 1": ['volume', 'pol'],
        "preset 2": ["pol"]
      },
      tabs: [
        {
          name: "Settings",
          fields: fields 
        }
      ], 
    };

    // Main function
    let widget = $("my-plate-map");
    widget.plateMap({
      numRows: 8,
      numCols: 12,
      readOnly: false,  // optional
      attributes: attributes,
      updateWells: function(event, data) {
        //Run when data state changes
      },
      selectedWells: function(event, selectedWell) {
        //output the selected wells in the console, can also add other methods upon mouse up events
        console.log('selected: ' + selectedWell.selectedAddress);
      }
    });
    //You can trigger the load of plateData at any time, 
    //including initializing, using the getPlates method
    widget.plateMap("getPlates", plateData);
  }
```

# User-Provided Callback Functions
The following callback function must be implemented by the user and provided to the init function.

## updateWells(event, data)
Anytime the user makes changes, this callback will be invoked with the current state of the data, 
allowing the developer to respond to changes.

## selectedWells: function(event, selectedWell)
Every time after mouse up event on canvas, selectedWells function will be triggered and output the addresses of selectedWell

# Major Functions
The following functions may be called at any time to interact with the UI. 
Typically you will invoke these functions using `$("#mylayout").plateMap("function", ...args)` form. 

## loadPlate(data)
This function may be called at any time to load data. Well data should be passed in the following form:
```js
data = {
  wells: {
    "A1": { //address of well
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
                    subfield_1: "value 3",
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
    "field_6_multiplex_field1", //activate checkbox for subfield
    "field_7",
  ], 
  selectedAddresses: ["A1", "A2", "A3"]
}
```

## getPlate()
Calling this function will return the current state of the plate-map, in the form as passed into `loadPlate`.
```js
$("#my-plate-map").plateMap("getPlate")
```

## isReadOnly()
This function will disable editing of the plates, set `flag` to true for read only mode and set `flag` to false to disable read only mode
```js
$("#mylayout").plateMap("isReadOnly", flag)
```

## isDisableAddDeleteWell()
This function will disable adding and removing the existing wells. Set `flag` to true will set the current state of the plate as reference and remove the ability to add and remove wells. `defaultFields` can be specified for setting default values to existing empty wells (`defaultFields` format: `{fieldId1: val1, fieldId2: val2, ...}`)
```js
$("#mylayout").plateMap("isDisableAddDeleteWell", flag, defaultFields)
```

## setSelectedAddresses()
Calling this function will set the input address as selected wells on the plate, `addresses` is a list of addresses
 (example: ['A1', 'A2', ...])
```js
$("#my-plate-map").plateMap("setSelectedAddresses", addresses)
```

## getSelectedAddresses()
Calling this function will return the addresses of selected wells on the plate, as in `setSelectedAddresses`
```js
$("#my-plate-map").plateMap("getSelectedAddresses")
```

# Data Types
We have four data types which can be used to initialize tabs in the right hand side. They are text, numeric, boolean and 
multichoice.

## Text
Text field are the normal and basic text field which holds a text value inside. Nothing specific.

## Numeric
Numeric fields only allow numeric values. If a non-numeric value is entered, the field will be rendered in red and not 
save the value. 
Numeric fields may optionally allow for units. You can specify the default unit if desired, otherwise the first unit 
will be used. 
```js
some_numeric_field = {
  required: true,
  id:       'volume',
  name:     'Volume',
  type:     'numeric',
  placeholder: "Volume",
  units: ["uL", "mL"], 
  defaultUnit: "uL"
};
```
see the units in the above object. Units will be a seperate dropdown and will be placed over the text box where we enter 
speed data.
when numeric field is used as a sub field for multiplex field, if the numeric field has multiplex units, the set up of 
the field will become:
```js
some_multiplex_numeric_field = {
  required: false,
  id: 'raw_value',
  name: 'Amount',
  type: 'numeric',
  hasMultiplexUnit: true,
  units: ["unit1", "unit2", "unit3", "unit4", "unit5", "unit6"]
};
```
Note that `units` attribute is a list of all the possible options for `condition_amt` field.
More examples at the end of the page

## Boolean Field
Name says it all, Just brought the select2 to show it.

## Select
Selected single option using select2 dropdown.Options field lists options in order. 
```js
some_select_field= {
  required: true,
  id: 'pol',
  name: 'Polymerase',
  type: 'select',
  placeHolder: "Polymerase",
  options: [
    {
      id:   '234',
      text: 'Taq 1'
    },
    {
      id:   '123',
      text: 'Taq 2'
    }
  ]
};
```

## Multiselect
Select multiple options using select2 picker. Options field lists options in order. 
```js
some_multiselect_field = {
  required: true,
  id: "pol",
  name: "Polymerase",
  type: "multiselect",
  placeHolder: "Polymerase",
  options: [
    {
      id:   "234",
      text: "Taq 1"
    },
    {
      id:   "123",
      text: "Taq 2"
    }
  ]
}
```

## Multiplex
A special field type used to handle fields which contain multiple sub fields
creating a multiplex field will automatically generate a single select field with display name `Select to edit`, the 
single select field is for user to choose one multiplex value to inspect or update. multiplexFields can be used to 
specify sub fields, components of multiplexFields can be any of the basic field type shown above.

### Example 1: multiplex field without sub field multiplex units
```js
some_multiplex_field = {
  required: true,
  id: "amplicon_id",
  name: "Amplicon",
  type: "multiplex",
  options: [
    {id: "a", text: "amplicon_a"},
    {id: "b", text: "amplicon_b"}
  ],
  multiplexFields: [
    {
      required: true,
      id: "template_ngul",
      name: "template conc",
      type: "numeric",
      defaultUnit: "ng/ul"
    },
    {
      required: true,
      id: "primer_umolarity",
      name: "Primer conc",
      type: "numeric",
      placeHolder: "Primer",
      units: ["uM (final)", "unit1"],
      defaultUnit: "uM (final)"
    },
    {
      required: true,
      id: "probe_umolarity",
      name: "Probe conc",
      type: "numeric",
      placeHolder: "Probe",
      defaultUnit: "uM (final)"
    },
    {
      required: true,
      id: "dilution_factor",
      name: "Dilution factor",
      type: "numeric",
      placeHolder: "Dilution factor",
      defaultUnit: "X"
   }
  ]
}
```
see the example above, Amplicon is a multiplex field contains sub fields: template concentration, primer concentration, 
probe concentration and dilution factor.

### Example 2: multiplex field with multiplex unit sub fields
```js
some_multiplex_field = {
  required: false,
  id: "experimental_conditions",
  name: "Experimental Conditions",
  type: "multiplex",
  placeHolder: "Experimental Conditions",
  options: [
    {
      id: "a",
      unitOptions: {"raw_value": ["unit1", "unit2"]},
      text: "experimental condition1"
    },
    {
      id: "b",
      unitOptions: {"raw_value": ["unit3", "unit4"]},
      text: "experimental condition2"
    },
    {
      id: "c",
      unitOptions: {"raw_value": ["unit5", "unit6"]},
      text: "experimental condition3"
    }
  ],
  multiplexFields: [
    {
      required: false,
      id: "raw_value",
      name: "Amount",
      type: "numeric",
      units: ["unit1", "unit2", "unit3", "unit4", "unit5", "unit6"],
      hasMultiplexUnit: true
    },
    {
      required: false,
      id: "is_modulator",
      name: "Is Additive",
      type: "select",
      options:[
        {id:"a", text: "Is Modulator"},
        {id:"b", text: "Not Modulator"}
      ]
    }
  ]
}
```
In this case `experimental_conditions` is a multiplex field with subfields `condition_amt` and `is_modulator`. 
`condition_amt` is a subfield with multiplex units. In `experimental_conditions` field options, for each experimental 
condition there is a corresponding `unitOptions`. `unitOptions` is used to filter units upon choosing an experimental 
condition. For instance, if the user chooses option "a" in the single select field, the corresponding list of unit 
options for subfield id `raw_value` will be `["unit1", "unit2"]` , which is used to filter the unit options in the 
`condition_amt` field. `condition_amt` will only have unit options `["unit1", "unit2"]` after the filtering.

# How to contribute

## Requirements
**Note** that this project was tested with _Node_ v9.10.1 and _NPM_ v5.6.0.

If this is your first time:
1. install the (os) dependencies of the `canvas` library: https://www.npmjs.com/package/canvas/v/1.6.11
2. run `npm install` in this directory

   
## Project Structure
```
plate-map
    ├── src
    |   ├── css
    |   │   └── *.css
    |   ├── js
    |   │   └── *.js
    /   └── index.html
    ├── gulpfile.js
    └── package.json
```

## Automated Workflow
This project makes use of _Gulp_ to automate and enhance some parts of the workflow, so that developers can spend less
time on repetitive tasks, and rely on a more reproducible process.

> For more information about _Gulp_, see [Gulp Website](https://gulpjs.com/).

The _Gulp_ configuration sits in `gulpfile.js`, at the root of the project. This file contains some common tasks used to
build and serve both development and production environments, as well as build the package for release.

A common pattern for writing tasks is to first load the required gulp package, then define the task itself.
**Note** that you may need to `npm install` gulp packages, if they are not listed in `package.json` already. Please
remember to commit `package.json` each time you add a dependency.

Here is an example of how to use _Gulp_:
- In your terminal:
    ```bash
    # install `gulp` if you don't have it
    npm install gulp
    ```
- In a `gulpfile.js`:
    ```js
    // load gulp
    var gulp = require('gulp');
    
    // basic syntax of a gulp task
    // task-name would be used whenever you want to run a task in Gulp.
    gulp.task('task-name', function() {
      // stuff here
    });
    ```
- In your terminal:
    ```bash
    # you can run this task in the command line by writing
    gulp task-name
    ```
More examples about how to use _Gulp_ are available here [Gulp For Beginners](https://css-tricks.com/gulp-for-beginners/).

> _NPM_ can be also used as a tasks runner, you can easily run tasks by adding them to the 'scripts' field in 
`package.json` then run them with `npm run <task-name>`. Run `npm run` to see available tasks.

Please have a look at `gulpfile.js` for more details on the available tasks of this projects.

## Dev Environment
The development build task outputs the application files in `dist/dev/`. These files are served by _BrowserSync_,
a development server which offers features like:
- live reload: automatically rebuild `src` into `dist/dev` and refresh the browser(s) after each change in code
- interactions synchronization: user actions can be mirrored across multiple browsers open simultaneously

> For more details about _BrowserSync_, see [BrowserSync Website](https://browsersync.io/). 

To serve the application in dev mode : 
```bash
npm start # or npm run serve.dev
```

## Prod Environment
The production build task outputs the minified application files in `dist/prod/`. These files contain both the project 
source code and the production dependencies. This directory is therefore ready to be served as a standalone application by
a production server (eg. nginx). This project is configured to use a `connect` server.

> For more details about 'Minification', see 
[Minification in Programming](https://en.wikipedia.org/wiki/Minification_(programming)).

To serve the application in production mode:
```bash
npm run serve.prod
```

## Release
The 'package' build task outputs the minified application files in `dist/pack/`. These files only contain the minified
source code of the app, and therefore cannot be served as such. Their purpose it to be released as an `npm` package,
that can then be integrated in dependent projects. It is up to each dependent project to build its own production bundle(s),
with a proper handling of the transitive dependencies.

The `plate-map` _NPM_ package contains:
- `plate-map.min.css` (app CSS source files concatenated and minified)
- `plate-map.min.js`  (app JS source files concatenated and uglified)
- `package.json` (dependencies and tasks of the package)

To build this package on your machine: 
```bash
npm run build.package
# test
# release to npm
```

## Add External Dependencies
If you want to external dependencies to the PlateMap tool, you can follow the next steps: 

- Install the npm dependency: 
    ```bash
    npm install 'package_name'
    ```
- In the gulpfile.js, add the new dependency path(s) to the constant PATH under the dependencies key. For example, if 
your dependency has just a javascript distribution file `dist/js/index.js`, the PATH constant in the gulpfile.js should 
look like this:
```
const PATH = {
    source: {
        app: {...},
        dependencies: {
            css: [...],
            js: [
                ...,
                'node_modules/your-package/dist/index.js'
            ],
            img: [...]
        },
    },
    destination: {...} 
};
```
