const express = require("express");
const router = express.Router();

const validatorModule = require("./middleware/validator.js");
const authModule = require("./middleware/authentication.js");
router.use(validatorModule);
router.use(authModule);



const authController = require("./auth.js")(router);
const categoryController = require("./category.js").bind(router);
const brandController = require("./brand.js").bind(router);
const pictureController = require("./picture.js")(router); //for debug purpose
const productController = require("./product.js").bind(router);
const adminController = require("./controllers/admin.js")(router);


//router.use(express.urlencoded({extended: true}));
//router.use(express.json({type: "*/*"}));


router.get("/", function(req, res){
    const db = req.app.get('db');

    const con = db;
    //con.connect();
    //con.end();
    res.json({"msg": "Backend API is working"});
});


//TODO: Do not show trace stack on the production server
router.use(function (err, req, res, next){
    res.json({
        name: err.name,
        message: err.message
    })
   /* res.json({
        name: err.name,
        message: err.message,
        file: err.fileName,
        line: err.lineNumber,
        col: err.columnName,
        stack: err.stack
    })*/
});

/**
 * 404 - page not found
 **/
router.use( function(req, res, next){
    res.status(404).json({
        "message": "API endpoint not found"
    });
});


module.exports = router;
