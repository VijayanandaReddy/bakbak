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

var indexOf = function(needle) {
    if(typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                if(this[i] === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }
    return indexOf.call(this, needle);
};

findElementLocation = function (el) {
    //if(el !== null) throw Exception("Got null element");
    if (el instanceof $) {
      // a jQuery element
      el = el[0];
    }
    if (el[0] && el.attr && el[0].nodeType == 1) {
      // Or a jQuery element not made by us
      el = el[0];
    }
    if (el.id) {
      return "#" + el.id;
    }
    if (el.tagName == "BODY") {
      return "body";
    }
    if (el.tagName == "HEAD") {
      return "head";
    }
    if (el === document) {
      return "document";
    }
    var parent = el.parentNode;
    if ((! parent) || parent == el) {
      console.warn("elementLocation(", el, ") has null parent");
      throw new Error("No locatable parent found");
    }
    var parentLocation = findElementLocation(parent);
    var children = parent.childNodes;
    var _len = children.length;
    var index = 0;
    for (var i=0; i<_len; i++) {
      if (children[i] == el) {
        break;
      }
      if (children[i].nodeType == document.ELEMENT_NODE) {
        if (children[i].className.indexOf("togetherjs") != -1) {
          // Don't count our UI
          continue;
        }
        // Don't count text or comments
        index++;
      }
    }
    return parentLocation + ":nth-child(" + (index+1)	 + ")";
  }

/*jQuery.fn.getPath = function () {
    if (this.length != 1) {
    	console.log("MOUSETRACKER:: Length is" + this.length);
    	throw 'Requires one element.';
    }

    var path, node = this;
    while (node.length) {
        var realNode = node[0];
        var name = (

            // IE9 and non-IE
            realNode.localName ||

            // IE <= 8
            realNode.tagName ||
            realNode.nodeName

        );

        // on IE8, nodeName is '#document' at the top level, but we don't need that
        if (!name || name == '#document') break;

        name = name.toLowerCase();
        if (realNode.id) {
            // As soon as an id is found, there's no need to specify more.
            return name + '#' + realNode.id + (path ? '>' + path : '');
        } else if (realNode.className) {
            name += '.' + realNode.className.split(/\s+/).join('.');
        }

        var parent = node.parent(), siblings = parent.children(name);
        if (siblings.length > 1) name += ':eq(' + siblings.index(node) + ')';
        path = name + (path ? '>' + path : '');

        node = parent;
    }

    return path;
};
*/
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

function getHiddenProp(){
    var prefixes = ['webkit','moz','ms','o'];
    
    // if 'hidden' is natively supported just return it
    if ('hidden' in document) return 'hidden';
    
    // otherwise loop over all the known prefixes until we find one
    for (var i = 0; i < prefixes.length; i++){
        if ((prefixes[i] + 'Hidden') in document) 
            return prefixes[i] + 'Hidden';
    }

    // otherwise it's not supported
    return null;
}


function isHidden() {
	var prop = getHiddenProp();
    if (!prop) return false;
    return document[prop];
}

function clone(obj,ignoreList) {
    if (null == obj || "object" != typeof obj) return obj;
    if (null == ignoreList) ignoreList=[];
    var copy = {};
    for (var attr in obj) {
    	console.log(ignoreList.indexOf(attr));
    	if(!(ignoreList.indexOf(attr) > -1)) {
        	if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    	}
    }
    return copy;
}

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

function removeURLParameter(url, parameter) {
    //prefer to use l.search if you have a location/link object
    var urlparts= url.split('?');   
    if (urlparts.length>=2) {

        var prefix= encodeURIComponent(parameter)+'=';
        var pars= urlparts[1].split(/[&;]/g);

        //reverse iteration as may be destructive
        for (var i= pars.length; i-- > 0;) {    
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {  
                pars.splice(i, 1);
            }
        }

        url= urlparts[0]+'?'+pars.join('&');
        if(url.endsWith("?")) {
        	url = url.replace(new RegExp('\\?$'), '')
        }
        return url;
    } else {
        return url;
    }
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

		socket.mouseTrack = function(customerId,info) {
			console.log("MOUSETRACKER:: send to socket " + customerId);
			var data = {};
			data.type = 'mouseTrack';
			data.log = info;
			data.reciever = customerId;
			data.sender = sender;
			socket.emit('mouseTrack',data);
		};

		socket.screenshot = function(id,imgData) {
			var data = {};
			data.reciever = id;
			data.sender = sender;
			data.imgData = imgData;
			console.log('Sending fetch screenshot to ' +  id);
			socket.emit('screenshot',data);
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
		socket.on('call',config.onCall);
		socket.on('setCookie',config.setCookie);
		socket.on('screenshot',config.onScreenshot);
	};
	
	heartbeat = function(data) {
		console.log("Sending presence!");
		if(socket) {
			presenceData = clone(data,['phono']);
			console.log('Sending presence data');
			console.log(presenceData);
			socket.presence(presenceData);
		}
	};

	//remove this.
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
  		playNewMessage();
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
					heartbeat(self);
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
    			heartbeat(self);
				});
  	}

  	initializeUserAgentData = function(self) {
		userAgent = navigator.userAgent.toString();
		$.post( bakbakUrl + "ua",{ua:userAgent},'json').done(function(response) {
				console.log(response);
    			self.ua = response;
    			heartbeat(self);	
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

	intializeSoundManager = function() {
		soundManager.setup({
    		// where to find the SWF files, if needed
    		url: bakbakUrl + 'static/swf',
    		onready: function() {
      			soundManager.createSound({
      				id: 'newUser',
      				url: bakbakUrl+'sounds/doorbell.mp3'
    			});
    			soundManager.createSound({
      				id: 'newMessage',
      				url: bakbakUrl+'sounds/text_message.mp3'
    			});
    			
    		},

    		ontimeout: function() {
    			console.log("SOUND MANAGER FAILED TO LOAD!");
    			soundManager = undefined;
      			// Uh-oh. No HTML5 support, SWF missing, Flash blocked or other issue
    		}
		});

	}

	intializePhono = function(self) {
		/*if(self.webrtc && !self.webrtc.support) {
			return false;
		}
		var phono = $.phono({
  			apiKey: "ad3e2fadd6a88c87fab918bf0c610558",
  			onReady: function() {
    			console.log("Phono Connected");
    			self.phonoId = this.sessionId;
    			heartbeat(self);
    			$('#'+self.phono.audio.config.localContainerId).hide();
    			this.messaging.send("biplav.saraf@gmail.com", "Hello");
  			},
  			// Phone API Configuration
  			phone: {
    			// Same as calling the get/set functions
    			//ringTone: "http://s.phono.com/ringtones/Diggztone_Agent94.mp3",
    			headset: true,
    			// Event Handlers
    			onIncomingCall: function(event) {
      				console.log("Incoming Call: " + event.call.id);
      				var call = event.call;
      				self.onCall();
      				call.bind({
          				onHangup: function(event) {
               				console.log("HUNGUP--->");
               				self.callEnded();
          				},
          				onAnswer: function(event) {
          					console.log("ANSWER-------->");
          					self.callAnswered(call);
          				},
          				onError: function(event) {
          					console.log("HUNGUP--->");
               				self.callEnded();
          				}
          			});
          			call.answer();
    			},
    			onError: function(event) {
      				console.log("Phone error: " + event.reason);
      				self.callEnded();
    			}
  			}
		});
		self.phono = phono;
    */
	}

	initializeTenHands = function() {
		//api key
		//0c945ac4-330b-46d7-aa78-e966a1dd0c0e
	}

	playNewUser = function() {
		if(typeof(soundManager) != "undefined" && isHidden()) {
			console.log("New user sound");
			soundManager.play('newUser');
		}
	}

	playNewMessage = function() {
		if(typeof(soundManager) != "undefined" && isHidden()) {
			soundManager.play('newMessage');
		}
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
