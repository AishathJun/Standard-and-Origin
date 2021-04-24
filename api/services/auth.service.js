const db_error = require("../utils/error.js").handle_db_error;
const queryHandler = require("../utils/query.js");
const uuid = require("../db.service.js").helpers.uuid;

const bcrypt = require("bcrypt");
const saltRounds = 10;

const jwt = require("jsonwebtoken");
const jwt_opts =  { expiresIn: '1h' };

const config = require("../config.js");
const secret_key = config.secret_key || "1234";

//Lets you manage users
function userServices(db){
    const create = (vals, onSuccess, onFail) => {
	const {login_id, password} = vals;
	const sql = "INSERT INTO `user` (`_id`, `login_id`, `password_hash`) VALUES (?,?,?);";
	const create_query_handler = queryHandler.createQuery(onSuccess, onFail);

	bcrypt.hash(password, saltRounds).then( (hash) => {
	    const insertVals = [uuid(), login_id, hash];
	    const query = db.format(sql, insertVals);

	    db.query(query, create_query_handler);
	}).catch( onFail );
	
	
    };

    const list = (onSuccess, onFail) => {
        const sqlQuery = "SELECT CONVERT(_id, CHAR(128)) AS _id, login_id, password_hash FROM user LIMIT 0, 100;"

        db.query(sqlQuery, queryHandler.retrieveQuery(onSuccess, onFail));
    };


    const retrieve = (_id, onSuccess, onFail) => {
        const sql = "SELECT CONVERT(_id, CHAR(128)) AS _id, login_id, password_hash FROM user WHERE `_id` = ?;";
	const insertVals = [_id];
	const query = db.format(sql, insertVals);

        db.query(query, queryHandler.retrieveOneQuery(onSuccess, onFail));
    };

    const retrieveByLoginId = (login_id, onSuccess, onFail) => {
        const sql = "SELECT CONVERT(_id, CHAR(128)) AS _id, login_id, password_hash FROM user WHERE `login_id` = ?;";
	const insertVals = [login_id];
	const query = db.format(sql, insertVals);

        db.query(query, queryHandler.retrieveOneQuery(onSuccess, onFail));
    };


    const decode = (token, onSuccess, onFail) => {
	jwt.verify(token, secret_key, jwt_opts, (err, payload) => {
	    if(err)
		onFail(err);
	    onSuccess(payload);
	});
    };

    const refresh = (token, onSuccess, onFail) => {	
	const decodePromise = _token => new Promise( (s,f) => decode(_token, s, f) );
	decodePromise(token)
	    .then( payload => {
		delete payload.iat;
		delete payload.exp;
		delete payload.nbf;
		delete payload.jti		
		
		jwt.sign(payload, secret_key, jwt_opts, (err, token) => {
		    if(err)
			onFail(err);
		    
		    onSuccess(token);
		});
	    }).catch(err => {
		onFail(err)
	    });
    };
   

    const authenticate = (data, onSuccess, onFail) => {	
	const payload = {type: "admin"};
	const password = data.password;
	const fetchUser = value => new Promise( (s,f) => retrieveByLoginId(value, s, f));
	
	fetchUser(data.login_id).then( user => {	    
	    payload.id = user._id;
	    bcrypt.compare(password, user.password_hash, (err, result) => {
		if(err)
		    onFail(err);		

		if(result){ //password verify success

		jwt.sign(payload, secret_key, jwt_opts, (err, token) => {
		    if(err)
			onFail(err);
		    
		    onSuccess(token);
		});

		}else{
		    onFail("Failed to verfiy password");
		}
		

	    });
	}).catch(
	    (err) => onFail({"msg": "Cannot find user", err})
	);
    };

    /*
    const update;
    const remove;*/
    
    return {
	refresh: (token) => new Promise( (s, f) => refresh(token, s, f) ),
	decode: (token) => new Promise( (s, f) => decode(token, s, f) ) ,
	retrieve: (_id) => new Promise( (s,f) => retrieve(_id, s,f ) ),
	list: () => new Promise( (s,f) => list(s,f) ),
	create: val => new Promise( (s, f) => create(val, s, f)),
	authenticate: val => new Promise( (s,f) => authenticate(val, s, f) )
    }
}

module.exports = userServices;
