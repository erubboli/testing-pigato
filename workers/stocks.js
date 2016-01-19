var pigato = require('pigato');
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('db/stocks.db');
var http = require('http');
var moment = require('moment');

var urlFor= function(symbol) {
    var today = moment();
    var yesterday = moment().subtract(1, 'days');
    var url="http://ichart.finance.yahoo.com/table.csv?s=" + symbol + 
        "&a=" + yesterday.format('D') + "&b=" + yesterday.format('M') +"&c=" + yesterday.format('YYYY') + "&d=" +
        today.format('D')+ "&e=" + today.format('M') + "&f=" + today.format('YYYY')+ "&g=d&ignore=.csv";
    return url;
}

// Retrieve only the most recent price from Yahoo
var getPriceFromYahoo = function(symbol,onSuccess,onError) {
    var csv = ''
      , line = 0
      , closePrice; 

    http.get(urlFor(symbol), function(res) {
        res.on('data', function(chunk) {
            if(line == 2){
                csv = String(chunk);
            }
            line += 1;
        }).on('end', function() {
            //CSV: Date,Open,High,Low,Close,Volume,Adj Close
            closePrice = csv.split(',')[4];
            onSuccess(closePrice);
        }).on('error', function(e){
            onError(e)
        });
    });
}

var savePriceToDB = function(symbol,price){
    db.run("INSERT INTO prices (symbol,price,date) VALUES (?,?,CURRENT_DATE)", [symbol,price]);
}

var getPriceFromDB = function(symbol, onSuccess, onError) {
    db.serialize(function(){
        ensureDBStructure(); 
        db.get("SELECT price FROM prices WHERE symbol=? AND date=CURRENT_DATE",[symbol], function(err,row){
            if(row !== undefined){
                onSuccess(row.price);
            }else{
                onError(err);
            } 
        });
    });
}

var ensureDBStructure = function() {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='prices'", function(error, row) {
        if(row == undefined){
            console.log("Creating prices table")
            db.run("CREATE TABLE prices (symbol TEXT, date TEXT, price NUM);");
        }
    });
}

var getStockPrice = function(symbol, out) {
    console.log("getting price for "+symbol);
    getPriceFromDB(symbol, function(price) { //success DB
        console.log("Retrive price from DB");
        out.write(price);
        out.end('');
    }, function(){ // fail DB
        console.log("Error Retrieving today's price from DB")
        getPriceFromYahoo(symbol, function(price) {//success Yahoo
            savePriceToDB(symbol,price);
            out.write(price);
            out.end('');
        }, function(e) { // Fail Yahoo
            console.log("Error retriving price from Yahoo: "+e);
            out.end('');
        });
    });
}

exports.run = function(conn) {
    var stocksWorker = new pigato.Worker(conn, 'stockPrices');
    stocksWorker.start();

    stocksWorker.on('request', function(data,reply) {
       getStockPrice(data.symbol,reply);
    }).on('error', function(e) {
        console.log("worker error: " + e.message); 
    });

    return stocksWorker
}
