const handle_db_error = (db) => (error, fail) => {
    if(error){
        if(db)
            db.rollback();
        console.log(error);
        var errorMsg = error.toString();

        if(error.code && error.errno){
            switch(error.errno){
            case 1146:
                errorMsg = "Incorrect table name provided";
                break;
            case 1062:
                errorMsg = "Object already exists";
                break;
            default:
                break;
            }
        }
        fail("Database Error: "+ errorMsg, 500, error);
        return true;
    }else{
        return false;
    }
};

const handle_service_error = (db, error, callback) => {
    if(error){
        db.rollback();
        callback(error.toString());
        return true;
    }else{
        return false;
    }
};

module.exports = {
    handle_db_error,
    handle_service_error
};
