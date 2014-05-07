require.config({
	baseUrl: bakbakUrl + 'js/lib',
	paths: {
        app: '../app',
        jquery: 'jquery-2.0.3.min',
        css: '../../css',
        socketio: '../../socket.io/socket.io.js',

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
    link.href = bakbakUrl+url;
    document.getElementsByTagName("head")[0].appendChild(link);
}



requirejs(['webrtcsupport','jquery','socketio','app/call','app/utils','app/visitor','validator','html2canvas',
  'jquery.embedly-3.1.1.min','jquery.placeholder','jquery.phono.min','tenhands.loader.v2.0','ejs'],
  function(webrtc,$,socketio,call,util,visitor,validator,html2canvas,embedly,ejs) {
  		console.log('lib is loaded');
      var src = $('#bakbakscript').attr('src');
  		var customerId = src.substring(src.indexOf('=')+1);
      console.log('Customer Id is ' + customerId);
  		var visitor = new Visitor(customerId);
		  visitor.init();
		//Cannot afford bootstrap css need to use custom css. Remove it post demo
		loadCss('css/bakbak_bootstrap_min.css');
		//loadCss('css/bootstrap-responsive.css');
    loadCss('css/base.css');
  	}); 