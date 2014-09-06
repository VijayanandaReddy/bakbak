var nodemailer = require('nodemailer')
  , videojs = require(__dirname + '/video');

var transport = nodemailer.createTransport("SMTP", {
            service: "Gmail",
            auth: {
                user: "donateoldspectacles@gmail.com",
                pass: "biplav3403"
            }
        });


var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function validFormat(n) {
  return (n < 10) ? "0"+n : ""+n;
}

function getTZFormat(d) {
  return d.getUTCFullYear()+
         validFormat(1+d.getUTCMonth())+
         validFormat(d.getUTCDate())+
         "T"+
         validFormat(d.getUTCHours())+
         validFormat(d.getUTCMinutes())+
         validFormat(d.getUTCSeconds())+
         "Z"
}

function createIcal(params,uid) {
  start = new Date(params.start);
  end = new Date(params.end);
  ts = new Date();
  start = getTZFormat(start);
  end = getTZFormat(end);
  ts = getTZFormat(ts);
  uid = replaceAll('-','',guid());
  main_email = params.email;
  part_email = params.main_email;
  org_name = "BakBak Scheduler";
  org_email = "donateoldspectacles@gmail.com";
  subject = params.subject;
  agenda = params.agenda;
  url = 'http://www.bakbak.io/schedule/meeting/parts?users='+main_email+','+part_email;
  escaped_url = ' <'+url+'>';
  return 'BEGIN:VCALENDAR\r\n'
          +'PRODID:-//Bakbak//BakBak Scheduler Calendar 1.0//EN\r\n'
          +'VERSION:2.0\r\n'
          +'CALSCALE:GREGORIAN\r\n'
          +'METHOD:REQUEST\r\n'
          +'BEGIN:VEVENT\r\n'
          +'DTSTAMP:'+ts+'\r\n'
          +'DTSTART:'+start+'\r\n'
          +'DTEND:'+end+'\r\n'
          +'SUMMARY:'+subject+escaped_url+'\r\n'
          +'UID:'+ uid +'\r\n'
          +'DESCRIPTION:'+ agenda +' \r\n' 
          +'LOCATION: Web Location'+escaped_url+'\r\n'
          +'ORGANIZER;CN='+org_name+':mailto:'+org_email+'\r\n'
          +'ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN='+part_email+';X-NUM-GUESTS=0:mailto:'+part_email+'\r\n'
          +'ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN='+main_email+';X-NUM-GUESTS=0:mailto:'+main_email+'\r\n'
          +'SEQUENCE:0\r\n'
          +'LAST-MODIFIED:'+ts+'\r\n'
          +'CREATED:'+ts+'\r\n'
          +'TRANSP:OPAQUE\r\n'
          +'STATUS:CONFIRMED\r\n'
          +'END:VEVENT\r\n'
          +'END:VCALENDAR\r\n';
}

function createText(params,uid) {
  start = new Date(params.start);
  end = new Date(params.end);
  ts = new Date();
  main_email = params.email;
  part_email = params.main_email;
  org_name = "BakBak Scheduler";
  org_email = "donateoldspectacles@gmail.com";
  subject = params.subject;
  agenda = params.agenda;
  url = 'http://www.bakbak.io/schedule/meeting/parts?users='+main_email+','+part_email;
  escaped_url = ' <'+url+'>';
  return 'Start Time: '+start+'\r\n'
          +'End Time: '+end+'\r\n'
          +'Subject: '+subject+escaped_url+'\r\n'
          +'Agenda: '+ agenda +' \r\n' 
          +'Location: Web Location'+escaped_url+'\r\n'
          +'Participants: '+part_email+','+main_email+'\r\n'
}

exports.create = function(req,res) {
  res.header("Access-Control-Allow-Origin", "*");
  params = req.body;
  uid = replaceAll('-','',guid());
  console.log(params)
  var ical = createIcal(params,uid);
  var text = createText(params,uid);
  console.log(ical);
  transport.sendMail({
                    from: 'BakBak Scheduler<donateoldspectacles@gmail.com>',
                    to: params.email+","+params.main_email,
                    subject: params.subject,
                    text: text,
                    alternatives: [{
                      contentType: "text/calendar",
                      contents: new Buffer(ical),
                      contentEncoding: "7bit"
                      
                    }]
                    }, function(err, responseStatus) {
                    if (err) {
                        console.log(err);
                        res.render('schedule',{errors: err.message});
                    } else {
                        console.log(responseStatus.message);
                        res.render('schedule',{success_msg: "Successfully Created!", withEmail:params.main_email});
                    }
                });
}

exports.index = function(req,res) {
  res.header("Access-Control-Allow-Origin", "*");
  var withEmail='biplav.saraf@gmail.com';
  if(req.query.withEmail) {
    withEmail=req.query.withEmail;
  }
  res.render('schedule',{withEmail:withEmail});
}


exports.meeting = function(req,res) {
  res.header("Access-Control-Allow-Origin", "*");
  console.log(req.body);
  var local;
  var remote;
  if(req.method != 'GET') {
    local = req.body.local;
    remote = req.body.remote;
  } else {
    local = req.query.local;
    remote = req.query.remote;
  }

  console.log("Local:"+local+" Remote:"+remote);
  
  var token = videojs.getToken(local);
  res.render('meeting',{local:local,remote:remote,token:token}); 
}

exports.meetingSelect = function(req,res) {
  res.header("Access-Control-Allow-Origin", "*");
  var users = req.query.users;
  users = users.split(',');
  res.render('meetingSelect',{user1: users[0],user2:users[1]});
}