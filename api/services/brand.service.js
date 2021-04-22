const db_error = require("../utils/error.js").handle_db_error;
const queryHandler = require("../utils/query.js");
const uuid = require("../db.service.js").helpers.uuid;
const queryBuilder = require("../utils/query.builder.js");

function brandServices(db){
    var qb = {};
    if(db){
	qb = queryBuilder(db);
    }

    /**
     * Creates a new brand
     *  on success - calls back onSuccess(insertId)
     *  on failure - calls back onFailure(failMessage)
     **/
    const create = (vals, onSuccess, onFail) => {
        const {name, origin} = vals;
        const sqlQuery = "INSERT INTO `brand` (`_id`, `name`, `origin`) VALUES (?, ?, ?);";
	const insertId = uuid();
        const insertValues = [insertId, name, origin];
        const query = db.format(sqlQuery, insertValues);

        const runCallback = (error, results, fields) => {
            if(db_error(db)(error, onFail))
                return;
            if(onSuccess)
                onSuccess(insertId);
        };

        db.query(query, runCallback);
    };


    const update = (vals, onSuccess, onFail) => {
        const {_id, name, origin} = vals;

        if(!_id)
            throw new Error("_id not supplied by the caller");

        const inVals = {name, origin};

        const {sql, sql_input} = queryHandler.updateQueryFormat(_id, "brand", inVals);
	
        const query = db.format(sql, sql_input);

        db.query(query, queryHandler.updateQuery(onSuccess, onFail) );
    };


    const remove = (_id, onSuccess, onFail) => {
        const sql = "DELETE FROM `brand` WHERE `brand`.`_id` = ?;";
        const insertValues = [_id];
        const query = db.format(sql, insertValues);

        const runCallback = queryHandler.deleteQuery(onSuccess, onFail);

        db.query(query, runCallback);
    };

    const findOne = (_id, onSuccess, onFail) => {
        const sqlQuery = "SELECT  CONVERT(_id, CHAR(128)) AS _id , `name`, `origin` FROM brand WHERE _id = ?;"
        const insertVals = [_id];
        const query = db.format(sqlQuery, insertVals);

        db.query(query, queryHandler.retrieveOneQuery(onSuccess, onFail));
    };

    const find = (filter, onSuccess, onFail) => {
	var filterString = " ";

	var joinstr = "";
	var fields = ["name", "origin"];
	if(filter){	    
	    if(filter.category ){
		joinstr = qb.createJoin("product", "brand", {"brand": "_id"}, {type: "LEFT"});		
		joinstr += qb.createJoin("category", "product", [["_id", "category"], ["_id", `'${filter.category}'`]]);
		joinstr += " GROUP BY `brand`._id;";
		//fields.push({"product": ["_id", "name"]});
		fields.push({"category":["name"]});
	    }
	}
        //const sqlQuery = `SELECT  CONVERT(_id, CHAR(128)) AS _id , \`name\`, \`origin\` FROM \`brand\` ${joinstr} LIMIT 0, 100 ;`;
	const sqlQuery = qb.selectAll("brand", fields);
	const query = `${sqlQuery} ${joinstr} ;`;

        db.query(query, queryHandler.retrieveQuery(onSuccess, onFail));
    };

    const createPromiseWithVal = (val, fn) => new Promise((success, fail)=>fn(val, success, fail));

    return {
        create: (val) => new Promise((s,f) => create(val, s,f)),
        update: (val) => new Promise((s,f) => update(val, s,f)),
	find: (val) => new Promise( (s, f) => find(val, s, f)),
        findAll: ()=> new Promise((s,f) => find(null, s, f)),
        findOne: _id => createPromiseWithVal(_id, findOne),
        remove: _id => new Promise( (s,f) => remove(_id, s, f) )
    };
};

module.exports = brandServices;
