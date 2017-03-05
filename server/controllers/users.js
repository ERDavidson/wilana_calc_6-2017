var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var User = mongoose.model('User');
module.exports = {
	index: function(req,res){
		User.find({}, {_id: 1, unit: 1, email: 1, dues_reminder: 1}, function(err, user_list){
			if (err){
				res.json({error: "Error in server controller user index method"});
			} else {
				res.json({users: user_list});
			}
		})
	},
	register: function(req,res){	//currently still relies on unit as the main username.  will want to switch to email once better authentication is in place.
		if (req.body.pw != req.body.pw_confirm){
			res.json({error: "Password and confirmation fields must match."});
		} else {
			User.findOne({unit: req.body.unit}, function(err, redundant_user){
				if(err){
					res.json({error: "Error checking for existing user: " + err});
				} else if (redundant_user != null){
					res.json({error: "Unit " + req.body.unit + " is already registered."});
				} else {
					var hash = bcrypt.hashSync(req.body.pw, 11);
					var this_user = new User({email: req.body.email, unit: req.body.unit, pw_hash: hash, online: false}); // hashing needs implementation
					this_user.save(function(err, new_user){
						if (err){
							res.json({error: "Error saving new user."});
						} else {
							res.json(new_user);
						}
					})
				}
			})
		}
	},
	login: function(req,res){
		console.log("in user controller login server function");
		if (!req.body.unit || !req.body.pw){
			res.json({error: "Please provide a unit number and password."});
		} else {
			//console.log("About to start validating login credentials.");
			User.findOne({unit: req.body.unit}, function(err, this_user){
				if(err){	
					res.json({error: "Error retrieving user: " + err});
				} else if (!bcrypt.compareSync(req.body.pw, this_user.pw_hash)){
					res.json({error: "Unit number or password is incorrect.  Unit: " + req.body.unit});
				} else {
					this_user.online = true;  // this property change & resave is unnecessary and should be removed.
					this_user.save(function(err, online_user){
						if(err){	
							res.json({error: "Error flagging user as online: " + err});
						} else {
							if (online_user.unit === "Admin"){
								//console.log("Hello Admin");
								res.json({admin: true, logged_in: true, unit: online_user.unit, dues_reminder: online_user.dues_reminder, email: online_user.email});
							} else {
								res.json({admin: false, logged_in: true, unit: online_user.unit, dues_reminder: online_user.dues_reminder, email: online_user.email});
							}
						}
					})
				}
			})
		}
	},
	update: function(req,res){
		if (req.body.updated_user.pw_hash){
			if (req.body.updated_user.pw_hash === req.body.updated_user.pw_confirm){
				var hash = bcrypt.hashSync(req.body.updated_user.pw_hash, 11);
				//console.log("Hash: " + hash);
				req.body.updated_user.pw_hash = hash;
				delete req.body.updated_user.pw_confirm;
			} else {
				res.json({error: "Password and Password Confirmation must match."})
				delete req.body.updated_user;
			}
		}
		if (req.body.updated_user){
			console.log("Updating with this information: " + JSON.stringify(req.body.updated_user));
			User.findOneAndUpdate({unit: req.params.unit_number}, {$set: req.body.updated_user}, {new: true}, function(err, updated_user){
				if (err){
					res.json({error: "Error updating user: " + err});
				} else {
					console.log("User successfully updated: " + JSON.stringify(updated_user));
					res.json({result: "User successfully updated.", updated_user: updated_user});
				}
			})	
		}
	},
	logout: function(req,res){
		User.findOneAndUpdate({unit: req.body.unit}, {online: false}, function(err, this_user){
			if (err){
				res.json({error: "Error attempting to log out: " + err});
			} else {
				console.log("this_user: " + JSON.stringify(this_user) + " logged out");
				res.json({logged_out: true, unit: req.body.unit});
			}
		})
	}
}