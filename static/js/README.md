#Client Side code.

####Technolgoies used
require.js,jquery.js,

####mouseTracker.js -> 
All the mosue tracking related code here.

initForRecording() ->
If the url is valid that is configured on server to track mouse event then the clickListener is initialized. Which writes each click info on the socket.

initClickMap()
If url has query parameter bakbakClickMap=map then the click map data is fetched from server and heat map drawen over it.

initClickCount()
If url has query parameter bakbakClickMap=count then the count for each element is feched from server and count is shown as tooltip on each element. 
