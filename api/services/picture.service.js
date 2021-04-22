const queryHandler = require("../utils/query.js");
const db_error = require("../utils/error.js").handle_db_error;
const uuid = require("../db.service.js").helpers.uuid;

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/**
 * This one's outside because I'm reusing it. I should probably think of 
 * refactoring the whole api to use a better design pattern.
 **/
const checkFileExist = (img_path) => new Promise( (success, fail ) => {
	const path_list = ["", "html"];
	const result = path_list.map( root_path => {
	    const filepath = path.resolve(root_path, img_path);
	    fs.access(filepath, error => {
		if(error){
		    return false;
		}
		success(filepath);
	    });
	}).reduce( (a,b) => a || b);
	
	if(result==false){ 
	    fail("Cannot find file ", img_path);
	};
});

const getMetadata = (fullpath, result) => new Promise( (success, fail) => {
    sharp(fullpath).metadata()
	.then( ({width, height, format })=> {
	    const return_val = {
		width,
		height,
		format,
		mobile: false,
		thumbnail: false,
		desktop: false,
		base64: !!result.base64,
		blob: !!result.data
	    };

	    success(return_val);
	}).catch(fail);
});

module.exports = (db={}) => ({
    create: (vals) => new Promise( (success, fail)=> {
        const {label, url}=vals;
        const sql = "INSERT INTO `picture` (`_id`, `label`, `url`) VALUES (?, ?, ?);"
	const insertId = {_id: uuid()};
        const insert = [insertId._id, label, url];
        const query = db.format(sql, insert);

        db.query(query, queryHandler.createQuery(success, fail, insertId));
    }),

    fileExists: checkFileExist, 

    list: () => new Promise( (success, fail) => {
        const sql = "SELECT CONVERT(_id, CHAR(128)) AS _id, created_at, url, base64, data, label FROM `picture` LIMIT 0, 100;"

        db.query(sql, queryHandler.retrieveQuery(success, fail));
    }),

    remove: (_id) => new Promise( (success, fail) => {
        const sql = "DELETE FROM `picture` WHERE `picture`.`_id` = ?;";
        const vals = [_id];
        const query = db.format(sql, vals);

        db.query(query, queryHandler.deleteQuery(success, fail));
    }),

    update: (_id, vals) => new Promise( (success, fail) => {
        const {name, url} = vals;

        if(!_id)
            throw new Error("_id not supplied by the caller");

        const {sql, sql_input} = queryHandler.updateQueryFormat(_id, "picture", vals);
        const query = db.format(sql, sql_input);

        db.query(query, queryHandler.updateQuery(success, fail, _id) );
    }),

    findOne: (_id) => new Promise(  (success, fail) => {
        const sql = "SELECT CONVERT(_id, CHAR(128)) AS _id, created_at, url, base64, data, label FROM `picture` WHERE `_id` = ? LIMIT 0, 100;"
        const vals = [_id];
        const query = db.format(sql, vals);
	const preprocessor = async (result) => {	   	    
	    const fullpath = await checkFileExist(result.url);
	    return {
		...result,
		metadata: await getMetadata(fullpath, result),
		fileExists: !!fullpath
	    };
	};
	
        db.query(query, queryHandler.retrieveOneQuery(success, fail, preprocessor));
    })
});
