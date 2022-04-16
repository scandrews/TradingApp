//  Database controller all interaction with the database are here

const mysql = require('mysql2');
var comController = require ('./communicationsController');

// variables for the temperature sensor
var tempSum1 = 0;
var tempSum2 = 0;
var tempSum3 = 0;
var tempSum4 = 0;
var tempSum5 = 0;
var tempSum6 = 0;
var tempSum7 = 0;
var tempSum8 = 0;
var avgTemp1 = 0;
var avgTemp2 = 0;
var avgTemp3 = 0;
var avgTemp4 = 0;
var avgTemp5 = 0;
var avgTemp6 = 0;
var avgTemp7 = 0;
var avgTemp8 = 0;
var flags = [];
var numOfReadingsToAvg = 10;
var tempcount = 0;
//  30 min * 60 * numOfReadingsToAvg = 1800 - save every 30 min
//  2  min * 60 * numOfReadingsToAvg / 2 = 600
//  1  min * 60 * numOfReadingsToAvg / 2 = 300
//  20 sec * numOfReadingsToAvg * 2 = 1
//  2 sec * numOfReadingsToAvg * currentSaveDelayCount = 20 sec
//  2 sec * numOfReadingsToAvg * currentSaveDelayCount / 60 = 
//  2 sec * 10 * 90 / 60 = 30 Min - current time between saves
//var currentSaveDelayCount = 90;
// the period between all temperature saves
var saveDelayIntervalMinutes = 1;
var saveDelayIntervalSeconds = saveDelayIntervalMinutes * 60;
var currentSaveDelayCount = saveDelayIntervalSeconds;
var currentDelayCountMin = 0; //var saveDelay = currentSaveDelayCount;
//var delayCount = 0;
var numDataPointsRead = 40;
var temporaryTimes = [];
var test = "Test";

var connection;

// timer
var myVar = setInterval(myTimer, 1000);

//function myTimer() {
//  var saveDelayInterval = saveDelayInterval - 1;
//  console.log( saveDelayInterval);
//};

//var saveDelayInSec = currentSaveDelayCount * 60;
function myTimer(){
  currentSaveDelayCount = currentSaveDelayCount - 1;
  currentDelayCountMin = secondsToHms(currentSaveDelayCount);
  console.log("current delay count - " + currentDelayCountMin);
};


function secondsToHms(d) {
    d = Number(d);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return m + ":" + s; 
};

exports.upDateTempSaveIterval = function(newDelay) {
  saveDelayIntervalMinutes = newDelay;
  saveDelayIntervalSeconds = saveDelayIntervalMinutes * 60;
  return ("Saved New Temp Save INterval");
};

exports.updateNumDataPointsToChart = function(newDataPoints) {
  numDataPointsRead = newDataPoints;
  return ("sucessfuly updated num data points to chart");
};

exports.getCurrentTimes = function(){
  temporaryTimes = [currentSaveDelayCount, tempcount, currentDelayCountMin];
  return(temporaryTimes);
};

if (process.env.JAWSDB_URL) {
  connection = mysql.createConnection(process.env.JAWSDB_URL);
  } else {
    connection = mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'RutBud17',
      database: 'home_control_db'
    });
  };

