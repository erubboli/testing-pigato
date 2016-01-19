var pigato = require('pigato');
var client = new pigato.Client('tcp://localhost:55555');
client.start();
var http = require('http');

var remote = function(symbol, handler) {
    client.request('stockPrices', {symbol: symbol}, { timeout: 90000 })
        .on('data', handler)
        .on('end', handler)
};

exports.remote = remote;
