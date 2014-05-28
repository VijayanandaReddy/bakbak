(function() {
	window.MouseTracker = function(customerId) {
		var self = this;
		this.customerId = customerId;
		this.movementList = [];
		this.clickPosition = [];
		this.url=window.location.href;
		MAX_SIZE=100;
		this.init = function() {
			console.log("MOUSETRACKER:: init " + self.url);
			var bakbakClickMap = getUrlParameter('bakbakClickMap');
			console.log("MOUSETRACKER:: init " + bakbakClickMap);
			if(bakbakClickMap == 'map') {
				initClickMap();
			} else if(bakbakClickMap == 'count') {
				initClickCount();
			} else {
				if(window.location.href == "http://localhost:5000/index1" ||
        			window.location.href.indexOf("censore.blogspot") > -1) {
					initForRecording();
				}
			}
		};


		function initClickMap() {
			var loadingOverLay = createLoadingOverLay();
			$(loadingOverLay).fadeIn(100);
			console.log("MOUSETRACKER:: init ClickMap");
			self.url = removeURLParameter(self.url,'bakbakClickMap');
			$.get( bakbakUrl + "mousetrack/?customerId="+customerId+"&pageUrl="+self.url).done(function(data){
				console.log("MOUSETRACKER:: init "+data); //use list ineterface to add data, server return formatted data.
				try{
					 var canvas = createCanvasOverlay();
 				   	 var heatmap = createWebGLHeatmap({canvas: canvas});
				} catch(ex){
					console.log("MOUSETRACKER::cannot create heat map" );
    				console.log(ex);
				}
				
				var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                         window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
                 var update = function(){
                    for(i in data) {
					heatmap.addPoint(data[i].pageX, data[i].pageY, data[i].clickCount, 1/450); //figure out intensity
					}
                    heatmap.adjustSize(); // can be commented out for statically sized heatmaps, resize clears the map
                    heatmap.update(); // adds the buffered points
                    heatmap.display(); // adds the buffered points
                    //heatmap.multiply(0.9995);
                    //heatmap.blur();
                    //heatmap.clamp(0.0, 1.0); // depending on usecase you might want to clamp it
                    raf(update);
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
			$.get( bakbakUrl + "mousetrack/?customerId="+customerId+"&pageUrl="+self.url).done(function(data){
				console.log("MOUSETRACKER:: init "+data); //use list ineterface to add data, server return formatted data.
				for(i in data) {
					var elem = document.elementFromPoint(data[i].pageX, data[i].pageY);
					var clickCount = $(elem).attr('clickCount');
					if(clickCount) {
						clickCount = +clickCount + +data[i].clickCount;
					} else {
						clickCount = data[i].clickCount;
					}
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
				$(loadingOverLay).fadeOut(100);
				
				
			});
		}


		function send() {
			socket.mouseTrack(customerId,
				{'mouseMovements': self.movementList,
				  'clickPosition': self.clickPosition,
				 'pageUrl' : self.url,
				 'customerId' : self.customerId}
			);
			self.clickPosition=[]; //Can loose Clicks.
			initMovementList(); //Can loose some movement.
		}

		function initForRecording() {
			initMovementList();
			initMovementListeners();
			initClickListeners();
		}

		function initClickListeners() {
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
			e['pageX']=0;
			e['pageY']=0;
			e['time']=Date.now();
			return e;
		}

		function getPosition(e) {
			var pos={};
			pos['pageX'] = e.pageX;
			pos['pageY'] = e.pageY;
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
  			$(myCanvas).html("<img id='bakbakClickLoading' src='"+bakbakUrl+"img/actions/gif/loaderBar.gif'>Loading</img>");
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