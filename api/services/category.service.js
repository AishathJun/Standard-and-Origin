const service_error = require("../utils/error.js").handle_service_error;

function categoryServices(db){

    const create = (vals, onSuccess, onFail) => {
        const {label, picture_url, cost, tags} = vals;

        db.beginTransaction(err => {
            const insertQuery = "INSERT INTO picture (`label`, `url`) VALUES (?, ?)";
            const insertValues = [label+"_picture", picture_url];
            const query = db.format(insertQuery, insertValues);


            db.query(query, (error, results, fields) => {
                if(service_error(db, error, onFail))
                    return;

                const queryProductSQL = "INSERT INTO category (`name`, `pic`, `tags`) VALUES (?,?,?);"
                const queryProductValues = [label, results.insertId, "[]", cost];
                const queryProduct = db.format(queryProductSQL, queryProductValues);
                db.query(queryProduct, (error, results)=> {
                    if(service_error(db, error, onFail)){
                        return;
                    }

                    db.commit(err => {
                        if (err) {
                            onFail(err.toString());
                            return;
                        }

                        if(onSuccess)
                            onSuccess(results.insertId);
                    }); //db.commit

                })
            });

        });
    };

    const update = (vals, onSuccess, onFail) => {

    };

    const remove = (_id, onSuccess, onFail) => {

    };

    const retrieve = (_id, onSucess, onFail) => {

    };

    const findAll = (onSuccess, onFail) => {
        const sqlQuery = "SELECT category.pk as _id, category.label, tags, picture.url FROM `category` INNER JOIN `picture` WHERE `category`.pic = `picture`.pk;"

        db.query(sqlQuery,  (error, results, fields) => {
            if(service_error(db, error, onFail))
                return;

            if(onSuccess)
                onSuccess(results);
        });
    };

    return {create, retrieve, update, remove, findAll};
}

module.exports = categoryServices;
