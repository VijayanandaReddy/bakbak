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
        'util': {
          deps: ['jquery']
        },
        'html2canvas' : {
          exports: 'html2canvas'
        },
        'vline': {
          exports: 'vline'
        },
        'strophe': {
          exports: 'Strophe'
        }  
    },
    waitSeconds: 0
});

function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = bakbakUrl+url;
    document.getElementsByTagName("head")[0].appendChild(link);
}


requirejs(['jquery','webrtcsupport','socketio','app/utils','app/visitor','validator',
  'jquery.embedly-3.1.1.min','jquery.placeholder',/*'jquery.phono.min',*/'tenhands.loader.v2.0','ejs','app/mouseTracker','webgl-heatmap',
  'jquery.balloon.min','app/videoconf'],
  function($,webrtc,socketio,util,visitor,validator,embedly,placeholder,/*phono,*/tenhands,ejs,mouseTracker,heatmap,balloon,videoconf) {
  		console.log('lib is loaded');
      var src = $('#bakbakscript').attr('src');
  		var customerId = src.substring(src.indexOf('=')+1);
      console.log('Customer Id is ' + customerId);
  		var visitor = new Visitor(customerId);
		  visitor.init();
      var mouseTracker = new MouseTracker(customerId);
      mouseTracker.init();
      var videoConf = new VideoConf(customerId);
      videoConf.init();
		//Cannot afford bootstrap css need to use custom css. Remove it post demo
		loadCss('css/bakbak_bootstrap_min.css');
		//loadCss('css/bootstrap-responsive.css');
    loadCss('css/base_ui.css');
    loadCss('css/jquery.qtip.min.css');
  	}); 