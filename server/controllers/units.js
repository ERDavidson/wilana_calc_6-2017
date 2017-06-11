var mongoose = require('mongoose');
var Transaction = mongoose.model('Transaction');
var Unit = mongoose.model('Unit');
var res_result = function(res, err, result){
	if (err){
		res.json({error: "Error in server Units controller: " + err});
	} else {
		res.json({index: result});
	}
}
module.exports = {
	create: function(req,res){
		console.log("Server controller unit create method opened.");
		Unit.findOne({number: req.body.number}, function(err, already_there){
			if (err){
				console.log("Error while checking whether unit is already in database: " + err);
				res.json({error: "Error while checking whether unit is already in database: " + err});				
			} else if (already_there != null){
				console.log("error in create method: Unit is already in database");
				res.json({error: "Unit is already in database"});
			} else {
				this_unit = new Unit({
					number: req.body.number, 
					shareholder: req.body.shareholder, 
					initial_balance: req.body.initial_balance,
					pet_deposit: req.body.pet_deposit,
					sublease_deposit: req.body.sublease_deposit,
					transactions: [],
				});
				this_unit.save(function(err){
					if (err){
						console.log("Error saving new unit: " + err);
						res.json({error: "Error saving new unit: " + err});
					} else {
						console.log("Unit entered into database without encountering errors: " + this_unit.number + ", " + this_unit.shareholder);
						res.json({result: "ok"});		
					
					}
				})
			}
		})
	},
	update: function(req,res){
		//console.log("controller unit update function active");
		Unit.findOneAndUpdate({_id: req.params.id}, {
			number: req.body.number, 
			shareholder: req.body.shareholder, 
			initial_balance: req.body.initial_balance,
			pet_deposit: req.body.pet_deposit,
			sublease_deposit: req.body.sublease_deposit,
			transactions: req.body.transactions
		}, function(err, result){
			if (err){
				res.json({error: "Unit update failed: " + err});
			} else {
				res.json({result: result});
			}
		})
	},
	show: function(req,res){
		Unit.findOne({number: req.params.number})
			.populate('transactions')
			.exec(function(err, this_unit){
			if (err){
				//console.log("Error while retrieving unit to show: " + err);
			} else {
				res.json({unit: this_unit});
			}
		})
	},
	index: function(req,res){
		if (req.body.options["populate"] === true){
			Unit.find({})
				.populate('transactions')
				.exec(function(err, result){res_result(res, err, result)});
		} else if (req.body.options["deposits"] === true){
			Unit.find({}, {pet_deposit: 1, sublease_deposit: 1, number: 1}, function(err, result){res_result(res, err, result)});
		} else {
			Unit.find({}, function(err, result){res_result(res, err, result)});
		}
	},
	unit_numbers_index: function(req,res){
		Unit.find({}, {number: 1}, function(err, these_unit_numbers){
			if (err){
				res.json({error: "Error in server controller unit_list method"});
			} else {
				res.json({unit_numbers: these_unit_numbers});
			}
		})
	}
}

/*{
				if (err){
					res.json({error: "Error in server controller Index method: " + err});
				} else {
					res.json({index: this_index});
				}
			})
*/