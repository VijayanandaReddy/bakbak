(function() {
 	window.Visitor = function(customerId) { //CustomerId is the admin with whom this guy is connected to.
 		getUserId = function() {
			var userId = readCookie('bakbakUserId');
			if(userId == null) {
				userId = getGUID();
				createCookie('bakbakUserId',userId,999);
			}
			return userId;
		}
		//Extract a method
		this.visitorName = readCookie('bakbakchatVisitorName') ? readCookie('bakbakchatVisitorName') : 'Unknown';
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
		this.visitorId = getUserId();
		this.presenceIndicator = function () {
			heartbeat(self);
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
						self.lastOnline = new Date().getTime()-5; //dont want to wait 2 cycles!
						self.adminOnline=true;
						setTimeout(self.adminMonitor, CUSTOMER_MONITOR);
						return;
					}
					var now = new Date().getTime();
					var timeDiff = now - self.lastOnline;
					if(timeDiff > CUSTOMER_MONITOR) {
						console.log("Customer is offline at " + now);
						if(self.adminOnline) {
							self.adminOnline = false;
							setAdminStatus(false);
						}
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
			heartbeat(self);
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
			$("body").append("<footer id='bakbakchat' style='width:150px;z-index:99999;margin:0;position:fixed;bottom:0px' class='table-bordered backgroundGray'></footer>");
			if(readCookie('bakbakchatOnline')) {
				//addOnlineLabel();
				setAdminStatus(true);
			} else {
				addStatusCheckLabel();
			}
		};

		addStatusCheckLabel = function() {
			$('#bakbakchat').empty();
			$('#bakbakchat').width('150px');
			$('#bakbakchat').append("<p id='offlineCheck' class='alert alert-info' style='margin:0px'>Support<img src='"+bakbakUrl+"img/actions/png/spinner.gif'/></p>");
		}

		showChatBar = function(showByDefault) {
			if($('#chatPanel').length) {
				if($('#chatPanel').is(':visible') && 
					(showByDefault == undefined || !showByDefault)) {
					console.log("Hiding chat bar!");
					$('#chatMsg').blur();
					$('#chatPanel').hide();
					$('#bakbakchat').width('150px');
				} else {
					console.log("Showing chat bar!");
					$('#chatPanel').show();
					$('#chatMsg').focus();
					$('#bakbakchat').width('260px');
					console.log('Admin socjet id is ' + self.adminSocketId);
					if(!self.adminSocketId) {
						$('#chatMsg').attr('disabled', 'disabled');
						$('#chatSendButton').attr('disabled', 'disabled');
					}
				}
				return;
			}
			console.log("Showing chat bar!");
			$('#bakbakchat').append("<div id='chatPanel' class='chatPanel'> \
			<div id='chatMsgBox' class='chatMessages maxHeight100 scrollbar'></div> \
			<div class='chatText input-append' style='margin:0;width:100%'> \
  				<input class='input-block-level' id='chatMsg' type='text' placeholder='Chat'> \
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
			$('#bakbakchat').width('260px');
			$('#chatMsg').focus();
			if(!self.adminSocketId) {
						$('#chatMsg').attr('disabled', 'disabled');
						$('#chatSendButton').attr('disabled', 'disabled');
					}
		}

		addOnlineLabel = function() {
			if($('#onlineConfirm').length) return;
			$('#bakbakchat').width('150px');
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
			$('#bakbakchat').width('150px');
			console.log('Adding offline label');
			$('#bakbakchat').empty();
			$('#bakbakchat').append("<p id='offlineConfirm' class='alert alert-danger' style='margin:0px'>Support<img src='"+bakbakUrl+"img/avatars/avatar-red-talking20x20.png'></img></p>");
		}

		this.onPresence = function (message) {
			console.log("Customer Id is " + self.customerId + " while sender is " + message.sender + " socketid is " + message.data.id);
			if(message.sender == self.customerId) {
				self.lastOnline = new Date().getTime();
				//console.log("Customer is online " + self.lastOnline);
				self.adminOnline = true;
				setAdminStatus(true);
				self.adminSocketId = message.data.id;
				heartbeat(self);
				createCookie('bakbakchatOnline','true',0,CUSTOMER_HEARTBEAT+5000);
				$('#chatMsg').removeAttr('disabled');
				}
		};
		this.onMessage = function (message) {
			console.log(message);
		};	

		this.onChat = function(message) {
			//console.log(message);
			addOnlineLabel();
			showChatBar(true);
			if(message.html) {
				addToChatMessageBoxHtml(null,self.visitorId,message.message);
			} else {
				addToChatMessageBox(null,message.sender,message.message);
			}
		};

		this.onCall = function(message) {
			console.log(message);
			self.call.onCall(message);
		};

		sendChatMessage = function(chatText) {
			if(chatText == null || chatText == '') return;
			socket.chat(chatText,self.adminSocketId);
			$('#chatMsg').val('');
			console.log('sending chat message to ' + self.adminSocketId +' with message ' + chatText);
			addToChatMessageBox(null,'me',chatText);
		}

		this.setCookie = function(data) {
			console.log('Got set cookie meesage!');
			createCookie(data.cookieName,data.cookieValue);
		} 
	};
	})();