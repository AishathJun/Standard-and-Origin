const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

//database service
const dbService = require("./api/db.service.js");

//this loads the the backend API
const webapi = require("./api");


//serve everything in html folder
app.use(express.static("html"));


app.use(express.json());

//all requests to /api will be handled by our backend api
app.use("/api", webapi);

//provide databse service as 'db'
app.set("db", dbService.service);
app.set("helpers", dbService.helpers);


//redirect base url to homepage.
app.get("/", (req, res) => {
	res.sendFile("html/home.html", {root: __dirname});
});

//then we start server
app.listen(port, () => {
	console.log("Please open http://localhost:"+port+"/");
});
