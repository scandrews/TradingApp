var express = require("express");
var bodyParser = require ("body-parser");
// var morgan = require("morgan");

var app = express();

// set up express parsing
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

//var routes =   require("./controllers/routeController.js");
//app.use("/", routes);

//var server = require ("../../server.js");

// apply the routes to our application
//app.use('/', router);

//app.set('views',__dirname + '/public');
// Serve static content from 'public'
app.use(express.static('public'));

var curWatchList = {};
var curOwnList = {};

app.updateData = function (watchList, ownList){
	curWatchList = watchList;
	curOwnList = ownList;
};

/*
app.get('/about', (req, res) => {
//    res.sendFile('./about.html');
	res.sendFile(__dirname, "./views/about.html");
});
*/

app.get('/currentWatchList', (req, res) => {
	console.log("in the get current watch list route");
	//curWtchLst = server.returnCurrentData();
	res.send(curWatchList);	
});


app.get('/listOwned', (req, res) => {
	console.log("in the get listOwned route");
	//	console.log(req.body)
	res.send(curOwnList);
});



module.exports = app;