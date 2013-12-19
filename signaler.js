var express = require('express'),
    path = require('path'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    http  = require('http');

var port = process.env.PORT || 5000;
server.listen(port);
console.log("Connected on port " + port);
// ----------------------------------socket.io

var channels = {};
var senders={};

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
    	//socket.join(socket.handshake.sessionID);

        socket.on('message', function (data) {
            if (data.sender == sender)
                socket.broadcast.emit('message', data);
        });
	   socket.on('presence', function (data) {
            if (data.sender == sender)
                socket.broadcast.emit('presence', data);
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

app.get('/socketio.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/socket.io.js');
});

app.get('/call.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/call.js');
});

app.get('/webrtcsupport.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/webrtcsupport.js');
});
app.get('/jquery.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/jquery-2.0.3.min.js');
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

app.use('/img',express.static(path.join(__dirname, 'static/img')));
app.use('/css',express.static(path.join(__dirname, 'static/css')));
app.use('/js',express.static(path.join(__dirname, 'static/js')));

