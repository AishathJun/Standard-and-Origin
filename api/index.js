const express = require("express");
const router = express.Router();

const categoryController = require("./category.js")(router);
const brandController = require("./brand.js")(router);



//router.use(express.urlencoded({extended: true}));
//router.use(express.json({type: "*/*"}));

router.get("/", function(req, res){
    const db = req.app.get('db');

    const con = db;
    //con.connect();
    //con.end();
    res.json({"msg": "Backend API is working"});
});



/**
 * 404 - page not found
 **/
router.use( function(req, res, next){
    res.json({
        "message": "API endpoint not found"
    });
});


module.exports = router;
