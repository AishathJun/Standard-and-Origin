async function create_admin(services){
	const {user, db} = services;

	user(db).create({
		login_id: "admin",
		password: "1234"
	}).then( success => {
		console.log("Admin successfully created", success);
	}).catch(err =>{
		console.log("Failed to create admin" );
		process.exit(0);
	});

}

module.exports = create_admin;
