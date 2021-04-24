const categoryService = require("./services/category.service.js");
const brandService = require("./services/brand.service.js");
const responseProvider = require("./utils/response.js");


const listCategory = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res);

    categoryService(db)
        .findAll()
        .then(rp.default.success, rp.default.failure);
};


const listBrand = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res);

    const id = req.params.id;
    
    brandService(db)
        .find({category: id})
        .then(rp.default.success, rp.default.failure);
};


const createCategory = (req, res) => {
    const db = req.app.get('db');
    const rp = responseProvider(res);

    const {name, pics, cost} = req.body;

    const success = (insertId)=> {
            res.json({
                "message": "Successfully created",
                "category_id": insertId
            });
    };

    const fail = (failMsg) => {
            res.json({
                "message": "Sorry. Cannot create category",
                "error": failMsg
            });
    };

    categoryService(db)
        .create({
            name,
            pics,
            cost
        })
        .then(success, fail);
};

const findCategory = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;

    const id = req.params.id;

    categoryService(db)
        .fetch(id,true)
        .then(rp.success, rp.fail);
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


module.exports = function(router){
    router.get("/category", listCategory);
    router.get("/category/:id", findCategory);
    router.get("/category/:id/brand", listBrand);
    router.post("/category", createCategory);
    router.post("/category/:id", updateCategory);
    router.delete("/category/:id", deleteCategory);
};
