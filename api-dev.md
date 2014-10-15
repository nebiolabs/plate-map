# Plate Layout API

Josh, I write this addressing you, because still many things like well, plate all those things dont make any sense to me. Here I imagine a well is a collection of plates and plates are those circles I saw in dropbox. And do we have tabs ? if so I guess that those circles are scattered in different tabs. [I saw tabs in configuration file you wrote in readme.md]

```
var plateLayOutConf = {
			embedId:          'my-plate-layout'
			numRows:          '8',
			numCols:          '12',
			incrementalSave:  'true',
			attributes:       attributes
		};

var plateLayOut = new ChaiBioTech.plateLayOut(plateLayOutConf); 
// This should initialize a new plate lay out screen

```
Now I am going to fetch all the plates in the well, sorry if I am wrong with name and concept
```
var allPlates = plateLayOut.getPlates(); 
// Conviniently this should get me all the plates
```
Here its better if we can specify number and limit of plates it returns
```
var allPlates = plateLayOut.getPlates(1, 10); // Should return 1-10 , what if we have pagination

var thirdPlate = plateLayOut.getPlate(3); // Ofcourse it fetches 3rd plate
```
its better we implement getter and setter method to well and plate; this could be done like , imgine we have a 
color property
```
thirdPlate.color = "red";
thirdPlate.set("color", red");

// Just like that
// This getter and setter method should be available for all the objects and should be able get/set any property
var color = thirdPlate.color;
var color = thirdPlate.get("color");
```
And it could be any property
```
thirdPlate.set("temperature", 100);

var temp = thirdPlate.get("temperature");
```
Now we may want to delete a plate so it could be like
```
allPlates.delete(3);

// or

plateLayOut.getPlates(3).delete();

// or

thirdPlate.delete();

```

Now we may want to save a plate after edit

```
thirdPlate.set("temperature", 80);

thirdPlate.update();
```

Now create a new plate

```
var plateData = {

	"color": "red",
	"temperature": 70
}

var newPlate = new plateLayOut.plate(plateData);
// may be new plate should be added to the end of plateLayout
```

Now lets provide a method to sync the data with server

```
var plateData = {

	"color": "red",
	"temperature": 70
}

var newPlate = new plateLayOut.plate(plateData);

plateLayOut.sync();

// this should essentially saves the new plate to the server.

```
Or may be we should be able to save all the changes in the stack 

```
plateLayOut.updateWell();

```
### Redo/undo

Redo undo feature should be accissible with simple function call

```
plateLayOut.undo();

plateLayOut.redo();

```

### Events

lets fire events for different things

may be when we create a new plate, delete a plate , and when well is updated.

```
// imagine there is an event when a plate is created

plateLayOut.on("plate:created", function(plate) {

	var plateTemp = plate.get("temperature");

});

```

Like wise above, we may employ evets to see if any property changed for plate

```
var plateData = {

	"color": "red",
	"temperature": 70
}

var newPlate = new plateLayOut.plate(plateData);

newPlate.on("change:temperature", function(plate) {
	
	console.log(plate.get("temperature"));
})

```

Again to be a cool we should give programmer opportunity to fire coustom events

```
var plateData = {

	"color": "red",
	"temperature": 70
}

var newPlate = new plateLayOut.plate(plateData);

var someData = {

	"ssdfsd": "bingo"

}
newPlate.fire("someRandomEvent", someData);

// Now we bind this event

newPlate.on("someRandomnEvent", function(data) {

	console.log("here s the data", data);

});

```

