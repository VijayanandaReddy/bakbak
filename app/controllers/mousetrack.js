var userUtil = require(__dirname + '/user')
	, mongoose = require('mongoose')
    , MouseTrackModel = mongoose.model('MouseTrackModel')
    , everyauth = require('everyauth');


exports.updateLog= function(info){
	var pageUrl = info['pageUrl'];
	var customerId = info['customerId'];
	var clickPosition = info['clickPosition'][0];
	if(!clickPosition) return;
	var pageX = clickPosition['pageX'];
	var pageY = clickPosition['pageY'];
	//Think about musemovement later.
	console.log("PageX " + pageX + " PageY " + pageY);
	isPageUrlValid(customerId,pageUrl,function(model){
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
				console.log(result);
			}
		});
		console.log(info);
	});
};

exports.getLog = function(req,res) {
	res.header("Access-Control-Allow-Origin", "*");
	var customerId = req.query.customerId;
	var pageUrl = req.query.pageUrl;
	console.log("PageUrl:: " + pageUrl + " customerId:: " + customerId);
	MouseTrackModel.findOne({"customerId":customerId,"pageUrl":pageUrl},function(err,model) {
			if(err || model == null) {
				res.json({"error":err});
			} else {
				console.log("Found in db!");
				console.log(model.mouseTrackLog);
				res.json(model.mouseTrackLog);
			}
		});
}

function isPageUrlValid(customerId,currentUrl,callback) {
	//Validate based on customer settings.
	//Will implement later. 
	//Check in db, if valid then create an entry for it.
	if(currentUrl == "http://localhost:5000/index1" ||
		currentUrl.indexOf("censore.blogspot") > -1){
		console.log("Valid Current Url");
		MouseTrackModel.findOne({customerId:customerId,pageUrl:currentUrl},function(err,model) {
			if(err || model == null) {
				console.log("Creating new mouse track doc for the page.");
				var MouseTrack = new MouseTrackModel({
                   		pageUrl: currentUrl,
    					customerId: customerId
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
	} else {
		console.log("Current URL is not valid " + currentUrl);
		callback(null);
	}
}