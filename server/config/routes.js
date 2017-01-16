var dues_matrixes = require('./../controllers/dues_matrixes.js');
var units = require('./../controllers/units.js');
var transactions = require('./../controllers/transactions.js');
var users = require('./../controllers/users.js');
var mortgages = require('./../controllers/mortgages.js');
var property_taxes = require('./../controllers/property_taxes.js');
var budget_lines = require('./../controllers/budget_lines.js');
module.exports = function(app){
	app.post('/users/register', function(req,res){
		users.register(req,res);
	});
	app.post('/users/login', function(req,res){
		users.login(req,res);
	});
	app.post('/users/logout', function(req,res){
		users.logout(req,res);
	});
	app.post('/dues_matrixes', function(req,res){
		dues_matrixes.index(req,res);
	});
	app.post('/trim_matrix', function(req,res){
		dues_matrixes.trim_matrix(req,res);
	});
	app.get('/unit_numbers_index', function(req,res){
		units.unit_numbers_index(req,res);
	});
	app.get('/mortgages', function(req,res){
		mortgages.index(req,res);
	});
	app.use(function(req,res,next){
		//console.log("Authentication middleware activated");
		next();
	});
	app.post('/users/:unit_number/update', function(req,res){
		users.update(req,res);
	});
	app.post('/budget_lines/create', function(req,res){
		budget_lines.create(req,res);
	});
	app.post('/budget_lines', function(req,res){
		budget_lines.index(req,res);
	});
	app.post('/users', function(req,res){
		users.index(req,res);
	});
	app.post('/units/:id/update', function(req,res){
		units.update(req,res);
	});
	app.post('/units/:number', function(req,res){
		units.show(req,res);
	});
	app.post('/units', function(req,res){
		units.index(req,res);
	});
	app.post('/units/create', function(req,res){
		units.create(req,res);
	});
	app.post('/transactions/createOne', function(req,res){
		transactions.createOne(req,res);
	});
	app.post('/transactions/createMany', function(req,res){
		transactions.createMany(req,res);
	});
	app.post('/transactions/:_id/update', function(req,res){
		transactions.updateOne(req,res);
	});
	app.post('/transactions/:_id/delete', function(req,res){
		transactions.deleteOne(req,res);
	});
	//app.post('/transactions/deleteMany', function(req,res){
	//	transactions.deleteMany(req,res);
	//});
	app.post('/transactions', function(req,res){
		transactions.index(req,res);
	});
	app.post('/mortgages/create', function(req,res){
		mortgages.create(req,res);
	});
	app.post('/property_taxes/:id/delete', function(req,res){
		property_taxes.delete(req,res);
	});
	app.post('/property_taxes/create', function(req,res){
		property_taxes.create(req,res);
	});
	app.post('/property_taxes', function(req,res){
		property_taxes.index(req,res);
	});	
};