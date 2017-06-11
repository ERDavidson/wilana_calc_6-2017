var mongoose = require('mongoose');
var Dues_Matrix = mongoose.model('Dues_Matrix');
module.exports = {
	index: function(req,res){
		Dues_Matrix.findOne({}, function(err, these_dues){
			if(err){
				res.json({error: "Error retrieving dues matrix: " + err});
			} else {
				//console.log("months: " + req.body.months);
				//console.log("raw db dues matrix: " + JSON.stringify(these_dues));
				for (unit=0; unit<these_dues.rates.length; unit++){ //iterate through each unit
					if (these_dues.rates[unit] === null){
						these_dues.rates[unit] = [];
					}
					var current_rate = these_dues.rates[unit][0];
					for (month=0; month<req.body.months; month++){ // iterate through each month.  Currently configured to go from origin date through however many are specified in req.body
						if (these_dues.rates[unit][month] != null){  
							current_rate = these_dues.rates[unit][month];  //If there's a dues update, set current rate to new value.
						} 
						these_dues.rates[unit][month] = current_rate;  //and add a cell with the current rate.
					}
				}
				res.json({rates: these_dues.rates});
			}
		})
	},
	update: function(req,res){ // input params unit_number contains unit number, body will be an object: {month: <target list date (secondary) index, as integer>, dues: <dollar amount, as integer>}
		Dues_Matrix.findOne({}, function(err, these_dues){
			if (err){
				console.log("Error retrieving dues matrix for update formatting.");
			} else {
				if (these_dues === null){
					initial_matrix = new Dues_Matrix({rates: []});
					initial_matrix.save(function(err, fresh_matrix){
						if (err){
							console.log("Attempted to create blank dues matrix failed.");
						} else {
							console.log("Blank dues matrix created.");
							res.json({rates: []});
						}
					})
				} else {
					console.log(JSON.stringify(req.body));
					if (!these_dues.rates[req.params.unit_number]){
						these_dues.rates[req.params.unit_number] = [];
					}
					var null_months = req.body.month - these_dues.rates[req.params.unit_number].length;
					if (null_months < 0){
						console.log("Editing of past dues values is not yet supported.");
					} else {
						var append_array = [];
						append_array[null_months] = Number(req.body.dues);
						console.log("Ready to append " + append_array + " to unit " + req.params.unit_number + ".");
						var update_position = {"$push": {}};  //sets up dot notation with variable index
						update_position["$push"]["rates." + req.params.unit_number] = {$each: append_array};
						console.log(JSON.stringify(update_position));
						Dues_Matrix.findOneAndUpdate({}, update_position, function(err, old_matrix){
							if (err){
								console.log("Error updating dues matrix.");
							} else {
								console.log("Matrix updated without crashing.");
							}
						}) // how to manage req.params.unit_number
					}
				}
			}
			res.json({result: "Server controller update method finished."});
		})			
	},
	trim_matrix: function(req,res){
		//console.log("In Trim_matrix server method");
		Dues_Matrix.findOne({}, function(err, these_dues){  //retrieves & returns the section of the dues matrix corresponding to a specified unit & time span.
			if(err){										//since months are stored as # months-from-origin, a specific month is also an origin-to-date time span.
				res.json({error: "Error retrieving dues matrix: " + err});
			} else {
				if (these_dues === null){
					initial_matrix = new Dues_Matrix({rates: []});
					initial_matrix.save(function(err, fresh_matrix){
						if (err){
							console.log("Attempted to create blank dues matrix failed.");
						} else {
							console.log("Blank dues matrix created.");
							res.json({rates: []});
						}
					})
				} else {
					if (these_dues.rates.length < (req.body.unit =1)){
						console.log("Dues requested for unit that does not exist.");
						res.json({dues_list: [], unit: req.body.unit});
					} else {
						var response_list = [];
						for (i=0; i<req.body.months; i++){ //it's easier to fill in null values while trimming list length instead of just trimming now and dealing with nulls later.;''
							if (these_dues.rates[req.body.unit][i]){  //iterating through months 0 through x-1, if the dues chart offers a new dues rate...
								response_list[i] = these_dues.rates[req.body.unit][i];
							} else if (i===0){
								//console.log("Error: Could not find initial dues rate for unit " + req.body.unit + ". Unit dues sequence used: " + these_dues.rates[req.body.unit]);
							} else {
								response_list[i] = response_list[i-1];
							}
						}
						//console.log("dues list: " + response_list);
						res.json({dues_list: response_list, unit: req.body.unit});
					}
				}
			}
		})
	}
}