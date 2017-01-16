var mongoose = require('mongoose');
var Dues_Matrix = mongoose.model('Dues_Matrix');
module.exports = {
	index: function(req,res){
		Dues_Matrix.findOne({}, function(err, these_dues){
			if(err){
				res.json({error: "Error retrieving dues matrix: " + err});
			} else {
				//console.log("months: " + req.body.months);
				for (unit=0; unit<these_dues.rates.length; unit++){ //iterate through each unit
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
	trim_matrix: function(req,res){
		//console.log("Retrieving dues matrix for unit " + req.body.unit);
		Dues_Matrix.findOne({}, function(err, these_dues){  //retrieves & returns the section of the dues matrix corresponding to a specified unit & time span.
			if(err){										//since months are stored as # months-from-origin, a specific month is also an origin-to-date time span.
				res.json({error: "Error retrieving dues matrix: " + err});
			} else {
				var response_list = [];
				for (i=0; i<req.body.months; i++){ //it's easier to fill in null values while trimming list length instead of just trimming now and dealing with nulls later.
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
		})
	}
}