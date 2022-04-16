// The sever for my trading app
const express = require("express");
var bodyParser = require("body-parser");
const app = express();
const fs = require("fs");

var routes = require("./controllers/routeController.js");
app.use("/", routes);

var apicntrl = require("./controllers/apiController2.js");
//var testAlpaca = require("./testAlpacaRealTime");
//var clockTest = require("./clockTestAlpaca");

const PORT = process.env.PORT || 5000;

// our global variables
var currentWatchList = new Array;
var LongDelayLength = 30;
var currentShortDelay = 5;  // in 2 seconds
var currentShortDelayCount = currentShortDelay;
var currentLongDelayCount = LongDelayLength;
var numTimesThroughLoop = 0;
//var isMarketOpen = false;
var running = true;
//var aboutToClose = false;
var waitingToClose = 0;  // just so we enter the waiting to close calculation

const MINUTE = 60000;
var times = {
	openTime: 0,
	closeTime: 0,
	timeToOpen: 0,
	timeToClose: 0,
	nextOpenDay: 0,
	currentTime: 0,
	currentDay:0
};


var currentPortfolio = {
	cashOnHand: 1000,
	numberOfStocksCurrentlyOwned: 0,
	currentOwn: new Array
};
/* the object of each currentOwn element:
	var currentOwn = {
        symbol: '',
        sharesOwned: 0,
        purchasePrice: 0,
        currentPrice: 0,
        priceOne: 0,
        priceTwo: 0,
        priceThree,
        status: '',
        id: ''
	};
*/

