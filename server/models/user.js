var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserSchema = new mongoose.Schema({ 
	email: String,
	pw_hash: String,
	unit: String,     // is NOT at the present time an ObjectID.  This currently serves more as a username.
	online: Boolean,
	dues_reminder: {type: String, default: ""}	//contains the email address to email reminders to, or "" if reminders have not been selected
},
{
	timestamps: true
});
UserSchema.path('unit').required(true, "Users must be associated with a unit.");
UserSchema.path('pw_hash').required(true, "Users must have passwords.");
mongoose.model('User', UserSchema);
