var pigato = require('pigato');
var client = new pigato.Client('tcp://localhost:55555');
client.start();
var http = require('http');

var remote = function(symbol, dataHandler, endHandler) {
    client.request('stockPrices', {symbol: symbol}, { timeout: 90000 })
        .on('data', dataHandler)
        .on('end', endHandler)
};

exports.remote = remote;
