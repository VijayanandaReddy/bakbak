var mongoose = require('mongoose')
    , UserModel = mongoose.model('UserModel')
    , everyauth = require('everyauth');
/*
 * GET users listing.
 */

  exports.isAdmin = function(session,callback) {
  	if(session == null || typeof session == 'undefined') {
  		callback(false,null);
  		return;
  	}
 	var auth = session.auth;
 	if(typeof auth == 'undefined') {
 		console.log("NOT LOGGED IN");
		console.log(auth);
		callback(false,null);
	} else if(auth.loggedIn){
		console.log('LOGGED IN');
 		UserModel.findOne({_id:auth.userId},function(err,user){
 			console.log('FOUND User');
 			console.log(user);
 			callback(true,user);
 		});
    } else {
    	console.log("NOT LOGGED IN 3");
		console.log(auth);
		callback(false,null);
    }
 } 

 exports.authenticated = function(req,res,next) {
 	var auth = req.session.auth;
 	if(typeof auth == 'undefined') {
 		console.log("NOT LOGGED IN");
		console.log(auth);
		res.redirect('/login');
	} else if(auth.loggedIn){
		console.log('LOGGED IN');
 		next();
    } else {
    	console.log("NOT LOGGED IN 3");
		console.log(auth);
		res.redirect('/login');
    }
 } 

 exports.userById = function(req,callback) {
 	console.log(req.session.auth);
 	UserModel.findOne({_id:req.session.auth.userId},function(err,user){
 		console.log('FOUND User');
 		console.log(user);
 		callback(user);
 	});
 } 

exports.index = function(req, res){
    UserModel.findOne({_id:req.session.auth.userId},function(err,user){
 		res.render('user',{user:user
 			, create:false
			, createOrEdit:false
		});
 	});
};

exports.login = function(req, res){
	console.log('LOGIN PAGE-->');
	res.render('signin', {});
};

exports.logout = function(req, res){
	req.logout();
	res.render('/', {});
};