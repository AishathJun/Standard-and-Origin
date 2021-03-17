const db_error = require("../utils/error.js").handle_db_error;
const queryHandler = require("../utils/query.js");
const uuid = require("../db.service.js").helpers.uuid;

function brandServices(db){

    /**
     * Creates a new brand
     *  on success - calls back onSuccess(insertId)
     *  on failure - calls back onFailure(failMessage)
     **/
    const create = (vals, onSuccess, onFail) => {
        const {name, origin} = vals;
        const sqlQuery = "INSERT INTO `brand` (`_id`, `name`, `origin`) VALUES (?, ?, ?);";
        const insertValues = [uuid(), name, origin];
        const query = db.format(sqlQuery, insertValues);

        const runCallback = (error, results, fields) => {
            if(db_error(db)(error, onFail))
                return;
            if(onSuccess)
                onSuccess(results.insertId);
        };

        db.query(query, runCallback);
    };


    const update = (vals, onSuccess, onFail) => {
        const {_id, name, origin} = vals;

        if(!_id)
            throw new Error("_id not supplied by the caller");

        const inVals = {name, origin};

        //number of values that have been passed by the caller and is not undefined
        //const numInVals = Object.values(x).filter(e => e!=undefined).length;

        const entryVals= Object.entries(inVals).filter(e => e[1] != undefined);
        const queryPlaceholders = entryVals.map(e => "?? = ?").join(",");
        const sql = "UPDATE `brand` SET "+queryPlaceholders + " WHERE _id = ?; ";
        const queryVals = [].concat(...entryVals);
        queryVals.push(_id);


        const query = db.format(sql, queryVals);

        db.query(query, queryHandler.retrieveQuery(onSuccess, onFail) );
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

    const findAll = (onSuccess, onFail) => {
        const sqlQuery = "SELECT  CONVERT(_id, CHAR(128)) AS _id , `name`, `origin` FROM brand LIMIT 0, 100;"

        db.query(sqlQuery, queryHandler.retrieveQuery(onSuccess, onFail));
    };

    const createPromiseWithVal = (val, fn) => new Promise((success, fail)=>fn(val, success, fail));

    return {
        create: (val) => new Promise((s,f) => create(val, s,f)),
        update: (val) => new Promise((s,f) => update(val, s,f)),
        findAll: ()=> new Promise(findAll),
        findOne: _id => createPromiseWithVal(_id, findOne),
        remove: _id => new Promise( (s,f) => remove(_id, s, f) )
    };
};

module.exports = brandServices;
