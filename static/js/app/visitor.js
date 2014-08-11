define(['jquery','webrtcsupport','socketio','app/utils','validator','html2canvas',
  'jquery.embedly-3.1.1.min','jquery.placeholder',/*'jquery.phono.min',*/'tenhands.loader.v2.0','ejs','app/xmpp_chat'],
  function($,webrtc,socketio,util,validator,html2canvas,embedly,placeholder,/*phono,*/tenhands,ejs,xmpp) {
 	window.Visitor = function(customerId) { //CustomerId is the admin with whom this guy is connected to.
		var self = this;
		//Extract a method
		this.visitorName = readCookie('bakbakchatVisitorName') ? readCookie('bakbakchatVisitorName') : 'Unknown';
		this.adminOnline = false;
		this.adminId = null;
		this.customerId = customerId;
		this.webrtc = null;
		this.location = null;
		this.adminSocketId=null;
		this.current_url = window.location.toString();
		this.gAData = null;
		this.id = sessionId; 
		this.visitorId = sessionId;
		
		this.presenceIndicator = function () {
			heartbeat(self);
		}
		
		this.init = function() {
			$('#chatPanel').hide();
			$('#offlineIndicator').show();
			initializeRefererData(self);
			initializeUserAgentData(self);
			initializeLocationData(self);
			initializeStatusUi();
			initializeWebRTCSupport(self);
			initializeGoogleAnalyticsData(self);
			initializeSocket(self);
			heartbeat(self);
			initializeByeBye(self);
			initializeXmpp();
			//intializePhono(self);
			//initialize_calling();
			$(document).ready(function(){
				var bodyHeight = $("body").height();
                var vwptHeight = $(window).height();
                if (vwptHeight > bodyHeight) {
                 	$("footer#bakbakchat").css("position","absolute").css("bottom",0);
                }
			});
		}

		initializeXmpp = function () {
			console.log('Event fired to connect to xmpp!');
			var xmpp = new xmmppChatClient(false,'test');
			$(document).trigger('bakbak_chat_connect',{});
			$(document).bind('bakbak_chat_online',function() {
				addOnlineLabel();
			});
			$(document).bind('bakbak_chat_offline',function() {
				addOfflineLabel();
			});
			$(document).bind('bakbak_chat_msg_recvd',function(ev,data) {
				self.onChat(data.from,data.msg);
			});
		}

		initializeStatusUi = function() {
			$("body").append("<div id ='bakbakchat_container' class='bakbak_bootstrap'><footer id='bakbakchat' style='z-index:99999;margin:0;position:fixed;bottom:0px' class='table-bordered backgroundGray'></footer></div>");
			var adminId = readCookie('bakbakchatOnline');
			addOfflineLabel(false);
			if(adminId) {
				self.adminId = adminId;
			}
		};

		addStatusCheckLabel = function() {
			$('#bakbakchat').empty();
			$('#bakbakchat').width('150px');
			$('#bakbakchat').append("<p id='offlineCheck' class='alert alert-info' style='margin:0px'>Support<img src='"+bakbakUrl+"img/actions/png/spinner.gif'/></p>");
		}

		showContactUsBar = function () {
			if($('#contactUsPanel').length) {
				if($('#contactUsPanel').is(':visible')) {
					console.log("Hiding Contact Us bar!");
					$('#contactUsPanel').hide();
					$('#bakbakchat').removeClass('chatMaximize').addClass('chatMinimize');
				} else {
					console.log("Showing chat bar!");
					$('#contactUsPanel').show();
					$('#bakbakchat').removeClass('chatMinimize').addClass('chatMaximize');
				}
				return;
			}
			$("#bakbakchat").append("<div id='contactUsPanel'/>");
			if(typeof offlineForm != 'undefined')
				showOfflineForm(offlineForm);
			else
				showDefaultForm();
		}

		showOfflineForm = function(offlineForm) {
			if(offlineForm.type == '0')
				showDefaultForm(offlineForm.data);
			else if(offlineForm.type == '1') 
				showGoogleForm(decodeURI(offlineForm.data));
			else 
				showEmbedForm(decodeURI(offlineForm.data));
		}

		showEmbedForm = function(embedCode) {
			$('#contactUsPanel').html(embedCode);
			$('#bakbakchat').removeClass('chatMinimize').addClass('chatMaximize');
		}

		showGoogleForm = function(url) {
			$("#contactUsPanel").html("Loading...");
				$.get(url, {}, function(content) {
   					$('#contactUsPanel').html(html);
   					$('#bakbakchat').removeClass('chatMinimize').addClass('chatMaximize');
   					return false;
				},
		 		"text");
			return false;
		}

		showDefaultForm = function(msg) {
			console.log("Showing Default Form!");
			var html = new EJS({url: bakbakUrl+'js/tpl/defaultForm.ejs'}).render({displayMsg:msg});
			$('#contactUsPanel').html(html);
			$('#contactUsForm').on( 'submit' ,function(event) {
				event.preventDefault();
				sendContactUsForm($(this).serialize());
			});
			$('#bakbakchat').removeClass('chatMinimize').addClass('chatMaximize');
			$('#inputEmail').focus();
			$('input, textarea').placeholder();
		}

		disableChatBar = function() {
			$('#chatMsg').attr('disabled', 'disabled');
			$('#chatSendButton').attr('disabled', 'disabled');
		}

		enableChatBar = function() {
			console.log("ENabling CHAT bar");
			$('#chatMsg').removeAttr('disabled');
			$('#chatSendButton').removeAttr('disabled');
		}

		showChatBar = function(showByDefault) {
			if($('#chatPanel').length) {
				if($('#chatPanel').is(':visible') && 
					(showByDefault == undefined || !showByDefault)) {
					console.log("Hiding chat bar!");
					$('#chatMsg').blur();
					$('#chatPanel').hide();
					$('#bakbakchat').removeClass('chatMaximize').addClass('chatMinimize');
				} else {
					console.log("Showing chat bar!");
					$('#chatPanel').show();
					$('#chatMsg').focus();
					$('#bakbakchat').removeClass('chatMinimize').addClass('chatMaximize');
				}
				return;
			}
			console.log("Showing chat bar!");
			$('#bakbakchat').append("<div id='chatPanel' class='chatPanel'> \
			<div id='bakbakVideoPanel' /> \
			<div id='chatMsgBox' class='chatMessages maxHeight100 scrollbar'></div> \
			<div class='chatText input-append' style='margin:0;width:100%'> \
  				<input class='input-block-level' id='chatMsg' type='text' placeholder='Chat'> \
			</div> \
		</div>");
			$('#chatMsg').keydown(function(event) {
				if (event.keyCode == 13) {
					sendChatMessage($('#chatMsg').val());
					event.preventDefault();
				}
			});
			$('#chatSendButton').click(function() {
				sendChatMessage($('#chatMsg').val());
			});
			$('#bakbakchat').removeClass('chatMinimize').addClass('chatMaximize');
			$('#chatMsg').focus();
		}

		addOnlineLabel = function() {
			if($('#onlineConfirm').length) return;
			console.log('Adding online label');
			$('#onlineConfirm').unbind('click');
			$('#bakbakchat').empty();
			$('#bakbakchat').append("<p id='onlineConfirm' class='alert alert-success' style='margin:0px'><span class='chatHeaderText'>Support</span><img id='onlineConfirmImg' src='"+bakbakUrl+"img/avatars/avatar-green-talking20x20.png' class='imageIconMedium marginLeft'></img></p>");
			$('#bakbakchat').removeClass('extraImage');
			$('#bakbakchat').removeClass('chatMaximize').addClass('chatMinimize');
			$('#onlineConfirm').click(function(event) {
				showChatBar();
				event.preventDefault();
			});
		}

		addOnlineImg = function() {
			if(!$('#onlineConfirm').length) return;
			$('#onlineConfirmImg').attr('src',bakbakUrl+'img/avatars/avatar-green-talking20x20.png');
			$('#bakbakCallHangup').remove();
			$('#bakbakchat').removeClass('extraImage');
		}

		addCallRingingLabel = function() {
			if(!$('#onlineConfirm').length) return;
			$('#bakbakchat').removeClass('extraImage');
			$('#onlineConfirmImg').attr('src',bakbakUrl+'img/actions/png/client_ringing.gif');
			$('#onlineConfirmImg').height(20);
			$('#onlineConfirmImg').width(20);
		}

		addCallProgressLabel = function(call) {
			if(!$('#onlineConfirm').length) return;
			$('#onlineConfirmImg').attr('src',bakbakUrl+'img/actions/png/client_talking.gif');
			$('#onlineConfirm').append("<img id='bakbakCallHangup' src="+bakbakUrl+"'img/actions/png/call_hangup.png' class='imageIconMedium rightAlignIcon' title='Hangup'/>");
			$('#bakbakchat').addClass('extraImage');
			$('#bakbakCallHangup').click(function() {call.hangup()});
			$('#onlineConfirmImg').height(20);
			$('#onlineConfirmImg').width(20);
		}


		addOfflineLabel = function() {
			if($('#offlineConfirm').length) return;
			console.log('Adding offline label');
			$('#bakbakchat').empty();
			$('#offlineConfirm').unbind('click');
			$('#bakbakchat').removeClass('extraImage');
			$('#bakbakchat').append("<div id='offlineConfirm' class='alert alert-danger' style='margin:0px'><span class='chatHeaderText'>Feedback</span><img src='"+bakbakUrl+"img/avatars/avatar-red-talking20x20.png'></img></div>");
			$('#bakbakchat').removeClass('chatMaximize').addClass('chatMinimize');
			$('#offlineConfirm').click(function(event) {
				showContactUsBar();
				event.preventDefault();
			});
		}

		this.onPresence = function (message) {
			console.log("Customer Id is " + self.customerId + " while sender is " + message.sender + " socketid is " + message.data.id);
			if(message.sender == self.customerId) {
				console.log(message);
				self.adminSocketId = message.data.id;
				heartbeat(self);
			}
		};

		this.onChat = function(from,message) {
			showChatBar(true);
			console.log(message);
			addToChatMessageBox(null,from,message);
		};

		this.onCall = function(message) {
			console.log(message);
			addCallRingingLabel();
		};

		this.callAnswered = function(call) {
			console.log(call);
			addCallProgressLabel(call);
		};

		this.callEnded = function(message) {
			console.log(message);
			addOnlineImg();
		};

		sendChatMessage = function(chatText) {
			if(chatText == null || chatText == '') return;
			$(document).trigger('bakbak_chat_msg_send',chatText);
			$('#chatMsg').val('');
			console.log('sending chat message to xmpp with message ' + chatText);
		}

		sendContactUsForm = function(data) {
			$('#contactUsButton').attr('disabled',true);
			html2canvas(document.body, {
  					onrendered: function(canvas) {
    					var imageDataUrl = canvas.toDataURL();
    					console.log(imageDataUrl);
    					console.log(data);
    					visitorObj = clone(self,['phono']);
    					console.log(JSON.stringify(visitorObj));
    					toSend = JSON.parse(JSON.stringify(visitorObj));
    					toSend['email'] = adminEmail;
    					toSend['template'] = 'contactUs';
    					toSend['image'] = imageDataUrl;
    					toSend['contactUs'] = data;
    					$.post( bakbakUrl + "email",toSend,'json')
    						.done(function(response) {
    							console.log("Attempted to send email");
								if(response == "OK") {
									console.log('Email sent SUCCESS!');
									$('#contactUsForm').append("<p>Thanks for contacting us!</p>");
									$('#contactUsForm')[0].reset();
									$('#contactUsButton').removeAttr('disabled');
								} else {
									$('#contactUsForm').append("<p>Error Contacting the Server!</p>");
									$('#contactUsButton').removeAttr('disabled');
								}

							});
  					},
  					width: 900,
  					height: 900
			});
			
		}

		this.setCookie = function(data) {
			console.log('Got set cookie meesage!');
			createCookie(data.cookieName,data.cookieValue);
		}

		this.screenshot =function(imgData) {
			socket.screenshot(self.adminSocketId,imgData);
		}

		this.onScreenshot = function(id,data) {
			console.log("Will take screenshot now!!!");
			html2canvas(document.body, {
  					onrendered: function(canvas) {
    					var imageDataUrl = canvas.toDataURL();
    					console.log(imageDataUrl);
    					self.screenshot(imageDataUrl);
					},
					width: 900,
  					height: 900
  			});
		}
	};
	});