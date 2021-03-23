var fs = require('fs');
//Loads the config file
function loadConfigFile(){
    try{
        return JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    }catch(err){
        console.log("Cannot start the server. Please make sure the config.json exists in the root directory. \nPlease check the README file for details");
        process.exit(-1);
    }
}

module.exports = loadConfigFile();
