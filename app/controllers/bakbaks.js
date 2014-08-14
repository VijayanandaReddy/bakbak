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
					res.render('bakbak_list', {user:user,
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

exports.create = function(req,res) {
	userUtil.userById(req,function(user){
		ApplicationModel.findOne({adminId:user._id},function(err,application) {
			if(err || application == null) {
				res.redirect('/application/create');
			} else {
				var bakbak = {};
				if(req.param('id') != null) {
					if(application.bakbaks) {
						for(var i=0;i<application.bakbaks.length;i++) {
							console.log(req.param('id'));
							console.log(application.bakbaks[i].id.toString());
							if(application.bakbaks[i].id.toString() == req.param('id')) {
								bakbak = application.bakbaks[i];
								console.log(application.bakbaks[i]);
								break;
							}
						}	
					}
				}
				res.render('bakbak_create', {user:user,
					application:application,
					success_message:req.session.success_message,
					bakbak:bakbak,
					current:'bakbak'
				});
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
