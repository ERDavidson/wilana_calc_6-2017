var mongoose = require('mongoose');
var Transaction = mongoose.model("Transaction");
var Unit = mongoose.model("Unit");
var change_unit = function(transaction_id, old_unit, new_unit_number, callback){  //accepts these parameters, modifies & saves both the old unit & new unit, and returns the new unit's ID.
	console.log('received transaction_id' + transaction_id + ", old_unit " +  JSON.stringify(old_unit) + ", and new unit number " + new_unit_number + " in change unit method.");
	var new_old_unit = old_unit;
	if (old_unit.transactions.indexOf(transaction_id) === -1){
		console.log("Could not find transaction in old unit's transaction list.");
	} else {
		var cut_transaction = new_old_unit.transactions.splice(old_unit.transactions.indexOf(transaction_id), 1);
		//console.log("I just cut " + cut_transaction + " out of unit " + old_unit.number + "'s transaction list");
	}	
	old_unit.save(function(err, save_result){
		if (err){
			console.log("Error saving old unit during transaction update" + err);
		} else {
			Unit.findOne({number: new_unit_number}, function(err, new_unit){
				if (err){
						console.log("Error finding new unit for updated transaction" + err);
				} else {
					//console.log("Saved old unit with no errs and just found the new one: " + JSON.stringify(new_unit) + ".  Will push " + transaction_id + " to its list of transactions: " + new_unit.transactions + " and save it.");
					new_unit.transactions.push(transaction_id);
					new_unit.save(function(err, other_save_result){
						if (err){
							console.log("Error saving new unit of updated transaction" + err);
						} else {
							console.log("returning new unit id: " + new_unit._id);
							callback({new_id: new_unit._id});
						}
					})			
				}
			})
		}
	})
}
var finish_update = function(id_status, transaction_update_request, callback){  // id_status should be {updated_id: <new unit ID>} or {updated_id: false}
	var prepped_updated_transaction = {
		amount: transaction_update_request.amount * 100, 
		type: transaction_update_request.type, 
		notes: transaction_update_request.notes, 
		date: transaction_update_request.date, 
		check_number: transaction_update_request.check_number
	};
	if (id_status.updated_id){
		prepped_updated_transaction['_unit'] = id_status.updated_id;  // if unit is not updated, no need to include it in prepped_update.
	}
	Transaction.findOneAndUpdate({_id: transaction_update_request._id}, {$set: prepped_updated_transaction}, {new: true})
		.populate('_unit', 'number')
		.exec(function(err, result){
			if (err){
				console.log("Error in transactions controller update method during final transaction save: " + err);
				callback({error: "Error updating transaction: " + err});
			} else {		
				//console.log("Transaction update complete: " + JSON.stringify(result));
				callback({result: result});
			}
	})
}
module.exports = {
	index: function(req,res){
		Transaction.find({})
			.populate('_unit', 'number')
			.exec(function(err, this_index){
			if (err){
				res.json({error: "Error while retrieving transaction index: " + err});
			} else {
				//console.log("Server transactions controller is returning transaction index: " + JSON.stringify(this_index));
				res.json({index: this_index});
			}
		})
	},
	updateOne: function(req,res){
		var this_id = req.params._id;
		//console.log("Received this for updating: " + JSON.stringify(req.body.updated_transaction));
		Unit.findOne({_id: req.body.updated_transaction._unit._id}, function(err, old_unit){
			if (err){
				console.log("Error during transaction update");
				res.json({error: " Error finding old unit during transaction update: " + err});
			} else {
				//console.log("Found old unit");
				if (old_unit.number != req.body.updated_transaction._unit.number){ // checks whether unit ID is still in sync with unit number.  If it isn't, then method knows that transaction unit has been updated
					change_unit(req.body.updated_transaction._id, old_unit, req.body.updated_transaction._unit.number, function(unit_change_result){
						if (unit_change_result.error){
							res.json(unit_change_result);
						} else {
							finish_update({updated_id: unit_change_result.new_id}, req.body.updated_transaction, function(result){
								//console.log("Update complete on server side, in changed-unit subroute.  Returning this to factory: " + JSON.stringify(result));
								res.json(result);
							})
						}
					});
				} else {
					finish_update({updated_id: false}, req.body.updated_transaction, function(result){
						//console.log("Update complete on server side, in fixed-unit subroute.  Returning this to factory: " + JSON.stringify(result));
						res.json(result);
					})
				}	
			}
		})
	},
	deleteOne: function(req,res){
		Transaction.findOne({_id: req.params._id}, function(err, bad_transaction){
			if (err){
				//console.log("Error in transactions controller finding transaction to delete: " + err);
				res.json({error: "Error deleting transaction: " + err});
			} else {
				Unit.findOne({_id: bad_transaction._unit}, function(err, this_unit){
					if (this_unit.transactions.indexOf(req.params._id) === -1){
						//console.log("Failed to find id to delete in Unit's transaction list.  Will save unit unchanged and delete transaction's own entry");
						var deleted_id = [req.params._id];
					} else {
						var deleted_id = this_unit.transactions.splice(this_unit.transactions.indexOf(req.params._id), 1);
						//console.log("deleted_id: " + deleted_id);
					}
					this_unit.save(function(err, save_result){
						if (err || deleted_id.length != 1){
							//console.log("Error in transactions controller deleteOne method updating relevant unit.  Popped element(s): " + deleted_id + ", error: " + err);
							res.json({error: "Error saving unit after removing bad transaction: " + err});
						} else {
							//console.log("Removed " + deleted_id + " from its unit's transaction list if it was there.  About to delete transaction's own db entry: " + JSON.stringify(save_result));
							Transaction.remove({_id: deleted_id[0]}, function(err, result){ //the splice should return a single-eleemnt array
								if (err){
									//console.log("Error in transactions controller deleting single transaction: " + err);
									res.json({error: "Error deleting transaction: " + err});
								} else {
									//console.log("Transaction deleteOne method completed deleting id " + deleted_id[0] + " without throwing an error: " + result);
									res.json({result: result});
								}
							})
						}
					})
				})
			}			
		})
	},
	deleteMany: function(req,res){ //works!!!!
		var error = false;

		Transaction.remove({}, function(err, result){
			if (err){
				res.json({error: "Error deleting transactions: " + err});
				//console.log("Error attempting to clear transactions: " + err);
			} else {
				//console.log("Successfully deleted transactions: " + JSON.stringify(result));
			}
		})	
		Unit.find({}, {number: 1}, function(err, these_units){
			if (err){
				res.json({error: "Error getting unit list: " + err});
				//console.log("Error retrieving unit list: " + err);
			} else {
				//console.log("these_units: " + JSON.stringify(these_units));
				var this_index = function(){
					var start_index = -1;
					var bump = function(bump_or_tell){
						if (bump_or_tell == "bump"){
							return(start_index += 1);
						} else if (bump_or_tell == "tell"){
							return (start_index);
						}
					}
					return bump;
				}();
				for (i=0; i<these_units.length; i++){						// I could have probably just done something like Unit.update({}, {$set: {transactions: []}})
					//console.log("about to delete transactions from unit index" + (this_index("tell") +1));
					Unit.findOne({number: these_units[this_index("bump")].number}, function(err, this_unit){
						if (err){
							//console.log("Error deleting a unit's transactions: " + err);
						} else {
							//console.log("transactions for unit " +  this_unit.number + ": " + this_unit.transactions.length);
							this_unit.transactions = [];
							this_unit.save(function(err, saved_unit){
								if (err){
									//console.log("error saving updated unit: " + err);
								} else {
									//console.log("Updated unit " + saved_unit.number + ", transactions: " + saved_unit.transactions.length);
								}
							})
						}
					})
				}
				res.json({result: "See console for results"});
			}
		})
	},
	createOne: function(req,res){
		//console.log("Transactions controller received new transaction request: " + JSON.stringify(req.body.new_transaction));
		Unit.findOne({number: req.body.new_transaction._unit}, function(err, this_unit){
			nascent_transaction = req.body.new_transaction;
			nascent_transaction._unit = this_unit._id; // req.body supplied _unit as a number, this replaces it with the appropriate ObjectId
			this_transaction = new Transaction(nascent_transaction);
			this_transaction.save(function(err){
				if (err){
					//console.log("Error saving new transaction: " + err);
					res.json({error: "Error Saving new transaction: " + err});
				} else {
					this_unit.transactions.push(this_transaction);
					this_unit.save(function(err, updated_unit){
						if (err) {
							//console.log("Error updating unit after transaction saved: " + err);
							res.json({error: "Error updating unit after transaction saved: " + err});
						} else {
							//console.log("Transaction creation successful: " + updated_unit + ", " + JSON.stringify(this_transaction));
							this_transaction._unit = updated_unit.number;
							res.json({saved_transaction: this_transaction});
						}
					})
				}
			})
		})	
	},
	createMany: function(req,res){
		Unit.findOne({number: req.body.credit_row[0]},  function(err, this_unit){
			if (err){
				res.json({error: "Error finding a transaction's unit during createmany transactions: " + err});
			} else {
				//console.log("In first callback while working on unit " + this_unit.number + "'s transactions");
				for(col=1; col<req.body.credit_row.length; col++){
					if (req.body.credit_row[col]._unit != String(this_unit.number)){
						//console.log("Error while editing pre-creation transaction list: I'm replacing _units with the wrong unit #: " + req.body.credit_row[col]._unit + " and " + String(this_unit.number));
						//console.log("I was on column " + col + " which is " + JSON.stringify(req.body.credit_row[col]));
						//console.log("First ten entries in row I'm using: " + JSON.stringify(req.body.credit_row.slice(0,10)));
					}
					req.body.credit_row[col]._unit = this_unit._id;
				}
				//console.log("Fully prepped row: " + JSON.stringify(req.body.credit_row));
				Transaction.create(req.body.credit_row.slice(1), function(err, result){  //mongoose can save a whole row of transactions at once.
					if (err){
						//console.log("Error saving list of transactions: " + err);
					} else {
						//console.log("Successfully saved list of transactions: " + JSON.stringify(result));
						this_unit.transactions = this_unit.transactions.concat(result);
						this_unit.save(function(err, updated_unit){
							if (err){
								//console.log("Error saving unit after updating transaction list");
							} else {
								//console.log("Successfully updated unit " + updated_unit.number + ". It is now length " + updated_unit.transactions.length);
							}
						})
					}
				})
				res.json({result: "ok"});
			}
		})
	}
}

					/*

		var transaction_count = 0;
		var row_index = function(){
			var start_index = 0;
			var bump = function(bump_or_tell){
				if (bump_or_tell == "bump"){
					return(start_index += 1);
				} else if (bump_or_tell == "tell"){
					return (start_index);
				}
			}
			return bump;
		}();
		for (row=1; row<req.body.credit_chart.length; row++){
			var this_row = req.body.credit_chart[row_index("tell") + 1];
			transaction_count += this_row.length;
			
		}
		res.json({result: "Queued " + transaction_count + " new transactions."});
	}
}
						console.log("bumping column to " + col_index("bump"));
						var this_amount = req.body.credit_chart[row_index("tell")][col_index("tell")];
						if (this_amount > 0){
							this_transaction = new Transaction({_unit: this_unit._id, type: "Dues", date: req.body.credit_chart[0][col_index("tell")], amount: this_amount});
							this_transaction.save(function(err, saved_transaction){
								if (err){
									console.log("Error saving new transaction: " + err);
								} else {
									console.log("transaction saved: " + JSON.stringify(saved_transaction));
									Unit.findOneAndUpdate({_id: saved_transaction._unit}, {$push: {transactions: saved_transaction._id}}, function(err, result){
										if (err){
											console.log("Error appending transaction to unit: " + err);
										} else {
											console.log("Appended transaction to unit " + result.number + ". Its transactions are now length " + result.transactions.length);
										}
									})
								}
							})
						} else {
							console.log("Skipping zero-amount transaction at " + row_index("tell") + ", " + col_index("tell"));
						}
					}
				}
			})
		}
		res.json({result: "Hopefully ok"});
	}
}
		var create_transaction = function(credit_chart, row, column){	
			var this_row = row;				// my first attempt at a closure
			var this_column = column;
			var this_closure = function(){
				var this_amount = credit_chart[this_row][this_column];
				console.log("Starting closure function at row " + this_row + " & column " + this_column);
				if (this_amount > 0){
					
							this_transaction = new Transaction({_unit: this_unit._id, type: "Dues", date: date_list[this_column], amount: this_amount});
							this_transaction.save(function(err, saved_transaction){
								if (err){
									res.json({error: "Error saving new transaction: " + err});
								} else {
									console.log("transaction saved: " + JSON.stringify(result));
									return ({saved: true, unit_id: this_unit._id, transaction_id: saved_transaction._id});
								}
							})
						}
					})
				} else {
					console.log("Skipping zero-amount payment slot at " + this_row + ", " + this_column + " while executing createMany");
					return({saved: false})
				}
			}
			return this_closure;
		}
		var update_unit_of_transaction = function(unit_id, transaction_id_list){
			Unit.update({})
		}
		for (i=1; i<req.body.credit_chart.length;i++){
			var chart_row = chart_parameters(i);
			chart_row = chart_row();
			
			
					for(x=1;x<req.body.credit_chart[chart_row].length; x++){
						var chart_column = chart_parameters(x);
						chart_column = chart_column();
						console.log("chart_column created: " + chart_column);
						var this_amount = req.body.
						if (this_amount > 0){
							
							//console.log("transaction that I want to save: " + JSON.stringify(this_transaction));
							
									
									if (!this_unit.transactions){
										this_unit.transactions = [];
									}
									//console.log(JSON.stringify(this_unit));
									this_unit['transactions'].push(result._id);
									this_unit.save(function(err, saved_unit){
										if (err){
											res.json({error: "Error saving unit after adding transaction: " + err});
										} else {
											console.log("Updated unit " + saved_unit.number + " using parameters " + chart_row + " and " + chart_column + ".  It now has " + saved_unit.transactions.length + " transactions.  The first four sum to " + (
												Number(saved_unit.transactions[0].amount) + Number(saved_unit.transactions[1].amount) + Number(saved_unit.transactions[2].amount) + Number(saved_unit.transactions[3].amount)));
										}
									})
								}
							})
						} else {
							console.log("Skipping zero-amount payment slot while executing createMany");
						}
					}
				}
			})
		}
	}
}
*/