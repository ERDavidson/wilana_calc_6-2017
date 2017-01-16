var mongoose = require('mongoose');
var BudgetLine = mongoose.model('BudgetLine');
module.exports = {
	index: function(req,res){
		BudgetLine.find({}, function(err, these_categories){
			if (err){
				res.json({error: "Error retrieving spending history index " + err});
			} else {
				res.json({new_index: these_categories});	
			}
		})
	},
	create: function(req,res){
		var new_category = new BudgetLine(req.body.new_category);
		console.log("Attempting to save new category: " + JSON.stringify(new_category));
		new_category.save(function(err, created_category){
			if (err){
				console.log("Error creating new budget category: " + JSON.stringify(err));
				res.json({error: "Error creating new budget category: " + err});
			} else {
				console.log("Saved new budget category: " + JSON.stringify(created_category));
				res.json({created_category: created_category});
			}
		})
	}
};