(function() {

    window.xmppChatAdmin = function(debug,xmppId) {
        var BAKBAK_CHAT_BIND = debug ? 'http://127.0.0.1:7070/http-bind/' : 'http://xmpp.bakbak.io:7070/http-bind/';
        var BAKBAK_CHAT_CONF = debug ? '@conference.how-you-doing.local' : '@conference.xmpp.bakbak.io';
        var BAKBAK_USER_JID = debug ? '@how-you-doing.local' : '@xmpp.bakbak.io';
        var BAKBAK_CHAT_JID = debug ? '-how-you-doing-local' : '-xmpp-bakbak-io';
        var conn = new Strophe.Connection(BAKBAK_CHAT_BIND);
        var nick = '/'+getRandom()+"admin";

        connect = function() {
            conn.connect(xmppId, xmppId, function (status) {
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

        joinMUC = function(mucId) {
            var user_jid = xmppId+"@"+BAKBAK_USER_JID;
            var jid_muc = mucId + BAKBAK_CHAT_CONF+nick;
            console.log("Connecting " + jid_muc + " " + user_jid);
            var pres = $pres({from: user_jid, to: jid_muc}); //join muc for this session
            conn.send(pres);
            return true;
        }

        onConnect = function() {
            $(function() {
                $(document).bind('bakbak_chat_join_muc',function(ev,data) { joinMUC(data)});
            });
            console.log('connected');
            var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
            console.log(iq);
            conn.sendIQ(iq, onRoster);
            conn.addHandler(onRoster, "jabber:iq:roster", "iq", "set"); //roster changed wont for anonymous users
            conn.addHandler(onMessage,null, "message", "chat");
            conn.addHandler(onMessage, null, 'message', 'groupchat');
            $(document).trigger('bakbak_chat_connected',{});
        }

        jid_to_id = function (jid) {
            return Strophe.getBareJidFromJid(jid)
            .replace(/@/g, "-")
            .replace(/\./g, "-")
            .replace(BAKBAK_CHAT_JID,"");
        },

        onPresence = function(presence) {
            console.log(presence); //No need to process presence right now.
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
            return true;
        }

        onMessage = function(mesg) {
            //console.log(mesg);
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
                //console.log(body);
            }
            var from = $(mesg).attr("from");
            console.log(from);
            var room = from.split('@')[0];
            var id = from.split('/')[1]
            if(id.indexOf('admin') > -1) {
                from = 'me';
            } else {
                from='visitor';
            }
            console.log(body);
            $(document).trigger('bakbak_chat_msg_recvd',{from:from,msg:body,room:room});
            return true;
        }

        sendMessage = function(data) {
            var user_jid = xmppId+"@"+BAKBAK_USER_JID;
            var jid_muc = data.mucId + BAKBAK_CHAT_CONF;
            var message = data.message;
            console.log(user_jid + " " + jid_muc + " " + message);
            var msg = $msg({ to: jid_muc, from: user_jid, type: 'groupchat' }).c('body').t(message);
            conn.send(msg);
            return true;
        }

        $(function() {
            $(document).bind('bakbak_chat_connect',function() {console.log("Will connect xmpp");connect();}); //init only when u get en event to do so
            $(document).bind('bakbak_chat_msg_send',function(ev,data) {sendMessage(data)});
        });
        
    }
})();