var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var app = express();

app.use(express.static(path.join(__dirname, '/client')));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

require('./server/config/mongoose.js');
require('./server/config/routes.js')(app);

app.listen(8000, function(){
	console.log('Ready to greet visitors at localhost 8000.');
});
