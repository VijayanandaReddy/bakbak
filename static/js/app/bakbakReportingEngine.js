define(['jquery','app/utils'],function($,utils) {


    window.BakbakReportingEngine = function(debug,visitor) {
        var self = this;
        var customReportingEvent = ['bakbak_reporting_bakbak_show'];
        init = function () {   
            if(typeof ga === 'undefined') {
                console.log("No Google analytics configured!");
                return;
            }
            console.log("Intializing");
            for(var i in customReportingEvent) {
                console.log("Subscrining to " + customReportingEvent[i])
                $(document).on(customReportingEvent[i],function(ev,data) {
                    report(ev,data);
                    return true;
                }) ;  
            }
            
        }

        report = function(ev,data) {
            console.log(ev);
            console.log(data);
            if(typeof ga !== 'undefined') {
                ga('send', 'event', 'bakbak_report', ev.type, data);
            }
            if(typeof _trackEvent !== 'undefined') {
            _trackEvent(ev.type, ev.data);
            }
        }
        init();

	};  
}); 