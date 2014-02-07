var bakbakUrl ='';
(function() {
	window.Customer = function(customerId) {
		this.customerId = customerId;
		this.visitorId = customerId;
		this.users = new Array();
		this.id = null; //Used for socket Id.
		this.webrtcCall = new Call(customerId);
		var self = this;
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
					console.log('The userId is ' + self.users[i].id + ' while presence userId is ' + presenceUser.id);
					if((self.users[i].id == null)  || ((self.users[i].id != presenceUser.id) && presenceUser.id)) {
						self.users[i].id = presenceUser.id;
						var text = $('#chatMsgBox'+presenceUser.visitorId).html();
						console.log("Chat text is " +text);
						$('#'+presenceUser.visitorId).detach();
						$("#UserListTemplate").tmpl(presenceUser).appendTo("#userList");
						$("#flagIcon"+presenceUser.visitorId).tooltip();
						$('#chatMsgBox'+presenceUser.visitorId).html(text);
						self.sendChatMessage(presenceUser.id,presenceUser.visitorId,text,false);

					} else if(presenceUser.id == null) {
						$('#chatMsg'+presenceUser.visitorId).attr('disabled', 'disabled');
						$('#chatSendInput'+presenceUser.visitorId).attr('disabled', 'disabled');
					}
					if(presenceUser.location != null) //And check if popover is not there!
						$("#map"+presenceUser.visitorId).popover({content : getMapContent(presenceUser.location.geoplugin_city,presenceUser.location.geoplugin_latitude,presenceUser.location.geoplugin_longitude)});
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
			if(!presenceUser.id) {
				$('#chatMsg'+presenceUser.visitorId).attr('disabled', 'disabled');
				$('#chatSendInput'+presenceUser.visitorId).attr('disabled', 'disabled');
			}
			setTimeout(function() {
				customer.sendChatMessage(presenceUser.id,presenceUser.visitorId,"Good Morning! Please like our Facebook Page.");
			},3000);
			 
		};

		this.onCall = function(message) {
			console.log(message);
			self.webrtcCall.onCall(message);
		};

		this.sendChatMessage = function(id,visitorId, chatText,shouldAdd) {
			if(chatText == null || chatText == '') return;
			shouldAdd = typeof shouldAdd !== 'undefined' ? shouldAdd : true;
			socket.chat(chatText,id,!shouldAdd);
			console.log('sending chat message to ' + visitorId +' with message ' + chatText);
			$('#chatMsg'+visitorId).val('');
			if(shouldAdd) {
				addToChatMessageBox(visitorId,customerId,chatText);
			}
		};

		this.init = function() {
			initializeSocket(self);
			//self.presenceIndicator();
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

		this.audioCall = function(id) {
			self.webrtcCall.call(id,true);
		}

		this.editUserId = function(visitorId,element,id) {
			console.log(visitorId);
			element.contentEditable = 'true';
			$(element).focus();
			$(element).keypress(function(event) {
				if (event.keyCode == 13) {
					event.preventDefault();
					var newVisitorName = $(element).text()
					console.log(newVisitorName);
					socket.setCookie('bakbakchatVisitorName',newVisitorName,id);
					$(element).blur();
					$(element).unbind('key');
					element.contentEditable = 'false';
					$(element).text(visitorId + ' ('+newVisitorId +')');
				}
			});
		}

		this.emailVisitorDetails = function(visitorId) {
			console.log('Sending email!');
			for(i in self.users) {
				if(self.users[i].visitorId == visitorId) {
					toPost = self.users[i];
					toPost['email'] = 'biplav.saraf@gmail.com';
					toPost['template'] = 'chatScript';
					toPost['chatScript'] = $('#chatMsgBox'+visitorId).html();
					$.post( bakbakUrl + "email",toPost, 'json').done(function(data) {
						if(data == "OK") {
							console.log('Email sent SUCCESS!');
						}
					});
				}
			}
		}
	};
})();