var userUtil = require(__dirname + '/user')
	, mongoose = require('mongoose')
    , ApplicationModel = mongoose.model('ApplicationModel')
    , everyauth = require('everyauth');

//create app created step and use it.    

exports.index = function(req,res) {
	userUtil.userById(req,function(user){
		ApplicationModel.findOne({adminId:user._id},function(err,application) {
			if(err || application == null) {
				res.redirect('/application/create');
			} else {
				if(application.bakbak == null) {
					res.render('bakbak_create', {user:user,
						create:false,
						createOrEdit:false,
						application:application,
						success_message:req.session.success_message,
						current:'bakbak'
					});
				}	
			}
		});
	});
}

exports.upsert = function(req, res){
	userUtil.userById(req,function(user){
		ApplicationModel.findOne({adminId:user._id},function(err,application) {
			if(err || application == null) {
				res.redirect('/application/create');
			} else {
				application.upsertBakBak(req.body,function(err,cb){
					if(err) {
						res.render('bakbak_create', {user:user,
							create:false,
							createOrEdit:false,
							application:application,
							success_message:req.session.success_message,
							current:'bakbak'
						});	
					} else {
						res.redirect('/application/create');
					}
				});	
			}
		});
	});
};
