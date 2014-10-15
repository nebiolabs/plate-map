# Plate Layout API

Josh, I write this addressing you, because still many things like well, plate all those things dont make any sense to me. Here I imagine a well is a collection of plates and plates are those circles I saw in dropbox. And do we have tabs ? if so I guess that those circles are scattered in different tabs. [I saw tabs in configuration file you wrote in readme.md]

```
var plateConf = {
			embedId:          'my-plate-layout'
			numRows:          '8',
			numCols:          '12',
			incrementalSave:  'true',
			attributes:       attributes
		};

var plateLayOut = new ChaiBioTech.plateLayOut(plateConf); // This should initialize a new plate lay out screen

// Now I am going to fetch all the plates in the well, sorry if I am wrong with name and concept

var allPlates = plateLayOut.getPlates(); // Conviniently this should get me all the plates

//Here its better if we can specify number and limit of plates it returns

var allPlates = plateLayOut.getPlates(1, 10); // Should return 1-10 , what if we have pagination

var thirdPlate = plateLayOut.getPlate(3); // Ofcourse it fetches 3rd plate

// its better we implement getter and setter method to well and plate; this could be done like , imgine we have a 
// color property

thirdPlate.color = "red";
thirdPlate.set("color", red");

// Just like that
// This getter and setter method should be available for all the objects and should be able get/set any property
var color = thirdPlate.color;
var color = thirdPlate.get("color");

// And it could be any property

thirdPlate.set("temperature", 100);

var temp = thirdPlate.get("temperature");

