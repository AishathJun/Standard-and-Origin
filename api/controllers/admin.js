const responseProvider = require("../utils/response.js");
var multer  = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (directory="", filename=null) =>  ({
    storage: multer.diskStorage({
    destination: function(req, file, callback){
	callback(null, "uploads/"+directory);
    },
    filename: function(req, file, callback){
	if(filename){
	    callback(null, filename);
	    return; 
	}

	//delete existing file
	let files = fs.readdirSync(path.resolve("uploads/"+directory));
	if(files.includes(file.originalname)){
            fs.unlinkSync('pwrite the pathath'+ file.originalname);
	}
	
	const extension = file.mimetype.split("/")[1];
	callback(null, file.fieldname + "-" + Date.now()+"."+extension);
    }
    })
});

/*
var storage = multer.diskStorage({
    destination: function(req, file, callback){
	callback(null, "uploads/");
    },
    filename: function(req, file, callback){
	const extension = file.mimetype.split("/")[1];
	callback(null, file.fieldname + "-" + Date.now()+"."+extension);
    }
});*/

var upload = multer(createStorage());

//services
const authService = require("../services/auth.service.js");
const pictureService = require("../services/picture.service.js");
const categoryService = require("../services/category.service.js");
//const brandService = require("../services/brand.service.js");

const categoryController = require("../category.js");
const brandController = require("../brand.js");
const productController = require("../product.js");

const adminStatus = (req, res) => {
    if(req.session && req.session.type){
	res.json(req.session);
    }
}

const uploadPicture = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;    
    const data = req.file;
    
    const createData = {
	label: data.filename,
	url: data.path
    };
    
    pictureService(db)
        .create(createData)
        .then((results) => {
	    res.json(
		results
	    );
	}, rp.fail);

}

const reuploadPicture = async (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;    

    const id = req.params.id;
    const picture = await pictureService(db).findOne(id);

    //const reupload = multer(createStorage("",
    const reupload = multer(createStorage("", picture.url.split("/")[1])).single("image");
    
    reupload(req, res, (err)=>{
	if(err){
	    res.json(err);
	    return;
	}
	res.json({
	    picture,
	    data: null
	});
    })
};

const createCategory =  async (req, res) => {
    const rp = responseProvider(res).default;    

    const db = req.app.get("db");
    const data = req.body;
    req.expect(["name", "picture"]);

    if(data.picture._id){
	try{
	    const picture =
		  await pictureService(db)
		    .findOne(data.picture._id);

	    categoryService(db)
		.create(data)
		.then((insertId) => {
		    res.json({
			"message": "Successfully created",
			"category_id": insertId
		    })
		}, rp.fail);

	}catch(err){
	    console.error(err);
	    res.json({error: err});
	}
	return;
    }
    
    res.status(500).json({
	"message": "Invalid picture id"
    });
};


const updateCategory = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;

    const id = req.params.id;
    const vals = req.body;

    categoryService(db)
        .update(id, vals)
        //.then(r=> categoryService(db))
        //.then(r => r.fetch(id))
        .then(rp.success)
        .catch(rp.fail);
};



const deleteCategory = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;

    const id = req.params.id;

    categoryService(db)
        .remove(id)
        .then(rp.success)
        .catch(rp.fail);
};

const listCategory = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res);

    categoryService(db)
        .findAll({fileExists:true})
        /*.then(results => {
	    
	    return results.map(row => {
		//var fileExists =false;
		//fileExists = await pictureService.fileExists(row.url);
		//console.log("this", row);
		return {
		    ...row
		};
	    });
	})*/
        .then(rp.default.success, rp.default.failure);
};



module.exports = function(router){
    router.use("/admin", (req, res, next) => {
	if(req.session.type == 'admin'){
	    next();
	}else{
	    res.status(401).json({
		"message": "Unauthorized access"		
	    });
	}
    });
    router.get("/admin", adminStatus);
    router.post("/admin/picture", upload.single('image'), uploadPicture);
    router.post("/admin/picture/:id", reuploadPicture);


    const category_ctrl = categoryController.controllers;    
    
    //manage category
    router.get("/admin/category", listCategory);
    router.post("/admin/category", createCategory);    
    router.post("/admin/category/:id", updateCategory);
    router.delete("/admin/category/:id", deleteCategory);

    const brand_fn = brandController.controllers

    router.get("/admin/brand", brand_fn.list);
    router.post("/admin/brand", brand_fn.create);
    router.delete("/admin/brand/:id", brand_fn.remove);
    router.get("/admin/brand/:id", brand_fn.fetch);
    router.post("/admin/brand/:id", brand_fn.update);

    const _product = productController.controllers;     
    router.get("/admin/product", _product.list);
    router.post("/admin/product", _product.create);
    router.get("/admin/product/:id", _product.retrieve);
    router.post("/admin/product/:id", _product.update);
    router.delete("/admin/product/:id", _product._delete);
}
