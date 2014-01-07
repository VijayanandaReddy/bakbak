require.config({
	baseUrl: 'http://cryptic-thicket-3838.herokuapp.com/js/lib',
	paths: {
        app: '../app',
        jquery: 'jquery-2.0.3.min',
        css: '../../css'
    },
    shim: {
        'webrtcsupport': {
            exports: 'webrtcsupport'
        },
    }
});

function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "http://cryptic-thicket-3838.herokuapp.com/"+url;
    document.getElementsByTagName("head")[0].appendChild(link);
}



requirejs(['webrtcsupport','jquery','socket.io','app/call','app/utils','app/visitor'],function(webrtc,$,socketio,call,util,visitor) {
  		console.log('lib is loaded');
  		var customerId = $('#bakbakscript').attr('src').replace('/js/bakbak.js?id=','');
  		var visitor = new Visitor(customerId);
		visitor.init();
		//Cannot afford bootstrap css need to use custom css. Remove it post demo
		loadCss('css/bootstrap.css');
		loadCss('css/bootstrap-responsive.css');
  	}); 