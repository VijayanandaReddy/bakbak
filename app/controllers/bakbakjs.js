var userUtil = require(__dirname + '/user')
	, mongoose = require('mongoose')
    , ApplicationModel = mongoose.model('ApplicationModel')
    , everyauth = require('everyauth');

//create app created step and use it.    

exports.index = function(req, res){
	var id = req.query.id;
	if(!id) {
		res.setHeader('Content-Type', 'application/javascript');
		res.render('errorjs',{ msg:'No id specified'}); //render empty js.
	}
	ApplicationModel.findOne({_id:id},function(err,application) {
		if(err || application == null) {
			res.setHeader('Content-Type', 'application/javascript');
			res.render('errorjs',{ msg: 'Application id is incorrect!' }); //render empty js.				
		} else {
			console.log(application);
			res.setHeader('Content-Type', 'application/javascript');
			res.render('bakbakjs', { application:application,
							sessionId:req.sessionID
			});
		}
	});
};