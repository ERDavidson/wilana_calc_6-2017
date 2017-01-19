var mongoose = require('mongoose');
var Message = mongoose.model('Message');
module.exports = {
	index: function(req,res){
		Message.find({}, function(err, these_messages){
			if (err){
				res.json({error: "Error retrieving message index: " + err});
			} else {
				res.json({feedback_index: these_messages});	
			}
		})
	},
	create: function(req,res){
		console.log("received feedback: " + JSON.stringify(req.body.new_message));
		var new_message = new Message({
			author: req.body.new_message.author,
			unit: req.body.new_message.unit,
			date: req.body.new_message.date,
			email: req.body.new_message.email,
			title: req.body.new_message.title,
			text: req.body.new_message.text,
		});
		new_message.save(function(err, created_message){
			if (err){
				res.json({error: "Error creating new message: " + err});
			} else {
				console.log("Save result: " + JSON.stringify(created_message));
				res.json({submitted_feedback: created_message});
			}
		})
	},
	delete: function(req,res){
		console.log("In message delete method deleting " + req.params.id);
		Message.findOneAndRemove({_id: req.params.id}, function(err, deletion_result){
			if (err){
				res.json({error: "Error deleting feedback"});
			} else {
				console.log("Feedback deleted: " + JSON.stringify(deletion_result));
				res.json({deletion_result: deletion_result});
			}
		})
	}
};