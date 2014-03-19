var TenHands = TenHands || {};

TenHands.versionString = "";

TenHands.videoService = function(options) {
    new TenHands.VideoServiceFactory(options);
}

// @deprecated
// use TenHands.videoService instead
TenHands.loadVideoService = function(videoContainerId, user, options, onSuccessHandler) {
    options = options || {};
    options.videoContainerId = videoContainerId;
    options.user = user;
    options.onSuccess = onSuccessHandler;
    new TenHands.VideoServiceFactory(options);
}

TenHands.VideoServiceFactory = function(options) {
    var isLoaded = false;
    var useIframe = true;
    var self = this;
    var serviceConfiguration = new TenHands.ServiceConfiguration("wss://routeserver.tenhands.net/sessionrouter/sessionrouter", null, "https://www.tenhands.net");
    if (options && options.hasOwnProperty("serviceConfiguration") && options.serviceConfiguration != null) {
        serviceConfiguration = options.serviceConfiguration;
    }
    if (options && options.hasOwnProperty("useIframe")) {
        useIframe = options.useIframe;
    }
    var doc = document;
    if (useIframe) {
        var iFrame = document.createElement("iframe");
        iFrame.id = this.videoFrameId;
        iFrame.name = this.videoFrameId;
        iFrame.style.border = "none";
        iFrame.style.height = "100%";
        iFrame.style.width = "100%";
        iFrame.onload = onIframeLoaded
        var container = document.getElementById(options.videoContainerId);
        container.appendChild(iFrame);
    }

    function onIframeLoaded() {
        document.getElementById(self.videoFrameId).onload = function(){};
        var doc = document.getElementById(self.videoFrameId).contentWindow.document;
        var html = "<!DOCTYPE html>";
        html += "<html>";
        html += "<head>";
        html += "<link rel=\"stylesheet\" href=\"" + serviceConfiguration.coreServiceBaseURL + "/wro/2_0/tenhands-api.css\" type=\"text/css\"/>";
        html += "</head>";
        html += "<body>";
        html += "<script type=\"text/javascript\" src=\"" + serviceConfiguration.coreServiceBaseURL + "/wro/2_1/tenhands-api.js?minimize=false\"></script>";
        html += "</body>";
        html += "</html>";

        doc.open();
        doc.write(html);
        // If close() is not called on IE, the page load indicator will
        // continue to spin.
        doc.close();

        onScriptLoaded();
    }

    function onScriptLoaded() {
        var videoFrameWindow = window;
        if (useIframe) {
            videoFrameWindow = document.getElementById(self.videoFrameId).contentWindow;
        }
        if (typeof videoFrameWindow.TenHands != "undefined"
            && typeof videoFrameWindow.TenHands.VideoService == "function") {
            isLoaded = true;
            createVideoService(options);
        } else {
            setTimeout(function(){onScriptLoaded()}, 100);
        }
    }

    function createVideoService(options) {
        if (isLoaded) {
            options.serviceConfiguration = serviceConfiguration;
            options.useIframe = useIframe;
            options.onInitHandler = onVideoServiceInitialized;
            var videoFrameWindow = window;
            if (useIframe) {
                videoFrameWindow = document.getElementById(self.videoFrameId).contentWindow;
            }
            videoFrameWindow.gVideoService =
                new videoFrameWindow.TenHands.VideoService().ServiceFactory(options);
        } else {
            throw new Error("TenHands video service not loaded yet");
        }
    };

    function onVideoServiceInitialized(result) {
        if (result.succeeded) {
            var videoFrameWindow = window;
            if (useIframe) {
                videoFrameWindow = document.getElementById(self.videoFrameId).contentWindow;
            }
            options.onSuccess(videoFrameWindow.gVideoService);
        } else {
            alert("Error: Video Service not initialized");
        }
    }
}

TenHands.VideoServiceFactory.prototype.videoFrameId = "THVideoFrame";


TenHands.ServiceConfiguration = function(wsURL, sioURL, coreServiceBaseURL) {
    this.wsURL = wsURL;
    this.sioURL = sioURL;
    this.coreServiceBaseURL = coreServiceBaseURL;
};