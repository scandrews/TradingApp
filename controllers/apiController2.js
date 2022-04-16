const Alpaca = require('@alpacahq/alpaca-trade-api');

const config = require('../config.json');
var cheerio = require("cheerio");
var request = require("request");
const fs = require("fs");

var server = require('../server2');
let { AlpacaClient, AlpacaStream } = require('@master-chief/alpaca');

const alpacaToken = config.APCA_API_KEY_ID;
const alpacaTokenSecret = config.APCA_API_SECRET_KEY;

const iexToken = config.IEX_PUB_KEY;
const iexTokenSecret = config.IEX_SECRET_KEY;

const alpaca = new Alpaca({
      keyId: alpacaToken,
      secretKey: alpacaTokenSecret,
      paper: true,
    });

const client = new AlpacaClient({
  credentials: {
    key: alpacaToken,
    secret: alpacaTokenSecret,
    // access_token: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  for OAuth
    paper: true,
  },
  rate_limit: true,
})

let quoteBuffer1 = new Array;
let quoteBuffer2 = new Array;
let whichBuffer = true;

/*
var positions = [
  {
    asset_id: '53833666-cd3e-442c-8d59-3c4af8ce7aa4',
    symbol: 'ALGN',
    exchange: 'NASDAQ',
    asset_class: 'us_equity',
    asset_marginable: false,
    qty: '1',
    avg_entry_price: '442.81',
    side: 'long',
    market_value: '437.06',
    cost_basis: '442.81',
    unrealized_pl: '-5.75',
    unrealized_plpc: '-0.0129852532688964',
    unrealized_intraday_pl: '-5.75',
    unrealized_intraday_plpc: '-0.0129852532688964',
    current_price: '437.06',
    lastday_price: '437.06',
    change_today: '0'
  }
]
*/


var testNum = 1;
var currentSymbolList = [];
var currentQuotes = [];
var newCurrentQuote = new Array;

const websocket = alpaca.data_stream_v2;

exports.startStreamConnection = function(){

  console.log("started the real time test");
  console.log("websocket - ")
  console.log(websocket);

  //startStockFeed = function(){
  console.log("in start stock feed");

  websocket.connect(function(result){
  });

  websocket.onConnect(function(event) {
    console.log("got the connect");

    websocket.subscribeForQuotes(currentSymbolList)
    websocket.onStockQuote(function(quoteResult) {
      console.log(quoteResult);
      if(whichBuffer){
        quoteBuffer1.push(quoteResult);
        //logRawQuotes(quoteResult);
      } else {
        quoteBuffer2.push(quoteResult);
        //logRawQuotes(quoteResult);
      }
    })

/*
    websocket.subscribeForTrades(currentSymbolList)
    websocket.onStockTrade(function(tradeResult) {
      console.log(tradeResult);
      //logRawTrades(tradeResult)
      //var tempQuote = [];
      for(i=0; i<currentQuotes.length; i++){
        if(currentQuotes[i].symbol == tradeResult.Symbol){
          currentQuotes[i].current = tradeResult.Price;
          currentQuotes[i].updated = true
        }
      }
    });
*/


  });  // end on connect
};  // end start stream connection

exports.getCurrentQuotes = function (){
  log("*** ------------ In Get Current Quotes ------------ ***")
  log("symbol list - ");
  // keep which buffer for this funct, but change it for the stream
  whichBufferHere = whichBuffer;
  if (whichBuffer){
    whichBuffer = false
  } else {
    whichBuffer = true
  };
  currentSymbolList.forEach(log, currentSymbolList[i]);
  newCurrentQuote.length = 0;
  for (x=0; x<currentSymbolList.length; x++){
    //log("length of current symbol list - " + currentSymbolList.length);
    //log("current current symbol - " + currentSymbolList[x]);
    //log("which buffer here - " + whichBufferHere);
    var bidPriceTotal = 0;
    var askPriceTotal = 0;
    var count = 0;
    var tempArray = {
      symbol: '',
      bidPrice: 0,
      askPrice: 0,
      updated: false
    }
    if (whichBufferHere){
      //log("did we get this far?")
      //log("quote buffer length - " + quoteBuffer1.length);
      for (i=0; i<quoteBuffer1.length; i++){
        //log (" A Quote - ")
        //log(currentSymbolList[x])
        //log (quoteBuffer1[i].Symbol + "  " + quoteBuffer1[i].AskPrice);
        //console.log(quoteBuffer1[i].Symbol + " " + quoteBuffer1[i].BidPrice);
        if(quoteBuffer1[i].Symbol == currentSymbolList[x]){
          bidPriceTotal = bidPriceTotal + quoteBuffer1[i].BidPrice;
          askPriceTotal = askPriceTotal + quoteBuffer1[i].AskPrice;
          count++
          tempArray.updated = true;
        }
      }
    } else {
      //log("or maybe we got this one instead");
      //log("quote buffer length - " + quoteBuffer2.length);
      for (i=0; i<quoteBuffer2.length; i++){
        //log (" A Quote - ")
        //log (quoteBuffer1[i])
        //console.log(quoteBuffer1[i].Symbol + " " + quoteBuffer1[i].BidPrice);
        if(quoteBuffer2[i].Symbol == currentSymbolList[x]){
          bidPriceTotal = bidPriceTotal + quoteBuffer2[i].BidPrice;
          askPriceTotal = askPriceTotal + quoteBuffer2[i].AskPrice;
          count++
          tempArray.updated = true;
        }
      }
    };
    if(tempArray.updated){
      tempArray.symbol = currentSymbolList[x];
      Math.round(tempArray.bidPrice = bidPriceTotal / count).toFixed(2);
      Math.round(tempArray.askPrice = askPriceTotal / count).toFixed(2);
      //log(tempArray.symbol + "  " + tempArray.askPrice + "  " + tempArray.updated);
      newCurrentQuote.push(tempArray);
    };
  };
  log("OK Here are the latest quotes");
  for (i=0; i<newCurrentQuote.length; i++){
    log("Stock - " + newCurrentQuote[i].symbol);
    log("Bid  -  " + newCurrentQuote[i].bidPrice);
    log("Ask  -  " + newCurrentQuote[i].askPrice);
    log("Updated - " + newCurrentQuote[i].updated);
  }
  if (whichBufferHere){
      quoteBuffer1.length = 0;
  } else {
      quoteBuffer2.length = 0;
  };

  return(newCurrentQuote);
};


