var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    http  = require('http');

var port = process.env.PORT || 5000;
server.listen(port);
console.log("Connected on port " + port);
// ----------------------------------socket.io

var channels = {};

io.sockets.on('connection', function (socket) {
    var initiatorChannel = '';
    if (!io.isConnected)
        io.isConnected = true;

    socket.on('new-channel', function (data) {
        channels[data.channel] = data.channel;
        onNewNamespace(data.channel, data.sender);
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

        socket.on('message', function (data) {
            if (data.sender == sender)
                socket.broadcast.emit('message', data);
        });
	socket.on('presence', function (data) {
            if (data.sender == sender)
                socket.broadcast.emit('presence', data);
        });
    });
}

// ----------------------------------extras

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

app.get('/location', function(req, res) {
    var ip = req.connection.remoteAddress;
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
