var express = require('express'),
    path = require('path'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    http  = require('http'),
    path           = require('path'), 
    templatesDir   = path.resolve(__dirname, 'templates'), 
    emailTemplates = require('email-templates'), 
    nodemailer     = require('nodemailer'),
    Referer = require('referer-parser'),
    ua = require('ua-parser'),
    MemoryStore = express.session.MemoryStore,
    cons = require('consolidate');

var port = process.env.PORT || 5000;
var active_sessions = {}; //in future would use a persistent store!
server.listen(port);
console.log("Connected on port " + port);
// ----------------------------------socket.io

var channels = {};
var senders={};
var EXPRESS_SID_KEY = 'bakbak.sid';
var EXPRESS_SID_SECRET = 'biplav';

var cookieParser = express.cookieParser(EXPRESS_SID_SECRET);

var sessionStore = new MemoryStore();

app.configure(function() {
    app.use(express.bodyParser());
    app.use(cookieParser);
    app.use(express.session({
        store: sessionStore,
        secret: EXPRESS_SID_SECRET,
        key: EXPRESS_SID_KEY,
        cookie: {
                httpOnly: false, 
                maxAge:86400000,
                //expires: new Date(Date.now() + 60 * 10000) 
                }, //24 hours
    }));
    app.use(app.router);
    app.enable('trust proxy');

    app.use(express.compress());

    app.get('/js/bakbak.js', function (req, res) {
        res.setHeader('Content-Type', 'application/javascript');
        console.log(req.sessionID);
        cons.swig(__dirname + '/static/js/bakbak.js', { sessionId: req.sessionID }, function(err, html){
            if (err) throw err;
            res.send(html);
        });
    });

    app.use('/img',express.static(path.join(__dirname, 'static/img')));
    app.use('/css',express.static(path.join(__dirname, 'static/css')));
    app.use('/js',express.static(path.join(__dirname, 'static/js')));
    app.use('/tmp',express.static(path.join(__dirname, 'static/tmp')));
    app.use('/sounds',express.static(path.join(__dirname, 'static/sounds')));

    app.use(function (req, res, next) {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);
        // Pass to next layer of middleware
        next();
    });

});

//Only because we have one dynamo
io.configure(function () { 
  //io.set("transports", ["xhr-polling"]); 
  //io.set("polling duration", 10); 

    io.set('authorization', function (data, accept) {
        if (!data.headers.cookie) {
            return accept('No cookie transmitted.', false);
        }
        cookieParser(data,{},function(parseErr) {
            if(parseErr) { return callback('Error parsing cookies.', false); }
            var sidCookie = (data.secureCookies && data.secureCookies[EXPRESS_SID_KEY]) ||
                        (data.signedCookies && data.signedCookies[EXPRESS_SID_KEY]) ||
                        (data.cookies && data.cookies[EXPRESS_SID_KEY]);
            console.log(sidCookie);
            sessionStore.load(sidCookie, function(err, session) {
                // And last, we check if the used has a valid session and if he is logged in
                //Need this later now jsut need to set session id
                if (err) {// || !session || session.isLogged !== true) {
                    return accept('Not logged in.', false);
                } else {
                    console.log('SETTING session ' + sidCookie);
                    // If you want, you can attach the session to the handshake data, so you can use it again later
                    data.sidCookie = sidCookie;
                    return accept(null, true);
                }
            });
        });
    });
});

io.sockets.on('connection', function (socket) {
    var initiatorChannel = '';
    if (!io.isConnected)
        io.isConnected = true;

    if(!socket.handshake.sidCookie) {
        return false;
    }

    if(!active_sessions[socket.handshake.sidCookie]) {
        active_sessions[socket.handshake.sidCookie] = [];
    }
    active_sessions[socket.handshake.sidCookie].push(socket.id);

    socket.on('new-channel', function (data) {
        console.log('CREATING NEW CHANNEL:: ' + data.channel);
        channels[data.channel] = data.channel;
        if(senders[data.sender] == undefined) {
            onNewNamespace(data.channel, data.sender);
            senders[data.sender] = data.sender;
        }
    });

    socket.on('presence', function (channel) {
        console.log("GOT PRESENCE!!!");
        var isChannelPresent = !! channels[channel];
        socket.emit('presence', isChannelPresent);
        if (!isChannelPresent)
            initiatorChannel = channel;
    });

});

