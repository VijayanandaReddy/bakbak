var userUtil = require(__dirname + '/user')
	, mongoose = require('mongoose')
    , MouseTrackModel = mongoose.model('MouseTrackModel')
    , everyauth = require('everyauth')
    , ApplicationModel = mongoose.model('ApplicationModel');


exports.updateLog= function(info){
	var pageUrl = info['pageUrl'];
	var urlId = info['urlId'];
	var applicationId = info['customerId'];
	var clickPosition = info['clickPosition'][0];
	if(!clickPosition) return;
	var pageX = clickPosition['pageX'];
	var pageY = clickPosition['pageY'];
	//Think about musemovement later.
	console.log("PageX " + pageX + " PageY " + pageY + " " +urlId );
	isPageUrlValid(applicationId,urlId,pageUrl,function(model){
		if(model == null) {
			console.log("Failed to access db!");
			return;
		}
		model.addOrIncrementClickCount(pageX,pageY,function(err,result) {
			if(err) {
				console.log('Failed to update click count');
				console.log(err);
			} else {
				console.log('Succedded to update click count');
				//console.log(result);
			}
		});
		console.log(info);
	});
};

exports.getSettings = function(req,res) {
	var applicationId = req.query.applicationId;
	userUtil.userById(req,function(user){
		ApplicationModel.findOne({"id":applicationId},function(err,application) {
			if(err || application == null) {
				res.redirect('/application/create');
			} else {
				var mouseTrack = application.mouseTracking
				console.log(mouseTrack);
				if(!mouseTrack || mouseTrack.length == 0) {
					mouseTrack['_id'] = null;
					mouseTrack['url']='';
					mouseTrack['clickTrack'] = false;					
				} else {
					mouseTrack = mouseTrack[0];
				}
				res.render('application_mousetrack', {
					user:user,
					create:false,
					createOrEdit:false,
					mousetrack:mouseTrack,
					applicationId: application._id,
					current:'mousetracking'
				});
			}
		});
	});
}
exports.setSettings = function(req,res) {
	var applicationId = req.query.applicationId;
	userUtil.userById(req,function(user){
		ApplicationModel.findOne({"id":applicationId},function(err,application) {
			if(err || application == null) {
				res.redirect('/application/create');
			} else {
				application.upsertMouseTracking(req.body,function(err,mouseTrack) {
					if(err) {
						mouseTrack = req.body;
						error_message = err['message'];
						console.log(err);
						res.render('application_mousetrack', {
							user:user,
							create:false,
							createOrEdit:false,
							mousetrack:mouseTrack,
							applicationId: application._id,
							current:'mousetracking',
							error_message:err
						});
					} else {
						createClickLogEntry(application._id,application.mouseTracking[0]._id,application.mouseTracking[0].url,function(err,model) {
							if(err) {
								console.log(err);
							}
							res.redirect('/application');
						});
						
					}
					
				});
			}
		});
	});
}

exports.getLog = function(req,res) {
	res.header("Access-Control-Allow-Origin", "*");
	var customerId = req.query.customerId;
	var pageUrl = req.query.pageUrl;
	var urlId = req.query.urlId;
	console.log("PageUrl:: " + pageUrl + " customerId:: " + customerId);
	MouseTrackModel.findOne({"applicationId":customerId,"urlId":urlId},function(err,model) {
			if(err || model == null) {
				res.json({"error":err});
			} else {
				console.log("Found in db!");
				console.log(model.mouseTrackLog);
				res.json(model.mouseTrackLog);
			}
		});
}

function createClickLogEntry(applicationId,urlId,currentUrl,callback) {
		MouseTrackModel.findOne({applicationId:applicationId,urlId:urlId},function(err,model) {
			if(err || model == null) {
				console.log("Creating new mouse track doc for the page. " + currentUrl + urlId);
				var MouseTrack = new MouseTrackModel({
                   		pageUrl: currentUrl,
    					applicationId: applicationId,
    					urlId: urlId
                	});
					MouseTrack.save(function(err,mouseTrack){
						if(err) {
							console.log("Cannot save to db!");
							console.log(err);
							callback(null);
						} else {
							console.log("CREATED!");
							callback(mouseTrack);
						}
					});
			} else {
				console.log("Found in db");
				console.log(model);
				callback(model);
			}
		});
}

function isPageUrlValid(applicationId,urlId,currentUrl,callback) {
	//Validate based on customer settings.
	//Will implement later. 
	//Assuming that script is only initialized for correct urls
	//Check in db, if valid then create an entry for it.
	console.log(applicationId + " " + urlId);
		MouseTrackModel.findOne({applicationId:applicationId,urlId:urlId},function(err,model) {
			if(err || model == null) {
				console.log(err);
				callback(null);
			} else {
				console.log("Found in db");
				console.log(model);
				callback(model);
			}
		});
}