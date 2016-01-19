var express = require('express');
var router = express.Router();
var stocks = require("./../resources/stocks.js");

/* GET prices list */
router.get('/stocks/:symbol', function(req, res, next){
    stocks.remote(req.params.symbol, function(data){
        res.json(data);
    });
});

module.exports = router;
