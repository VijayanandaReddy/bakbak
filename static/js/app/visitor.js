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
				addOnlineLabel();
			}else {
				addOfflineLabel();
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
			initializeStatusUi();
			$('#offlineIndicator').show();
			initializeWebRTCSupport(self);
			initializeLocationData(self);
			initializeGoogleAnalyticsData(self);
			initializeSocket(self);
			//self.presenceIndicator();
			self.adminMonitor();
			//console.log(self.navigator);
			//initialize_calling();
			$(document).ready(function(){
				var bodyHeight = $("body").height();
                var vwptHeight = $(window).height();
                if (vwptHeight > bodyHeight) {
                 	$("footer#bakbakchat").css("position","absolute").css("bottom",0);
                }
			});
		}

		initializeStatusUi = function() {
			$("body").append("<footer id='bakbakchat' style='width:125px;z-index:99999;margin:0;position:fixed;background:white' class='table-bordered'></footer>");
			addStatusCheckLabel();
			setTimeout(function() {
					if(!this.adminOnline){
						addOfflineLabel();
					}
				},12000);
		};

		addStatusCheckLabel = function() {
			$('#bakbakchat').empty();
			$('#bakbakchat').append("<p id='offlineCheck' class='alert alert-info' style='margin:0px'>Support<img src='"+bakbakUrl+"img/actions/png/spinner.gif'/></p>");
		}

		showChatBar = function(showByDefault) {
			if($('#chatPanel').length) {
				if($('#chatPanel').is(':visible') && 
					(showByDefault == undefined || !showByDefault)) {
					console.log("Hiding chat bar!");
					$('#chatPanel').hide();
				} else {
					console.log("Showing chat bar!");
					$('#chatPanel').show();
					$('#chatMsg').focus();
				}
				return;
			}
			console.log("Showing chat bar!");
			$('#bakbakchat').prepend("<div id='chatPanel' class='chatPanel'> \
			<div id='chatMsgBox' class='chatMessages maxHeight100 scrollbar backgroundWhite'></div> \
			<div class='chatText input-append' style='margin:0;width:100%'> \
  				<input class='input-block-level' id='chatMsg' type='text' placeholder='Chat'> \
  				<button class='btn btn-success btn-default' id='chatSendButton' type='button'>S</button>\
			</div> \
		</div>");
			$('#chatMsg').keydown(function(event) {
				if (event.keyCode == 13) {
					sendChatMessage($('#chatMsg').val());
				}
			});
			$('#chatSendButton').click(function() {
				sendChatMessage($('#chatMsg').val());
			});

		}

		addOnlineLabel = function() {
			if($('#onlineConfirm').length) return;
			console.log('Adding online label');
			$('#onlineConfirm').unbind('click');
			$('#bakbakchat').empty();
			$('#bakbakchat').append("<p id='onlineConfirm' class='alert alert-success' style='margin:0px'>Support<img src='"+bakbakUrl+"img/avatars/avatar-green-talking20x20.png'></img></p>");
			$('#onlineConfirm').click(function() {
				showChatBar();
			});
		}


		addOfflineLabel = function() {
			if($('#offlineConfirm').length) return;
			console.log('Adding offline label');
			$('#bakbakchat').empty();
			$('#bakbakchat').append("<p id='offlineConfirm' class='alert alert-danger' style='margin:0px'>Support<img src='"+bakbakUrl+"img/avatars/avatar-red-talking20x20.png'></img></p>");
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
			addOnlineLabel();
			showChatBar(true);
			addToChatMessageBox(null,message.sender,message.message);
		};

		this.onCall = function(message) {
			console.log(message);
			self.call.onCall(message);
		};

		sendChatMessage = function(chatText) {
			socket.chat(chatText,self.adminSocketId);
			$('#chatMsg').val('');
			console.log('sending chat message to ' + self.adminSocketId +' with message ' + chatText);
			addToChatMessageBox(null,'me',chatText);
		}
	};
	})();