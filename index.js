const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

//serve everything in html folder
app.use(express.static("html"));


//redirect base url to homepage.
app.get("/", (req, res) => {
	res.sendFile("html/home.html", {root: __dirname});
});

//then we start server
app.listen(port, () => {
	console.log("Please open http://localhost:"+port+"/");
});
