PhotosphereAndMapEmbed = function() {
  this.FEED_SCHEMA = 'http://schemas.google.com/g/2005#feed';
  this.CAROUSEL_HEIGHT = 0;
  this.CAROUSEL_WIDTH = 0;

  this.STYLE = '.photosphere-carousel::-webkit-scrollbar {' +
               '  -webkit-appearance: none;' +
               '  width: 5px;' +
               '}' +
               '.photosphere-carousel::-webkit-scrollbar-thumb {' +
               '  background-color: rgba(0,0,0,.5);' +
               '  -webkit-box-shadow: 0 0 1px rgba(255,255,255,.5);' +
               '}';

  this.viewerContainer = undefined;
  this.titleContainer = undefined;
  this.toggleButton = undefined;
  this.mapToggle = undefined;
  this.mapArea = undefined;
  this.carousel = undefined;
  this.markers=[];
  
};

latitudes = ['51.7586474' , '52.7586474' , '53.7586474' , '50.7586474', '54.7586474' , '55.7586474', '56.7586474', '57.7586474', '58.7586474'];
longitudes = ['1.7586474' , '2.7586474' , '3.7586474' , '0.7586474', '4.7586474' , '5.7586474', '6.7586474', '7.7586474', '8.7586474'];
titles =  ['51.7586474' , '52.7586474' , '53.7586474' , '50.7586474', '54.7586474' , '55.7586474', '56.7586474', '57.7586474', '58.7586474'];



PhotosphereAndMapEmbed.styleAdded = false;

PhotosphereAndMapEmbed.prototype.init = function(elementId, userId, albumId, mapId, mapWidth) {
  // Due to a bug on Chrome/OSX, the horizontal scrollbar is missing. This adds it back.
  if (!PhotosphereAndMapEmbed.styleAdded) {
    PhotosphereAndMapEmbed.styleAdded = true;
    $('<style>' + this.STYLE + '</style>').attr('type', 'text/css').appendTo('head');
  }
  
  var container = $('#' + elementId)
      .css('position', 'relative')
	  //.css('float','left')   // this causes a problem in the current google chrome see http://stackoverflow.com/questions/15157253/css-floating-bug-in-google-chrome
								// the mapToggle area had to be shifted over the map again.
	  .css('display','inline-block')
      .css('box-shadow', '0 0 15px black');

  var width = container.width();
  var height = container.height();
  var viewerHeight = height - this.CAROUSEL_HEIGHT;
  var viewerWidth = width - this.CAROUSEL_WIDTH;
	
  this.userID = userId;
  this.albumID = albumId;

  // The show/hide map button
  this.toggleButton = $('<div id="mapToggle"><span id="toggleText">Show map</span></div>').css('width', '85px')
													.css('height', '0px')
													.css('font-weight','bold')
													.css('color','lightgrey')
													.css('cursor','pointer')
													.css('position','relative')
													.css('left', '55px')
													.css('bottom', -height + 40 +'px')
													.css('z-index','150')
   container.append(this.toggleButton);
	$.data(document.getElementById('toggleText'),"onoff",1);
	 $('#mapToggle').hide();
	$('#mapToggle').bind("click", function (event) {
		var map = $.data(document.getElementById('mapToggle'),"map");
		var onoff = $.data(document.getElementById('toggleText'),"onoff");
		//$('#' + mapId).animate({width: 'toggle'},"slow");  // toggles the map area right left
		$('#' + mapId).slideToggle('slow');  // toggles the map area top to bottom
		var center = map.getCenter();
		google.maps.event.trigger(map, "resize");	
		map.setCenter(center);
		if(onoff == 1){
			$('#toggleText').text("Hide map");
			$.data(document.getElementById('toggleText'),"onoff",0);
		}else{
			$('#toggleText').text("Show map");
			$.data(document.getElementById('toggleText'),"onoff",1);
		}
		return false;
  });

  // This container will contain the title
  this.titleContainer = $('<div><span id="titleText"></span></div>').css('position', 'absolute')
										 .css('height','0px')
										 .css('left','80%')
										 .css('z-index','100')
                                         .css('top', '10px');
  container.append(this.titleContainer);
  
  // This container will contain the panorama viewer.
  this.viewerContainer = $('<div></div>').css('height', '100%')
                                         .css('width', viewerWidth + 'px')
										 .css('position', 'absolute')
										 .css('right','0')
										 .css('z-index','50')
                                         .css('background-color', 'black');
  container.append(this.viewerContainer);

  // This will contain the thumbnail list
  this.carousel =  $('<div></div>').css('width', '200px')
                                   .css('height', '100%')
                                   .css('position', 'absolute')
                                   .css('left', '10px')
								   .css('z-index','100')
  container.append(this.carousel);
  
  // This div is used for positioning the map div and is used for the toggle command
  var my_left = Math.round(width * mapWidth/100);
  var mapToggle = $('#' + mapId)
	.css('height', viewerHeight)
	.css('display','none')
	.css('position','relative')
	.css('z-index','200')
	.css('top',-height +'px')
	.css('left', width - my_left + 'px');

  // The map area is where the google map API puts the actual map and the marker
  this.mapArea = $('<div id="mapHere"></div>').css('width', my_left + 'px')
                                   .css('height', viewerHeight + 'px')		   
  mapToggle.append(this.mapArea);

  var albumFeedUrl = this.getAlbumFeedUrl(userId, albumId);
  this.fetchPhotos(albumFeedUrl);

};

