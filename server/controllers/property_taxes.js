var mongoose = require('mongoose');
var PropertyTax = mongoose.model('PropertyTax');
module.exports = {
	index: function(req,res){
		PropertyTax.find({"year_paid": {$gt: 2006}}, function(err, these_taxes){
			if (err){
				res.json({error: "Error retrieving property tax index: " + err});
			} else {
				console.log("server returning this index: " + JSON.stringify(these_taxes));
				res.json({prop_tax_index: these_taxes});	
			}
		})
	}, 
	create: function(req,res){
		var new_tax = new PropertyTax({
			year_paid: req.body.year_paid,
			bill_main: req.body.bill_main,
			land_val_main: req.body.land_val_main,
			imp_val_main: req.body.imp_val_main,
		});
		var optional_keys = ["land_val_main", "imp_val_main", "units_main", "bill_alt", "reimbursement_alt", "land_val_alt", "imp_val_alt", "units_alt"];
		for (i=0;i<optional_keys.length;i++){
			if (req.body[optional_keys[i]]){
				new_tax[optional_keys[i]] = req.body[optional_keys[i]];
			}
		}
		new_tax.save(function(err, created_tax){
			if (err){
				res.json({error: "Error creating new property tax year: " + err});
			} else {
				console.log("Save result: " + JSON.stringify(created_tax));
				res.json({created_tax: created_tax});
			}
		})
	},
	delete: function(req,res){
		PropertyTax.findOneAndRemove({_id: req.params.id}, function(err, deleted_tax_result){
			if (err){
				console.log("Error deleting tax year: " + JSON.stringify(err));
				res.json({error: "Error deleting tax year: " + err});
			} else {
				console.log("Deleted tax year: " + JSON.stringify(deleted_tax_result));
				res.json({result: deleted_tax_result});
			}
		})
	}
};