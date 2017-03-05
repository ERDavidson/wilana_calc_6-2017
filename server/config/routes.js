var dues_matrixes = require('./../controllers/dues_matrixes.js');
var units = require('./../controllers/units.js');
var transactions = require('./../controllers/transactions.js');
var users = require('./../controllers/users.js');
var messages = require('./../controllers/messages.js');
var mortgages = require('./../controllers/mortgages.js');
var property_taxes = require('./../controllers/property_taxes.js');
var budget_lines = require('./../controllers/budget_lines.js');
var balance_histories = require('./../controllers/balance_histories.js');

var express = require('express');
var passport = require('passport');
var router = express.Router();

//module.exports = function(app){ // was function(app)

router.post('/users/register', function(req,res){
	users.register(req,res);
});
router.get('/feedback', function(req,res){
	messages.index(req,res);
});
router.post('/users/login', function(req,res){
	console.log("in users/login route, about to authenticat with passport");
	//console.log(req);
	//console.log(res);
	//passport.authenticate('local', function(err, user, info){ 
	//	console.log("err, user, info: " + err + ", | " + user + ", | " + info);
	//	if (err){ console.log("Error in passport authentication: " + err); }
	//	else if (!user){ console.log("Passport authentication failed to find user"); }
	//	else {
	//		console.log("passport authentication reached users.login call without encountering errors.  Info: " + info);
			users.login(req,res);
	//	}
    //});
});
router.post('/users/logout', function(req,res){
	users.logout(req,res);
});
router.post('/dues_matrixes', function(req,res){
	dues_matrixes.index(req,res);
});
router.post('/trim_matrix', function(req,res){
	dues_matrixes.trim_matrix(req,res);
});
router.get('/unit_numbers_index', function(req,res){
	units.unit_numbers_index(req,res);
});
router.get('/mortgages', function(req,res){
	mortgages.index(req,res);
});
router.use(function(req,res,next){
	//console.log("Authentication middleware activated");
	//console.log(req);
	next();
});
router.post('/balance_histories/create', function(req,res){
	balance_histories.create(req,res);
});
router.post('/balance_histories', function(req,res){
	balance_histories.index(req,res);
});
router.post('/users/:unit_number/update', function(req,res){
	users.update(req,res);
});
router.post('/budget_lines/create', function(req,res){
	budget_lines.create(req,res);
});
router.post('/budget_lines', function(req,res){
	budget_lines.index(req,res);
});
router.post('/users', function(req,res){
	users.index(req,res);
});
router.post('/units/:id/update', function(req,res){
	units.update(req,res);
});
router.post('/units/:number', function(req,res){
	units.show(req,res);
});
router.post('/units', function(req,res){
	units.index(req,res);
});
router.post('/units/create', function(req,res){
	units.create(req,res);
});
router.post('/feedback/create', function(req,res){
	messages.create(req,res);
});
router.post('/feedback/:id/delete', function(req,res){
	messages.delete(req,res);
});
router.post('/transactions/createOne', function(req,res){
	transactions.createOne(req,res);
});
router.post('/transactions/createMany', function(req,res){
	transactions.createMany(req,res);
});
router.post('/transactions/:_id/update', function(req,res){
	transactions.updateOne(req,res);
});
router.post('/transactions/:_id/delete', function(req,res){
	transactions.deleteOne(req,res);
});
//router.post('/transactions/deleteMany', function(req,res){
//	transactions.deleteMany(req,res);
//});
router.post('/transactions', function(req,res){
	transactions.index(req,res);
});
router.post('/mortgages/create', function(req,res){
	mortgages.create(req,res);
});
router.post('/property_taxes/:id/delete', function(req,res){
	property_taxes.delete(req,res);
});
router.post('/property_taxes/create', function(req,res){
	property_taxes.create(req,res);
});
router.post('/property_taxes', function(req,res){
	property_taxes.index(req,res);
});	

module.exports = router;