PhotosphereAndMapEmbed.prototype.getAlbumFeedUrl = function(userId, albumId) {
  return 'https://picasaweb.google.com/data/feed/api/user/'
          + userId + '/albumid/' + albumId + '?alt=json&v=4';
};

/** Fetches photos, filters photo spheres and displays them. */
PhotosphereAndMapEmbed.prototype.fetchPhotos = function(url) {
  var this_ = this;
 
  $.getJSON(url, function(response) {
    if (!response || !response.feed || !response.feed.entry) {
      return;
    }
    var firstPanoramaFeedUrl;
	var lats = 0;
	var longs = 0;
	var i=0;
    $.each(response.feed.entry, function(index, entry) {
	  //console.log(entry);
      if (this_.isPhotoSphere(entry)) {
      	i++;
	if(i > 10) return;
        if (!firstPanoramaFeedUrl) {
          firstPanoramaFeedUrl = this_.getFeedUrl(entry);
        }
        this_.carousel
            .addClass('photosphere-carousel')
            .append($('<img></img>')
            .attr('src', entry.media$group.media$thumbnail[1].url)
            .attr('panoFeedUrl', this_.getFeedUrl(entry))
            .css('margin', '5px')
            .css('box-shadow', '0 0 0 4px #eee')
            .css('cursor', 'pointer')
            .click(function() {
				this_.displayPhotoSphere($(this).attr('panoFeedUrl'));
			})
			);
		var _locTitle = entry.media$group.media$description.$t;
		this_.carousel
            .addClass('photosphere-carousel')
            .append($('<p class="caption-text">' + _locTitle + '</p>'));
	//	if(entry.georss$where)	{
	//		var _locLat_long = entry.georss$where.gml$Point.gml$pos.$t.split(/ /);
			lats += Number(latitudes[i]);
			longs += Number(longitudes[i]);
			var lat_long = new Array();
			lat_long[0] = Number(latitudes[i]);
			lat_long[1] = Number(longitudes[i]);
//		}
        var marker = {                                  
			"locationTitle" : titles[i],
			"lat_long" : lat_long,
			"feedUrl": this_.getFeedUrl(entry)
		};
	this_.updatePanoMarker(lat_long, titles[i]);

		queryStr = { "marker" : marker };
		this_.markers.push(queryStr);
      }
    });
	this_.displayMap(new Array(lats/this_.markers.length, longs/this_.markers.length), "Any title"); // this puts the map in the middle of the markers
    this_.displayPhotoSphere(firstPanoramaFeedUrl);
  });
};


/** Returns the feed URL of an entry. */
PhotosphereAndMapEmbed.prototype.getFeedUrl = function(entry) {
  for(var i = 0; i < entry.link.length; ++i) {
    if (entry.link[i].rel == this.FEED_SCHEMA) {
      return entry.link[i].href;
    }          
  }
  return '';  
};

/** Returns whether the given entry is a photo sphere. */
PhotosphereAndMapEmbed.prototype.isPhotoSphere = function(entry) {
  if (!entry.gphoto$streamId) {
    return false;
  }
  var streamIds = entry.gphoto$streamId;
  for (var i = 0; i < streamIds.length; ++i) {
    if (streamIds[i].$t == 'photosphere') {
      return true;
    }
  }
  return false;  
};


/**
 * Fetches the feed data for a photo sphere based on the given feed URL
 * and displays the photo sphere given the returned metadata.
 */
