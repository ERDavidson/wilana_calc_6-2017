var mongoose = require('mongoose');
var Mortgage = mongoose.model('Mortgage');
module.exports = {
	index: function(req,res){
		Mortgage.find({}, function(err, these_mortgages){
			if (err){
				res.json({error: "Error retrieving mortgage index: " + err});
			} else {
				res.json({mortgage_index: these_mortgages});	
			}
		})
	},
	create: function(req,res){
		var new_mortgage = new Mortgage({
			name: req.body.name,
			initial_date: req.body.initial_date,
			initial_balance: req.body.initial_balance,
			payments: req.body.payments
		});
		//console.log("Attempting to save new mortgage: " + JSON.stringify(new_mortgage));
		new_mortgage.save(function(err, created_mortgage){
			if (err){
				res.json({error: "Error creating new mortgage: " + err});
			} else {
				console.log("Save result: " + JSON.stringify(created_mortgage));
				res.json({created_mortgage: created_mortgage});
			}
		})
	}
};