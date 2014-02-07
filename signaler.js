var express = require('express'),
    path = require('path'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    http  = require('http'),
    path           = require('path'), 
    templatesDir   = path.resolve(__dirname, 'templates'), 
    emailTemplates = require('email-templates'), 
    nodemailer     = require('nodemailer');

var port = process.env.PORT || 5000;
var visitor_count=0;
server.listen(port);
console.log("Connected on port " + port);
// ----------------------------------socket.io

var channels = {};
var senders={};

//Only because we have one dynamo
/*io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});*/

io.sockets.on('connection', function (socket) {
    var initiatorChannel = '';
    if (!io.isConnected)
        io.isConnected = true;

    socket.on('new-channel', function (data) {
        console.log('CREATING NEW CHANNEL:: ' + data.channel);
        channels[data.channel] = data.channel;
        if(senders[data.sender] == undefined) {
            onNewNamespace(data.channel, data.sender);
            senders[data.sender] = data.sender;
        }
    });

    socket.on('presence', function (channel) {
        var isChannelPresent = !! channels[channel];
        socket.emit('presence', isChannelPresent);
        if (!isChannelPresent)
            initiatorChannel = channel;
    });

    socket.on('disconnect', function (channel) {
        if (initiatorChannel)
            channels[initiatorChannel] = null;
    });
});

function onNewNamespace(channel, sender) {
    io.of('/' + channel).on('connection', function (socket) {
        if (io.isConnected) {
            io.isConnected = false;
            socket.emit('connect', true);
        }
        var socketid = socket.id;
        console.error("VISITOR NUMBER " + ++visitor_count/3);
    	//socket.join(socket.handshake.sessionID);

        socket.on('message', function (data) {
            if (data.sender == sender)
                socket.broadcast.emit('message', data);
        });
	   socket.on('presence', function (data) {
            if (data.sender == sender) {
                console.log('PRESENCE --> ' +data.sender);
                socket.broadcast.emit('presence', data);
            }
        });
	   socket.on('chat',function (data) {
		  console.log('GOT CHAT msg for ' + data.reciever + ' for id ' +socketid);
		  socketId = data.reciever;
          if(data.sender == sender) {
		      io.of('/' + channel).socket(socketId).emit('chat',data);
          } else {
            console.log('CHAT DROPPED ' +data.sender + ' ' + sender);
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
    });
}

// ----------------------------------extras
//
app.enable('trust proxy');

app.use(express.compress());
app.use(express.bodyParser());

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/static/call/index1.html');
});

app.get('/admin', function (req, res) {
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

app.get('/location', function(req, res) {
    console.log(req.ip);
    console.log(req.ips);
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
			    	console.log('location response : ' + body);
			    	res.send(body);
			      	});
	      }).on('error', function(e) {
		console.log("Got error: " + e.message);
		res.setHeader('Content-Type','application/json');
	      	res.send(e.message);
	});

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

        if(visitor['image']) {
            var b64string = visitor['image'];
            b64string = b64string.replace('data:image/png;base64,','');
            buf = new Buffer(b64string, 'base64');
            
        }


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
                    attachments : (buf != undefined ? [{'filename' : 'screenshot.jpg' , 'contents' : buf}] : [])
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

app.use('/img',express.static(path.join(__dirname, 'static/img')));
app.use('/css',express.static(path.join(__dirname, 'static/css')));
app.use('/js',express.static(path.join(__dirname, 'static/js')));
app.use('/tmp',express.static(path.join(__dirname, 'static/tmp')));


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
