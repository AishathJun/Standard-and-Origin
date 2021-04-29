const service_error = require("../utils/error.js").handle_service_error;
const db_error = require("../utils/error.js").handle_db_error;
const queryHandler = require("../utils/query.js");
const queryBuilder = require("../utils/query.builder.js");
const uuid = require("../db.service.js").helpers.uuid;

const picService = require("../services/picture.service.js");

function categoryServices(db){

    /**
     * Creates a new category and picture
     *
     * Returns Success onSuccess(_id)
     **/
    const create = (vals) => new Promise( (onSuccess, onFail) => {
        const {name, url, picture, tags} = vals;

        db.beginTransaction(err => {
	    var picId = uuid();
	    var queryPicture = null;
	    if(!picture._id){
		const insertQuery = "INSERT INTO picture (`_id`, `label`, `url`) VALUES (?, ?, ?)";
		const insertValues = [picId, name+"_picture", url];
		const queryPicture = db.format(insertQuery, insertValues);
	    }else{
		picId = picture._id;
	    }

	    const createProductCallback = (error, results, fields) => {
                if(service_error(db, error, onFail))
                    return;

                const _id = uuid();
                const queryProductSQL = "INSERT INTO category (`_id`, `name`, `pic`) VALUES (?,?,?);"
                const queryProductValues = [_id, name, picId];
                const queryProduct = db.format(queryProductSQL, queryProductValues);

                db.query(queryProduct, (error, results)=> {
                    if(service_error(db, error, onFail)){
                        return;
                    }

                    //const category = await fetch(_id);

                    db.commit(err => {
                        if (err) {
                            onFail(err.toString());
                            return;
                        }

                        if(onSuccess)
                            onSuccess(_id);
                    }); //db.commit

                })//db.query (product)
            };
	    
	    if(!picture._id)
		db.query(queryPicture, createProductCallback);//db.query (picture)
	    else
		createProductCallback(false, [],[]);

        });
    });

    const fetch = (_id, fetch_assoc=false) => new Promise( (success, fail) => {
        var sql = "SELECT CONVERT(`category`._id, CHAR(128)) AS _id, name, CONVERT(`pic`, CHAR(128)) AS pic FROM `category`  WHERE `category`.`_id` = ?;";

        if(fetch_assoc){
            sql = "SELECT CONVERT(`category`._id, CHAR(128)) AS _id, name, picture.url, JSON_OBJECT('_id', CONVERT(`picture`._id, CHAR(128)) )AS 'picture$', (SELECT COUNT(*) FROM `product` WHERE `product`.category = `category`._id) AS 'product_count' FROM `category` INNER JOIN `picture` WHERE `category`.pic = `picture`._id AND `category`.`_id` = ?;";
	   

        }
//
	
        const query = db.format(sql, [_id]);

        db.query(query, queryHandler.retrieveOneQuery(success, fail) );
    });


    const update = (_id, vals) => new Promise( async (success, fail) => {
        //update this record and associated records
        if(!_id){
            onFail("category_service.update: _id not provided by the caller");
        }

        const {name, url} = vals;
        const inVals = {name};
        const {sql, sql_input} = queryHandler.updateQueryFormat(_id, "category", inVals);
        const query = db.format(sql, sql_input);


        try{
            var category =  await fetch(_id);
            if(!category){
                throw new Error("Category not found.");
            }

	    if(url){
            const pic_inVals = {url};

            await picService(db)
                .update(category.pic, pic_inVals)
                .then( r=> console.log("Done", r) )
                .catch(fail);
	    }
            category = await fetch(_id, true);
            db.query(query, queryHandler.updateQuery(success, fail, category));
        }catch(err){
            fail(err);
        }

        //picService.update()
    });

    const remove = (_id)  => new Promise((onSuccess, onFail) => {
        //remove this record and associated picture record
        if(!_id){
            onFail("category_service.remove: _id not provided by the caller");
        }

        //const sql = "DELETE FROM `brand` WHERE `brand`.`_id` = ?;";
        const query= queryBuilder(db).delete(_id, "category");

        db.query(query, queryHandler.deleteQuery(onSuccess, onFail));

        //throw new Error("Not implemented yet");

    });


    const find = (options={})=> new Promise( (onSuccess, onFail) => {
	const defaultOptions = {
	    checkFileExist: false
	};
	const opts = {...defaultOptions, ...options};
        const sqlQuery = "SELECT CONVERT(`category`._id, CHAR(128)) AS _id, name, picture.url FROM `category` INNER JOIN `picture` WHERE `category`.pic = `picture`._id;";

	var preprocessor=null;

	preprocessor = async (results) => {
	    //console.log(f);
	    const promises = results.map(async row => {	
		var fileExists = false;
		try{
		   fileExists =  await picService(db).fileExists(row.url);

		    console.log(fileExists);
		}catch(err){
		    console.log(err); 
		}
		return {
		    ...row,
		    fileExists
		};
	    });
	    return (await Promise.allSettled(promises)).map(r=>r.value);
	};

	db.query(sqlQuery,
		 queryHandler.retrieveQuery(onSuccess, onFail, preprocessor)
		);
	
	/*
        db.query(sqlQuery,  (error, results, fields) => {
            if(service_error(db, error, onFail))
                return;
    

	    results = results.map(async row => {
		const fileExists = picService(db)
		      .fileExistsSync(row.url);
		const f = await fileExists;
		console.log(row);
		return {
		    a: 1
		};
	    });
	    

            if(onSuccess)
                onSuccess(results);
        });*/
    });

    return {
        create,
        fetch,
        update,
        remove,
        find,
	findAll: () => find()
    };
};

module.exports = categoryServices;
