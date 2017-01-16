var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var BudgetLineSchema = new mongoose.Schema({
	category: String,
	values: Object,
	is_income: {type: Boolean, default: false},
	is_maintenance: {type: Boolean, default: false}
},
{
	timestamps: true
});
BudgetLineSchema.path('category').required(true, "Budget line must be categorized.");
BudgetLineSchema.path('values').required(true, "Budget line should have values formatted as an object {year: amount}");
mongoose.model('BudgetLine', BudgetLineSchema);