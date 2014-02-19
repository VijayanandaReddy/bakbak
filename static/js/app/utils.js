/*common utils for the app */

var embedly_key='ec9acca865ff44c2af3db2c91a269730';

/*
Stuffing into natives
*/

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.replaceAll = function(key,replaceString) {
    return this.replace(new RegExp(key, 'g'), replaceString);
};

Date.prototype.toShortDate = function() {
	return this.getDate()+'/'+(this.getMonth()+1)+'/'+this.getFullYear()+
		' '+this.getHours()+':'+this.getMinutes()+':'+this.getSeconds();
}

/**
 * A utility function to find all URLs - FTP, HTTP(S) and Email - in a text string
 * and return them in an array.  Note, the URLs returned are exactly as found in the text.
 * 
 * @param text
 *            the text to be searched.
 * @return an array of URLs.
 */
function findUrls( text ) {
    var source = (text || '').toString();
    var urlArray = [];
    var url;
    var matchArray;
    // Regular expression to find FTP, HTTP(S) and email URLs.
    var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;
    // Iterate through any URLs in the text.
    while( (matchArray = regexToken.exec( source )) !== null ) {
        var token = matchArray[0];
        urlArray.push( token );
    }
    return urlArray;
}


/* Gloabls */

//Replace with generic way of doing things
getSessionId = function() {
	var response;
	$.ajax({
         url:    bakbakUrl + "sessionid",
         success: function(result) {
                      response = result;
                  },
         async:   false
    });
   return response;
}

