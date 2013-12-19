(function() {
    window.Call = function(channel,id) {
        this.channel = channel || document.domain.replace( /\/|:|#|%|\.|\[|\]/g , '');

        this.onincomingcall = function(_caller) {
            self.receive(_caller.receiverid);
        };

        this.oncustomer = function(customer) {
            caller.call(customer.callerid);
        };

        this.call = function(callerid,video) {
            start(true,callerid);
            caller.call(callerid,video);
        };

        this.receive = function(receiverid,video) {
            caller.receive(receiverid,video);
        };

        this.onstream = function(e) {
            console.log("Root onStream ");
            audio = e.audio;
            audio.play();
            document.documentElement.appendChild(audio, document.documentElement.firstChild);
        };

        this.onCall = function(message) {
            console.log(message);
            /*if(message.request) {
                console.log("Got call will recieve!");
                self.receive(message.video, message.senderId);
            } else {
            caller.handleResponse(message);
            }*/
            if (!pc)
                start(false,message.senderId);
            console.log(message);
            var signal = message;
            //if(message.request) return;
            if (signal.sdp)
                pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            else if(signal.candidate)
                pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            };

        var self = this;
        this.callerid = id;
        var caller = new Call.Caller(this);

        var pc;
        var configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

        var remoteVideo = document.createElement('video');
        var localVideo = document.createElement('video');

        // run start(true) to initiate a call
        function start(isCaller,senderId) {
            pc = new webkitRTCPeerConnection(configuration);

            // send any ice candidates to the other peer
            pc.onicecandidate = function (evt) {
                socket.call(true,senderId,false,{ "candidate": evt.candidate });
            };

            // once remote stream arrives, show it in the remote video element
            pc.onaddstream = function (evt) {
                remoteVideo.src = window.webkitURL.createObjectURL(evt.stream);
                remoteVideo.setAttribute('id','remote');
                remoteVideo.controls = false;
                //audio.autoplay = true;
                remoteVideo.play();
                document.documentElement.appendChild(remoteVideo, document.documentElement.firstChild);
            };



            // get the local stream, show it in the local video element and send it
            navigator.webkitGetUserMedia({ "audio": true, "video": true }, function (stream) {
                
                localVideo.src = window.webkitURL.createObjectURL(stream);
                localVideo.setAttribute('id','local');
                localVideo.controls = false;
                //audio.autoplay = true;
                localVideo.play();
                document.documentElement.appendChild(localVideo, document.documentElement.firstChild);
                pc.addStream(stream);

                if (isCaller)
                    pc.createOffer(gotDescription);
                else
                    pc.createAnswer(gotDescription,successCallback,failureCallback);

                function successCallback(data) {
                    console.log('SUCCESS');
                    console.log(data);
                }

                function failureCallback(data) {
                    console.log('FAIL');
                    console.log(data);
                }

                function gotDescription(desc) {
                    pc.setLocalDescription(desc);
                    socket.call(true,senderId,false,{ "sdp": desc });
                }
            });
        }
    };

    window.Call.Caller = function(root) {
        var self = this;
        var peer = null;
        var defaultSocket;
        var asked = false;
 
        this.receive = function(video,receiverid) {
            /*
                call display popup method.
            */
            if(asked) {
                return;
            }
            asked= true;
            getUserMedia({
                        onsuccess: function(stream) {
                            self.peer = new Call.PeerConnection({
                                onRemoteStream: onRemoteStream,
                                attachStream: stream,
                                onICE: function(candidate) {
                                    socket.call(video,receiverid,false,{
                                        candidate: {
                                            sdpMLineIndex: candidate.sdpMLineIndex,
                                            candidate: JSON.stringify(candidate.candidate)
                                        },
                                    });
                                },
                                onOfferSDP: function(sdp) {
                                    socket.call(video,receiverid,false,{
                                        sdp: sdp,
                                    });
                                }
                            });
                        },
                        audio: document.createElement('video')
                    },video);
        };

        this.handleResponse = function (response) {
            if(asked) {
                if(response.sdp) {
                    self.peer.addAnswerSDP(response.sdp);
                } else if (response.candidate) {
                    self.peer.addICE(response.candidate.candidate);
                }
                return;
            }
            asked= true;
            console.log("handling response");
                    getUserMedia({
                        onsuccess: function(stream) {
                            self.peer = new Call.PeerConnection({
                                    onRemoteStream: onRemoteStream,
                                    attachStream: stream,
                                    offerSDP: response.sdp,
                                    onICE: function(candidate) {
                                        socket.call(response.video,response.senderId,false,{
                                            candidate: {
                                                sdpMLineIndex: candidate.sdpMLineIndex,
                                                candidate: JSON.stringify(candidate.candidate)
                                            },
                                        });
                                    },
                                    onAnswerSDP: function(sdp) {
                                        console.log('onAnswerSDP');
                                        socket.call(response.video,response.senderId,false,{
                                            sdp: sdp,
                                        });
                                    }
                                });
                                self.peer.addAnswerSDP(response.sdp);
                            },
                        audio: document.createElement('video')
                        },true);
            //        }
            /*if (response.candidate) {
                console.log('response.candidate');
                peer && peer.addICE({
                    sdpMLineIndex: response.candidate.sdpMLineIndex,
                    candidate: JSON.parse(response.candidate.candidate)
                });
            }*/
        }

        this.call = function(id,video) {
            socket.call(video,id,true);
        };

        function onRemoteStream(stream) {
            var audio = document.createElement('video');
            if (!moz) audio.src = window.webkitURL.createObjectURL(stream);
                else audio.mozSrcObject = stream;
            audio.setAttribute('id','remote');
            audio.controls = false;
            //audio.autoplay = true;
            audio.play();

            setTimeout(function() {
                console.log("Remote Stream ");
                console.log(stream);
                audio.volume = 1;
                root.onstream({
                    audio: audio,
                    stream: stream,
                    callerid: self.callerid
                });
            }, 3000);
        }
    };

    window.moz = !!navigator.mozGetUserMedia;
    window.Call.PeerConnection = function(options) {
        var w = window,
            PeerConnection = w.mozRTCPeerConnection || w.webkitRTCPeerConnection,
            SessionDescription = w.mozRTCSessionDescription || w.RTCSessionDescription,
            IceCandidate = w.mozRTCIceCandidate || w.RTCIceCandidate;

        var STUN = {
            url: !moz ? 'stun:stun.l.google.com:19302' : 'stun:23.21.150.121'
        };

        options.iceServers = [{"url": "stun:stun.l.google.com:19302"}];

        var TURN = {
            url: 'turn:homeo@turn.bistri.com:80',
            credential: 'homeo'
        };

        var iceServers = {
            iceServers: options.iceServers || [STUN]
        };

        if (!moz && !options.iceServers) {
            if (parseInt(navigator.userAgent.match( /Chrom(e|ium)\/([0-9]+)\./ )[2]) >= 28)
                TURN = {
                    url: 'turn:turn.bistri.com:80',
                    credential: 'homeo',
                    username: 'homeo'
                };

            iceServers.iceServers = [TURN];
        }

        optional = {
            optional: []
        };

        if (!moz) {
            optional.optional = [{
                DtlsSrtpKeyAgreement: true
            }];
        }

        var peerConnection = new PeerConnection(iceServers, optional);

        peerConnection.onicecandidate = function(event) {
            if (event && event.candidate) options.onICE(event.candidate);
        };

        peerConnection.addStream(options.attachStream);
        peerConnection.onaddstream = onaddstream;

        peerConnection.onconnecting = function () {
            console.log("SESSION CONNECTING!!!");
        };
        peerConnection.onopen = function() {
            console.log("SESSION OPENED!");
        };
  
        peerConnection.onremovestream = function() {
            console.log("REMOVE STREAM REMOVED!!");
        };


        function onaddstream(event) {
            console.debug('on:add:stream:', event.stream);
            options.onRemoteStream(event.stream);
        }

        var constraints = {
            optional: [],
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        };

        function createOffer() {
            if (!options.onOfferSDP) return;
            console.log("Creating answer");
            peerConnection.createOffer(function(sessionDescription) {
                peerConnection.setLocalDescription(sessionDescription);
                options.onOfferSDP(sessionDescription);
            }, onSdpError, constraints);
        }

        function createAnswer() {
            if (!options.onAnswerSDP) return;
            console.log("Creating answer");
            console.log(options.offerSDP);
            peerConnection.setRemoteDescription(new SessionDescription(options.offerSDP), onSdpSuccess, onSdpError);
            peerConnection.createAnswer(function(sessionDescription) {
                peerConnection.setLocalDescription(sessionDescription);
                options.onAnswerSDP(sessionDescription);
            }, onSdpError, constraints);
        }

        createOffer();
        createAnswer();

        function onSdpError(e) {
            console.error(JSON.stringify(e));
        }

        function onSdpSuccess() {
            console.error("SDP Success!!");
        }

        return {
            addAnswerSDP: function(sdp) {
                console.log("adding sdp");
                peerConnection.setRemoteDescription(new SessionDescription(sdp), onSdpSuccess, onSdpError);
                //console.debug('remoteDescription', peerConnection.remoteDescription.sdp);
            },
            addICE: function(candidate) {
                console.log('addICE');
                peerConnection.addIceCandidate(new IceCandidate({
                    sdpMLineIndex: candidate.sdpMLineIndex,
                    candidate: candidate.candidate
                }));
            },
            connection: peerConnection
        };
    };

    window.getUserMedia = function(options,video) {
        navigator.getMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        var streaming = function(stream) {
            console.log("Got stream in streaming!");
            console.log(options);
            audio = options.audio;
            if (audio) {
                console.log("Seting local stream info");
                audio.setAttribute('id','local');
                document.documentElement.appendChild(audio, document.documentElement.firstChild);
                audio[moz ? 'mozSrcObject' : 'src'] = moz ? stream : window.webkitURL.createObjectURL(stream);
                audio.play();
            }
            options.onsuccess(stream);
        };

        var onerror = function(e) {
            console.error(JSON.stringify(e));
            if (options.onerror) options.onerror(e);
        };

        navigator.getMedia({
            audio: true,
            video: true/*video*/
        }, streaming, onerror);
        
    };
})();