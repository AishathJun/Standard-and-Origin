const queryBuilder = require("../utils/query.builder.js");
const queryHandler = require("../utils/query.js");
const uuid = require("../db.service.js").helpers.uuid;
const picService = require("./picture.service.js");

function productServices(db){
    const findAll = (options={}) => new Promise( (success, fail ) => {
        const defaultOptions = {populate: false, checkFileExists: false, offset:0, limit: 100};
        const opt = {...defaultOptions, ...options};


	var preprocessor = null;
	if(options.checkFileExists){
	    preprocessor = async (results) => {
		const promises = results
		.map(async row => {	
		    var fileExists = false;
		    const rowUrlExists = !!row.url;
		    
		    try{
			if(!rowUrlExists){
			    const pictureData = await picService(db).findOne(row.pic);
			    fileExists = pictureData.fileExists;
			}else{
			    fileExists =  !!(await picService(db).fileExists(row.url));
			}
		    }catch(err){
			//console.log(err); 
		    }
		    return {
			...row,
			fileExists
		    };
		});
		return (await Promise.allSettled(promises)).map(r=>r.value);
	    };
	}

        if(!opt.populate){
            const query = queryBuilder(db).selectAll("product", ["name", "$brand", "$pic", "packaging", "$category"]);
            db.query(query, queryHandler.retrieveQuery(success, fail, preprocessor));
        }else{
            var sql = "SELECT CONVERT(`product`.`_id`, CHAR(128)) as _id, `product`.`name`, `brand`.`name` as brand, `brand`.`origin` as `origin`,  `packaging`, `category`.`name` as `category`, `picture`.`url` as `url` FROM  `product` "
              + " INNER JOIN `picture` ON `product`.`pic` = `picture`.`_id` "
              + " INNER JOIN `brand` ON `product`.`brand` = `brand`.`_id` "
              + " INNER JOIN `category` ON `product`.`category` = `category`.`_id`";
            if(options.category_id){
                sql += ` WHERE \`category\`.\`_id\` = '${options.category_id}'`;
            }else if(options.search){		
		var search_by = "product";
		
		if(options.filter){
		    const param = options.filter ;
		    if(param === "brand" || param === "category"){
			search_by = param;
		    }
		}
		
                sql += ` WHERE \`${search_by}\`.\`name\` LIKE '%${options.search}%'`;

		if(!options.filter){
                    sql += ` OR  \`brand\`.\`name\` LIKE '%${options.search}%'`;

                    sql += ` OR  \`category\`.\`name\` LIKE '%${options.search}%'`;
		}
	    }

	    
            db.query(sql, queryHandler.retrieveQuery(success, fail, preprocessor));
        }
    });

    const fetch = (_id, options={}) => new Promise((success, fail) => {
        const defaultOptions = {populate: false, offset:0, limit: 100};
        const opt = {...defaultOptions, ...options};

        const qb = queryBuilder(db);

        if(!opt.populate){
            const query = queryBuilder(db).selectBy("product", ["name", "$brand", "$pic", "packaging", "$category"], {_id});
            db.query(query, queryHandler.retrieveOneQuery(success, fail));
        }else{	    
        //const query = qb.selectBy("product", ["name", "$brand", "$pic", "packaging", "$category"], {_id});
	    //foreign keys are [brand, picture, category]
	    var fields = ["name", "packaging"];
	    fields.push({"picture": ["_id", "url", "label", "base64", "data"]});	    
	    fields.push({"brand": ["_id", "name", "origin"]});	    
	    fields.push({"category": ["_id", "name"]});	    
            const select_query = qb.selectAll("product", fields);
	    const picture_join = qb.createJoin("picture", "product", {"_id": "pic"});
	    const category_join = qb.createJoin("brand", "product", {"_id": "brand"});
	    const brand_join = qb.createJoin("category", "product", {"_id": "category"});
	    const join_query = `${picture_join} ${category_join} ${brand_join}`;
	    const sql = `${select_query} ${join_query} WHERE \`product\`.\`_id\` = ? `;
            /*const sql = "SELECT CONVERT(`product`.`_id`, CHAR(128)) as _id, `product`.`name`, `brand`.`name` as brand, `brand`.`origin` as `origin`, `packaging`, `category`.`name` as `category`, CONVERT(`picture`._id , CHAR(128) ) AS pic, `picture`.`url` FROM  `product` "
                  + " INNER JOIN `picture` ON `product`.`pic` = `picture`.`_id` "
                  + " INNER JOIN `brand` ON `product`.`brand` = `brand`.`_id` "
                  + " INNER JOIN `category` ON `product`.`category` = `category`.`_id`"
                  +  " WHERE `product`.`_id` = ? "
            ;*/

            const query = db.format(sql, [_id]);
            db.query(query, queryHandler.retrieveOneQuery(success, fail));
        }
    });

    const create = (val) => new Promise(async (success, fail) => {
        const _id = uuid();
        const qb = queryBuilder(db);
        const query_build_queue = [];
        const {brand, category, pic} = val;

        //category, dont create category from here
        if(typeof(category) == "object"){
            //const category_id = uuid();
            //const categoryBuildQuery = qb.create("category", category_id, category);
            const categoryFetchQuery = qb.selectBy("category", [], category);
            const results = await qb.queryPromise(categoryFetchQuery);
            if(results.length == 0){
                fail("Cannot find category: "+ category.name);
                //return;
            }else{
                val.category = results[0]._id;
            }
        }

        //brand
        if(typeof(brand) == "object"){
            const brand_id = uuid();
            const brandFetchQuery = qb.selectBy("brand", [], brand);
            const fetchBrand = await qb.queryPromise(brandFetchQuery);
            if(fetchBrand.length == 0){
                //create if the brand does not exists
                const brandBuildQuery = qb.create("brand", brand_id, brand);
                val.brand = brand_id;
                query_build_queue.push(brandBuildQuery);
            }else{
                //do not create use the first brand matching the parameters
                const firstBrand = fetchBrand[0];
                val.brand = firstBrand._id;
            }
        }


        //pic
        if(typeof(pic) == "object"){
            const picture_id = uuid();
            const pictureBuildQuery = qb.create("picture", picture_id, pic);
            val.pic = picture_id;
            query_build_queue.push(pictureBuildQuery);
        }

        //product
        const query = qb.create("product", _id, {
           ...val
        });
        query_build_queue.push(query);

        const promiseList = query_build_queue.map( query=> qb.queryPromise(query) );

        Promise.all(promiseList)
            .then( (data) =>{
                //console.log("Done", data)
                success({
                    _id
                });
            } )
            .catch( (ex) => {
                console.log("Error", ex);
                fail(ex);
            } )
    });


    /**
     * Updates the product
     **/
    const update = (_id, val) => new Promise(async (success, fail) => {
        var {name, packaging, brand, pic, category} = val;
        const query_list = [];
        const qb = queryBuilder(db);

        //we fetch the current vals first
        const currentProduct = await fetch(_id, {populate:false});

        //update brand object
        if(typeof(brand) == "object"){
            //switch the _id if a similar brand object exists
            const findBrandObject = qb.queryPromise(qb.selectBy("brand", [], brand));
            const brand_object = await findBrandObject;
            if(brand_object.length != 0){
                brand = brand_object[0]._id;
            }else{
                //create a new brand object if similar object doesnt exist
                const brand_id = uuid();
                const sql = qb.create("brand", brand_id, brand);
                query_list.push(sql);
                brand = brand_id;
            }
        }

        //category will not be created, but we allow search by name
        //TODO: Find category by name only
        if(typeof(category) == "object"){
            const findCategoryObject = qb.queryPromise(qb.selectBy("category", [], category));
            const category_results = await findCategoryObject;
            if(category_results.length != 0){
                category = category_results[0]._id;
            }else{
                fail(`Category ${category.name} not found`);
            }
        }

        //picture is tightly coupled, so we just change it
        if(typeof(pic) == "object"){
            const pic_update_sql  = qb.update(currentProduct.pic, "picture", pic);
            query_list.push(pic_update_sql);
        }

        //build product update query
        const inVals = {name, packaging};
        //if id is provided for these values we push them too
        [["brand", brand], ["pic", pic], ["category", category]].forEach(e => {
            if(typeof(e[1]) == "string"){
                inVals[e[0]] = e[1];
            }
        });

        const updateQuery = qb.update(_id, "product", inVals);
        query_list.push(updateQuery);

        const promise_list = query_list.map( q => qb.queryPromise(q) );

        Promise.all(promise_list)
            .then( success, fail );


    }) ;

    /**
     * Delete product and it's asocciated picture along with it.
     **/
    const remove = (_id) => new Promise(async (success, fail) => {
        const qb = queryBuilder(db);
        const queryDeleteProduct = qb.delete(_id, "product");
        const querySelectProduct = qb.selectBy("product", ["$pic", "$brand"], {_id});

        const queryPromise = qb.queryPromise(querySelectProduct);

        const product = await queryPromise;

        if(product.length == 0){
            fail("Sorry, the product does not exist");
        }

        const queryDeletePicture = qb.delete(product[0].pic, "picture");

        const promiseList = [queryDeleteProduct, queryDeletePicture].map(q => qb.queryPromise(q));

        const startTransaction = qb.resolveQueryPromises(promiseList);


        startTransaction
            .then(success)
            .catch(fail);
    });

    return {
        findAll,
        fetch,
        create,
        update,
        remove
    }
}

module.exports = productServices;
