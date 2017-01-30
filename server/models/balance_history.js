var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var BalanceHistorySchema = new mongoose.Schema({
	account_name: String,
	dates: [Date],
	values: [Number]
},
{
	timestamps: true
});
BalanceHistorySchema.path('account_name').required(true, "History must have a name.");
mongoose.model('BalanceHistory', BalanceHistorySchema);