PhotosphereAndMapEmbed.prototype.displayPhotoSphere = function(panoFeedUrl) {
  this.viewerContainer.empty();

  var this_ = this;
  // Request the full exif of the photo sphere, which contains the
  // metadata we need to properly display it.
  $.getJSON(panoFeedUrl + '&full-exif=true', function(response) {
    if (!response || !response.feed || !response.feed.exif$tags) {
      return;
    }
	
	var img_data = response.feed;
	//console.log(response);
    // Extract the required metadata.
    var exif = response.feed.exif$tags;
	var CALP = typeof exif.exif$CroppedAreaLeftPixels !== 'undefined' ? exif.exif$CroppedAreaLeftPixels.$t : 0;
	var CATP = typeof exif.exif$CroppedAreaTopPixels !== 'undefined' ? exif.exif$CroppedAreaTopPixels.$t : 0;
    this_.viewerContainer
        .append($('<g:panoembed></g:panoembed>')
        .attr('imageurl',
              response.feed.media$group.media$content[0].url)
        .attr('fullsize',
              exif.exif$FullPanoWidthPixels.$t + ',' +
              exif.exif$FullPanoHeightPixels.$t)
        .attr('croppedsize',
                exif.exif$CroppedAreaImageWidthPixels.$t + ',' +
                exif.exif$CroppedAreaImageHeightPixels.$t)		
        .attr('offset',
                CALP + ',' + CATP)
		.attr('autorotate',1)
        .attr('displaysize', this_.viewerContainer.width() + ',' + this_.viewerContainer.height())
   	);
	var title = response.feed.media$group.media$description.$t;
	$('#titleText').empty();
	$('<a href="https://plus.google.com/photos/' + this_.userID + '/albums/' + this_.albumID + '/' + response.feed.gphoto$id.$t + '" target="_blank" style="color:lightgrey">' + title + '</a>').appendTo($('#titleText'));
	if(img_data.georss$where) {
		var lat_long = img_data.georss$where.gml$Point.gml$pos.$t.split(/ /);
		this.lat_long = lat_long;
	}
	
    	// Searches the whole DOM tree for g:panoembed elements and
    	// initializes them.
    	gapi.panoembed.go();
	//this_.updatePanoMarker(lat_long, title);
  });
};


PhotosphereAndMapEmbed.prototype.displayMap = function(coordinates, maptitle) {
	var this_ = this;
	//console.log(this_.markers);
	var latlong = new google.maps.LatLng(coordinates[0], coordinates[1]);

	var settings = {
		zoom: 19,
		maxZoom: 19,
		minZoom:13,
		center: latlong,
		draggable: false,
		disableDoubleClickZoom: true,
		keyboardShortcuts: false,
		overviewMapControl: false,
		panControl: false,
		rotateControl: false,
		scaleControl: false,
		scrollwheel: false,
		streetViewControl: false,
		zoomControl: true,
		zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL,
        position: google.maps.ControlPosition.RIGHT_TOP
		},
		mapTypeControl: false,
		navigationControl: false,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	   };
	this_.map = new google.maps.Map(document.getElementById('mapHere'), settings);
	$.data(document.getElementById('mapToggle'),"map",this_.map);
	
	//
	//ToDo: 
	// DONE - Do not redraw or repostion the map
	// DONE - Only change the pin color
	// DONE - Each pin gets a listner so you can use them to change the sphere
	// - link carousel image to marker so hover shows that pin in differnt color??

};
 
PhotosphereAndMapEmbed.prototype.updatePanoMarker = function(coordinates, maptitle) {
	var this_ = this;
	//console.log(this_.markers);
	var latlong = new google.maps.LatLng(coordinates[0], coordinates[1]);
	
	// redraw all marker
	$(this_.markers).each(function(index) {
		var mark_lat_long = new google.maps.LatLng(this_.markers[index].marker.lat_long[0], this_.markers[index].marker.lat_long[1]);
		var marker = new google.maps.Marker({
			position: mark_lat_long,
			map: this_.map,
			title: this_.markers[index].marker.locationTitle
		});
		google.maps.event.addListener(marker, 'click', function() { 
			this_.displayPhotoSphere(this_.markers[index].marker.feedUrl);
		}); 
	});
	
	// change current pin marker and set it
  	var pinColor = "007569";
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34));
		new google.maps.Marker({
			position: latlong,
			map: this_.map,
			icon: pinImage,
			title: maptitle
	});
};
