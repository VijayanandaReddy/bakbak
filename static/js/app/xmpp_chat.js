define(['jquery','strophe'],function($,Strophe) {

    window.xmmppChatClient = function(debug,customerId) {
        var BAKBAK_CHAT_BIND = debug ? 'http://127.0.0.1:7070/http-bind/' : 'http://xmpp.bakbak.io:7070/http-bind/';
        var BAKBAK_CHAT_CONF = debug ? '@conference.how-you-doing.local' : '@conference.xmpp.bakbak.io';
        var BAKBAK_CHAT_JID = debug ? '-how-you-doing-local' : '-xmpp-bakbak-io';
        var conn = new Strophe.Connection(BAKBAK_CHAT_BIND);
        var nick = '/'+getRandom();
        var jid_muc = sessionId + BAKBAK_CHAT_CONF;

        connect = function() {
            conn.connect(''+sessionId, null, function (status) {
                console.log("Status is " + status);
                if (status === Strophe.Status.CONNECTED) {
            	   onConnect();
        	    } else if (status === Strophe.Status.DISCONNECTED) {
            	   console.log('disconnected');
                   onDisconnect();
                } else if (status === Strophe.Status.ERROR) {
            	   console.log('status ERROR');
                } else if (status === Strophe.Status.CONNECTING) {
            	   console.log('status CONNECTING');
                } else if (status === Strophe.Status.CONNFAIL) {
            	   console.log('status CONNFAIL');
                } else if (status === Strophe.Status.AUTHENTICATING) {
            	   console.log('status AUTHENTICATING');
        	    } else if (status === Strophe.Status.AUTHFAIL) {
            	   console.log('status AUTHFAIL');
        	    } else if (status === Strophe.Status.ATTACHED) {
            	   console.log('status ATTACHED');
                }
            });
        }

        sendMessage = function(message) {
            var msg = $msg({ to: jid_muc, from: conn.jid, type: 'groupchat' }).c('body').t(message);
            conn.send(msg); 
        }

        onMessage = function(mesg) {
            console.log(mesg);
            var body = '';
            var body = $(mesg).find("html > body");
            if (body.length === 0) {
                body = $(mesg).find('body');
                if (body.length > 0) {
                    body = body.text()
                } else {
                    body = null;
                }
            } else {
                body = $(body.contents()[0]).text();
                console.log(body);
            }
            var from = $(mesg).attr("from");
            from = from.split('/')[1];
            if(!isNaN(from)) from = 'me';
            $(document).trigger('bakbak_chat_msg_recvd',{from:from,msg:body});
            return true;
        }

        

        jid_to_id = function (jid) {
            return Strophe.getBareJidFromJid(jid)
            .replace(/@/g, "-")
            .replace(/\./g, "-")
            .replace(BAKBAK_CHAT_JID,"");
        },

        onPresence = function(presence) {
            console.log(presence);
            var ptype = $(presence).attr('type');
            var from = $(presence).attr('from');
            var jid = $(presence).find('item').attr('jid');
            id = jid_to_id(jid)
            console.log(id);
            if(id != customerId) { //No need to process presence of anyone other then admin
                return true;
            }

            if (ptype === 'subscribe') {
                console.log("Subscribe " + id);
            } else if (ptype !== 'error') {
                console.log("Status " + id);
                if (ptype === 'unavailable') {
                    console.log("Offline " + id);
                    $(document).trigger('bakbak_chat_offline',{});
                } else {
                    var show = $(presence).find("show").text();
                    if (show === "" || show === "chat") {
                        console.log("Online " + id);
                        $(document).trigger('bakbak_chat_online',{});
                    } else {
                        console.log("Away " + id);
                        $(document).trigger('bakbak_chat_offline',{});
                    }
                }
            }
            return true;
        }

	   onRoster =  function(roster) {
            console.log(roster);
            //Roster will be empty for anonymous users
            // set up presence handler and send initial presence
            conn.addHandler(onPresence, null, "presence");
            conn.send($pres());
            return true;
        }

        onDisconnect = function() {
            $(document).trigger('bakbak_chat_disconnected',{});
            connect();
        }

        onConnect = function() {
            console.log('connected');
            var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
            console.log(iq);
            conn.sendIQ(iq, onRoster);
            conn.addHandler(onRoster, "jabber:iq:roster", "iq", "set"); //roster changed wont for anonymous users
            //conn.addHandler(onMessage,null, "message", "chat");
            var pres = $pres({to: jid_muc+nick}); //join muc for this session
		    conn.send(pres);
		    conn.addHandler(onMessage, null, 'message', 'groupchat');
            $(document).trigger('bakbak_chat_connected',{});
            $(document).bind('bakbak_chat_msg_send',function(ev,data) {sendMessage(data)});
        }

        $(document).bind('bakbak_chat_connect',function() {console.log("Will connect xmpp");connect();}); //init only when u get en event to do so
	}
});