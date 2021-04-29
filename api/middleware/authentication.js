const auth_service = require("../services/auth.service.js")({});
/**
 * Authentication middleware
 **/
const authentication_middleware = async (req, res, next) => {
    req.session = {type: "public"};    

    if(req.headers.authorization){	
	const bearer_token = req.headers.authorization;
	const token = bearer_token.split(" ")[1];
	try{	    
	    req.session = await auth_service.decode(token);	    
	    //consider refresh tokens as invalid
	    if(req.session.type == "refresh_token"){ 
		delete req.session;
	    }
	}catch(err){	   
	    req.token_expired  = true;
	}
	req.token = token;
    }

    next();
};

module.exports = authentication_middleware;

