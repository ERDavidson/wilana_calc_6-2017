var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MortgageSchema = new mongoose.Schema({
	name: String,
	initial_date: Date,
	initial_balance: Number,
	payments: [{pay_date: Date, total: Number, principal: Number, interest: Number}]
},
{
	timestamps: true
});
MortgageSchema.path('initial_date').required(true, "Mortgage must have initial_date.");
MortgageSchema.path('initial_balance').required(true, "Mortgage must have initial_balance.");
mongoose.model('Mortgage', MortgageSchema);