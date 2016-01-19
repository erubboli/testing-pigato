var pigato = require('pigato');
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('db/stocks.db');
var http = require('http');
var moment = require('moment');

var urlFor= function(symbol) {
    var today = moment();
    var yesterday = moment().subtract(1, 'days');
    var url="http://ichart.finance.yahoo.com/table.csv?s=" + symbol + 
        "&a=" + today.format('d') + "&b=" + today.format('m') +"&c=" + today.format('YYYY') + "&d=" +
        yesterday.format('d')+ "&e=" + yesterday.format('m') + "&f=" + yesterday.format('YYYY')+ "&g=d&ignore=.csv";
    console.log(url);
    return url;
}

// Retrieve prices from Yahoo
var getPricesFromYahoo = function(symbol,out) {
    http.get(urlFor(symbol), function(res) {
        res.on('data', function(chunk) {
            out.write(String(chunk));
        }).on('end', function() {
            out.end('');
        });
    });
}

exports.run = function(conn){
    var stocksWorker = new pigato.Worker(conn, 'stockPrices');
    stocksWorker.start();

    stocksWorker.on('request', function(data,reply) {
        getPricesFromYahoo(data.symbol, reply);
    }).on('error', function(e) {
        console.log("worker error: " + e.message); 
    });

    return stocksWorker
}
