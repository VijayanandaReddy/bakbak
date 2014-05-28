var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Schema
 */
 var BakBak = Schema({ 
    type: String,
    data: String
});

var PageLevelMouseTrack = Schema({
    url: String,
    clickTrack:Boolean,
    movementTrack:Boolean,
    scrollDepth:Boolean
});


var ApplicationSchema = Schema({
    adminId: String,
    name: String,
    agents: Number,
    email: String,
    domain_blacklist: Array,
    enabled: Boolean,
    agentIds: Array,
    displayName: String,
    mouseTracking: [PageLevelMouseTrack]/*,
    offlineForm: BakBak*/
});

ApplicationSchema.methods.upsertMouseTracking = function(data,cb) {
    if(data['clickTrack'] == 'on') data['clickTrack'] = true;
        else data['clickTrack'] = false;
    if(data._id && (data._id != null && data._id != 'null' && data._id != 'undefined')) {
        console.log("Need to update mouse tracking");
        console.log(data);
        var set = {};
        set['mouseTracking.$.url'] = data['url'];
        set['mouseTracking.$.clickTrack'] = data['clickTrack'];
        this.model('ApplicationModel').update({_id:this._id,'mouseTracking._id':data._id},
            {$set: set},cb);
    } else {
        delete data['_id'];
        console.log(data);
        this.mouseTracking.push(data);
        this.save(cb);
    }
}

mongoose.model('ApplicationModel', ApplicationSchema);