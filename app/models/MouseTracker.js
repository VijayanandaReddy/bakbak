
var mongoose = require('mongoose')
    require('mongoose-number')(mongoose),
    Schema = mongoose.Schema;


var MouseTrackInfo = Schema({
    element: {type: String, index:true},
    clickCount:{ type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
    x: { type: Number, default:0},
    y: { type: Number, default: 0},
    identifier: {type: String}
});

var MouseTrackSchema = Schema({
    pageUrl: { type: String},
    applicationId: { type: String, index: true },
    mouseTrackLog: { type: [MouseTrackInfo], default:[]},
    urlId: {type: String, index: true}
});

MouseTrackSchema.methods.addOrIncrementClickCount = function(element,pageX,pageY,cb) {
    var parent = this;
    this.model('MouseTrackModel').findOneAndUpdate(
        {   'applicationId':this.applicationId, 
            'urlId':this.urlId, 
            'mouseTrackLog.identifier': { $ne : element+"X"+pageX+"Y"+pageY},
        }, 
        {
            "$push": {'mouseTrackLog' :{'element':element,'clickCount':0,'timeSpent':0, 'x':pageX, 'y':pageY, identifier: element+"X"+pageX+"Y"+pageY}}
        },
        {
            'new': true
        },
        function(err,result) {
            if(err) {
                console.log("Stuck! in adding or incrmenting click count");
                console.log(err);
            } else {
                console.log(result);
                parent.incrementClickCount(element,pageX,pageY,cb);
            }
        });
}


MouseTrackSchema.methods.incrementClickCount = function(element,pageX,pageY,cb) {
    var parent = this;
    this.model('MouseTrackModel').update(
        {
            'applicationId':this.applicationId, 
            'urlId':this.urlId, 
            'mouseTrackLog.identifier': element+"X"+pageX+"Y"+pageY
        },
        {
            '$inc':{'mouseTrackLog.$.clickCount':1}
        },
        {
            'new': true
        },
        cb);
}


mongoose.model('MouseTrackModel', MouseTrackSchema);