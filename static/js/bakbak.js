var bakbakUrl = ((window.location.hostname != 'localhost') && 
	!(window.location.hostname.indexOf('192.168.') > -1) &&
	!(window.location.hostname.indexOf('10.95.') > -1)) 
	? 'http://cryptic-thicket-3838.herokuapp.com/':'';
if (typeof console == "undefined") {
  window.console = {
    log: function () {}
    };
}
var sessionId = '{{ sessionId }}';
console.log('Url is ->' + bakbakUrl);
var fileref=document.createElement('script');
fileref.setAttribute("type","text/javascript");
fileref.setAttribute("src", bakbakUrl + 'js/lib/require.js');
fileref.setAttribute("data-main", bakbakUrl + 'js/main.js');

document.getElementsByTagName("head")[0].appendChild(fileref);
fileref.onload = function() {
  console.log('Require js is loaded');
}

