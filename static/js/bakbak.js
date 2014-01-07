  var fileref=document.createElement('script');
  fileref.setAttribute("type","text/javascript");
  fileref.setAttribute("src", 'http://cryptic-thicket-3838.herokuapp.com/js/lib/require.js');
  fileref.setAttribute("data-main", 'http://cryptic-thicket-3838.herokuapp.com/js/main.js');

  document.getElementsByTagName("head")[0].appendChild(fileref);
  fileref.onload = function() {
  	console.log('Require js is loaded');
  }

