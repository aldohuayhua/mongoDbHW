var router = require("express").Router();
var db = require("../../models");
var path = require('path');

router.get("/", function(req, res) {
    res.sendFile(path.resolve(__dirname, '../../', 'public/index.html'));
});

module.exports = router;
