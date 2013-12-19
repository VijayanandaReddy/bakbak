(function() {
 	var socket;

 	window.Visitor = function(customerId) { //CustomerId is the admin with whom this guy is connected to.
		this.adminOnline = false;
		this.lastOnline = null;
		this.adminId = null;
		this.customerId = customerId;
		this.webrtc = null;
		this.location = null;
		this.adminSocketId=null;
		//this.geolocation = window.navigator.geolocation;
		this.browser = BrowserDetect.browser;
		this.os = BrowserDetect.OS;
		this.version = BrowserDetect.version;
		this.gAData = null;
		this.id = null; //socketid will be stored here.
		//Generate this later.
		this.visitorId = Math.round(Math.random() * 60535) + 5000;
		this.presenceIndicator = function () {
			heartbeat(self);
			setTimeout(self.presenceIndicator,VISITOR_HEARTBEAT);
		}
		var self = this;
		this.adminMonitor = function() {
					if(self.lastOnline == null || !self.adminOnline) {
						//First time check or offline customer
						setTimeout(self.adminMonitor, CUSTOMER_MONITOR);
						return;
					}
					var now = new Date().getTime();
					var timeDiff = now - self.lastOnline;
					console.log("Last online at "+ self.lastOnline);
					if(timeDiff > CUSTOMER_MONITOR) {
						console.log("Customer is offline at " + now);
						self.adminOnline = false;
					}
					setTimeout(self.adminMonitor, CUSTOMER_MONITOR);
		};
		this.init = function() {
			initializeWebRTCSupport(self);
			initializeLocationData(self);
			initializeGoogleAnalyticsData(self);
			initializeSocket(self);
			self.presenceIndicator();
			self.adminMonitor();
			console.log(self.navigator);
			//initialize_calling();
		}
		this.onPresence = function (message) {
			console.log("Customer Id is " + self.customerId + " while sender is " + message.sender);
			if(message.sender == self.customerId) {
				self.lastOnline = new Date().getTime();
				console.log("Customer is online " + self.lastOnline);
				self.adminOnline = true;
				self.adminSocketId = message.data.id;
				}
		};
		this.onMessage = function (message) {
			console.log(message);
		};	

		this.onChat = function(message) {
			console.log(message);
			addToChatMessageBox(null,message.sender,message.message);
		};

		this.sendChatMessage = function(chatText) {
			socket.chat(chatText,self.adminSocketId);
			console.log('sending chat message to ' + self.adminSocketId +' with message ' + chatText);
			addToChatMessageBox(null,'me',chatText);
		}
	};
	
	window.Customer = function(customerId) {
		this.customerId = customerId;
		this.visitorId = customerId;
		this.users = new Array();
		this.id = null; //Used for socket Id.
		this.presenceIndicator = function() {
			heartbeat(self);
			setTimeout(self.presenceIndicator,CUSTOMER_HEARTBEAT);
		}
		this.onMessage = function(message) {
			console.log(message);
		};

		this.onChat = function(message) {
			console.log(message);
			addToChatMessageBox(message.sender,message.sender,message.message);
		};

		this.onPresence = function (message) {
			console.log(message);
			var presenceUser = message.data;
			console.log(self.users);
			for(i in self.users) {
				user=self.users[i];
				if(user.visitorId == presenceUser.visitorId) {
					//currently return.
					//In future we will update that visitor.
					console.log("User already in the list!");
					self.users[i].lastOnline = new Date().getTime();
					if(self.users[i].location == null) {
						console.log('Updating location for visitor' + presenceUser.visitorId);
						self.users[i].location=presenceUser.location;
						$('#'+presenceUser.visitorId).detach();
						$("#UserListTemplate").tmpl(presenceUser).appendTo("#userList");
						$("#flagIcon"+presenceUser.visitorId).tooltip();
						$("#map"+presenceUser.visitorId).popover({content : getMapContent(presenceUser.location.geoplugin_city,presenceUser.location.geoplugin_latitude,presenceUser.location.geoplugin_longitude)});
					}
					return;
				}
			}
			console.log("Adding new user!");
			presenceUser.lastOnline = new Date().getTime();
			self.users.push(presenceUser);
			$("#UserListTemplate").tmpl(presenceUser).appendTo("#userList");
			$("#flagIcon"+presenceUser.visitorId).tooltip();
			if(presenceUser.location != null ) {
				$("#map"+presenceUser.visitorId).popover({content : getMapContent(presenceUser.location.geoplugin_city,presenceUser.location.geoplugin_latitude,presenceUser.location.geolugin_longitude)});
			}
		};
		this.sendChatMessage = function(id,visitorId, chatText) {
			socket.chat(chatText,id);
			console.log('sending chat message to ' + visitorId +' with message ' + chatText);
			addToChatMessageBox(visitorId,customerId,chatText);
		};
		var self = this;
		this.init = function() {
			initializeSocket(self);
			self.presenceIndicator();
			self.visitorMonitor();
			//initialize_calling();
		}
		this.visitorMonitor = function() {
			console.log('VISITOR MONITOR');
			for(i in self.users) {
				var user = self.users[i];
				var now = new Date().getTime();
				var timeDiff = now - user.lastOnline;
				//Give a lag in timeDiff for production
				if(timeDiff > VISITOR_MONITOR) {
						console.log("Visitor went offline " + user.visitorId + " at " + now);
						$('#'+user.visitorId).detach();
						self.users.splice(i,1);
					}	
			}
			setTimeout(self.visitorMonitor,VISITOR_MONITOR);
		}
	};

	initializeSocket = function(config) {
		console.log("Initializing socket");
		var SIGNALING_SERVER = '/'
       	var channel = config.customerId;
		var sender = config.visitorId;

		console.log('Declaring a new channel');
		io.connect(SIGNALING_SERVER).emit('new-channel', {
						channel: channel,
					        sender : sender
   		});


   		socket = io.connect(SIGNALING_SERVER + channel);

		
		socket.channel = channel;
		socket.on('connect', function () {
	      		if (config.callback) {
				config.callback(socket);
			}
			console.log('Setting id ' + socket.socket.sessionid);
			console.log(socket);
			config.id = socket.socket.sessionid;
   		});

   		socket.send = function (message) { //Make it channel specific
        		socket.emit('message', {
            			sender: sender,
            			data  : message
        		});
    		};
    	//id should be the socketId to chat with
		socket.chat = function(message,id) {
			var data = {};
			data.type = 'chat';
			data.message = message;
			data.reciever = id;
			data.sender = sender;
			console.log('Sending chat to ' +  id);
			socket.emit('chat',data);
		};

		socket.presence = function(visitor) { //make it channel specific
			socket.emit('presence',{
				sender : sender,
				data : visitor //should change in future with the visitor data.
				});
		};

   		socket.on('message', config.onMessage);
		socket.on('presence',config.onPresence);
		socket.on('chat',config.onChat);
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
		chatBox.append('<br>'+senderName+': '+chatText);
  		chatBox.scrollTop(9999999999);
	}

	initializeWebRTCSupport = function(data) {
				console.log(webrtcsupport);
				data.webrtc=webrtcsupport;
	}

	initializeLocationData = function(self) {
		$.getJSON( "/location", function(data) {
					console.log(data);
					self.location = data;
					});
	}
	initializeGoogleAnalyticsData = function(self) {
		self.gAData = {};
		self.gAData = fillCookieData(self.gAData,'__utma');
		self.gAData = fillCookieData(self.gAData,'__utmz');
		self.gAData = fillCookieData(self.gAData,'__utmx');
		self.gAData = fillCookieData(self.gAData,'__utmc');
		self.gAData = fillCookieData(self.gAData,'__utmb');
		self.gAData = fillCookieData(self.gAData,'__utmv');
		self.gAData = fillCookieData(self.gAData,'__utmcmd');
		self.gAData = fillCookieData(self.gAData,'__utmcsr');
		self.gAData = fillCookieData(self.gAData,'__utmcct');
		self.gAData = fillCookieData(self.gAData,'__utmccn');
		self.gAData = fillCookieData(self.gAData,'__utmctr');
		self.gAData = fillCookieData(self.gAData,'__utmclid');

	}

	})();

