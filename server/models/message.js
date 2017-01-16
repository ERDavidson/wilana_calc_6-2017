var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MessageSchema = new mongoose.Schema({
	author: String,
	unit: String,
	title: String,
	text: String,
},
{
	timestamps: true
});
MessageSchema.path('unit').required(true, "Message must be associated with the author's unit.");
MessageSchema.path('text').required(true, "Message must have text.");
mongoose.model('Message', MessageSchema);