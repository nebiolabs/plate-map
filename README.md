# JavaScript Plate Layout
JavaScript Plate Layout is an open source tool developed collaboratively by [Chai Biotechnologies](www.chaibio.com) and [New England BioLabs](www.neb.com) for visualizing and editing the layout of scientific assay plates.

Many scientific instruments such as PCR thermocyclers, DNA sequencers, and microplate readers use plates ranging from 24 to 384 wells, with 96 well plates being particularly common. It is usually necessary to set data attributes for each of the wells, both so that the instrument can properly configure itself, and so that results can be properly analyzed. Correctness of the layout is critical for the integrity of results, but not always easy to obtain given the number of wells and data attributes to be assigned.

JavaScript Plate Layout provides a tool for visualizing the plate layout using a few dimensions at a time, to better comprehend the layout they have created. It provides extensive plate editing capabilities and is designed to be easily utilized in the context of a larger scientific software application.

## Features
* Assign and edit up to roughly 25 data attributes to plates ranging from 16 to 96 wells
* Save plate layouts using user-provided REST API
* Colorfully visualize the layout using user-selected data dimensions
* Assign attributes to multiple wells at once
* Supports multiple units of measure for numeric attributes
* Undo / redo support
* Import plate templates

## Usage
Instantiate the plate layout as follows:

```
var pl = new PlateLayout(plateParams, attributes, baseUrl);
```
The following JSON parameters should be passed in plateParams:
Parameter | Definition
--------- | ----------
width | The width of the tool in pixels
height | The height of the tool in pixels
plateRows | The number of rows of wells in the plate
plateCols | The number of columns of wells in the plate

baseUrl is the REST resource URL of the particular plate to be edited. Actions will be applied to this URL as described in the REST API section. For example:
```
http://acmebio.com/mytool/plates/43
```


## REST API