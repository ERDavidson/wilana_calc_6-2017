var mongoose = require("mongoose");
var path = require("path");
var fs = require("fs");
mongoose.connect('localhost/wilana_calc_6-2017'); //not currently active - connection is established in server.js
var models_path = path.join(__dirname, './../models');
fs.readdirSync(models_path).forEach(function(file){
	if (file.indexOf('.js') >= 0) {
		require(models_path + '/' + file);
	}
});
