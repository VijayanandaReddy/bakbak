var mongoose = require('mongoose')
    , UserModel = mongoose.model('UserModel')
    , ObjectId = mongoose.Types.ObjectId
    , ApplicationModel = mongoose.model('ApplicationModel')
    , userUtil = require(__dirname + '/user')
    , everyauth = require('everyauth');

/*
 * GET Dashboard.
 */
exports.index = function(req, res){
	console.log(req.session);
	console.log('LOADING DASHBOARD');
	userUtil.userById(req,function(user){
		if(user == null) {
			console.log(user);
			console.log('REDIRECTING -->');
			res.redirect('/login');
		} else {
			console.log(user);
			ApplicationModel.findOne({adminId:user._id},function(err,application){
				if(err || application == null) {
					res.redirect('/application/create');
				} else {
					res.render('dashboard', { user: user,
						application:application
					});
				}
			});
		}
	});
};