function onNewNamespace(channel, sender) {
    io.of('/' + channel).on('connection', function (socket) {
        if (io.isConnected) {
            io.isConnected = false;
            socket.emit('connect', true);
        }
        var socketid = socket.id;

        socket.on('message', function (data) {
            if (data.sender == sender)
                socket.broadcast.emit('message', data);
        });
	   socket.on('presence', function (data) {
        console.log("DATA.SENDER-> "+data.sender+" SENDER->"+sender);
        if (data.sender == sender) {
            if(data.data.visitorId) {
                socket.visitorId = data.data.visitorId;
            }
            console.log('PRESENCE --> ' +data.sender);
            socket.broadcast.emit('presence', data);
        }
        });
	   socket.on('chat',function (data) { 
		  console.log('GOT CHAT msg for ' + data.reciever + " from " + data.sender );
		  sidCookie = data.reciever;
          socketIds = active_sessions[sidCookie];
          if(!socketIds) {
            console.error("Active Session are " + active_sessions);
            console.error("sidCookie " + sidCookie);
            return;
          }
          for (i in socketIds) {
            if(data.sender == sender) {
                console.log("SENDING CHAT MSG TO " + socketIds[i]);
                io.of('/' + channel).socket(socketIds[i]).emit('chat',data);
            } else {
                console.log('CHAT DROPPED ' +data.sender + ' ' + sender);
            }
          }        
	   });

        socket.on('setCookie',function (data) {
          console.log('GOT SET COOKIE msg for ' + data.reciever + ' for id ' +socketid);
          socketId = data.reciever;
          if(data.sender == sender) {
              io.of('/' + channel).socket(socketId).emit('setCookie',data);
          } else {
            console.log('SET COOKIE ' +data.sender + ' ' + sender);
          }
       });

        socket.on('screenshot',function (data) {
          console.log('GOT SCREENSHOT msg for ' + data.reciever + ' for id ' +socketid);
          sidCookie = data.reciever;
          socketIds = active_sessions[sidCookie];
          if(!socketIds) {
            console.error("Active Session are " + active_sessions);
            console.error("sidCookie " + sidCookie);
            return;
          }
          for (i in socketIds) {
            if(data.sender == sender) {
                console.log("SENDING SCREENSHOT MSG TO " + socketIds[i]);
                 io.of('/' + channel).socket(socketIds[i]).emit('screenshot',data);
            } else {
                console.log('SCREENSHOT MSG DROPPED ' +data.sender + ' ' + sender);
            }
          } 
       });

        socket.on('call',function (data) {
          console.log('GOT CALL for for ' + data.reciever + ' for id ' +socketid);
          socketId = data.reciever;
          data.senderId = socketid;
          if(data.sender == sender) {
              io.of('/' + channel).socket(socketId).emit('call',data);
          } else {
            console.log('CALL DROPPED ' +data.sender + ' ' + sender);
          }
       });

        socket.on('disconnect', function (channel) {
            console.log('DISCONNECTED!!!!! ----> ' + socket.id);
            if(!active_sessions[socket.handshake.sidCookie]) {
                console.error("Server might have restarted!");
                return;
            }
            var message = {};
            var data={};
            data['id'] = socket.handshake.sidCookie;
            if(socket.visitorId) {
                data['visitorId'] = socket.visitorId;
            }
            message.sender = sender;
            data['state'] = false;
            message.data = data;
            socket.broadcast.emit('presence', message);
            active_sessions[socket.handshake.sidCookie].splice( active_sessions[socket.handshake.sidCookie].indexOf(socket.id),1);
        });
    });
}

app.get('/index', function (req, res) {
    res.sendfile(__dirname + '/static/call/index.html');
});

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/static/call/index.html');
});

app.get('/index1', function (req, res) {
    res.sendfile(__dirname + '/static/call/index1.html');
});

app.get('/admin', function (req, res) {
    console.log(req.sessionID);
    res.sendfile(__dirname + '/static/call/admin1.html');
});

app.get('/conference.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/video-conferencing/conference.js');
});

