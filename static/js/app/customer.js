var bakbakUrl ='';
(function() {
	window.Customer = function(customerId) {
		this.customerId = customerId;
		this.visitorId = customerId;
		this.users = new Array();
		this.id = getSessionId(); 
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

		disableChat = function(visitorId) {
			console.log('Disabling Chat!');
			$('#chatMsg'+visitorId).attr('disabled', 'disabled');
			$('#chatSendInput'+visitorId).attr('disabled', 'disabled');
		}

		enableChat = function(visitorId) {
			console.log('Enabling Chat!');
			$('#chatMsg'+visitorId).removeAttr('disabled');
			$('#chatSendInput'+visitorId).removeAttr('disabled');
		}

		this.onPresence = function (message) {
			console.log(message);
			var presenceUser = message.data;
			console.log('Presence-->' + presenceUser);
			if(!presenceUser.adminSocketId) {
				heartbeat(self);
			}
			for(i in self.users) {
				user=self.users[i];
				if(user.visitorId == presenceUser.visitorId) {
					//currently return.
					//In future we will update that visitor.
					console.log("User already in the list!");
					console.log('Presence STATE -> ' + presenceUser.state);
					if(!presenceUser.state) {
						disableChat(presenceUser.visitorId);
					} else {
						enableChat(presenceUser.visitorId);
					}
					self.users[i].lastOnline = new Date().getTime();
					if(self.users[i].location == null && presenceUser.location != null) {
						console.log('Updating location for visitor' + presenceUser.visitorId);
						self.users[i].location=presenceUser.location;
						updateVisitorUi(i,presenceUser);
						$("#map"+presenceUser.visitorId).popover({content : getMapContent(presenceUser.location.geoplugin_city,presenceUser.location.geoplugin_latitude,presenceUser.location.geoplugin_longitude)});
					}
					if(self.users[i].referer == null && presenceUser.referer != null) {
						console.log("UPDATING REFERER!!");
						self.users[i].referer=presenceUser.referer;
						updateVisitorUi(i,presenceUser);
					}
					if(self.users[i].ua == null && presenceUser.ua != null) {
						self.users[i].ua=presenceUser.ua;
						updateVisitorUi(i,presenceUser);
					}
					self.users[i].curent_url = presenceUser.curent_url;
					$('#curent_url'+presenceUser.visitorId).text(presenceUser.current_url);
					console.log('The userId is ' + self.users[i].id + ' while presence userId is ' + presenceUser.id);
					if((self.users[i].id == null)  || ((self.users[i].id != presenceUser.id) && presenceUser.id)) {
						self.users[i].id = presenceUser.id;
						var text = updateVisitorUi(i,presenceUser);
					} else if(presenceUser.id == null) {
						disableChat(presenceUser.visitorId);
					} else if(presenceUser.first_time) {
						console.log('FIRST TIME ' + presenceUser.first_time);
						var text = $('#chatMsgBox'+self.users[i].visitorId).html();
						self.sendChatMessage(presenceUser.id,presenceUser.visitorId,text,false);
					}
					//if(presenceUser.location != null) //And check if popover is not there!
					//	$("#map"+presenceUser.visitorId).popover({content : getMapContent(presenceUser.location.geoplugin_city,presenceUser.location.geoplugin_latitude,presenceUser.location.geoplugin_longitude)});
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
				console.log("First time message!");
				customer.sendChatMessage(presenceUser.id,presenceUser.visitorId,"Good Morning! Please like our Facebook Page. \
					<iframe src='//www.facebook.com/plugins/like.php?href=http%3A%2F%2Fwww.donateoldspectacles.org%2F&amp;width&amp;layout=button&amp;action=like&amp;show_faces=false&amp;share=false&amp;height=35&amp;appId=163796550478024' \
					 scrolling='no' frameborder='0' style='border:none; overflow:hidden; height:35px;' allowTransparency='true'></iframe> \
					");
			},3000);
			 
		};

		updateVisitorUi = function(i,presenceUser) {
			self.users[i].id = presenceUser.id;
			var text = $('#chatMsgBox'+self.users[i].visitorId).html();
			console.log("Chat text is " +text);
			$('#'+self.users[i].visitorId).detach();
			$("#UserListTemplate").tmpl(self.users[i]).appendTo("#userList");
			$("#flagIcon"+self.users[i].visitorId).tooltip();
			$('#chatMsgBox'+self.users[i].visitorId).html(text);
			return text;
		}

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
			initializeByeBye(self);
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