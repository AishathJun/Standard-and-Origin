const brandService = require("./services/brand.service.js");


function responseProvider(res){
    //TODO: Only show error if debug mode is enable. Hide error in production.
    const defaultFail = (msg, code=500, error=null) => {
        res.status(code).json({
            "message": msg,
            error
        });
    };

    const defaultSuccess = data => {
        res.json({
            message: "Query success",
            data: data
        });
    };

    return {defaultFail, defaultSuccess};
};

const fetch = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res);
    const {id} = req.params;

    brandService(db)
        .findOne(id)
        .then(rp.defaultSuccess, rp.defaultFail);
};


const list = (req, res) => {
    const db = req.app.get("db");
    const success = data => {
        res.json({
            message: "Successfully retrieved data",
            data: data
        });
    };

    const failure = responseProvider(res).defaultFail;
    brandService(db).
        findAll()
        .then(success)
        .catch(failure);
};

const create = (req, res) => {
    const db = req.app.get("db");

    const {name, origin} = req.body;

    const success = data => {
        res.json({
            "message": "Brand created successfully",
            "body": req.body
        });
    }

    const fail = responseProvider(res).defaultFail;

    brandService(db)
        .create({name, origin})
        .then(success)
        .catch(fail);
}

const update = (req, res) => {
    const db = req.app.get("db");
    const {name, origin} = req.body;
    const _id = req.params.id;

    const success = data => {
        res.json({
            "message": "Brand successfully updated",
            "data": data
        });
    };
    const fail = responseProvider(res).defaultFail;

    brandService(db)
        .update({_id, name, origin})
        .then( success, fail);
};

const remove = (req, res) => {
    const db = req.app.get("db");

    const {id} = req.params;

    const success = data => {
        res.json({
            "message": "Successfully removed",
            "id": id
        });
    };

    brandService(db)
        .remove(id)
        .then(success, responseProvider(res).defaultFail);
};


module.exports = function(router){
    router.get("/brand", list);
    router.post("/brand", create);
    router.delete("/brand/:id", remove);
    router.get("/brand/:id", fetch);
    router.post("/brand/:id", update);
}
