var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UnitSchema = new mongoose.Schema({
	number: Number,
	shareholder: String,
	initial_balance: Number,
	pet_deposit: {type: Boolean, default: false},
	sublease_deposit: {type: Boolean, default: false},
	transactions: [{type: Schema.Types.ObjectId, ref: "Transaction"}]
},
{
	timestamps: true
});
UnitSchema.path('number').required(true, "Units must have numbers.");
UnitSchema.path('shareholder').required(true, "Units must have shareholders.");
UnitSchema.path('initial_balance').required(true, "Units must have initial balances.");
mongoose.model('Unit', UnitSchema);


/* old units have these fields:

*/