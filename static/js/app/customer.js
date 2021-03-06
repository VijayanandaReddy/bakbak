var bakbakUrl ='';
(function() {
	window.Customer = function(customerId) {
		var self = this;
		this.customerId = customerId;
		this.visitorId = customerId;
		this.users = new Array();
		this.id = getSessionId(); 
		this.webrtcCall = new Call(customerId);
		
		this.presenceIndicator = function() {
			heartbeat(self);
		}
		
		this.onChat = function(message) {
			addToChatMessageBox(message.sender,message.sender,message.message);
		};

		disableChat = function(visitorId) {
			console.log('Disabling Chat!');
			$('#chatMsg'+visitorId.toLowerCase()).attr('disabled', 'disabled');
			$('#chatSendInput'+visitorId).attr('disabled', 'disabled');
		}

		enableChat = function(visitorId) {
			console.log('Enabling Chat!');
			$('#chatMsg'+visitorId).removeAttr('disabled');
			$('#chatSendInput'+visitorId).removeAttr('disabled');
		}

		//break this method.
		this.onPresence = function (message) {
			console.log(message);
			var presenceUser = message.data;
			console.log('Presence-->');
			console.log(presenceUser);
			if(((typeof(presenceUser.adminSocketId) == "undefined") || 
				!presenceUser.adminSocketId )&& 
				presenceUser.id != self.id) {
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
						self.users[i].online = false;
						return;
					} else {
						self.users[i].online = true;
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
					if((self.users[i].phonoId == null && presenceUser.referer != null) ||
					 	(self.users[i].phonoId != presenceUser.phonoId)) {
						console.log("UPDATING REFERER!!");
						self.users[i].phonoId=presenceUser.phonoId;
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
			console.log("Adding new user and firing event!");
			$(document).trigger('bakbak_chat_join_muc',presenceUser.visitorId);
			presenceUser.lastOnline = new Date().getTime();
			presenceUser.online = true;
			self.users.push(presenceUser);
			updateVisitorRow(presenceUser);
			if(presenceUser.location != null ) {
				$("#map"+presenceUser.visitorId).popover({content : getMapContent(presenceUser.location.geoplugin_city,presenceUser.location.geoplugin_latitude,presenceUser.location.geolugin_longitude)});
			}
			if(!presenceUser.id) {
				$('#chatMsg'+presenceUser.visitorId).attr('disabled', 'disabled');
				$('#chatSendInput'+presenceUser.visitorId).attr('disabled', 'disabled');
			}
			playNewUser(); 
		};

		updateVisitorUi = function(i,presenceUser) {
			self.users[i].id = presenceUser.id;
			var text = $('#chatMsgBox'+self.users[i].visitorId.toLowerCase()).html();
			console.log("Chat text is " +text);
			updateVisitorRow(self.users[i]);
			$('#chatMsgBox'+self.users[i].visitorId.toLowerCase()).html(text);
			return text;
		}

		updateVisitorRow = function(user) {
			$('#'+user.visitorId).detach();
			$('#'+user.visitorId).remove();
			console.log(JSON.stringify(user));
			var html = new EJS({url: '/js/tpl/visitor.ejs'}).render(user);
			$(html).appendTo("#userList");
			$("#flagIcon"+user.visitorId).tooltip();
		}

		this.onCall = function(message) {
			console.log(message);
			self.webrtcCall.onCall(message);
		};

		this.sendChatMessage = function(id,visitorId, chatText,shouldAdd) {
			if(chatText == null || chatText == '') return;
			console.log('sending chat message to ' + visitorId +' with message ' + chatText);
			$('#chatMsg'+visitorId).val('');
			$(document).trigger('bakbak_chat_msg_send',{mucId:visitorId, message:chatText});
		};

		this.screenshot =function(id,visitorId) {
			socket.screenshot(id);
		}

		this.onScreenshot = function(data) {
			console.log('GOT SCREENSHOT');
			console.log(data);
			links = $('#screenshots'+data.sender +'> #links').append('<a href="'+data.imgData+'" title="Screenshot" data-gallery> \
			 <img class="imageIconLarge screenshotImg'+data.sender+'" src="'+data.imgData+'" alt="Screenshot"></a>');
			console.log(links);
		}

		this.init = function() {
			initializeSocket(self);
			//self.presenceIndicator();
			self.visitorMonitor();
			//initialize_calling();
			initializeByeBye(self);
			intializeSoundManager();
			//intializePhono(self);
			//self.phonoId = '1';
			initializeXmpp();
		}

		initializeXmpp = function() {
			var xmpp = xmppChatAdmin(false,customerId);
			$(function() {
				$(document).trigger('bakbak_chat_connect',{});
				$(document).bind('bakbak_chat_msg_recvd',function(ev,data) {
					console.log(data);
					addToChatMessageBox(data.room,data.from,data.msg);
					});
				$(document).bind('bakbak_chat_connected',function(ev,data) {
					for(var i in self.users) {
						$(document).trigger('bakbak_chat_join_muc',self.users[i].visitorId);
					}
				});
			});
		}

		this.visitorMonitor = function() {
			console.log('VISITOR MONITOR');
			for(i in self.users) {
				var user = self.users[i];
				var now = new Date().getTime();
				if(!user.online) {
					var timeDiff = now - user.lastOnline;
					//Give a lag in timeDiff for production
					if(timeDiff > VISITOR_MONITOR) {
						console.log("Visitor went offline " + user.visitorId + " at " + now);
						$('#'+user.visitorId).detach();
						self.users.splice(i,1);
					}
				} else {
					user.lastOnline = now;
				}	
			}
			setTimeout(self.visitorMonitor,VISITOR_MONITOR);
		}

		this.audioCall = function(id,callImg) {
			console.log("Dialing to " + id);
			var callButton = $(callImg);
			calls = self.phono.phone.calls;
			for(i in calls) {
				if($.inArray(calls[i].state, [0,1,3]) > -1) {
					calls[i].hangup();
					return;
				}
			}
			self.phono.phone.dial(id, {
          		onRing: function() {
            		console.log("RINGING");
            		callButton.attr('src','/img/actions/png/ringing.gif');
            		callButton.attr("disabled", true)
            		callButton.attr("title","Ringing");
          		},
          		onAnswer: function() {
            		console.log("ANSWERED");
            		callButton.attr('src','/img/actions/png/recieved.png');
            		callButton.attr("disabled", false)
            		callButton.attr('title',"Hangup");
          		},
          		onHangup: function() {
            		console.log("HANGUP");
            		callButton.attr('src','/img/actions/png/audio.png');
            		callButton.attr("disabled", false);
            		callButton.attr('title','Call');
          		},
          		onError: function() {
            		console.log("ERROR");
            		callButton.attr('src','/img/actions/png/audio.png');
            		callButton.attr("disabled", false).
            		callButton.attr('title',"Call");
            	}
        });
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
			console.log(self.users.length);
			for(i in self.users) {
				if(self.users[i].visitorId == visitorId) {
					visitor = self.users[i];
					toPost = visitor;
					toPost['email'] = 'biplav.saraf@gmail.com';
					toPost['template'] = 'chatScript';
					toPost['chatScript'] = $('#chatMsgBox'+visitorId).html();
					toPost['images'] = [];
					var len = $('.screenshotImg'+visitorId).length;
					console.log(len);
					$('.screenshotImg'+visitorId).each(function(index,element) {
						console.log(index);
						imgSrc = $(this).attr('src');
						console.log(imgSrc);
						toPost['images'].push(imgSrc);
						if(index == len-1) {
							console.log('SENDING');
							console.log(bakbakUrl + "email");
							$.post( bakbakUrl + "email",toPost, 'json').done(function(data) {
								if(data == "OK") {
									console.log('Email sent SUCCESS!');
								} else {
									console.log('EMAIL sent ERROR!');
								}
							});
							return false;
						}
					});
				}
			}
		}
	};
})();