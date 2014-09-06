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
                    console.log(ev);
                    console.log(data);
                    ga('send', 'event', 'bakbak_report', ev, data);
                    return true;
                }) ;  
            }
            
        }
        init();

	};  
}); 