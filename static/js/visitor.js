(function() {
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
		this.call = new Call(customerId);
		//Generate this later.
		this.visitorId = Math.round(Math.random() * 60535) + 5000;
		this.presenceIndicator = function () {
			heartbeat(self);
			setTimeout(self.presenceIndicator,VISITOR_HEARTBEAT);
		}
		var self = this;
		function setAdminStatus(status) {
			if(status) {
				$('#chatPanel').show();
				$('#offlineIndicator').hide();
			}else {
				$('#chatPanel').hide();
				$('#offlineIndicator').show();
			}
		}
		this.adminMonitor = function() {
					if(self.lastOnline == null || !self.adminOnline) {
						//First time check or offline customer
						setTimeout(self.adminMonitor, CUSTOMER_MONITOR);
						return;
					}
					var now = new Date().getTime();
					var timeDiff = now - self.lastOnline;
					//console.log("Last online at "+ self.lastOnline);
					if(timeDiff > CUSTOMER_MONITOR) {
						console.log("Customer is offline at " + now);
						self.adminOnline = false;
						setAdminStatus(false);

					}
					setTimeout(self.adminMonitor, CUSTOMER_MONITOR);
		};
		this.init = function() {
			$('#chatPanel').hide();
			$('#offlineIndicator').show();
			initializeWebRTCSupport(self);
			initializeLocationData(self);
			initializeGoogleAnalyticsData(self);
			initializeSocket(self);
			//self.presenceIndicator();
			self.adminMonitor();
			//console.log(self.navigator);
			//initialize_calling();
		}
		this.onPresence = function (message) {
			console.log("Customer Id is " + self.customerId + " while sender is " + message.sender);
			if(message.sender == self.customerId) {
				self.lastOnline = new Date().getTime();
				//console.log("Customer is online " + self.lastOnline);
				self.adminOnline = true;
				setAdminStatus(true);
				self.adminSocketId = message.data.id;
				}
		};
		this.onMessage = function (message) {
			console.log(message);
		};	

		this.onChat = function(message) {
			//console.log(message);
			addToChatMessageBox(null,message.sender,message.message);
		};

		this.onCall = function(message) {
			console.log(message);
			self.call.onCall(message);
		};

		this.sendChatMessage = function(chatText) {
			socket.chat(chatText,self.adminSocketId);
			$('#chatMsg').val('');
			console.log('sending chat message to ' + self.adminSocketId +' with message ' + chatText);
			addToChatMessageBox(null,'me',chatText);
		}
	};
	})();