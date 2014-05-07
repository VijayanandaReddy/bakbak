var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Schema
 */
 var BakBak = Schema({ 
	type: String,
	data: String
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
    offlineForm: BakBak*/
});

mongoose.model('ApplicationModel', ApplicationSchema);