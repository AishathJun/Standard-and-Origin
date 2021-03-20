/**
 * I wrote this because I keep forgetting basic SQL syntax.
 * Do not layer it to build complex query or use an ORM.
 * Just write your own query.
 **/
const queryBuilder = (db) => ({
    update: (_id, tablename, inVals) => {
        const entryVals= Object.entries(inVals).filter(e => e[1] != undefined);
        const queryPlaceholders = entryVals.map(e => "?? = ?").join(",");
        const sql = "UPDATE ?? SET "+queryPlaceholders + " WHERE _id = ?; ";
        const queryVals = [tablename].concat(...entryVals);
        queryVals.push(_id);

        return db.format(sql, queryVals);
    },

    create: (tablename, id, inVals=[]) => {
        const entryVals= Object.entries(inVals).filter(e => e[1] != undefined);
        const keyList = entryVals.map(e => e[0]);
        const valList = entryVals.map(e => e[1]);
        const fieldPlaceholder = keyList.map(e => ", ??").join("");
        const valPlaceholder = valList.map(e=> " , ?").join("");
        const sql = "INSERT INTO ?? (??"+ fieldPlaceholder+") VALUES (?"+valPlaceholder+");";
        const queryVals = [tablename, "_id", ...keyList, id, ...valList];

        return db.format(sql, queryVals);
    },

    delete: (_id, tablename) => {
        const sql = "DELETE FROM ?? WHERE ??.`_id` = ?;";
        const vals = [tablename, tablename, _id];
        return db.format(sql, vals);
    },

    selectAll: (tablename, in_fields=[], options={offsets: 0, populate: false}) => {
        var fieldsPlaceholder = "," + in_fields.map(field => field[0]=="$"?` CONVERT(??, CHAR(128)) as \`${field.substr(1)}\``: "??").join(",");
        const fields = in_fields.map(field => field[0]=="$"?field.substr(1):field); //remove $ sign
        if(fields.length==0)
            fieldsPlaceholder = "";
        const sql = "SELECT CONVERT(`_id`, CHAR(128)) as `_id` "
                        +      fieldsPlaceholder
                        +      " FROM ??;";
        const queryVals = [...fields, tablename];

        return db.format(sql, queryVals);
    },

    selectBy: (tablename, in_fields=[], conds, options={offset:0, populate:false}) => {
        var fieldsPlaceholder = "," + in_fields.map(field => field[0]=="$"?` CONVERT(??, CHAR(128)) as \`${field.substr(1)}\``: "??").join(",");
        const fields = in_fields.map(field => field[0]=="$"?field.substr(1):field); //remove $ sign
        const condsEntries = Object.entries(conds);
        const condsPlaceholder = condsEntries.map(e => " ?? = ? ").join(" AND ");
        const condsMap = [].concat(...condsEntries);

        if(fields.length==0)
            fieldsPlaceholder = "";
        const sql = "SELECT CONVERT(`_id`, CHAR(128)) as `_id` "
                        +      fieldsPlaceholder
                        +      " FROM ?? WHERE "+ condsPlaceholder +";";
        const queryVals = [...fields, tablename, ...condsMap];

        return db.format(sql, queryVals);
    },


    queryPromise:(query) => new Promise((resolve, reject) => {
        db.query(query, (err, rows, fields) => {
            if(err){
                reject(err);
            }
            resolve(rows);
        });
    }),

    /**
     * Resolves asynchronous query promises and return a reduced result
     *
     * Forms a transaction.
     **/
    resolveQueryPromises:  (promises, expected={}) => new Promise( (resolve, reject) => {
            db.beginTransaction( async err => {
                if(err)
                    reject(err);

                try{
                    const resultsArray = await Promise.all(promises);
                    const reducedResult = resultsArray.reduce(
                        (a,b) => ({
                            affectedRows: a.affectedRows+b.affectedRows,
                            changedRows: a.changedRows+b.changedRows
                        })
                    );

                    Object.keys(expected).forEach(key =>{
                        if(expected[key] != reducedResult[key] ){
                            db.rollback();
                            throw new Error(
                                 `${key} was ${reducedResult[key]}. Expected "${expected[key]}"`
                            );

                        }
                    });

                    db.commit();
                    resolve(reducedResult);
                }catch(err){
                    db.rollback();
                    reject(err);
                }
            });
    }),

    /**
     * Executes queries as a transaction, linearly
     **/
    /*
    executeQueryList: (queryList) => new Promise( (resolve, reject) => {

        db.beginTransaction(err => {
            const result = queryList.map(query => {
                db.query(query);
            });

            //one of the query was not executed
            if(result.indexOf(null) != -1){
                db.rollback();
                reject(result);
            }else{
                db.commit(err=>{});
                resolve(result);
            }


            db.commit(err => {
                if(err)
                    reject("Failed to commit");
                resolve(result);
            })
        });
        })
    */

});

module.exports = queryBuilder;
