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
var getPricesFromYahoo = function(symbol,out) {
    csv = '';
    line = 0;
    http.get(urlFor(symbol), function(res) {
        res.on('data', function(chunk) {
            if(line == 2){
                csv = String(chunk);
            }
            line += 1;
        }).on('end', function() {
            // Date,Open,High,Low,Close,Volume,Adj Close
            var closePrice = csv.split(',')[4];
            out.write(closePrice);
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
