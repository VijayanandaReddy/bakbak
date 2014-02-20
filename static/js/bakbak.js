  var bakbakUrl = window.location.hostname != 'localhost' ? 'http://cryptic-thicket-3838.herokuapp.com/':'';
  if(bakbakUrl != '' && console == undefined) {
    console = {};
    console.log = function() {
    }
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

