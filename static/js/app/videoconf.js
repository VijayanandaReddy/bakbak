define(['jquery','vline'],function($,vline) {
	window.VideoConf = function(customerId) {
		 this.client = vline.Client.create({
    		serviceId: 'bakbak',
    		 ui: false,
             uiVideoPanel: "bakbakVideoPanel",
             uiIncomingDialog: true,
             uiOutgoingDialog: true,
             uiBigGreenArrow: true
  			});
		 self = this;
		 this.session;
		 this.person;
		 this.init = function() {
		 	$.get(bakbakUrl + "/video/auth",function(authToken){
		 		self.client.login('bakbak',{displayName: 'guest'}, authToken).done(self.sessionInit,this);
		 	});
		 	$(window).unload(function() {
				self.person.release();
				self.client.logout();
			});
			$(window).on('beforeunload',function() {
				self.person.release();
				self.client.logout();
			});
		 };
		 this.sessionInit = function(session) {
		 	self.session=session;
		 	window.videoSession = session;
		 	self.person=session.getLocalPerson();
		 	self.person.autoRelease();
		 }
	};

});