var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Schema
 */
var ApplicationSchema = Schema({
    adminId: String,
    name: String,
    agents: Number,
    email: String,
    domain_blacklist: Array,
    enabled: Boolean,
    agentIds: Array,
    displayName: String
});

mongoose.model('ApplicationModel', ApplicationSchema);