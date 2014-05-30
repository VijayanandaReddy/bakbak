(function() {
	window.MouseTracker = function(customerId) {
		var self = this;
		this.customerId = customerId;
		this.movementList = [];
		this.clickPosition = [];
		this.url=window.location.href;
		this.urlId='';
		MAX_SIZE=100;
		this.init = function() {
			console.log("MOUSETRACKER:: init " + self.url);
			var bakbakClickMap = getUrlParameter('bakbakClickMap');
			console.log("MOUSETRACKER:: init " + bakbakClickMap);
			if(bakbakClickMap == 'map') {
				if(isValidUrl()) initClickMap();
			} else if(bakbakClickMap == 'count') {
				if(isValidUrl()) initClickCount();
			} else {
				if(isValidUrl()) initForRecording();
			}
		};

		function isValidUrl() {
			self.url = self.url.replace("?bakbakClickMap=map","");
			self.url = self.url.replace("?bakbakClickMap=count","");
			for(url in clickTrackUrls) {
				console.log("MOUSETRACKER:: " +url);	
				if(url == self.url) {
					self.urlId = clickTrackUrls[url];
					console.log('MOUSETRACKER:: Correct URL');
					return true;
				}
			}
			return false;
		}

		function initClickMap() {
			var loadingOverLay = createLoadingOverLay();
			$(loadingOverLay).fadeIn(100);
			console.log("MOUSETRACKER:: init ClickMap");
			self.url = removeURLParameter(self.url,'bakbakClickMap');
			$.get( bakbakUrl + "mousetrack/?customerId="+customerId+"&pageUrl="+self.url+"&urlId="+self.urlId).done(function(data){
				try{
					 var canvas = createCanvasOverlay();
 				   	 var heatmap = createWebGLHeatmap({canvas: canvas});
				} catch(ex){
					console.log("MOUSETRACKER::cannot create heat map" );
    				console.log(ex);
				}
				
				var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                         window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
                var formatted_data = [];
                var totalClick = 0;
                for(i in data) {
                	var element = data[i].element;
                	if(element.indexOf('body:') == 0) {
                		element=element.replace('body:','body :');
                	}
                	var clickCount = data[i].clickCount;
                	var offset = $(element).offset();
         
                	for(p in data[i].pos) {
                		pageX = data[i].pos[p].x+offset.left;
                		pageY = data[i].pos[p].y+offset.top; 
                		pixelSize = 100;
                		formatted_data.push({x:pageX,y:pageY,size:pixelSize,clickCount:clickCount});
                	}
                	totalClick = totalClick + clickCount;
				}
                var update = function(){
                 	for(i in formatted_data) {
                 		console.log(formatted_data[i]);
                 		heatmap.addPoint(formatted_data[i].x,formatted_data[i].y,10,formatted_data[i].clickCount/totalClick);
                 	}
                    //heatmap.adjustSize(); // can be commented out for statically sized heatmaps, resize clears the map
                    heatmap.update(); // adds the buffered points
                    heatmap.display(); // adds the buffered points
                    //heatmap.multiply(0.9995);
                    //heatmap.blur();
                    //heatmap.clamp(0.0, 1.0); // depending on usecase you might want to clamp it
                    //raf(update);
                }
                raf(update);
                $(loadingOverLay).fadeOut(10000);
			});
		}

		function initClickCount() {
			var loadingOverLay = createLoadingOverLay();
			$(loadingOverLay).fadeIn(100);
			//var canvas = createCanvasOverlay();
			console.log("MOUSETRACKER:: init ClickCount");
			self.url = removeURLParameter(self.url,'bakbakClickMap');
			$.get( bakbakUrl + "mousetrack/?customerId="+customerId+"&pageUrl="+self.url+"&urlId="+self.urlId).done(function(data){
				console.log("MOUSETRACKER:: init "+data); //use list ineterface to add data, server return formatted data.
				for(i in data) {
					var elem = data[i].element;
					if(elem.indexOf('body:') == 0) {
                		elem=elem.replace('body:','body :');
                	}
					var clickCount = data[i].clickCount;
					$(elem).attr('clickCount',clickCount);
					var tooltip = $(elem).qtip({
						suppress: false,
						id: 'clickCountTip',
						content: ''+clickCount,
						show:true,
						hide:false
						}).get('api');
				}
				console.log("MOUSETRACKER:: done")
				$(loadingOverLay).fadeOut(1000);	
			});
		}


		function send() {
			console.log("MOUSETRACKER:: Sending MouseTracking Data.");
			socket.mouseTrack(customerId,
				{'mouseMovements': self.movementList,
				  'clickPosition': self.clickPosition,
				 'pageUrl' : self.url,
				 'customerId' : self.customerId,
				  'urlId': self.urlId
				}
			);
			self.clickPosition=[]; //Can loose Clicks.
			initMovementList(); //Can loose some movement.
		}

		function initForRecording() {
			initMovementList();
			//initMovementListeners();
			initClickListeners();
		}

		function initClickListeners() {
			console.log("MOUSETRACKER:: init initClickListeners")
			$(window).click(function(e) {
				self.clickPosition.push(getPosition(e));
				send();
				return;
			});
		}

		function initMovementListeners() {
			$(window).mousemove(function(e) {
				self.movementList.push(getPosition(e));
				if(self.movementList.length > MAX_SIZE) {
					send();
				}
				return;
			});
		}

		function initMovementList() {
			self.movementList=[];
			self.movementList.push(getPosition(getDummyE()));
		}

		function getDummyE() {
			var e={};
			e['srcElement']=$('body');
			e['pageX']=0;
			e['pageY']=0;
			e['time']=Date.now();
			return e;
		}

		function getPosition(e) {
			var pos={};
			var el = e.srcElement;
			element = findElementLocation(el);
			console.log(findElementLocation(el));
			offset = $(el).offset();
			console.log(offset);
			pos['pageX'] = e.pageX-offset.left;
			pos['pageY'] = e.pageY - offset.top;
			pos['element'] = element;
			pos['time'] = Date.now();
			return pos;
		}

		function createLoadingOverLay() {
			myCanvas = document.createElement('div');
  			document.body.appendChild(myCanvas);
  			myCanvas.style.position = 'absolute';
  			myCanvas.style.left="0px";
  			myCanvas.style.top="0px";
  			myCanvas.style.zIndex="10";
  			myCanvas.style.opacity=0.8;
  			myCanvas.style.background="#aaa";
  			myCanvas.id="bakbakloadingMask";
  			$(myCanvas).html("<img id='bakbakClickLoading' src='"+bakbakUrl+"img/actions/gif/loaderBar.gif'><p style='color:#fff'>Loading</img>");
  			return myCanvas;
		}

		function createCanvasOverlay() {
  			myCanvas = document.createElement('canvas');
  			document.body.appendChild(myCanvas);
  			myCanvas.style.position = 'absolute';
  			myCanvas.style.left="0px";
  			myCanvas.style.top="0px";
  			myCanvas.style.zIndex="99999";
  			myCanvas.style.width="100%";
  			myCanvas.style.height="100%";
  			myCanvas.width=myCanvas.offsetWidth;
  			myCanvas.height=myCanvas.offsetHeight;
  			return myCanvas;
		}	

	};
})();