var mongoose = require('mongoose')
    , UserModel = mongoose.model('UserModel')
    ,ObjectId = mongoose.Types.ObjectId;

/*
 * GET home page.
 */
exports.index = function(req, res){
	var isAdmin=false;
	console.log(req.session.auth);
	if(req.session.auth &&
		req.session.auth.loggedIn && 
		req.session.auth.userId) {
			UserModel.findOne({id:req.session.userId},function(err, user) {
				if(err || user == null) {
					console.error(err);
					console.log(user);
					console.log("Not LOGGED IN");
					res.render('index', { title: 'Express',
    					  isAdmin: false
						});
				} else {
					console.log('LOGGED IN');
					console.log(user)
        			res.render('index', { isAdmin: true});
        		}
    		});
	} else {
		console.log("Not LOGGED IN");
		res.render('index', { title: 'Express',
    					  isAdmin: isAdmin
					});
	}   
};
