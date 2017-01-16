var mongoose = require("mongoose");
var path = require("path");
var fs = require("fs");
mongoose.connect('mongodb://dev_wilana_calc_3:17-wilana_calc_3-32@localhost/wilana_calc_three');
var models_path = path.join(__dirname, './../models');
fs.readdirSync(models_path).forEach(function(file){
	if (file.indexOf('.js') >= 0) {
		require(models_path + '/' + file);
	}
});
