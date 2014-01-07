  var fileref=document.createElement('script');
  fileref.setAttribute("type","text/javascript");
  fileref.setAttribute("src", 'js/lib/require.js');
  fileref.setAttribute("data-main", 'js/main.js');

  document.getElementsByTagName("head")[0].appendChild(fileref);
  fileref.onload = function() {
  	console.log('Require js is loaded');
  }

