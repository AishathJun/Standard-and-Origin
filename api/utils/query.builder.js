
//This one's at top because im reusing this 
const createConditions = (filtermap, userOptions={}) => {
    const defaultOptions = {
	operator: "AND",
	comparator: "="
    };
    const options = {...defaultOptions,...userOptions};
    var filter_arr = filtermap;
    if(typeof(filtermap)==="object" && !Array.isArray(filtermap)){
	filter_arr = Object.entries(filtermap);
    }
 return   filter_arr.map( (entry) => {
    const {key, val} = {key: entry[0], val: entry[1]};
    var tablename="";
    if(options.tablename)
	tablename = `\`${options.tablename}\`.`;
    var valtable = "";
    if(options.valueTable)
	valtable = `\`${options.valueTable}\`.`
     if(val[0]==="'" || val[0]==="$"){
	 valtable="";
	 //val=val.substr(1);
     }
    return ` ${tablename}${key} ${options.comparator} ${valtable}${val} `;
   }).join(options.operator);
}

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

    selectAll: (tablename, in_fields=[], user_options={} )=> {
	const defaultOptions={offsets: 0, populate: false, tablename, flat: false};
	const options = {...defaultOptions, user_options};	
	
	const processFields =  (tablename) => field => {
	    var ret="";
	    if(typeof(field)==="object"){
		const foreignFields = Object.keys(field)
		      .map(key => {
			  const joinedFields = field[key].map(processFields(key));

			  if(!options.flat){
			      const jo_create = [];
			      field[key].forEach( (e,i) => {
				  jo_create.push(`'${e}'`);
				  jo_create.push(joinedFields[i]);
			      });
			      return `JSON_OBJECT(${jo_create}) AS '${key}\$'`;
			  }
			  return joinedFields;
		      }).join(",");
		return foreignFields;
	    }

	    //if function
	    if(field.indexOf("(")!=-1){
		return field;
	    }
	    ret = ` \`${tablename}\`.??`;
	    if(options.flat && tablename !== options.tablename){
		ret += ` AS '${tablename}_${field}'`;
	    }
	    if(field[0]=="$"){
		ret = ` CONVERT(${ret}, CHAR(128)) as \`${field.substr(1)}\``;
	    }    	    
	    return ret;
	};

	const processFieldVals = field => {
	    if(typeof(field) === "object"){
		const foreignFields = Object.entries(field)
		      .map( e=>  e[1].map(processFieldVals) );
		return [].concat.apply([], foreignFields);
	    }
	    //ignore functions;
	    if(field.indexOf("(")!=-1){
		return;
	    }
	    return field[0]=="$"?field.substr(1):field
	};	
	
        var fieldsPlaceholder = ","
	    + in_fields.map(processFields(options.tablename)).filter(e=>!!e).join(",");
        const fields = [].concat.apply([], in_fields.map(processFieldVals )).filter(e=>!!e); //remove $ sign
	
        if(fields.length==0)
            fieldsPlaceholder = "";
        const sql = "SELECT CONVERT(`"+tablename+"`.`_id`, CHAR(128)) as '_id' "
                        +      fieldsPlaceholder
                        +      " FROM ??";
        const queryVals = [...fields, tablename];

        return db.format(sql, queryVals);
    },

    selectBy: (tablename, in_fields=[], conds, options={offset:0, populate:false, terminator: true}) => {
        var fieldsPlaceholder = "," + in_fields.map(field => field[0]=="$"?` CONVERT(??, CHAR(128)) as \`${field.substr(1)}\``: "??").join(",");
        const fields = in_fields.map(field => field[0]=="$"?field.substr(1):field); //remove $ sign
        const condsEntries = Object.entries(conds);
        const condsPlaceholder = condsEntries.map(e => " ?? = ? ").join(" AND ");
        const condsMap = [].concat(...condsEntries);

        if(fields.length==0)
            fieldsPlaceholder = "";
        const sql = "SELECT CONVERT(`_id`, CHAR(128)) as `_id` "
                        +      fieldsPlaceholder
              +      " FROM ?? WHERE "+ condsPlaceholder + (options.terminator?";":"");
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
     * Creates conditions from filter
     **/
    createConditions: createConditions, 

    createJoin: (table, dst_table, conditions={},userOptions={}) => {
	const defaultOptions = {
	    type: "INNER",
	    comparator: "=",
	    conditionOptions: {tablename: table, valueTable: dst_table}
	};	
	const options = {...defaultOptions, ...userOptions};
	const join_conds = createConditions(conditions, {tablename: table, valueTable: dst_table});
	return `${options.type} JOIN \`${table}\` ON ${join_conds} `;
    },

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
