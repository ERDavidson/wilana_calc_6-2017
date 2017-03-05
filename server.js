var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
require('./server/config/mongoose.js');
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

var routes = require('./server/config/routes.js');
var app = express();

//require('./server/config/routes.js')(app);

app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
app.use(session({
	secret: "deep kitty",
	store: new MongoStore({url: 'mongodb://dev_wilana_calc_3:17-wilana_calc_3-32@localhost/wilana_calc_three'})
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '/client')));

app.use('/', routes);

var users = require('./server/controllers/users.js');
passport.use(new LocalStrategy(
	{
		usernameField: 'unit',
		passwordField: 'pw'
	},
	function(username, password, done){
		console.log("in SERVERJS localstrategy function");
		users.login(req,res);
		/*User.findOne({unit: username}, function(err, this_user){
			if(err){ 
				console.log("Error finding user: " + err);
				return done({error: "Error retrieving user: " + err});
			} else if(!this_user){ 
				console.log("!this_user");
				return done(null, false); 
			} else if(!bcrypt.compareSync(password, this_user.pw_hash)){ 
				console.log("error: Unit number or password is incorrect.  Unit: " + username);
				return done(null, false);
			} else {
				console.log("in final else of serverjs authentication method");
				return done(null, user); // this will return admin status as part of user, I think.  But will want to manage before return to factory.
			}
		});*/

	}
));
passport.serializeUser(function(user, done){                   
	done(null, user._id);
});
passport.deserializeUser(function(id, done){
	User.findById(_id, function(err, user){
		done(err, user);
	});
});


app.listen(8000, function(){
	console.log('Ready to greet visitors at localhost 8000.');
});
 