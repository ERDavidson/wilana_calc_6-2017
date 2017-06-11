var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PropertyTaxSchema = new mongoose.Schema({
	year_paid: Number,
	bill_main: Number,
	land_val_main: Number,
	imp_val_main: Number,
	units_main: {type: Object, default: {'small': [3, 6, 7, 8, 9, 15, 16, 17, 18, 24, 25, 26, 27], 'medium': [2, 10, 11, 19, 20, 28, 29], 'large': [4, 5, 12, 14, 21, 22]}},
	bill_alt: Number,
	reimbursement_alt: Number,
	land_val_alt: Number,
	imp_val_alt: Number,
	units_alt: {type: Object, default: {'small': [], 'medium': [1], 'large': []}},
	unit_size_shares: {type: Object, default: {'small': 2950, 'medium': 3950, 'large': 4500}},
	unit_size_numbers: {type: Object, default: {'small': [3, 6, 7, 8, 9, 15, 16, 17, 18, 24, 25, 26, 27], 'medium': [1, 2, 10, 11, 19, 20, 28, 29], 'large': [4, 5, 12, 14, 21, 22]}}
},
{
	timestamps: true
});
PropertyTaxSchema.path('year_paid').required(true, "Tax must include the year paid.");
PropertyTaxSchema.path('bill_main').required(true, "Tax must have an amount.");
mongoose.model('PropertyTax', PropertyTaxSchema);