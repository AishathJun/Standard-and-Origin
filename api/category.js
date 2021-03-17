const categoryService = require("./services/category.service.js");

const listCategory = (req, res) => {
    const db = req.app.get("db");
    const success = (data) => {
        res.json({
            message: "Successfully retrieved",
            data: data
        });
    };
    const failure = (msg) => {
        res.json({
            message: msg
        });
    }

    categoryService(db)
        .findAll(success, failure);
};


const createCategory = (req, res) => {
    const db = req.app.get('db');
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
            label: "beverages",
            picture_url: "/assets/img/products/img3.jpg",
            cost: 0.0,
            tags: ""
        },success, fail);
}

module.exports = function(router){
    router.get("/category", listCategory);
    router.post("/category", createCategory);
};
