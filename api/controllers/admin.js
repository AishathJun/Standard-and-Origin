const responseProvider = require("../utils/response.js");
var multer  = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (directory="", filename=null) =>  ({
    storage: multer.diskStorage({
    destination: function(req, file, callback){	
	if(directory[0] === '/'){
	    //use absolute path
	    callback(null, directory)
	}else{
	    const resolved_path = path.resolve("uploads/"+directory);
	    if(!fs.existsSync(resolved_path)){
		fs.mkdirSync(resolved_path, { recursive: true });
	    }
	    callback(null, "uploads/"+directory);
	}
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
const productService = require("../services/product.service.js");
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
    const options = req.query;

    var _dir = "";
    if(options.type && typeof(options.type)==='string'){
	_dir = options.type;
    }
    const upload = multer(createStorage(_dir)).single("image");

    upload(req, res, err => {
	if(err){
	    res.json(err);
	    return;
	}

	const data = req.file;
	const rp = responseProvider(res).default;    
	
    
	const createData = {
	    label: data.filename,
	    url: data.path
	};

	pictureService(db)
            .create(createData, options)
            .then((results) => {
		res.json(
		    results
		);
	    }, rp.fail);
    })
}

const reuploadPicture = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;    

    const id = req.params.id;


    const options = req.query;

    var _dir = "";
    if(options.type && typeof(options.type)==='string'){
	_dir = options.type;
    }
    
    
    pictureService(db).findOne(id)
	.then( async picture => {
	    picture.dir=""; //old path 
	    picture.replace = false;
	    //const path_arr = picture.url.split("/");
	    //file exists and exists in assets folder
	    if(picture.fileExists && picture.url && picture.url.split("/")[0]==="assets"){
		picture.dir = await pictureService(db).fileExists(picture.url);
		picture.replace = true;
	    }	    
	    //file doesnt exist but is supposed to be in  assets folder
	    if(!picture.fileExists && picture.url && picture.url.split("/")[0]==="assets"){
		picture.replace = true;
		//todo mark the selected picture object for removal.
	    }

	    //picture is elsewhere. We havent decided what to do for this use case. for now we just keep the old image.
	    if(!picture.fileExists && picture.url && _dir !== "" &&  picture.url.split("/")[0]==="uploads"){
		picture.replace = true;
	    }
	    return picture;
	})
	.then ( picture => {
	    //const reupload = multer(createStorage("",
	    const _dir_arr = picture.url.split("/");
	    const _fname = _dir_arr[_dir_arr.length-1]
	    picture.reupload = multer(createStorage(_dir, _fname )).single("image");
	    const old_url = picture.url;
	    picture.url = ["uploads", _dir, _fname].join("/");
	    if(picture.url !== old_url){
		picture.replace = true;
	    }
	    return picture;
	}).then( async picture => {
	    if(picture.replace){
		if(_dir !== ""){
		    _dir = _dir + "/";
		}
		return await pictureService(db).update(picture._id, {
		    url: picture.url
		}).then(() => {
		    return picture;
		});
	    }else{
		return picture;
	    }
	}).then(picture => {
	    const reupload = picture.reupload;
	    delete picture.dir;
	    delete picture._name;
	    delete picture.replace;
	    delete picture.reupload;
	    
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
	}).catch(err => {
	    console.log("Error", err);
	    res.status(500).send("Sorry");
	});
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
        .findAll({checkFileExist:true})
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



const listProduct = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;

    const options = req.query;

    productService(db)
        .findAll(options)
        .then(rp.success, rp.fail);
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
    router.post("/admin/picture", uploadPicture);
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
    router.get("/admin/product", listProduct);
    router.post("/admin/product", _product.create);
    router.get("/admin/product/:id", _product.retrieve);
    router.post("/admin/product/:id", _product.update);
    router.delete("/admin/product/:id", _product._delete);
}
