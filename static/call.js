(function() {
 	var socket;
	var CUSTOMER_HEARTBEAT = 10000;
	var VISITOR_HEARTBEAT = 30000;
	var CUSTOMER_MONITOR = 20000;

 	window.Visitor = function(customerId) {
		this.adminOnline = false;
		this.lastOnline = null;
		this.customerId = customerId;
		this.webrtc = null;
		this.location = null;
		this.navigator = window.navigator;
		//Genrate this later.
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
			delete self.navigator.plugins;
			delete self.navigator.geolocation;
			delete self.navigator.mimeTypes;
			initializeWebRTCSupport(self);
			initializeLocationData(self);
			initialize_socket(self);
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
				}
		};	

			
	};
	
	window.Customer = function(customerId) {
		this.customerId = customerId;
		this.visitorId = customerId;
		this.presenceIndicator = function() {
			heartbeat(self);
			setTimeout(self.presenceIndicator,CUSTOMER_HEARTBEAT);
		}
		this.onMessage = function(message) {
			console.log(message);
		};
		this.onPresence = function (message) {
			console.log(message);
		};
		var self = this;
		this.init = function() {
			initialize_socket(self);
			self.presenceIndicator();
			//initialize_calling();
		}
	};

	initialize_socket = function(config) {
		console.log("Initializing socket");
		var SIGNALING_SERVER = '/'
       		var channel = config.customerId || this.channel;
		var sender = config.visitorId;
		io.connect(SIGNALING_SERVER).emit('new-channel', {
						channel: channel,
					        sender : sender
   		});

		socket = io.connect(SIGNALING_SERVER + channel);
		//socket.channel = channel;

		socket.on('connect', function () {
	      		if (config.callback) config.callback(socket);
   		});

   		socket.send = function (message) { //Make it channel specific
        		socket.emit('message', {
            			sender: sender,
            			data  : message
        		});
    		};

		socket.presence = function(visitor) { //make it channel specific
			socket.emit('presence',{
				sender : sender,
				data : visitor //should change in future with the visitor data.
				});
		};

   		socket.on('message', config.onMessage);
		socket.on('presence',config.onPresence);
	};
	
	heartbeat = function(data) {
		console.log("Sending presence!");
		socket.presence(data);
	};

	initialize_calling = function() {
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

	initializeWebRTCSupport = function(data) {
				console.log(webrtcsupport);
				data.webrtc=webrtcsupport;
	}

	initializeLocationData = function(self) {
		$.getJSON( "/location", function(data) {
					console.log(data);
					self.locationData = data;
					});
	}


	})();