function logRawTrades(quote){
      log("quoteResult - ");
//      log("T: " + quote.T);
      log("Symbol: " + quote.Symbol);
//      log("ID " + quote.ID); 
//      log("Exchange " + quote.Exchange) 
      log("Price: " + quote.Price); 
      log("Size: " + quote.Size); 
      log("Timestamp: " + quote.Timestamp) 
};

function logRawQuotes(quote){
      log("Quote Result - ");
      log("T: " + quote.T);
      log("Symbol:     " + quote.Symbol);
      log("BidExchange:" + quote.BidExchange); 
      log("BidPrice:   " + quote.BidPrice) 
      log("BidSize:    " + quote.BidSize); 
      log("AskExchange:" + quote.AskExchange); 
      log("AskPrice:   " + quote.AskPrice) 
      log("AskSize:    " + quote.AskSize);
      log("Conditions: " + quote.Conditions); 
      log("Tape:       " + quote.Tape); 
      log("Timestamp:  " + quote.Timestamp) 
};

function log(logThis){
  console.log(logThis);
  fs.appendFile('logConsoleFile.log', logThis + "\r\n", err => {
      if (err) {
        return console.error(err)
      }
  });
};

function logsymbolist(curSymlist){
  for (i=0; i<curSymlist.length; i++){
    log (curSymlist[i]);
  };
};

/*
exports.testInCommingQuotes = function (){
  for(i=0; i<currentQuotes.length; i++){
    currentQuotes[i].current = testNum;
    currentQuotes[i].updated = true;
    testNum++
  }
}
*/
/*
exports.testInCommingPositions = function (){
  for(i=0; i<positions.length; i++){
    positions[i].current_price = testNum;
    testNum++
    }
};
*/

exports.fromOutside = async function(){
  try{
        let clock = await client.getClock()
        console.log("in the await client get clock");
        console.log(clock);
        return (clock)
  } catch(error) {
    console.log(error);
  };
};


exports.webBids = function(){
/*    log("current quotes");
    log("Symbol    Price   updated")
  for (i=0; i<currentQuotes.length; i++){
    log(currentQuotes[i].symbol + currentQuotes[i].price + currentQuotes[i].updated)
  }
*/
  return (currentQuotes);
};

exports.clearQuotes = function (){
  for (i=0; i<currentQuotes.length; i++){
    currentQuotes[i].updated = false;
    //log("clearing the updated on - " + currentQuotes[i].symbol)
  }
}

exports.clearAllSubscribs = function(){
      websocket.unsubscribeFromTrades(currentSymbolList);
      currentSymbolList.length = 0;
      currentQuotes.length = 0;
};

// adds new stocks from the watch list to the symbol list and the quote list
exports.updateSymbolList = function (newSymbols){
  log("in APICNTRL update symbol list, new list - ");
  //logsymbolist(newSymbols);
//  for (i=0; i<currentSymbolList; i++){
//    log(currentSymbolList[i]);       };
  var newUniqueSymbols = [];
  for(i=0; i<newSymbols.length; i++){
    if(currentSymbolList.includes(newSymbols[i])){
      log("do nothing with te current symbol");
    } else {
      newUniqueSymbols.push(newSymbols[i]);
      currentSymbolList.push(newSymbols[i])
      var tempQuotes = {
            symbol: '',
            current: 0
      };
      tempQuotes.symbol = newSymbols[i];
      tempQuotes.current = 0;
      tempQuotes.updated = false;
      
      currentQuotes.push(tempQuotes);
    }
  }
  //log("new unique symbols - ");
  //logsymbolist(newUniqueSymbols);
  if (newUniqueSymbols.length > 0){
//    websocket.subscribeForTrades(newUniqueSymbols);
    websocket.subscribeForQuotes(newUniqueSymbols);
  }
  log("still in update symbol list, new current symbol list - ")
    logsymbolist(currentSymbolList);
};

