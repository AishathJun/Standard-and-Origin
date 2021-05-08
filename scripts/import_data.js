const fs = require("fs");
const path = require("path");
const { parse } = require('@fast-csv/parse');
const {Transform} = require('stream');

const csv_error_handle = (row) => {
    console.log("Cannot read", row);
};

const countRows = (file_path) => new Promise( (resolve, reject) => {
    fs.createReadStream(file_path)
        .pipe(parse({headers: true}))
        .on("data", ()=>{})
        .on("error", ()=>{
            console.log("Unable to count rows in the csv file");
            reject(0);
        })
        .on("end", (rowCount)=> {resolve(rowCount)});
});


const insertCategories = (services, category_csv_path) => new Promise( async (success, fail) =>  {
    const {db, progress, category} = services;

    //var count = await countRows(category_csv_path);

    const read_stream = fs.createReadStream(category_csv_path);
    const promise_list = [];

    read_stream
        .pipe(parse({headers:true}))
        .on("data", (row) => {
            const img = "assets/img/category/" +row.img;
            const data = {
                name: row.Category,
                url: img
            };
            const dbPromise = (callback=null)=>new Promise( (resolve, reject) => {
                category(db).create(data)
                .then( (res)=> {
                    if(callback)
                        callback(res);
                    //console.log(res);
                    resolve(res);
                })
                .catch( (err)=> {
                    console.error(err);
                    if(callback)
                        callback(err);
                    reject(err);
                })
            });
            promise_list.push(dbPromise);
        })
        .on("error", (row) => {
            console.error("Cannot read ", row);
        })
        .on("end", (rowCount) => {
            console.log(`EOF. ${rowCount} categories were found.`);
            //progress.stop();
        })
        .on("finish", () => {
            success(promise_list);
            //const promises = promise_list.map(p => p());
            //Promise.allSettled(promises).then((r)=>{
                //progress.stop();
                //console.log("Done");
            //});
        });
});


const insertBrands = (services, path) =>  new Promise(async (success, fail) => {
    const {db, progress, brand} = services;

    var count = await countRows(path);
    //const bar = progress.create(count);

    const read_stream = fs.createReadStream(path);
    const promise_list = [];

    read_stream
        .pipe(parse({headers: true}))
        .on("data", (row) =>{
            const brand =  {
                name: row.Brand,
                origin: row.Origin
            };

            const db_promise = (callback=null) => new Promise( (resolve, reject) => {
                services.brand(db)
                    .create(brand)
                    .then( (res) =>{
                        if(callback)
                            callback(res);
                        resolve(res);
                    } )
                    .catch(err => {
			console.error("Cannot create brand", err);
                        reject(err);
                    });
            });
            promise_list.push(db_promise);
        })
        .on("error", csv_error_handle)
        .on("end", rowCount => {
            console.log(`EOF. ${rowCount} brand`);
        })
        .on("finish", () => {
            console.log("Done reading", promise_list.length);
            success(promise_list);
        });
});

const insertProducts = (services, path) => new Promise( (success, fail) => {
    const {db, product} = services;


    const read_stream = fs.createReadStream(path);
    const promise_list = [];

    fs.createReadStream(path)
          .pipe(parse({headers: true}))
          .on("data", row => {
              if(row["img-status"] == "Completed"||
	        row["img status"] == "Completed"
	      ){		      
                  const data = {
                      name: row["Product Name"],
                      brand: {
                          name: row.Brand,
                          origin: row.Origin
                      },
                      packaging: row.Packaging,
                      category: {
                          name: row.Category
                      },
                      pic: {
                          url: "assets/img/products/"+row.id+".jpg"
                      }
                  };
                  const queryPromise = (callback=null) => new Promise( (resolve, reject) => {
                      services.product(db)
                          .create(data)
                          .then( res => {
                              if(callback)
                                  callback(res);
                              resolve(res);
                          } )
                          .catch( err => {
                              if(callback)
                                  callback(err);
                              console.error("error", err);
                              reject(err);
                          } )
                  });
                  promise_list.push(queryPromise);
              }
          }).on("error", csv_error_handle)
        .on("finish", () => {
            console.log("Done reading products", promise_list.length);
            success(promise_list);
        })
});

const createBrandAndCategory = (services) => new Promise(async (resolve, reject) => {
    const category_csv_path = path.resolve(__dirname, "../data", "category.csv");
    const brand_csv_path = path.resolve(__dirname, "../data", "brand_origin_list.csv");

    const brand_promises = await insertBrands(services, brand_csv_path);
    const category_promises = await insertCategories(services, category_csv_path);


    const brand_progress = services.progress.create(brand_promises.length);
    const category_progress = services.progress.create(category_promises.length);

    const moveBrandProgress = () => {
        brand_progress.increment();
    };
    const moveCategoryProgress = () => { category_progress.increment(); };

    //start executing brand and category queries
    //
    console.log("Brand and categories queries ready to execute ");
    const brand_promise_result = brand_promises.map(p => p(moveBrandProgress));
    const category_promise_result = category_promises.map(p => p(moveCategoryProgress));

    const promise_result = [...category_promise_result, ...brand_promise_result];


    Promise.allSettled(promise_result)
        .then(r => {
            console.log("Brand and categories queries complete")
            resolve(r);
            //services.progress.exit();
        })
});

const createProduct = (services) => new Promise( async (resolve, reject) => {
    const product_csv_path = path.resolve(__dirname, "../data", "product_list_sno.csv");

    const product_promises_fn = await insertProducts(services, product_csv_path);

    const product_progress = services.progress.create(product_promises_fn.length);

    const moveProductProgress = () => {
        product_progress.increment();
    };


    const product_promise = product_promises_fn.map( p => p(moveProductProgress)  );

    Promise.allSettled(product_promise)
        .then (r => {
            console.log("Products queries complete");
            resolve();
        });
});

async function runScript(services){
    await createBrandAndCategory(services);
    await createProduct(services);
    services.progress.stop();
    services.db.end();
    process.exit();
}

module.exports = runScript;
