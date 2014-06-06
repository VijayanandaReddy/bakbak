var userUtil = require(__dirname + '/user')
	, mongoose = require('mongoose')
    , ApplicationModel = mongoose.model('ApplicationModel')
    , everyauth = require('everyauth');

//create app created step and use it.    

exports.index = function(req, res){
	userUtil.userById(req,function(user){
		ApplicationModel.findOne({adminId:user._id},function(err,application) {
			if(err || application == null) {
				res.redirect('/application/create');
			} else {
				console.log(application)
				res.render('application', {user:user,
					create:false,
					createOrEdit:false,
					application:application,
					success_message:req.session.success_message,
					current:'base'
				});	
			}
		});
	});
};

exports.offline = function(req, res){
	userUtil.userById(req,function(user){
		ApplicationModel.findOne({adminId:user._id},function(err,application) {
			if(err || application == null) {
				res.redirect('/application/create');
			} else {
				console.log(application)
				res.render('application_offline', {user:user,
					create:false,
					createOrEdit:false,
					application:application,
					success_message:req.session.success_message,
					current:'offline'
				});	
			}
		});
	});
};

exports.saveOffline = function(req, res){
	userUtil.userById(req,function(user){
		ApplicationModel.findOne({adminId:user._id},function(err,application) {
			if(err || application == null) {
				res.redirect('/application/create');
			} else {
				application.upsertOfflineForm(req.body,function(err,result){
					if(err) {
						res.render('application_offline', {user:user,
							create:false,
							createOrEdit:false,
							application:application,
							success_message:err,
							current:'offline'
						});	

					} else {
						res.redirect('/application');
					}
				});
			}
		});
	});
};

exports.edit = function(req, res){
	userUtil.userById(req,function(user){
		ApplicationModel.findOne({adminId:user._id},function(err,application) {
			if(err || application == null) {
				res.redirect('/application/create');
			} else {
				if(req.method == 'GET') {
					console.log(application)
					res.render('application', {user:user,
						create:false,
						createOrEdit:true,
						application:application,
						success_message:req.session.success_message
					});
				} else {
					console.log(req.body);
					var _id=req.body['_id'];
					delete req.body['_id'];
					ApplicationModel.update({_id: _id},req.body,function (err, numberAffected, raw) {
  						if (err) return handleError(err);
  						console.log('The number of updated documents was %d', numberAffected);
  						console.log('The raw response from Mongo was ', raw);
						res.redirect('/application');
					});
				}	
			}
		});
	});
};

exports.create = function(req, res){
	userUtil.userById(req,function(user){
		ApplicationModel.findOne({adminId:user._id},function(err,application) {
			if(err || application == null) {
				if(req.method == 'GET') {
					application = {};
					application.adminId = user._id;
					application.name = '';
					application.agents = 1;
					application.agentIds = [];
					application.enable = true;
					application.domain_blacklist = [];
					application.displayName = user.name;
					application.email = user.email;
					application._id='';
					res.render('application', {user:user,
						create:true,
						createOrEdit:true,
						application:application
					});
				} else { //POST
					console.log('We are good to create');
					var data = req.body;
					console.log(data);
					var Application = new ApplicationModel({
                   		adminId: user._id,
    					name: data.name,
    					agents: 1,
    					email: data.email,
    					domain_blacklist: data.domain_blacklist,
    					enabled: true, //data.enabled == 'on', knowingly doing this to avoid cross browser issues.
    					agentIds: [],
    					displayName: data.displayName
                	});
					Application.save(function(err,application){
						if(err) {
							res.render('application', {user:user,
								create:true,
								createOrEdit:false,
								application:application,
								error_message:err	
							});
						} else {
							req.session.success_message = 'Successfully created application!';
							res.redirect('/application');
						}
					});
				}
			} else {
				res.redirect('/application');
			}
		});	
	});
};