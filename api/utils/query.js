const db_error = require("./error.js").handle_db_error;
//query response handlers


const retrieveOneQuery =  (onSuccess, onFail) => (error, results) => {
    if(db_error()(error,onFail)){
        return;
    }
    if(results.length>0)
        onSuccess(results[0]);
    else
        onSuccess(results);
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
        onFail("Cannot find the object to delete");
        return;
    }

    if(onSuccess)
        onSuccess(results);
};

module.exports = {
    retrieveQuery,
    retrieveOneQuery,
    deleteQuery
};
