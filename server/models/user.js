var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserSchema = new mongoose.Schema({
	pw_hash: String,
	unit: String,     // is NOT at the present time an ObjectID.  This currently serves more as a username.
	online: Boolean
},
{
	timestamps: true
});
UserSchema.path('unit').required(true, "Users must be associated with a unit.");
UserSchema.path('pw_hash').required(true, "Users must have passwords.");
mongoose.model('User', UserSchema);