exports.getOurPositions = new Promise(async (resolve) => {
        try {
          let positions = await alpaca.getPositions()
          log(positions);
          resolve(positions)
        } catch (err) {
          console.log(err.error);
        }
});


exports.makePurchase = function (stockToBuy, numOfSharesToBuy, priceTOBuyAt){
    console.log("We're Buying - " + stockToBuy, numOfSharesToBuy, priceTOBuyAt);

    return new Promise(async (resolve) => {
      try {
        let orderResults = await alpaca.createOrder({
          symbol: stockToBuy,
          qty: numOfSharesToBuy,
          side: 'buy',
          type: 'market',
          time_in_force: 'day'
        })
        console.log("Market order completed");
        console.log(orderResults);
        resolve(orderResults)
      } catch (err) {
        console.log("Order of did not go through")
        resolve(false)
      }
    })
//  }

    //var spent = numOfSharesToBuy * priceTOBuyAt;
    //server.purchaseSuccess(stockToBuy, numOfSharesToBuy, spent, priceTOBuyAt)
};


exports.sellOneStock = function(symbol, numShares){
    log("We're Selling - " + symbol, numShares);

    return new Promise(async (resolve) => {
      try {
        let orderResults = await alpaca.createOrder({
          symbol: symbol,
          qty: numShares,
          side: 'sell',
          type: 'market',
          time_in_force: 'day'
        })
        log("Market sell completed");
        console.log(orderresults);
        resolve(orderResults)
      } catch (err) {
        console.log("Sell order of did not go through")
        resolve(false)
      }
    })
    log("after the sell, sell results - ");
    log(orderResults)
    return(orderResults);
    //var spent = numOfSharesToBuy * priceTOBuyAt;
    //server.sellSuccess(stockToBuy, numOfSharesToBuy, spent, priceTOBuyAt)
};


exports.getCNNScrapedMovers = async function (){
  CNNscrapedMovers = new Array;
  console.log("in get CNN scraped movers");
  request("https://money.cnn.com/data/hotstocks/", function(error, response, body) {
    //console.log(body);
      // Load into cheerio and save it to a variable
      var $ = cheerio.load(body);
      // clear the array before we load new articles
      //var retArr = new Array;

      var arrayOfQuotes = new Array;


        $("td").each(function(i, e){
          arrayOfQuotes[i] = ($(this).text());
          $("td").children(function(i, e){
            arrayOfQuotes[i] = ($(this).text());
          });  
        });
        for(z=50; z<64; z=z+5){
          var tempCNNMovers = {
            symbol: '',
            name: '',
            price: 0,
            change: 0,
            percentChange: 0
          };

          tempCNNMovers.symbol = arrayOfQuotes[z];
          tempCNNMovers.name = arrayOfQuotes[z+1];
          tempCNNMovers.price = arrayOfQuotes[z+2];
          tempCNNMovers.change = arrayOfQuotes[z+3];
          tempCNNMovers.percentChange = arrayOfQuotes[z+4];
          CNNscrapedMovers.push(tempCNNMovers)          

        }
        //console.log("CNN Scraped results - ");
        //console.log(CNNscrapedMovers);
        // Log the CNNscrapedMovers
      return CNNscrapedMovers;
      });
  //});
  return CNNscrapedMovers;
};



// called from server line
exports.getMarketWatchScrapedMovers = async function (){
marketWatchScrapedMovers = new Array;
  console.log("in get scrape Market Watch movers");
  request("https://www.marketwatch.com/", function(error, response, body) {
      // Load into cheerio and save it to a variable
      var $ = cheerio.load(body);

      var symbols = new Array;
      var moveAmnt = new Array;

        $('.element--movers .mover__symbol').each(function(i, item){
            symbols.push($(this).text().trim());
        });
        $('.element--movers .positive').each(function(i, item){
            moveAmnt.push($(this).text().trim());
        });

        for(z=0; z<4; z++){
          var tempMovers = {
            symbol: '',
            name: '',
            price: 0,
            change: 0,
            percentChange: 0
          };

          tempMovers.symbol = symbols[z];
          tempMovers.name = '';
          tempMovers.price = 0;
          tempMovers.change = 0;
          tempMovers.percentChange = moveAmnt[z];
          marketWatchScrapedMovers.push(tempMovers)          

        };
        //console.log("in get WSJ scrape movers");
        //console.log(marketWatchScrapedMovers);
      return marketWatchScrapedMovers;
      });
  return marketWatchScrapedMovers;
};