var socket;

	initializeSocket = function(config) {
		console.log("Initializing socket");
		var SIGNALING_SERVER='';
		if(bakbakUrl.endsWith('/')) {
			SIGNALING_SERVER = bakbakUrl;
		} else {
			SIGNALING_SERVER = bakbakUrl +'/';
		}
       	var channel = config.customerId;
		var sender = config.visitorId;
		var connectOn = SIGNALING_SERVER + channel;
		console.log("Will Connect on --> " + connectOn);

		console.log('Declaring a new channel');
		io.connect(SIGNALING_SERVER).emit('new-channel', {
						channel: channel,
					     sender : sender
   		});


   		socket = io.connect(connectOn);
		
		socket.channel = channel;
		socket.on('connect', function () {
	      		if (config.callback) {
				config.callback(socket);
			}
			console.log('Connected with socket ' + socket.socket.sessionid);
			config.presenceIndicator();
   		});

   		socket.send = function (message) { //Make it channel specific
        		socket.emit('message', {
            			sender: sender,
            			data  : message
        		});
    		};
    	//id should be the socketId to chat with
		socket.chat = function(message,id,html) {
			html = typeof html !== 'undefined' ? html : false;
			var data = {};
			data.type = 'chat';
			data.message = message;
			data.reciever = id;
			data.sender = sender;
			data.senderId = socket.socket.sessionid;
			data.html = html;
			console.log('Sending chat to ' +  id);
			socket.emit('chat',data);
		};

		socket.setCookie = function(cookieName,cookieValue,id) {
			var data = {};
			data.type = 'setCookie';
			data.cookieName = cookieName;
			data.cookieValue = cookieValue;
			data.reciever = id;
			data.sender = sender;
			console.log('Sending setCookie to ' +  id);
			socket.emit('setCookie',data);
		};

		socket.call = function(video,id,request,data) {
			if(!data)
				data = {};
			data.video = video;
			data.request = request;
			data.reciever = id;
			data.sender = sender;
			console.log('Calling/Responding to ' +  id  + ' ' + sender );
			console.log(data);
			socket.emit('call',data);
		};

		socket.presence = function(visitor,state) { //make it channel specific
			state = (state == undefined || state == null) ? true:state;
			visitor.state = state;
			socket.emit('presence',{
				sender : sender,
				data : visitor //should change in future with the visitor data.
				});
		};

   		socket.on('message', config.onMessage);
		socket.on('presence',config.onPresence);
		socket.on('chat',config.onChat);
		socket.on('call',config.onCall);
		socket.on('setCookie',config.setCookie);
	};
	
	heartbeat = function(data) {
		console.log("Sending presence!");
		socket.presence(data);
	};

	initializeCalling = function() {
		navigator.getUserMedia = navigator.getUserMedia ||
			  navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

		var constraints = {video: true, audio : true};

		function successCallback(localMediaStream) {
			  window.stream = localMediaStream; // stream available to console
			  console.log("Success in getting user media!");
			    var video = document.querySelector("video");
			      video.src = window.URL.createObjectURL(localMediaStream);
			        video.play();
		}

		function errorCallback(error){
			  console.log("navigator.getUserMedia error: ", error);
		}

		navigator.getUserMedia(constraints, successCallback, errorCallback);

	};

	addToChatMessageBox = function(visitorId,senderName,chatText) {
		var chatBox = $('#chatMsgBox'); 
		if(visitorId) {
			chatBox = $('#chatMsgBox'+visitorId);
		}
		urlsArray = findUrls(chatText);
		chatBox.append('<small><br>'+senderName+': '+chatText+'</small>');
		if($('#chatMsgBox').length && urlsArray.length > 0) {
			$('#chatMsgBox').append('<small><br><a href='+urlsArray[0]+'>'+urlsArray[0]+'<a></small>');
			$('#chatMsgBox a').embedly({key: embedly_key, query: {maxwidth: 240}});
		}
  		chatBox.scrollTop(9999999999);
	}

	addToChatMessageBoxHtml = function(visitorId,myName,chatText) {
		var chatBox = $('#chatMsgBox'); 
		if(visitorId) {
			chatBox = $('#chatMsgBox'+visitorId);
		}
		chatText = chatText.replace(myName,'me');
		chatBox.append(chatText);
  		chatBox.scrollTop(9999999999);
	}

	initializeWebRTCSupport = function(data) {
				var webrtcsupport = require('webrtcsupport');
				console.log(webrtcsupport);
				data.webrtc=webrtcsupport;
	}

	initializeLocationData = function(self) {
		$.getJSON( bakbakUrl + "location", function(data) {
					console.log(data);
					self.location = data;
					});
	}
	initializeGoogleAnalyticsData = function(self) {
		self.gAData = {};
		self.gAData = fillCookieData(self.gAData,'__utma');
		self.gAData = fillCookieData(self.gAData,'__utmz');
		self.gAData = fillCookieData(self.gAData,'__utmx');
		self.gAData = fillCookieData(self.gAData,'__utmb');
		self.gAData = fillCookieData(self.gAData,'__utmv');
		self.gAData = fillCookieData(self.gAData,'__utmclid');
		if(self.gAData.__utmz) {
			utmz = self.gAData.__utmz.split('.')[4].split['|'];
			for(i in utmz) {
				each = utmz[i].split("=");
				self.gAData[each[0]] = each[1];
			}
		}
	}

	initializeRefererData = function(self) {
		referer_url = document.referrer;
		$.post( bakbakUrl + "referer",
			{
				referer_url : referer_url,
				current_url : self.current_url
			},'json').done(function(response) {
				console.log(response);
    			self.referer = response;
				});
  	}

  	initializeUserAgentData = function(self) {
		userAgent = navigator.userAgent.toString();
		$.post( bakbakUrl + "ua",{ua:userAgent},'json').done(function(response) {
				console.log(response);
    			self.ua = response;		
				});
  	}

	initializeByeBye = function(self) {
		$(window).unload(function() {
			socket.presence(self,false);
		});
		$(window).on('beforeunload',function() {
			socket.presence(self,false);
		});	
	}


/* Contants */
var CUSTOMER_HEARTBEAT = 30*1000;//10000;
var VISITOR_HEARTBEAT = 60*1000;//15000;
var CUSTOMER_MONITOR = 60*1000;//20000;
var VISITOR_MONITOR = 90*1000;//20000;

/* Other utils methods here */
function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function fillCookieData(obj,cookieName) {
		obj[cookieName] = readCookie(cookieName);
		return obj;
	}

function getMapContent(locationName,latitude,longitude) {
	return "<img src='http://maps.googleapis.com/maps/api/staticmap?center="+locationName+"&zoom=10&size=300x200&sensor=false&markers=color:blue%7Clabel:S%7C"+latitude+","+longitude+"' />"
}

function createCookie(name,value,days,timeout) {
	days = typeof days !== 'undefined' ? days : 999;
	var date = new Date();
	var expires = "; expires="+date.toGMTString();
	if (days && !timeout) {
		date.setTime(date.getTime()+(days*24*60*60*1000));
		expires = "; expires="+date.toGMTString();
	} else if(timeout) {
		date.setTime(date.getTime()+timeout);
		expires = "; expires="+date.toGMTString();
	} 
	document.cookie = name+"="+value+expires+"; path=/";
}


function getRandom() {
	return  Math.round(Math.random() * 60535) + 5000;
}

function getGUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    	return v.toString(16);
	});
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
