const queryHandler = require("../utils/query.js");
const db_error = require("../utils/error.js").handle_db_error;
const uuid = require("../db.service.js").helpers.uuid;

module.exports = (db) => ({
    create: (vals) => new Promise( (success, fail)=> {
        const {label, url}=vals;
        const sql = "INSERT INTO `picture` (`_id`, `label`, `url`) VALUES (?, ?, ?);"
        const insert = [uuid(), label, url];
        const query = db.format(sql, insert);

        db.query(query, queryHandler.createQuery(success, fail));
    }),

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

    findOne: (_id) => new Promise( (success, fail) => {
        const sql = "SELECT CONVERT(_id, CHAR(128)) AS _id, created_at, url, base64, data, label FROM `picture` WHERE `_id` = ? LIMIT 0, 100;"
        const vals = [_id];
        const query = db.format(sql, vals);

        db.query(query, queryHandler.retrieveOneQuery(success, fail));
    })
});
