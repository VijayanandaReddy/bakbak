
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MousePos = Schema({
    x: { type: Number},
    y: { type: Number}
});

var MouseTrackInfo = Schema({
    pos:{ type: [MousePos], default:[]},
    element: {type: String, index:true},
    clickCount:{ type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }
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
            'mouseTrackLog.element': { $ne : element}
        }, 
        {
            "$push": {'mouseTrackLog' :{'element':element,'clickCount':0,'timeSpent':0, 'pos':[]}}
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


MouseTrackSchema.methods.storePostion = function(element,pageX,pageY,cb) {
   this.model('MouseTrackModel').findOneAndUpdate(
        {   'applicationId':this.applicationId, 
            'urlId':this.urlId, 
            'mouseTrackLog.element': element,
            'mouseTrackLog.pos.x' : { $ne: pageX },
            'mouseTrackLog.pos.y' : { $ne: pageY } 
        },
        {
            "$push": {'mouseTrackLog.$.pos' :{x:+pageX,y:+pageY}}
        },
        {
            'new': true
        },
        cb);
}


MouseTrackSchema.methods.incrementClickCount = function(element,pageX,pageY,cb) {
    var parent = this;
    this.model('MouseTrackModel').update({'applicationId':this.applicationId, 
        'urlId':this.urlId, 'mouseTrackLog.element': element},
        {
            '$inc':{'mouseTrackLog.$.clickCount':1}
        },
        {
            'new': true
        },
        function(err,result) {
            if(err) {
                console.log("Failed to increment click count " + err);
                parent.storePostion(element,pageX,pageY,cb);
            } else {
                console.log("Incremented click count");
                console.log(result);
                parent.storePostion(element,pageX,pageY,cb);
            }
        });
}

MouseTrackInfo.methods.incrementClickCount = function(cb) {
    this.model('MouseTrackInfo').update({},{'$inc':{'clickCount':1}},cb);
}

mongoose.model('MouseTrackModel', MouseTrackSchema);