const productService = require("./services/product.service.js");
const responseProvider = require("./utils/response.js");


const create = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;

    req.expect(["name", "brand", "packaging", "category", "pic"]);

    const {name, packaging, pic, brand, category } = req.body;

    productService(db)
        .create({
            name,
            brand,
            packaging,
            category,
            pic
        }).then(rp.success, rp.fail);
};


const retrieve = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;

    const _id = req.params.id;
    const populate = req.query.populate;

    productService(db)
        .fetch(_id, {populate})
        .then(rp.success, rp.fail);
};

const update = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;

    const data = req.body;
    const _id = req.params.id;

    productService(db)
        .update(_id, data)
        .then(rp.success, rp.fail);
};

const _delete = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;
    const _id = req.params.id;

    productService(db)
        .remove(_id)
        .then(rp.success, rp.fail)
    ;

};


const list = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;

    const options = req.query;

    productService(db)
        .findAll(options)
        .then(rp.success, rp.fail);
};

module.exports = {
    bind: function(router){
	router.get("/product", list);
	router.post("/product", create);
	router.get("/product/:id", retrieve);
	router.post("/product/:id", update);
	router.delete("/product/:id", _delete);
    },
    controllers: {
	list, create, retrieve, update, _delete
    }
};
