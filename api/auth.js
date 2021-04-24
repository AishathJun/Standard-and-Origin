const authService = require("./services/auth.service.js");
const responseProvider = require("./utils/response.js");

const fetch = (req, res) => {
    const rp = responseProvider(res);
    const {id} = req.params;
    
    authService(db)
	.findOne(id)
        .then(rp.defaultSuccess, rp.defaultFail);
};

const login = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;
    const data = req.body;

    rp.status(401); //set default code
    authService(db)
	.authenticate(data)
	.then((token) => {
	    res.json({
		access_token: token,
		type: "Bearer"
	    });
	}, rp.fail);
};

const list = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;

    authService(db)
	.list()
    .then(rp.success, rp. fail);
};

//for testing purpose
const register = (req, res) => {
    const db = req.app.get("db");
    const rp = responseProvider(res).default;

    authService(db)
	.create({
	    login_id: "admin",
	    password: "1234"
	})
        .then(rp.success, rp.fail);
};

const loginState = (req, res) => {    
    if(req.session && req.session.type){
	
	res.json(req.session);
    }else{
	res.status(401).json({
	    message: "Unauthorized access"
	});
    }
    //res.json(req.headers);
};

const refresh = (req, res) => {
    const rp = responseProvider(res).default;
    if(req.session && req.session.type){
	authService()
	    .refresh(req.token)
	    .then(rp.success, rp.fail);
    }else{
	res.status(401).json({
	    message: "Cannot refresh. No user logged in."
	});
    }
};


module.exports = function(router){
    router.get("/login", loginState);
    router.post("/login", login);
    router.post("/login/create", register);
    router.get("/login/refresh", refresh);
}