connection.connect((err) => {
  if (err) throw err;

  // get the recirculator settings from the data base
  exports.recircSettingsRecirCNTRL = function (what, fn) {
    console.log("dbase controoler get recirc settings from recirs controller");
    connection.query("SELECT * FROM recirculatorsettings", (err, result) => {
      return ( fn ( result ));
    });
  };

  // get the recirculator settings from the data base
  exports.recircSettingsFrontEnd = function (req, res) {
    console.log("dbase controoler get recirc settings from the front end");
    connection.query("SELECT * FROM recirculatorsettings", (err, result) => {
        res.send( result );
    });
  };

  // retrieve the stored temp data for display
  exports.getTempData = function (req, res) {
    console.log("in get temp data  yyyoooo");
    var temp = "SELECT * FROM temperatures ORDER By id DESC LIMIT ";
    var oursql = temp.concat(numDataPointsRead);
    //console.log(oursql);
    connection.query( oursql, (err, result) => {
        console.log(result);
        if (err) {
          console.log("Got a DB error in getTempData (other)");
          console.log (err);
          };
      res.send( result );
    });
  };

  // retrieve the pipe temperature data
  exports.getPipeTempData = function (req, res) {
    console.log("in dbcontroler get pipe data");
    var temp = "SELECT * FROM recirculatorHistory ORDER By id DESC LIMIT ";
    var oursql = temp.concat(numDataPointsRead);
    console.log(oursql);
    connection.query( oursql, (err, result) => {
        console.log(result);
        if (err) {
          console.log("Got a DB error in getPipeTempData");
          console.log (err);
          };
        res.send ( result );
    });
  };


  exports.getdbSettings = function (){
    console.log("in db controller get db settings");
    var dbSettings = [saveDelayIntervalMinutes, numDataPointsRead];
    console.log(dbSettings);
    return dbSettings;
  };

  exports.saveTempData = function (temp1, temp2, temp3, temp4, temp5, temp6, temp7) {
    console.log("in save temperature data");
    console.log(temp1, temp2, temp3, temp4, temp5, temp6, temp7);
    //testSaveDelayInterval = testSaveDelayInterval - 2;
    console.log(currentDelayCountMin + " - current save delay Count");
    //console.log( "tempcount - " + tempcount + " Current Save Delay Count - " + currentSaveDelayCount);

    if (currentSaveDelayCount < 23){

        // average temperature readings to numOfReadingsToAvg
        tempSum1 = tempSum1 + temp1;
        tempSum2 = tempSum2 + temp2;
        tempSum3 = tempSum3 + temp3;
        tempSum4 = tempSum4 + temp4;
        tempSum5 = tempSum5 + temp5;
        tempSum6 = tempSum6 + temp6;
        tempSum7 = tempSum7 + temp7;
        tempcount++;

        if (tempcount == numOfReadingsToAvg) {
          avgTemp1 = parseFloat((tempSum1/tempcount).toFixed(1));
          avgTemp2 = parseFloat((tempSum2/tempcount).toFixed(1));
          avgTemp3 = parseFloat((tempSum3/tempcount).toFixed(1));
          avgTemp4 = parseFloat((tempSum4/tempcount).toFixed(1));
          avgTemp5 = parseFloat((tempSum5/tempcount).toFixed(1));
          avgTemp6 = parseFloat((tempSum6/tempcount).toFixed(1));
          avgTemp7 = parseFloat((tempSum7/tempcount).toFixed(1));
          tempSum1 = 0;
          tempSum2 = 0;
          tempSum3 = 0;
          tempSum4 = 0;
          tempSum5 = 0;
          tempSum6 = 0;
          tempSum7 = 0;
          tempcount = 0;
          console.log("averages - " + avgTemp1, avgTemp2, avgTemp3, avgTemp4, avgTemp5, avgTemp6, avgTemp7);

    //      console.log("Current Save Delay Count - " + currentSaveDelayCount);
//          if (currentSaveDelayCount == 0){

    //        comController.returnFlags = function(flags){
    //          console.log("Flags in db controller - " +  flags)
              console.log("Saving Temp Data");
              connection.query("delete from temperatures ORDER BY id limit 1", (err) => {
                if (err) {
                  console.log("Got a DB error in delete PipeTemp");
                  console.log (err);
                };
                return;
              });
              // NOTE:  assignment of temps to locations
              connection.query("INSERT INTO temperatures SET ?",
                {
                  tempOutDoorsSun: avgTemp7,
                  tempOutDoorsShade: 40,
                  tempFamilyRoom: avgTemp2,
                  tempBedRoom: avgTemp3,
                  tempDesk: avgTemp6,
                  tempPipe: avgTemp4,
                  tempWoodStove: avgTemp1,
                  tempFurnace: avgTemp5
                }, (err, result) => {
                  if (err) {
                      console.log("Got a DB error in savePipeTemp");
                      console.log (err);
                  };
                  return;
                }
              );
              // end get flags from com controller
    //        };
            currentSaveDelayCount = saveDelayIntervalSeconds;
//          };
//          delayCount++;
        };
    // end if save delay < 21
    }
//          currentSaveDelayCount = currentSaveDelayCount - 2;
  };

  exports.savePipeTemp = function (action, pipeTemp){
    console.log("In save pipe temp" + action + " , " + pipeTemp);
    connection.query("DELETE FROM recirculatorhistory ORDER BY id limit 1", (err) => {
      if (err) {
        console.log("Got a DB error in savePipeTemp");
        console.log (err);
      };
      return;
    });
    connection.query("INSERT INTO recirculatorHistory SET ?",
    {
      pipetemperatures: pipeTemp,
      recircOnOff: action,
    }, (err) => {
      if (err) {
        console.log("Got a DB error in savePipeTemp");
        console.log (err);
      };
      return;
    });
  };

  exports.changeState = function (action){
    if (action == "changeHome-Away"){
      connection.query ("UPDATE recirculatorsettings SET pipeTempOn = 35  WHERE id=2")
    }
    else if (action == "changeHome-Away"){
      
    }
  };

//    ******  Under construction   ********

  exports.upDateRecircSettings = function (newSettings) {
    console.log("in dbcntrlr");
    console.log(newSettings);

    // get existing settings and compare
    //connection.query ("SELECT * FROM recirculatorSettings WHERE id=1", (err, result) => {
    //  console.log("got back from getting recirc settings in update recirc setting");
    //  console.log(result);
    //  for (i=1; i < newSettings.length; i++) {
    //    compare newSettings[i] to result[i]

    //  step through the newSettings object looking for a value to save
    for (var key in newSettings){
      if (newSettings[key] == ''){
        console.log("nothing at - " + key)
      } else {
        console.log("At - " + key + " got - " + newSettings[key]);
        var y = newSettings[key];
        var x = key;
        if (typeof newSettings[key] === 'string'){
          y = "'" + y + "'"
        };
        var firstString = "UPDATE recirculatorsettings SET ";
        var secondString = " = ";
        var thirdString = " WHERE id=1";
        NewString = firstString.concat(x, secondString, y, thirdString);
        console.log (NewString);

        connection.query( NewString, (err, result) => {
          console.log(result);
          if (err) {
            console.log("Got a DB error in update reg setting");
            console.log (err);
          };
        })
      }
    }
  };

  exports.upDateGeneralSettings = function (newSettings){
    console.log("in db controler update general settings");
    console.log(newSettings);


  };

// end connection
});
