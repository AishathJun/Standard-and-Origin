const dbService = require("../api/db.service.js");
const category_service = require("../api/services/category.service.js");
const brand_service = require("../api/services/brand.service.js");
const product_service = require("../api/services/product.service.js");
const import_script = require("./import_data.js");
const cli_progress = require("cli-progress");

const progress_service = function(){
    const multibar = new cli_progress.MultiBar({
        clearOnComplete: false,
        hideCursor: true
    }, cli_progress.Presets.shades_grey);

    return {
        multibar: multibar,
        create: (val) => multibar.create(val, 0),
        increment: bar => bar.increment(),
        stop: () => multibar.stop()
    };
}

const services = {
    db: dbService.service,
    category: category_service,
    brand: brand_service,
    category: category_service,
    product: product_service,
    progress: progress_service()
};

const cmd_args = process.argv.slice(2);


if(cmd_args.length == 0){
    //no args passed
    console.log("No arguments passed to run script");
}else{
    const cmd = cmd_args[0];

    switch(cmd){
    case "import":
        import_script(services);
        break;
    default:
        console.log(`Unrecognized command '${cmd}'`);
    }
}
