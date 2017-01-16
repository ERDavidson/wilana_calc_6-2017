var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TransactionSchema = new mongoose.Schema({
	_unit: {type: Schema.Types.ObjectId, ref: "Unit"},
	type: {type: String, default: "credit"}, // choose from: credit, late_fee, assessment, other_fee.  Give details of other_fees in notes.
	date: Date,  // ambivalent about using string vs date object
	amount: Number,
	check_number: String, // string, since alternatives to checks like money orders often have special characters, and I'll never do math with these
	notes: String,
},
{
	timestamps: true
});
TransactionSchema.path('amount').get(function(this_amount){
	return (this_amount / 100).toFixed(2);
})
TransactionSchema.path('date').get(function(this_date){
	return (this_date.toLocaleDateString());
})
TransactionSchema.path('amount').set(function(this_amount){
	return (this_amount * 100);
})
TransactionSchema.path('_unit').required(true, "Transaction must be assigned to a unit.");
TransactionSchema.path('date').required(true, "Transaction must have a date.");
TransactionSchema.path('type').required(true, "Transaction must have a type.");
TransactionSchema.path('amount').required(true, "Transaction must have an amount.");
mongoose.model('Transaction', TransactionSchema);