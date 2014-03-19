var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Schema
 */
var UserSchema = Schema({
    name: String,
    firstname: String,
    lastname: String,
    email: String,
    username: String,
    social_id: String,
    facebook: {},
    google: {}
});

mongoose.model('UserModel', UserSchema);