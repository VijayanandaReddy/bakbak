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

var MouseTracking = Schema({
    pages:[PageLevelMouseTrack]
});

var ApplicationSchema = Schema({
    adminId: String,
    name: String,
    agents: Number,
    email: String,
    domain_blacklist: Array,
    enabled: Boolean,
    agentIds: Array,
    displayName: String/*,
    mouseTracking: MouseTracking,
    offlineForm: BakBak*/
});

mongoose.model('ApplicationModel', ApplicationSchema);