async function run () {

function log(logThis){
	console.log(logThis);
	fs.appendFile('logConsoleFile.log', logThis + "\r\n", err => {
  if (err) {
    return console.error(err)
  }

});
};

function displayCurPortfolio(){
	log("Portfolio, Cash, num stocks owned");
	log(currentPortfolio.cashOnHand + "  " + currentPortfolio.numberOfStocksCurrentlyOwned)
	for (i=0; i<currentPortfolio.numberOfStocksCurrentlyOwned; i++){
		log("Symbol  Shares Owned  Purchase Price  current Price  priceOne  PriceTwo  PriceThree  Status");
		log(currentPortfolio.currentOwn[i].symbol + "      " + currentPortfolio.currentOwn[i].sharesOwned + "     " + currentPortfolio.currentOwn[i].purchasePrice + "     " + currentPortfolio.currentOwn[i].currentPrice + "     " + currentPortfolio.currentOwn[i].priceOne + "     " + currentPortfolio.currentOwn[i].priceTwo + "     " + currentPortfolio.currentOwn[i].priceThree + "     " + currentPortfolio.currentOwn[i].status);
	};
};

function displayClockObj(curCLockObj){
	log("timestamp: " + curCLockObj.timestamp)
	log("is_open: " + curCLockObj.is_open)
	log("next_open: " + curCLockObj.next_open)
	log("next_close: " + curCLockObj.next_close)
}

function secondsToHms(d) {

	let daysToOpen = Math.trunc(d/86400); // number of secs in a day
	if (daysToOpen >= 1 ){
		timer = daysToOpen/2;
	}
	let plusHours = Math.trunc((d - (daysToOpen*86400))/3600);
	let plusMin = Math.trunc((d - ((daysToOpen*86400) + (plusHours*3600)))/60)
	if (plusMin < 10){
		var minChar = "0" + plusMin;
	} else {
		var minChar = plusMin
	};

	let plusSecs = Math.trunc((d - ((daysToOpen*86400) + (plusHours*3600) + (plusMin*60))))
	if (plusSecs < 10){
		var SecsChar = "0" + plusSecs;
	} else {
		var SecsChar = plusSecs
	};
    return daysToOpen + " " + plusHours + ":" + minChar + ":" + SecsChar + " "; 
};


async function awaitMarketOpen(){
    return new Promise(resolve => {
      const check = async () => {
        try {
          let clock = await apicntrl.fromOutside()
          log("in await, clock, check if open - ");
          displayClockObj(clock)
//          let maybeOpen = true;
//          if (maybeOpen) {
		  if (clock.is_open) {
            resolve()
          } else {
          	log("in the is not open else");
	        let openTime = new Date(clock.next_open);
	        log("my open time - " + openTime);
			let currTime = new Date(clock.timestamp);
			log("my current time - " + currTime);
			let timeToOpen = (openTime - currTime)/1000;
			//let timeToOpen = 20;
			log("timeToOpen in secs - " + timeToOpen);
			let initialDelay = Math.trunc(timeToOpen * 0.85);
			//let initialDelay = 30;
			log ("initial delay in secs - " + initialDelay);

	        var myVar = setInterval(countDown, 1000);

	        function countDown (){
	        	if(initialDelay == 0){
	        		clearInterval(myVar);
	        		check()
	        	}else{	
		        	initialDelay--
					process.stdout.write("\rcurrent time to open delay count - " + secondsToHms(initialDelay));
	        	} 
	        }
	      }
        } catch (err) {
          log(err.error)
        }
      }
      check()
      //running = true;
    })
// end await market open
};

async function checkIfClose(){
	    if (waitingToClose > 0){
			waitingToClose--
			log("waiting to close - " + waitingToClose);
	    } else {

		    return new Promise(resolve => {
		      const check = async () => {
		        try {
		          let clock = await apicntrl.fromOutside()
		          log("in waiting to close, await clock - ");
		          displayClockObj(clock)
		          if (clock.is_open) {
						//the market just opened so set the timer
						log("---------- THE MARKET JUST OPENED -------------");
						log("----------- or is about to close --------------");
						running = true;
						// calculate the waiting to close counter
						let closeTime = new Date(clock.next_close);
						log("my close time - " + closeTime);
						let currTime = new Date(clock.timestamp);
						log("my current time - " + currTime);
						// time untill the market closes in seconds
						let timeToClose = (closeTime - currTime)/1000;
						log("Time To Close in secs - " + timeToClose);
						if (timeToClose < 80){
							waitingToClose = 0;
							// market about to close so check every short process
						} else {
							// set the waiting to close counter to 2 min before closing
							waitingToClose = Math.trunc((timeToClose-120)/16);
							log("Waiting to close - " + waitingToClose);
							
						}
					} else {
						log("the market just closed so clean up - no cleanup at this time");
						running = false;
						apicntrl.clearAllSubscribs();
					};

		        } catch (err) {
		          log(err.error)
		        }
		      }
		      check()
		    })
		// end wating to close else    
	    }
// end check if close
}


// on startup get the movers list
async function initialStartup (){
	log("------- in initial startup --------")


	let goGetmarketWatchMovers = new Promise(function(resolve, reject){
		stuff = apicntrl.getMarketWatchScrapedMovers();
		var myVar = setTimeout(marketWatchMoversTimer, 2000);

		function marketWatchMoversTimer(){
			log("Wat Da Fa - " + stuff);
			if (stuff == "error"){
				reject("got an error in Market Watch scrape");
			} else {
				resolve(stuff);
			}
		}
	});

	goGetmarketWatchMovers.then(
		function(initialMovers){
			log("in the Market Watch .then -");
			//log(initialMovers);
			//apicntrl.initializeSymbolList(initialMovers);
			updateWatchList(initialMovers);
		},
		function(error){
			log("Market Watch scrape failed - ", error);
		}
	);

	const initialCNNMovers = await apicntrl.getCNNScrapedMovers();
	const x = await CNNScrapedPromise(4000, initialCNNMovers);
	log("after awaiting the CNN scrape promise");

// end initial startup
};

//Promise for initializing the watch list and getting the CNN movers
function CNNScrapedPromise(t, CNNMovers){
	return new Promise(function(){
		setTimeout(function(){
			log("in the CNN scraped promise - movers list CNNMovers");
			//log(CNNMovers);
			//log("-----------------");
			updateWatchList(CNNMovers);
//			getQuotes(newMoversList)
		}, t);
	})
};

//***  done with initialization



// ---------------  EXECUTION STARTS HERE  ---------------------

//fs.access(logConsoleFile.log){}

log("Waiting fo rthe market to open");
await awaitMarketOpen()
log("Back from await market open");

apicntrl.startStreamConnection();

initialStartup();

// Main program loop - in a timer
var shortInterval = setInterval(mainLoop, 2000);
//log("outside timer - " + myVar);

// main loop starts every 2 seconds
async function mainLoop(){
	// initially 8
	currentShortDelayCount --;
	process.stdout.write("\rcurrent short delay count - " + currentShortDelayCount);
	if (currentShortDelayCount == 0){
		currentShortDelayCount = currentShortDelay;
		shortProcess();
		if (!running){
			clearInterval(shortInterval);
			await awaitMarketOpen();
		}
		currentLongDelayCount --;
		log("current long delay count - " + currentLongDelayCount);
		if (currentLongDelayCount == 0){
			currentLongDelayCount = LongDelayLength;

			//check for new watch items
			log("going back to initial startup to check for new movers");
			initialStartup();

			//apicntrl.checkWhenClose();
			//updateMoverList();
		};

	};
};

// the processing every short interval
async function shortProcess(){
	numTimesThroughLoop++;
	//apicntrl.getCurrentQuotes();
	//apicntrl.testInCommingPositions();
	checkIfClose();
	checkPositions();
	getQuotes();
	//log("in short process after get quotes - ");
	updateCurrentValue();
	//apicntrl.testInCommingQuotes();
	//routes.updateData(currentWatchList, currentPortfolio);

//	var latestQuotes = await apicntrl.getBatchQuotes(symbolList);
//	const someReturnData = await shortProcessPromise(3000, latestQuotes)
	
};

//check if sell funciton
// get current positions from Alpaca compare to our positions, sell if appropriate
async function checkPositions (){
	apicntrl.getOurPositions.then(
		function(tempCurrentPositions){
			log("We're back !! (from the get possitions)");
			// THis displays the price and shares of our current positions from Alpaca
			log("Symbol Quantity Current price of the new positions");
			for(i=0; i<tempCurrentPositions.length; i++){
				log(tempCurrentPositions[i].symbol + "       " + tempCurrentPositions[i].qty + "       " + tempCurrentPositions[i].current_price);
			};

			latestMovers = new Array;
			for(i=0; i<tempCurrentPositions.length; i++){

				/* vendors contains the element we're looking for */
				//if (vendors.some(e => e.Name === 'Magenic')) {
				if (currentPortfolio.currentOwn.some(e => e.symbol == tempCurrentPositions[i].symbol)){
					log("YEs temp pos sym is in cur port sym")

				} //if a stock in Alpace portfolio is not in our portfolio - ERROR SeLL it
				else {
					//log("a stock in Alpaca Portfolio was not in our portfolio - SELL!!!");
					//apicntrl.sellOneStock(tempCurrentPositions[i].symbol, tempCurrentPositions[i].qty)
					log("a stock in Alpaca Portfolio was not in our portfolio - ADD!! - " + tempCurrentPositions[i].symbol);

					addToCurrentOwn(tempCurrentPositions[i]);
				};

				// make sure our positions are on the watch list
				if (currentWatchList.some(e => e.symbol == tempCurrentPositions[i].symbol)){
					log("no problem with - " + tempCurrentPositions[i].symbol)
				} else {
					log("in positions push onto temp watch list")
					//build a new 
					var tempWatchList = {
						symbol: '',
						price: 0,
					};

					tempWatchList.symbol = tempCurrentPositions[i].symbol;
					tempWatchList.price = tempCurrentPositions[i].current_price;
					//log("tempwatchlist right before the push - ");
					//log(tempWatchList);
					latestMovers.push(tempWatchList);
				};
			};
			log("in positions right before update watchlist, latest movers:");
			latestMovers.forEach(log, latestMovers[i]);
			log("was there something above this line?");
			updateWatchList(latestMovers)

			for(i=0; i<currentPortfolio.length; i++){
				//if (vendors.some(e => e.Name === 'Magenic')) {
				if (tempCurrentPositions.some(e => e.symbol == currentPortfolio[i].symbol)){
					log("Got the other way around");
				//if (tempCurrentPositions.symbol.includes (currentPortfolio[i].symbol)){
					}//do nothing there is no change
				else {
				 // probably means a sale went through, so remove it from our portfolio
				 	log("a stock in our portfolio was not in Positions")
					currentPortfolio.splice(i,	1);
				};
			};

			displayCurPortfolio();




		}
	), // end the get alpaca positions then
	function(error){
		log("ERROR from get positions - " + error);
	};
};



// new get quotes using promise properly
function getQuotes(){
	log("in get quotes");
		initialQuotes = apicntrl.getCurrentQuotes();
//			initialQuotes = apicntrl.webBids();
			log("back with quotes = ");
			for (i=0; i<initialQuotes.length; i++){
				log(initialQuotes[i].symbol + "   " + initialQuotes[i].askPrice + "   " + initialQuotes[i].updated);
			}

			saveNewPricesToWatchlist(initialQuotes);

/*
newPricesList[i].open;
newPricesList[i].current;
newPricesList[i].currentTime;
newPricesList[i].name;
newPricesList[i].symbol;
*/

};



// update the watch list with the latest movers
// called at the long intervale to update with the new movers
// also called at startup with the yahoo movers and the CNN movers
function updateWatchList(latestMovers){
	log("in update update watchlist with the latest movers - ");
	log(latestMovers)

	// check to see if a new stock is already on the list
	for(var i=0; i<currentWatchList.length; i++){
		for (var x=latestMovers.length-1; x>=0; x--){
			if(latestMovers[x].symbol === currentWatchList[i].symbol){
				currentWatchList[i].listedGain = latestMovers[x].percentChange;
				log(" remove the item from the new aray since it is already on the current")
				currentWatchList[i].name = latestMovers[x].name
				latestMovers.splice(x, 1);
			}
		}
	}
	// if no new movers, skip
	if(latestMovers.length > 0){
		log("in update update watchlist with the latest movers a second time - ");
		log(latestMovers)

		var newSymbolList = [];
		// the array will only have new items for the watch list
		for (x=0; x<latestMovers.length; x++){
				log(latestMovers[x].symbol);
				//build a new 
					var tempWatchList = {
						symbol: '',
						name: '',
						myRanking: 0,	//absolute
						myGain: 0,     //percent
						listedGain: 0,  //percent
						openPrice: 0,
						askPrice1: 0,
						bidPrice1: 0,
						time1: 0,
						askPrice2: 0,
						bidPrice2: 0,
						time2: 0,
						askPrice3: 0,
						bidPrice3: 0,
						time3: 0,
						askPrice: 0,
						bidPrice: 0,
						currentTime: 0
					};

					tempWatchList.symbol = latestMovers[x].symbol;
					tempWatchList.name = latestMovers[x].name;
					tempWatchList.myRanking = 0;
					tempWatchList.myGain = 0;
					tempWatchList.listedGain = latestMovers[x].percentChange;
					tempWatchList.openPrice = 0;
					tempWatchList.askPrice1 = 0;
					tempWatchList.bidPrice1 = 0;
					tempWatchList.askPrice2 = 0;
					tempWatchList.bidPrice2 = 0;
					tempWatchList.askPrice3 = 0;
					tempWatchList.bidPrice3 = 0;
					tempWatchList.askPrice = latestMovers[x].price;
					tempWatchList.bidPrice = 0;
					tempWatchList.currentTime = 0;
					//log("tempwatchlist right before the push - ");
					//log(tempWatchList);
					currentWatchList.push(tempWatchList);
					newSymbolList.push(latestMovers[x].symbol)
			}
	//	currentWatchList = tempTempWtchLst;

		// to subscribe to quotes
		apicntrl.updateSymbolList(newSymbolList);

	//	routes.updateData(currentWatchList, currentPortfolio);

	} else {
		log("There are no new movers");
	}
	showCurWatchList();
// end update watch list
};



// update current watch list with the latest quotes
function saveNewPricesToWatchlist(newPricesList){
	log("saving new prices to watch list, new prices - ");
	log("Num Times Through Loop  - " + numTimesThroughLoop);
	//log("new prices adding to watch list");
	//log(newPricesList[i].symbol + "  " + newPricesList[i].current);

	// shift the prices down, discarding the oldest
		//log(currentWatchList[i].symbol)
		for(x=0; x<newPricesList.length; x++){
			//log(newPricesList[x].symbol)

			
			// this replaces the stock price in portfolio with the latest quote
			for(i=0; i<currentPortfolio.currentOwn.length; i++){
				if(currentPortfolio.currentOwn[i].symbol == newPricesList[x].symbol){
					log("shifting - " + currentPortfolio.currentOwn[i].symbol)
					// shift the prices down in age
					currentPortfolio.currentOwn[i].priceThree = currentPortfolio.currentOwn[i].priceTwo;
					currentPortfolio.currentOwn[i].priceTwo = currentPortfolio.currentOwn[i].priceOne;
					currentPortfolio.currentOwn[i].priceOne = currentPortfolio.currentOwn[i].currentPrice;
					currentPortfolio.currentOwn[i].currentPrice = newPricesList[x].bidPrice;
					log("just put new price on current own - " + currentPortfolio.currentOwn[i].currentPrice);
				};
			};
			for (i=0; i<currentWatchList.length; i++){
				if(currentWatchList[i].symbol == newPricesList[x].symbol){
					//log("------------ half way into the save ----------");
					//log(newPricesList[x].updated);
					if(newPricesList[x].updated){
						currentWatchList[i].askPrice3 = currentWatchList[i].askPrice2;
						currentWatchList[i].bidPrice3 = currentWatchList[i].bidPrice2;
						currentWatchList[i].time3 = currentWatchList[i].time2;
						currentWatchList[i].askPrice2 = currentWatchList[i].askPrice1;
						currentWatchList[i].bidPrice2 = currentWatchList[i].bidPrice1;
						currentWatchList[i].time2 = currentWatchList[i].time1;
						currentWatchList[i].askPrice1 = currentWatchList[i].askPrice;
						currentWatchList[i].bidPrice1 = currentWatchList[i].bidPrice;
						currentWatchList[i].time1 = currentWatchList[i].currentTime;

						currentWatchList[i].askPrice = newPricesList[x].askPrice;
						currentWatchList[i].bidPrice = newPricesList[x].bidPrice;

						//log("--------------- we got into the save -----------------")
						//log(newPricesList[x].current);
						//currentWatchList[i].name = newPricesList[i].name;


						//calculate the percent gain for each stock on the watch list
						Math.round(currentWatchList[i].myGain = (((currentWatchList[i].askPrice-currentWatchList[i].askPrice3)/currentWatchList[i].askPrice3)*100).toFixed(2))/1;

						log("finished shifting prices for " + newPricesList[x].symbol);



						//	if(newPricesList[x].symbol == currentPortfolio.currentOwn[i].symbol)
									//log(currentWatchList[i].symbol + "  " + currentWatchList[i].myGain);
						//log("currently updated stock - " + currentWatchList[i].symbol + " price - " + currentWatchList[i].currentPrice + " price1 - " + currentWatchList[i].price1 + " my gain - " + currentWatchList[i].myGain);
					}
				}

		}
	};

	//apicntrl.clearQuotes();
	showCurWatchList();
	checkIfSell();
	handleLatestQuotes()
	//routes.updateData(currentWatchList, currentPortfolio);
};

// called from save new prices to watchlist
// check the prices on the watch and see if we buy
var handleLatestQuotes = function (){
	log("in handle latest quotes");
/*
	// update the prices on the currently owned list - from the current watch list
	// push the new prices in currently owned down is the age ranking
	for (y=0; y<currentPortfolio.numberOfStocksCurrentlyOwned; y++){
		for (x=0; x<currentWatchList.length; x++){
			// if we own the stock on the watchlist at i set the current price in current portfolio
			if (currentWatchList[x].symbol == currentPortfolio.currentOwn[y].symbol){
				currentPortfolio.currentOwn[y].priceThree = currentPortfolio.currentOwn[y].lastPrice;
				currentPortfolio.currentOwn[y].lastPrice = currentPortfolio.currentOwn[y].currentPrice;
				currentPortfolio.currentOwn[y].currentPrice = currentWatchList[x].currentPrice;
			}
		}
	};
	log("in handle latest quotes, current portfolio - ");
	displayCurPortfolio();
*/
/*
	function sellPromise(t, val) {
	   return new Promise(function(resolve) {
	       setTimeout(function() {
***				sellSuccess(val);
	       }, t);
	   });
	};
*/

	// if we've been through the loop more than two times
	// process the results and make a purchase
	log ("number of times through loop - " + numTimesThroughLoop);
	showCurWatchList();
	if (numTimesThroughLoop >= 3){
		numTimesThroughLoop = 0;
		// look for the two top gainers and save their index
		var highestGainIndex = 0;
		//var secondHighestGainIndex = 0;
		for (i=1; i<currentWatchList.length-1; i++){
				//if(parseFloat(currentWatchList[i].myGain) > parseFloat(currentWatchList[x].myGain)){
				if(currentWatchList[highestGainIndex].myGain < currentWatchList[i].myGain){
					highestGainIndex = i;
				};
				log("highest gain - " + currentWatchList[highestGainIndex].symbol);
		};

//		log("The two top gainers are - ");
//		log(currentWatchList[highestGain].symbol + "  " + currentWatchList[highestGain].myGain);
//		log(currentWatchList[secondHighestGain].symbol + "  " +currentWatchList[secondHighestGain].myGain);
		var OKToBuy = false;
		var stockToBuy = '';
		var sharesToBuy = '';
		var priceToBuyAt = 0;

		// buy a stock if we don't own any or if we only own 1
		if (currentPortfolio.numberOfStocksCurrentlyOwned == 0){
			stockToBuy = currentWatchList[highestGainIndex].symbol;
			sharesToBuy = Math.floor((currentPortfolio.cashOnHand/2)/currentWatchList[highestGainIndex].currentPrice);
			priceToBuyAt = currentWatchList[highestGainIndex].currentPrice;
			if(currentWatchList[highestGainIndex].myGain > 1) {
					OKToBuy = true
			};
		} else {
//			for (i=0; i<currentPortfolio.numberOfStocksCurrentlyOwned; i++){
			if (currentPortfolio.numberOfStocksCurrentlyOwned == 1) {
				//log("in buy num owned - " + currentPortfolio.numberOfStocksCurrentlyOwned);
				stockToBuy = currentWatchList[highestGainIndex].symbol
				if(stockToBuy == currentPortfolio.currentOwn[0].symbol){
					log("we already own stock - " - stockToBuy);

/*						stockToBuy = currentWatchList[secondHighestGainIndex].symbol
					if(stockToBuy == currentPortfolio.currentOwn[0].symbol){
						log("we already own stock - " - stockToBuy);
						OKToBuy = false;
					} else {			
						sharesToBuy = Math.floor(currentPortfolio.cashOnHand / currentWatchList[secondHighestGainIndex].currentPrice);
						priceToBuyAt = currentWatchList[secondHighestGainIndex].currentPrice;
						if(currentWatchList[secondHighestGainIndex].myGain > 1) {OKToBuy = true};	
					};
*/				} else {
					sharesToBuy = Math.floor(currentPortfolio.cashOnHand / currentWatchList[highestGainIndex].currentPrice);
					priceToBuyAt = currentWatchList[highestGainIndex].currentPrice;
					if(currentWatchList[highestGainIndex].myGain > 1) {
						OKToBuy = true
					};
				};
			};
		};
		log("stock to buy - " + stockToBuy + "  Number - " + sharesToBuy);
		//log("Numbre of shares to buy - " + sharesToBuy);
		log("ok to buy - " + OKToBuy);
		if(OKToBuy){
			apicntrl.makePurchase(stockToBuy, sharesToBuy, priceToBuyAt).then(
				function(purchaseResults){
					log("Back from the Purchase");
					log(purchaseResults);
				},
				function(error){
					log("ERROR from get positions - " + error);
				}
			)
		};
		
	};

	displayCurPortfolio();
	//routes.updateData(currentWatchList, currentPortfolio);

//end handle latest quote
};
/////////////////////////////////////////////////////////////////////////////////


			// Check if sell
var checkIfSell = function(){
	log("in check if sell");
	displayCurPortfolio();
	if (currentPortfolio.numberOfStocksCurrentlyOwned > 0){
		for (i=0; i<currentPortfolio.numberOfStocksCurrentlyOwned; i++){
			// if the stock went down on two concurent cycles
			if(currentPortfolio.currentOwn[i].priceThree > currentPortfolio.currentOwn[i].priceTwo && currentPortfolio.currentOwn[i].priceTwo > currentPortfolio.currentOwn[i].priceOne && currentPortfolio.currentOwn[i].priceOne > currentPortfolio.currentOwn[i].currentPrice){
					
					log("we should sell - " + currentPortfolio.currentOwn[i].symbol);
					apicntrl.sellOneStock(currentPortfolio.currentOwn[i].symbol, currentPortfolio.currentOwn[i].sharesOwned)
						.then(
							function(sellResults){
								log("Back from the Sell");
								log(sellResults);
									var tempOwn = {
								        symbol: '',
								        sharesOwned: 0,
								        purchasePrice: 0,
								        currentPrice: 0,
								        priceOne: 0,
								        priceTwo: 0,
								        priceThree,
								        status: '',
								        id: ''
									};
									tempOwn.symbol = sellResults.symbol;
									tempOwn.purchasePrice = priceToBuyAt;
									tempOwn.sharesOwned = sellResults.qty;
									tempOwn.currentPrice = 0;
									tempOwn.priceThree = 0;
									tempOwn.priceTwo = 0;
									tempOwn.priceOne = 0;
									tempOwn.status = sellResults.status;
									tempOwn.id = sellResults.id;
									currentPortfolio.currentOwn.push(tempOwn);
							}
						),
						function(error){
							log("ERROR from get positions - " + error);
						};
			};
		};
	};

	// end check if sell
}




//will add a stock to our current portfolio list
// input - position opject 
var addToCurrentOwn = function (newPositionObj){
	log("in add to current own, position coming in - ");
	log(newPositionObj);
						var tempOwn = {
							symbol: '',
							sharesOwned: 0,
							purchasePrice: 0,
							currentPrice: 0,
							priceOne: 0,
							priceTwo: 0,
							priceThree: 0,
							status: '',
							id: ''
						};
						tempOwn.symbol = newPositionObj.symbol;
						tempOwn.purchasePrice = newPositionObj.cost_basis;
						tempOwn.sharesOwned = newPositionObj.qty;
						tempOwn.currentPrice = newPositionObj.current_price;
						tempOwn.priceOne = 0;
						tempOwn.priceTwo = 0;
						tempOwn.priceThree = 0;
						tempOwn.status = 'own';
						tempOwn.id = newPositionObj.asset_id;
						currentPortfolio.currentOwn.push(tempOwn);
						currentPortfolio.numberOfStocksCurrentlyOwned++
};

var sellSuccess = function (sellSuccessdata){
	//stockSold, cashRecieved, price){
	currentPortfolio.cashOnHand = currentPortfolio.cashOnHand + sellSuccessdata.cash;
	currentPortfolio.numberOfStocksCurrentlyOwned --;
	//log ("in sell success stock - " + sellSuccessdata.stock);
	//var elementPos = array.map(function(x) {return x.id; }).indexOf(idYourAreLookingFor);
	//var index = a.findIndex(x => x.prop2 ==="yutu");
	var index = currentPortfolio.currentOwn.findIndex(x => x.symbol === sellSuccessdata.stock);
	//var index = currentPortfolio.currentOwn.map(function(stockSold) {return stockSold.id; }).indexOf(idYourAreLookingFor);
	//const index = currentPortfolio.currentOwn.indexOf(stockSold);

	//log("index - " + index);
	currentPortfolio.currentOwn.splice(index, 1);
	log("in sell success, portfolio - ");
	//log(currentPortfolio);
	updateCurrentValue();
	routes.updateData(currentWatchList, currentPortfolio);

	return;
};


	// calculate our current value
var updateCurrentValue = function(){
	currentValue = currentPortfolio.cashOnHand;
	for (i=0; i<currentPortfolio.numberOfStocksCurrentlyOwned; i++){
		var valOStockOne = currentPortfolio.currentOwn[i].currentPrice * currentPortfolio.currentOwn[i].sharesOwned;
		currentValue = currentValue + valOStockOne;
	}
	log("our current value  - " + currentValue);
};


//This function is called to write the watchlist to the console
function showCurWatchList (){
	log("OFFICIAL current watch list - ");
	log("symbol price3  price2  price1  currentprice  listedgain  mygain")
	for (i=0; i<currentWatchList.length; i++){
		log(currentWatchList[i].name);
		log(currentWatchList[i].symbol + "        " + currentWatchList[i].askPrice3 + "        " + currentWatchList[i].askPrice2 + "        " + currentWatchList[i].askPrice1 + "       " + currentWatchList[i].askPrice + "        " + currentWatchList[i].listedGain + "        " + currentWatchList[i].myGain);
	}
};

// to send current lists to the front end
exports.returnCurrentData = function(){
	return(currentWatchList, currentPortfolio);
};

app.listen(PORT, function() {
  log("App listening on PORT: " + PORT);
});

// end function run
};
run()
