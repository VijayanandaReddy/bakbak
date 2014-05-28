
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MouseTrackInfo = Schema({
    pageX:{ type: Number,  index: true },
    pageY :{ type: Number, index:true },
    clickCount:{ type: Number, min: 0 },
    timeSpent: { type: Number, min: 0 }
});

var MouseTrackSchema = Schema({
    pageUrl: { type: String, index: true },
    customerId: { type: String, index: true },
    mouseTrackLog: { type: [MouseTrackInfo], default:[]},
});

MouseTrackSchema.methods.addOrIncrementClickCount = function(posX,posY,cb) {
    var parent = this;
    this.model('MouseTrackModel').find({'customerId':this.customerId, 
        'pageUrl':this.pageUrl, 'mouseTrackLog.pageX': posX, 'mouseTrackLog.pageY': posY },{'mouseTrackLog.$': 1},
         function(err,mouseTrack) {
            if(err) {
                console.log("Error:: Not found! will create");
                console.log(err);
                parent.addMouseTrackLogWithClickCount(posX,posY,cb);
            } else if(mouseTrack.length == 0) {
                console.log("Not found! will create");
                console.log(mouseTrack);
                parent.addMouseTrackLogWithClickCount(posX,posY,cb);
            } else {
                console.log(mouseTrack);
                parent.incrementClickCount(( mouseTrack[0].mouseTrackLog[0]),cb);
            }
        });
}

MouseTrackSchema.methods.addMouseTrackLogWithClickCount = function(posX,posY,cb) {
     this.mouseTrackLog.push({'pageX':posX,'pageY':posY,'clickCount':1,'timeSpent':0});
     this.save(cb);
}

MouseTrackSchema.methods.incrementClickCount = function(mouseTrackLog,cb) {
    this.model('MouseTrackModel').update({'customerId':this.customerId, 
        'pageUrl':this.pageUrl, 'mouseTrackLog.pageX': mouseTrackLog.pageX,
        'mouseTrackLog.pageY': mouseTrackLog.pageY},{'$inc':{'mouseTrackLog.$.clickCount':1}},
        cb);
}

MouseTrackInfo.methods.incrementClickCount = function(cb) {
    this.model('MouseTrackInfo').update({},{'$inc':{'clickCount':1}},cb);
}

mongoose.model('MouseTrackModel', MouseTrackSchema);