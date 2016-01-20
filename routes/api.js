var express = require('express');
var router = express.Router();
var stocks = require("./../resources/stocks.js");

/* GET prices list */
router.get('/stocks/:symbol', function(req, res, next){
    var response='';
    stocks.remote(req.params.symbol, function(data){
        response = response+data;
    }, function(){
        res.json(response);
    });
});

module.exports = router;
