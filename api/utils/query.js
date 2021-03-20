const db_error = require("./error.js").handle_db_error;
//query response handlers

const createQuery = (onSuccess, onFail) => (error, results, data=null) => {
    if(db_error()(error,onFail)){
        return;
    }

    if(results.affectedRows > 0){
        if(data)
            results = data;
        onSuccess({
            return_code: 201,
            data: results
        });
    }else{
        onFail(new Error("Failed to create object. No exception thrown by the database layer"));
    }
};

const updateQuery =  (onSuccess, onFail, obj=null) => (error, results) => {
    if(db_error()(error,onFail)){
        return;
    }

    if(typeof(obj) == "string")
        obj = {_id: obj};

    if(results.affectedRows > 0){
        onSuccess({
            ...obj
        });
    }else{
        onFail({
            ...obj,
            message: "Failed to update object. Check whether the record exists in the database."
        })
    }
};

const retrieveOneQuery =  (onSuccess, onFail) => (error, results) => {
    if(db_error()(error,onFail)){
        return;
    }
    if(results.length>0)
        onSuccess(results[0]);
    else{
        onFail({
            name: "Unable to find object",
            message: "Unable to find object. Object not found in database.",
            return_code: 500
        });
    }
};

const retrieveQuery = (onSuccess, onFail) => (error, results) => {
    if(db_error()(error,onFail)){
        return;
    }

    onSuccess(results);
};

const deleteQuery = (onSuccess, onFail) => (error, results) => {
    if(error){
        onFail(error.toString());
        return;
    }

    if(results.affectedRows == 0){
        onFail(new Error("Cannot find the object to delete"));
        return;
    }

    if(onSuccess)
        onSuccess(results);
};

//TODO: Migrate to query builder
const updateQueryFormat = (_id, tablename, inVals) => {
    const entryVals= Object.entries(inVals).filter(e => e[1] != undefined);
    const queryPlaceholders = entryVals.map(e => "?? = ?").join(",");
    const sql = "UPDATE ?? SET "+queryPlaceholders + " WHERE _id = ?; ";
    const queryVals = [tablename].concat(...entryVals);
    queryVals.push(_id);

    return {
        sql,
        sql_input: queryVals
    }
}

module.exports = {
    createQuery,
    retrieveQuery,
    retrieveOneQuery,
    updateQuery,
    deleteQuery,
    updateQueryFormat
};
