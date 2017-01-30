var mongoose = require('mongoose');
var BalanceHistory = mongoose.model('BalanceHistory');
module.exports = {
	index: function(req,res){
		BalanceHistory.find({}, function(err, these_balances){
			if (err){
				res.json({error: "Error retrieving balance history index " + err});
			} else {
				res.json({history_index: these_balances});	
			}
		})
	},
	create: function(req,res){
		var new_history = new BalanceHistory({
			account_name: req.body.account_name,
			dates: req.body.dates,
			values: req.body.values
		});
		console.log("Attempting to save new balance history of length " + new_history.length);
		new_history.save(function(err, created_history){
			if (err){
				console.log("Error creating new balance history: " + JSON.stringify(err));
				res.json({error: "Error creating new balance history: " + err});
			} else {
				console.log("Saved new balance history: " + JSON.stringify(created_history));
				res.json({created_history: created_history});
			}
		})
	}
	
	/*,
make_daily: function(req,res){
		//console.log("req.body in new_history controller");
		//console.log(JSON.stringify(req.body));	make_daily: function(req,res){
		BalanceHistory.findOne({account_name: "Wilana Blanket Mortgage"}, function(err, these_balances){
			if (err){
				console.log("Error converting histories to daily values");
			} else {
				console.log("retrieved histories to fix");
				if (these_balances.values.length < 2000){
					these_balances.dates[0] = new Date("12/31/2006"); // some of them have transactions on 1/1/07 that I don't want collapsed into initial value.
					for (y=1;y<these_balances.dates.length;y++){
						var this_date = new Date(these_balances.dates[y]);
						console.log("Created " + this_date + " as a copy (not reference) of " + these_balances.dates[y] + " using y of " + y);
						var this_value = these_balances.values[y];
						var last_date = new Date(these_balances.dates[y-1]);
						console.log("Just made last_date the same way: " + last_date);
						var last_value = these_balances.values[y-1];
						if (this_date.toLocaleDateString() === last_date.toLocaleDateString()){					// if a date is repeated
							console.log("I decided " + this_date + " and " + last_date + " are the same");
							console.log("So I removed " + these_balances.dates.splice(y-1, 1) + " from these_balances");		// only keep the last one.  Be careful of index shift though
							console.log("Same for " + these_balances.values.splice(y-1, 1));
							y--;
							console.log("And reduced y to " + y + "before it gets bumped too high");
						} else {
							console.log("in else clause, about to increment last_date from " + last_date);
							if (last_date.setDate(last_date.getDate() + 1) < this_date){	// remember that last_date is now +1
								console.log(" tp " + last_date+ " and decided that " + last_date + " is less than " + this_date);
								console.log("so i'm about to splice in " + last_date + " at position " + y + ".  Starting dates length: " + these_balances.dates.length);
								these_balances.dates.splice(y, 0, last_date);
								these_balances.values.splice(y, 0, last_value);  // but do NOT put an extra y++, since you want to use this new insertion in next comparison
								console.log("and ending dates length: " +  these_balances.dates.length);
							} else {
								console.log("Decided that " + last_date + " was not less than " + this_date);
							}
						}
					}
					these_fixed_histories = new BalanceHistory({
						account_name: ("Final " + these_balances.account_name),
						dates: these_balances.dates,
						values: these_balances.values
					});
				}
				console.log("finished one");
				these_fixed_histories.save(function(err, result){
					if (err){
						console.log("Error saving fixed history 0: " + err);
					} else {
						console.log("Successful fixed history 0: " + JSON.stringify(result));
					}
				})
			}
		})
	}
		
*/
};