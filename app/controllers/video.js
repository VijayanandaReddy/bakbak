var jwt = require('green-jwt');

function createToken(sessionId) {
  var serviceId = 'bakbak';                     // replace with your Service ID
  var userId = sessionId;                           // replace with your User ID
  var apiSecret ='YWXPocQvcV6Nkdf_R5PGOjgXzB_656d5mT42E3ASZbI';   // replace with your API Secret
  var exp = new Date().getTime() + (48 * 60 * 60);     // 2 days in seconds
  return createAuthToken(serviceId, userId, exp, apiSecret);
}

function createAuthToken(serviceId, userId, expiry, apiSecret) {
  var subject = serviceId + ':' + userId;
  var payload = {'iss': serviceId, 'sub': subject, 'exp': expiry};
  var apiSecretKey = base64urlDecode(apiSecret);
  return jwt.encode(payload, apiSecretKey);
}

function base64urlDecode(str) {
  return new Buffer(base64urlUnescape(str), 'base64');
}

function base64urlUnescape(str) {
  str += Array(5 - str.length % 4).join('=');
  return str.replace(/\-/g, '+').replace(/_/g, '/');
}

exports.getToken = function(user) {
  return createToken(user);
}

exports.index = function(req,res) {
  res.header("Access-Control-Allow-Origin", "*");
  var sessionId = req.sessionID;
  res.json(createToken(sessionId));
}
