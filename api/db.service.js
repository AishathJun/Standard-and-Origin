//Database service
const config = require("./config.js");
const mysql = require("mysql");
const { v4: uuidv4 } = require('uuid');

function databaseService(){
    return mysql.createConnection(config.mysql);
}

function dbHelpers(){

}

/**
 * This probably doesnt work properly
 **/
function testConnection(){
    const con = databaseService();
    con.connect((err)=>{
        if(err){
            console.error("Error: Failed to connect to database. Make sure config.json is correct");
            process.exit(1);
        }
    });
    con.end();
}

function dbHelpers(){
    return {
        uuid: uuidv4
    }
};

testConnection();

module.exports = {
    service: databaseService(),
    helpers: dbHelpers()
};
