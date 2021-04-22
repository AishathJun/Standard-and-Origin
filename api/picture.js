const responseProvider = require("./utils/response.js");
const path = require('path'); 
/**
 * Use this controller only for testing purpose
 **/
const pictureService = require("./services/picture.service.js");

const create =  (req, res) => {
    const db = req.app.get("db");
    const {label, url} = req.body;

    const rp = responseProvider(res);

    pictureService(db)
        .create({
            label,
            url
        })
        .then(rp.defaultSuccess, rp.defaultFail);
};

const list = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res);
    pictureService(db)
        .list()
        .then(rp.default.success, rp.default.fail);
};

const update = (req, res) => {
    const db = req.app.get("db");
    const vals = req.body;
    const rp = responseProvider(res);
    const _id = req.params.id;

    const retrievePicture = (id) => pictureService(db).findOne(id);

    pictureService(db)
        .update(_id, vals)
        .then(r => pictureService(db) )
        .then(r => r.findOne(_id))
        .then(rp.default.success)
        .catch(rp.default.fail);
    ;
}


const remove = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res);
    const {id} = req.params;

    pictureService(db)
        .remove(id)
        .then(rp.default.success)
        .catch(rp.default.fail);
};


const fetch = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res);
    const {id} = req.params;
    
    //double not trick, turns undefined and other stuff to false
    const render = !(!req.query.render) && (req.query.render!="false");

    const renderFn = async (data) => {
	    
	const filepath = await pictureService().fileExists(data.url);
	//filepath =path.resolve(data.url);
	    
	res.sendFile(filepath);
    }
    
    const success = render? renderFn : rp.defaultSuccess;

    pictureService(db)
        .findOne(id)
        .then(success, rp.defaultFail);
};



module.exports = function(router){
    router.get("/picture", list);
    router.post("/picture", create);
    router.post("/picture/:id", update);
    router.delete("/picture/:id", remove);
    router.get("/picture/:id", fetch);
}