app.get('/conference-ui.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/video-conferencing/conference-ui.js');
});

app.get('/chat', function (req, res) {
    res.sendfile(__dirname + '/static/text-chat.html');
});

app.get('/RTCMultiConnection', function (req, res) {
    res.sendfile(__dirname + '/static/RTCMultiConnection/index.html');
});

app.get('/call.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/call.js');
});

app.get('/tour', function (req, res) {
    res.sendfile(__dirname + '/static/tour.html');
});

app.get('/tour.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/tour.js');
});

app.get('/sessionid', function (req, res) {
        console.log("Fetching session id");
        var sidCookie = req.sessionID;
        console.log(sidCookie);
        res.send(sidCookie);
    });

app.get('/location', function(req, res) {
    //console.log(req.ip);
    //console.log(req.ips);
    res.header("Access-Control-Allow-Origin", "*");
    var ip = req.ip;
    var url = "http://www.geoplugin.net/json.gp?ip="+ip;
    if(ip == '127.0.0.1') {
    	url = "http://www.geoplugin.net/json.gp";
    }
    console.log("Making a request to fetch location data. for " + url);
    http.get(url, function(response) {
	      	console.log("Got location response status code: " + response.statusCode);
	      	res.setHeader('Content-Type','application/json');
		response.on('data', function (body) {
			    	//console.log('location response : ' + body);
			    	res.send(body);
			      	});
	      }).on('error', function(e) {
		console.log("Got error: " + e.message);
		res.setHeader('Content-Type','application/json');
	      	res.send(e.message);
	});

});

app.post('/referer', function(req, resp) {
    resp.header("Access-Control-Allow-Origin", "*");
    var referer_obj = req.body;
    referer_url = referer_obj.referer_url;
    current_url = referer_obj.current_url;
    var r = new Referer(referer_url,current_url);
    delete r['referers'];
    resp.send(r);
});

app.post('/ua', function(req, resp) {
    resp.header("Access-Control-Allow-Origin", "*");
    var userAgent = req.body['ua'];
    var info = new ua.parse(userAgent);
    //console.log('USER AGENT---->'+userAgent);
    //console.log(info.ua.toString());
    resp.send(info);
});

app.post('/email', function(req, resp) {
    resp.header("Access-Control-Allow-Origin", "*");
    var visitor = req.body;
    locals = {
        visitor : visitor,
        email : visitor.email
    };
    console.log(locals);
   emailTemplates(templatesDir, function(err, template) {

    if (err) {
        console.log(err);
        resp.send(err.message);
    } else {

        // ## Send a single email
        // Prepare nodemailer transport object
        var transport = nodemailer.createTransport("SMTP", {
            service: "Gmail",
            auth: {
                user: "biplav.saraf@gmail.com",
                pass: "www.biplav.in"
            }
        });

        var templateName = visitor['template'];
         var buf = undefined;

        var attachmentObj = [];
        if(visitor['image']) {
            var b64string = visitor['image'];
            b64string = b64string.replace('data:image/png;base64,','');
            buf = new Buffer(b64string, 'base64');
            attachmentObj =[{'filename' : 'screenshot.jpg' , 'contents' : buf}];
        } else if (visitor['images']) {
            for(i in visitor['images']) {
                var b64string = visitor['images'][i];
                b64string = b64string.replace('data:image/png;base64,','');
                buf = new Buffer(b64string, 'base64');
                attachmentObj.push({'filename' : 'screenshot.jpg' , 'contents' : buf});
            }
        }

        console.log(attachmentObj.length);
        // Send a single email
        template(templateName, locals, function(err, html, text) {
            if (err) {
                console.log(err);
                resp.send(err.message);
            } else {
                console.log(html);
                console.log(text);
                transport.sendMail({
                    from: 'BakBak.io <biplav.sarf@gmail.com>',
                    to: locals.email,
                    subject: 'Chat Script',
                    html: html,
                    // generateTextFromHTML: true,
                    text: text,
                    attachments : attachmentObj
                    }, function(err, responseStatus) {
                    if (err) {
                        console.log(err);
                        resp.send(err.message);
                    } else {
                        console.log(responseStatus.message);
                        resp.send("OK");
                    }
                });
            }
        });
    }
    });
});


