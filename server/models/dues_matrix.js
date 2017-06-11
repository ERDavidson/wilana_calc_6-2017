var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Dues_MatrixSchema = new mongoose.Schema({
	rates: Array //primary index = unit number, secondary index = months past original date.  Manually edit in mongo.exe for now.
},
{
	timestamps: true
});
mongoose.model('Dues_Matrix', Dues_MatrixSchema);
// eventually should add origin date as a matrix attribute instead of trusting factories to submit updates with correct indexes.