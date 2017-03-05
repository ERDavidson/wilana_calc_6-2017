var wc3_services = angular.module('wc3_services', []);
wc3_services.factory('userFactory', ['$http', '$rootScope', function($http, $rootScope){
	/******** 
	USERFACTORY DOCS
	userFactory is the closest thing to an app-wide scope this app has.  It is designed to be injected into most or all controllers, since it is the place login status is managed client-side, and virtually every controller will need to check that.  As a result, it also can't generally have things injected into it, since Angular does not like circular injections.
	Main functions:
		1)  Have a record of user login status & admin privileges visible everywhere, so that server calls can be limited to tasks that actually require secure environments or db access.
		2)  Preload, make visible, & keep current & sorted (on client side) a list of all users, to simplify synchrony management of tasks that reference user lists.
		3)  Login, logout, registration, pw changes.
		4)  Serve as the primary controller for the nav pane, which means being the keeper of system messages to the user.  It is the place all other methods send error & task-result notifications to.  It displays them in the message log, and deletes the log at user request.
		6)  Could also be a good place for things like redirecting to the login page if someone tries to access views while logged out, & other tasks that would otherwise require lots of repetetive code on every view.

	Minor functions:
		1) Currently hosts the trigger for double-checking mongodb inter-model reference integrity, though that could probably be moved.
		2) (vestigial) hosts trigger for logging out all users at once for debug utiltity.  I should delete this.
	*********/
	//console.log("loading userFactory");
	var factory = {};
	var this_seed = new Date();
	var these_milliseconds = this_seed.getTime();
	isaac.seed(these_milliseconds);
	var bcrypt = dcodeIO.bcrypt;
	bcrypt.setRandomFallback(isaac.prng);
	factory.message_log = [];
	factory.nav_topic = "";
	factory.current_user = false //in production, just use this for tasks that don't deal with secure information.
	factory.current_pw = "";
	factory.dues_reminder = "";
	factory.current_user_info = {dues_reminder: ""};
	factory.email = "";
	factory.logged_in = "";
	factory.admin = false;
	factory.user_index = [];
	factory.register = function(user_info, callback){			// register a new user.  If it works, update preloaded user list.  In any case, pass result on to controller.  For now I'm going to let controllers call userFactory.log where possible, so it takes no action for registration errors here.
		$http.post('/users/register', user_info).success(function(result){
			if (!result.error){
				factory.index(function(updated_user_list){
					if (updated_user_list.error){
						userFactory.log('error', "Error updating user list: " + updated_user_list.error);
					} else {			
						factory.user_index = updated_user_list.users;
					}
				})
			}
			callback(result);
		})
	}
	factory.login = function(credentials, callback){
		$http.post('/users/login', credentials).success(function(result){
			if (result.logged_in){
				factory.admin = result.admin;
				factory.logged_in = true;
				factory.email = result.email;
				factory.current_user = result.unit;
				factory.current_pw = credentials.pw;
				factory.nav_topic = "unit_accounts";
				factory.current_user_info.dues_reminder = result.dues_reminder;
			}
			callback(result);
		})
	}
	factory.login_psspt = function(credentials, callback){
		callback("Yet to be implemented");
	}
	factory.logout = function(unit, callback){
		$http.post('/users/logout', unit).success(function(result){
			if (result.logged_out === true){
				factory.current_user = false;
				factory.admin = false;
				factory.logged_in = false;
				factory.current_pw = "";
				$rootScope.$broadcast('logged_out');
				callback(result);
			}
		})
	}
	factory.googlelogintest = function(callback){
		$https.post('/accounts.google.com/o/oauth2/v2/auth?scope=email%20profile&redirect_uri=http%3A%2F%2Flocalhost:8000%2Floginresult&response_type=token&client_id=544028406258-p756lflvl7dqrap03ajh3kogfmc873pf.apps.googleusercontent.com').success(function(result){
			//console.log(JSON.stringify(result));
			callback(result);
		})
	}
	factory.update_user = function(updated_user, callback){
		if (!updated_user.unit){
			updated_user.unit = factory.current_user;
		}
		updated_user.online = true;
		var update_user_path = 'users/' + updated_user.unit + '/update';
		$http.post(update_user_path, {updated_user: updated_user}).success(function(result){
			if (result.result && updated_user.pw_hash){
				factory.current_pw = updated_user.pw_hash;
			}
			if (result.updated_user){
				factory.current_user_info.dues_reminder = result.updated_user.dues_reminder;
			}
			factory.index(function(updated_user_list){ factory.user_index = updated_user_list.users; });
			callback(result);
		})
	}
	factory.index = function(callback){
		$http.post('/users').success(function(data){
			data.users.sort(function(a,b){
				if (a.unit == "Admin"){
					return 1;
				} else if (b.unit == "Admin"){
					return -1;
				} else {
					return (Number(a.unit) - Number(b.unit));
				}
			})
			callback(data);
		})
	}
	factory.index(function(data){
		if (data.error){
			userFactory.log('error', "Error retrieving user list: " + data.error);
		} else {			
			factory.user_index = data.users;
		}
	})
//	factory.log = function(action, message){  // can take 3 styles & numbers of arguments.  To add a message: ('error' or 'message' (whichever is relevant), message text).  to clear: ('clear').  to just retrieve log: ().
//		if ((action === 'error' || action === 'message') && (typeof message === "string")){
//			factory.message_log.unshift({type: action, date: (new Date(Date.now()).toLocaleTimeString()), text: message});
//		} else if (action === 'clear'){
//			for (i=0; i<factory.message_log.length+1;i++){
//				factory.message_log.shift();
//			}
//		}
//		return factory.message_log;
//	}
	return factory;
}]);
wc3_services.factory('balanceHistoryFactory', ['$http', 'toolFactory', 'userFactory', function($http, toolFactory, userFactory){
	var factory = {};
	factory.index = function(callback){
		$http.post('/balance_histories').success(function(result){
			if (result.error){
				callback(result);
			} else {
				var desired_histories = {"Daily Wilana Reserve Fund": true, "Daily Wilana Checking": true, "Daily Wilana Blanket Mortgage": true};
				var these_histories = [];
				var balanceHistoryColors = toolFactory.make_rainbowSync({count: 3, groups: 0});
				var these_colors = {"Daily Wilana Reserve Fund": balanceHistoryColors.color_strings[0], "Daily Wilana Checking": balanceHistoryColors.color_strings[1], "Daily Wilana Blanket Mortgage": "#cc3060"};
				var net_balance = {"key": "Net Account Balance", "color": balanceHistoryColors.color_strings[2], "values": [], "yAxis": 1, "type": "line"};
				for (index=0;index<result.history_index.length;index++){					//iterate through each account returned by controller (there are a few versions - the three indicated above have identical daily resolutions).
					if (desired_histories[result.history_index[index].account_name]){		//if it's an account I want to display
						var this_account_name = result.history_index[index].account_name;
						var index_for_chart = {key: this_account_name, color: these_colors[this_account_name], values: [], yAxis: 1, type: "line"};	//set up a chart data series with name & color & a slot for data
						for (i=0;i<result.history_index[index].dates.length;i++){
							var this_date = new Date(result.history_index[index].dates[i]);
							var this_value = result.history_index[index].values[i];
							index_for_chart.values.push([this_date, this_value]);				//create a [date, value] pair for each day in the relevant time span
							if (!net_balance.values[(index_for_chart.values.length - 1)]){				//if a slot for this date does not yet exist on the net balance series, create it.
								net_balance.values[(index_for_chart.values.length - 1)] = [this_date, 0];			//and then update it with the latest balance value.
							}
							net_balance.values[(index_for_chart.values.length - 1)][1] += this_value;		//and then update it with the latest balance value.
						}
						these_histories.push(index_for_chart);
						//console.log("Added history " + index_for_chart.key + " of length " + index_for_chart.values.length);
					}
				}
				//console.log("About to push net balance series to factory output: ");
				//console.log(net_balance);
				these_histories.push(net_balance);
				for (history_index=0; history_index<these_histories.length; history_index++){
					var this_history = these_histories[history_index];
					for (datum_index in this_history.values){
						this_history.values[datum_index] = {"x": this_history.values[datum_index][0], "y": this_history.values[datum_index][1]};
					}
				}
				//console.log("factory returning histories:");
				//console.log(these_histories);
				callback({histories_for_chart: these_histories});
			}
		})
	}
	factory.create = function(new_history, callback){
		//console.log"new_history in factory:");
		//console.log(new_history);
		$http.post('/balance_histories/create', new_history).success(function(result){
			callback(result);
		})
	}
	return factory;
}]);
wc3_services.factory('expenseFactory', ['$http', 'propertyTaxFactory', 'mortgageFactory', 'toolFactory', 'transactionFactory', 'userFactory', function($http, propertyTaxFactory, mortgageFactory, toolFactory, transactionFactory, userFactory){
	var factory = {};
	factory.index = function(callback){
		$http.post('/budget_lines').success(function(new_index){
			//console.log("factory received new spending history index: " + JSON.stringify(new_index));
			var expenses_by_supercategory = {"Expense Totals": {}, "Taxes": {}, "Mortgage": {"Total": {}}, "Insurance": {}, "Utilities": {}, "Other Expenses": {"Total": {}}, "Maintenance": {"Total": {}}, "Income": {"Total": {}}};
			var supercategory_key = {"Sewer": "Utilities", "Gas": "Utilities", "Garbage": "Utilities", "Water": "Utilities", "Electricity": "Utilities", "Water Meter": "Utilities", "Property Tax": "Taxes", "Income Tax": "Taxes", "Sr Citizen Tax Refund": "Other Expenses", "Mortgage Principal": "Mortgage", "Mortgage Interest": "Mortgage", "Building Insurance": "Insurance", "Cleaning": "Other Expenses", "Building Supplies": "Other Expenses", "Garage Rent": "Other Expenses", "Tax Prep": "Other Expenses", "Legal Fees": "Other Expenses", "Fire Inspections": "Other Expenses", "Bank Charges": "Other Expenses", "Other Fees": "Other Expenses"};
			var add_to_total = function(category_values, supercategory){
				if ("Total" in expenses_by_supercategory[supercategory]){
					for (this_year in category_values){
						if (expenses_by_supercategory[supercategory].Total[this_year]){
							expenses_by_supercategory[supercategory].Total[this_year] += category_values[this_year];
							if (supercategory === "Income"){
								//console.log("Added to income totals: " + expenses_by_supercategory[supercategory].Total);
							}
						} else {
							expenses_by_supercategory[supercategory].Total[this_year] = category_values[this_year];
							if (supercategory === "Income"){
								//console.log("Initialized income totals: " + expenses_by_supercategory[supercategory].Total);
							}
						}
					}
				} else if (supercategory === "Expense Totals"){
					for (this_year in category_values){
						if (expenses_by_supercategory[supercategory][this_year]){
							expenses_by_supercategory[supercategory][this_year] += category_values[this_year];
						} else {
							expenses_by_supercategory[supercategory][this_year] = category_values[this_year];
						}
					}
				}
			}
			var expense_chart_data = [];
			var income_chart_data = [];
			var supercategory_colors = toolFactory.make_rainbowSync({count: 6, groups: 0});
			var additional_data = {"maintenance_subcategories": [], "utilities_subcategories": [], "other_expenses_subcategories": []};
			var maintenance_data = {"key": "Maintenance", "color": supercategory_colors.color_strings[0], "values": [[2007, 0], [2008, 0], [2009, 0], [2010, 0], [2011, 0], [2012, 0], [2013, 0], [2014, 0], [2015, 0], [2016, 0], [2017, 0]]};
			var utilities_data = {"key": "Utilities", "color": supercategory_colors.color_strings[1], "values": [[2007, 0], [2008, 0], [2009, 0], [2010, 0], [2011, 0], [2012, 0], [2013, 0], [2014, 0], [2015, 0], [2016, 0], [2017, 0]]};
			var other_expenses_data =  {"key": "Other Expenses", "color": supercategory_colors.color_strings[2], "values": [[2007, 0], [2008, 0], [2009, 0], [2010, 0], [2011, 0], [2012, 0], [2013, 0], [2014, 0], [2015, 0], [2016, 0], [2017, 0]]};
			var utilities_categories = ["Sewer", "Gas", "Garbage", "Water", "Electricity", "Water Meter"];
			var other_expenses_categories = ["Cleaning", "Building Supplies", "Garage Rent", "Tax Prep", "Legal Fees", "Fire Inspections", "Bank Charges", "Other Fees", "Sr Citizen Tax Refund"];
			var utilities_divert = false;
			var other_expenses_divert = false;
			var maintenance_categories = [];
			var maintenance_divert = false;
			var years_to_show =  [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017];
			//expense_chart_data[0] = {key: "Mortgage Total", values: []};  //really ugly, but budgeted value will be inserted later in this method and requires a known index to insert into.  And the rest of the mortgage data won't get inserted until it's in the controller.
			expense_chart_data[0] = propertyTaxFactory.brief_index.for_chart; // this must have a fixed index so that insertion of current budget value knows where to go later on - no, not any more, but can't hurt
			expense_chart_data[0].color = supercategory_colors.color_strings[3];
			//console.log("********expense_chart_data[0]*********");
			//console.log(expense_chart_data);
			expenses_by_supercategory.Taxes["Property Tax"] = propertyTaxFactory.brief_index.for_table;
			for (i=0;i<new_index.new_index.length;i++){
				var this_category = new_index.new_index[i];	
				//if (this_category.category.search("Budget") != -1){
				//	var budgeted_year = Object.keys(this_category.values)[0];
				//	var budgeted_value = this_category.values[budgeted_year];
				//	if ((this_category.category === "Property Tax Budget") && (expense_chart_data[0].values.indexOf([budgeted_year, budgeted_value]) === -1)){
				//		expenses_by_supercategory.Taxes["Property Tax"][budgeted_year] = budgeted_value;
				//		expense_chart_data[0].values.push([budgeted_year, budgeted_value]);  // prop tax indeex was the first thing added to this list 
				//		console.log("added 2017 budget to property taxes for chart");
				//	}
				//} else {
				var category_data = {"key": this_category.category, "values": []};
				/*if (category_data["key"] === "Income Tax"){
					category_data["color"] = "#111111";
				} else if (category_data["key"] === "Building Insurance"){
					category_data["color"] = "#4444bb";
				}*/
				if (this_category.values){				//this_category is the db index item.  category_data is the output under construction
					for  (index in years_to_show){
						if (this_category.values[years_to_show[index]]){
							if (this_category.is_maintenance){
								maintenance_categories.push(this_category.category);
								maintenance_data.values[index][1] += this_category.values[years_to_show[index]];
								maintenance_divert = true;
							} else if (utilities_categories.indexOf(this_category.category) != -1){
								utilities_data.values[index][1] += this_category.values[years_to_show[index]];
								utilities_divert = true;
							} else if (other_expenses_categories.indexOf(this_category.category) != -1){
								other_expenses_data.values[index][1] += this_category.values[years_to_show[index]];
								other_expenses_divert = true;
							}
							category_data.values.push([years_to_show[index], this_category.values[years_to_show[index]]]);
						} else {
							category_data.values.push([years_to_show[index], 0]);
						}
					}
					if (this_category.is_income === true){
						income_chart_data.push(category_data);
					} else {
						if (maintenance_divert){
							additional_data.maintenance_subcategories.push(category_data);
							maintenance_divert = false;
						} else if (utilities_divert){
							additional_data.utilities_subcategories.push(category_data);
							utilities_divert = false;
						} else if (other_expenses_divert){
							additional_data.other_expenses_subcategories.push(category_data);
							other_expenses_divert = false;
						} else {
							expense_chart_data.push(category_data);	//this is where income tax must get added.
							if (category_data.key === "Income Tax"){
								//console.log("spotted income tax");
								expense_chart_data[(expense_chart_data.length -1)].color= supercategory_colors.color_strings[4];
							} else if (category_data.key === "Building Insurance"){
								//console.log("spotted insurance");
								expense_chart_data[(expense_chart_data.length -1)].color= supercategory_colors.color_strings[5];
							}
						}
					}
				//}
				}
			}			
			var income_colors = toolFactory.make_rainbowSync({count: income_chart_data.length, groups: 0});
			for (y=0;y<income_colors.color_strings.length;y++){
				income_chart_data[y].color = income_colors.color_strings[y];
			}
			var category_colors = {};
			for(detail_category in additional_data){
				category_colors[detail_category] = toolFactory.make_rainbowSync({count: additional_data[detail_category].length, groups: 0});
				for(q in additional_data[detail_category]){
					additional_data[detail_category][q].color = category_colors[detail_category].color_strings[q];
				}
			}
			expense_chart_data.push(maintenance_data);
			expense_chart_data.push(utilities_data);
			expense_chart_data.push(other_expenses_data);
			//console.log("constructed expense_chart_data & income_chart_data whose rows look like: ");
			//console.dir(expense_chart_data);
			//var index_for_chart = {income_categories: {}, expense_categories: {}};
			for (i=0;i<new_index.new_index.length;i++){								
				var this_category = new_index.new_index[i];
				//console.log("this_category is " + JSON.stringify(this_category));
				if (this_category.is_income === true){
			//		index_for_chart.income_categories[this_category.category] = [];
					if (this_category.values){
			//			for (year in this_category.values){
			//				index_for_chart.income_categories[this_category.category].push({"year": year, "amount": this_category.values[year]});
			//			}
						//console.log(JSON.stringify(this_category) + " is being treated as income");
						expenses_by_supercategory.Income[this_category.category] = this_category.values;
						add_to_total(this_category.values, "Income");
					}
				} else {
			//		index_for_chart.expense_categories[this_category.category] = [];
					if (this_category.values){
			//			for (year in this_category.values){
			//				index_for_chart.expense_categories[this_category.category].push({"year": year, "amount": this_category.values[year]});
			//			}
						add_to_total(this_category.values, "Expense Totals");
						if (this_category.is_maintenance === true){
							expenses_by_supercategory.Maintenance[this_category.category] = this_category.values;
							add_to_total(this_category.values, "Maintenance");
						} else if (supercategory_key[this_category.category]){
							expenses_by_supercategory[supercategory_key[this_category.category]][this_category.category] = this_category.values;
							add_to_total(this_category.values, supercategory_key[this_category.category]);  
						}
					} else {
						if (this_category.values){
							expenses_by_supercategory.Other[this_category.category] = this_category.values;
						}
					}
				}
			}
			new_index.by_supercategory = expenses_by_supercategory;
			//new_index.index_for_chart = index_for_chart;
			new_index.expense_chart_data = expense_chart_data;
			new_index.income_chart_data = income_chart_data;
			new_index.expense_chart_detail = additional_data;
			//console.log("Index reformatted and being returned as new_index.by_supercategory: " + JSON.stringify(new_index.by_supercategory));
			//console.log("Returning new index_for_chart:" + JSON.stringify(new_index.index_for_chart));
			callback(new_index);
		})
	}
	factory.create_budget_line = function(this_new_line, callback){
		$http.post('/budget_lines/create', {new_category: this_new_line}).success(function(created_category){
			//console.log("factory received save budget category: " + created_category);
			factory.index(function(new_index){
				callback(new_index);
			})
		})
	}
	factory.get_recorded_incomes =  function(callback){
		$http.post('/transactions').success(function(result){
			var year_sums = {"2007": 0, "2008": 0, "2009": 0, "2010": 0, "2011": 0, "2012": 0, "2013": 0, "2014": 0, "2015": 0, "2016": 0};
			for (i=0;i<result.index.length;i++){
				if (result.index[i].type === "credit"){
					var this_date = new Date(result.index[i].date);
					var this_year = this_date.getFullYear();
					year_sums[this_year] += (result.index[i].amount / 100);
				}
			}
			callback({"incomes": year_sums});
		})
	}
	return factory;
}]);
wc3_services.factory('feedbackFactory', ['$http', 'userFactory', function($http, userFactory){
	var factory = {};
	factory.index = function(callback){
		$http.get('/feedback').success(function(feedback_index){
			callback(feedback_index);
		})
	}
	factory.create_feedback = function(new_message, callback){
		$http.post('/feedback/create', {new_message: new_message}).success(function(created_feedback){
			callback(created_feedback);
		})
	}
	factory.delete_feedback = function(old_id, callback){
		var delete_path = '/feedback/' + old_id + "/delete";
		$http.post(delete_path).success(function(deletion_result){
			callback(deletion_result);
		})
	}
	factory.check_mail = function(){
		factory.index(function(this_feedback){
			//console.log("in mail callback with " + this_feedback.feedback_index.length + "mails");
			if (this_feedback.feedback_index && this_feedback.feedback_index.length > 0){
				//console.log("calling to userfact.log");
				userFactory.log("message", "You've got user feedback!");
			}
		})
	}
	return factory;
}]);
wc3_services.factory('filterFactory', ['$rootScope', function($rootScope){
	var factory = {};
	var defaults = {unit: false, type: false, date: {greater_than: false, less_than: false}, amount: {greater_than: false, less_than: false}, check_no: "", string: ""};
	function TransactionFilterSet(){
		//console.log("creating a transactionfilterset");
		this.unit = false;
		this.type = false;
		this.date = {greater_than: false, less_than: false};
		this.amount = {greater_than: false, less_than: false};
		this.check_no = "";
		this.string = "";
		this.mirror = function(original_filter_set){
			for (key in original_filter_set){
				if (key === 'date' || key === 'amount'){
					this[key].greater_than = original_filter_set[key].greater_than;
					this[key].less_than = original_filter_set[key].less_than;
				} else if (key === "unit" || key === "type" ){
					this[key] = [];
					for (index in original_filter_set[key]){
						this[key][index] = original_filter_set[key][index];
					}
				} else {
					this[key] = original_filter_set[key];
				}
			}
		}
		this.activate = function(activation_target){ // this will by called by the proposed filter object targeting the active filter object
			//console.log("this: "+ JSON.stringify(this));
			for (key in this){
				if ((key === "unit") || (key === "type")){
					if (this[key] === []){
						delete activation_target[key];
					} else {
						activation_target[key] = this[key];
					}
				} else if ((key === "check_no") || (key === "string")){
					if (this[key] === ""){
						delete activation_target[key];
					} else {
						activation_target[key] = this[key];
					}
				} else if ((key === "date") || (key === "amount")){
					activation_target[key] = {};
					for (nested_key in this[key]){
						if (this[key][nested_key] != false){
							activation_target[key][nested_key] = this[key][nested_key];
						}
					}
				}
			}
		}
		this.restore = function(restore_target){ //and this is for when you return to this view from somewhere else
			//console.log("Restorer: " + JSON.stringify(this) + " and Restoree: " + JSON.stringify(restore_target));
			var defaults = {unit: false, type: false, date: {greater_than: false, less_than: false}, amount: {greater_than: false, less_than: false}, check_no: "", string: ""};
			for (key in defaults){
				if ((key === "unit") || (key === "type")){
					if (!this[key]){
						restore_target[key] = defaults[key];
					} else {
						restore_target[key] = this[key];
					}
				} else if ((key === "check_no") || (key === "string")){
					if (!this[key]){
						restore_target[key] = defaults[key];
					} else {
						restore_target[key] = this[key];
					}
				} else if ((key === "date") || (key === "amount")){
					restore_target[key] = {};
					for (nested_key in defaults[key]){
						if (!this[key][nested_key]){
							restore_target[key][nested_key] = defaults[key][nested_key];
						} else {
							restore_target[key][nested_key] = this[key][nested_key];
						}
					}
				}
			}
		}
	};
	factory.proposed_filters = new TransactionFilterSet();
	factory.saved_filters = new TransactionFilterSet();
	factory.placeholder_filters = new TransactionFilterSet(); //trying to get an object that will have the methods without triggering filter digest
	for (key in defaults){
		delete factory.placeholder_filters[key];
		factory.placeholder_filters.date = {};
		factory.placeholder_filters.amount = {};
	}
	var filters = {};
	var filter_types = {};
	return factory;
}]);
wc3_services.factory('matrixFactory', ['$http', 'unitFactory', 'userFactory', function($http, unitFactory, userFactory){
	/*********
	MATRIXFACTORY DOCS
	Main tasks: 
		1) Preload a 2-dimensional array of all dues values for all units for all months, since that isn't terribly sensitive inforrmation and will simplify synchrony management.   ****** Still needs implementation
		2) Be able to supply other app elements with unit- and time-specific slices of that dues matrix.   ***** This is currently not centralized and gets done by other factories.
		3) Be able to supply a version of the dues matrix in transaction list format.
		4) Host the master copy of the Initial Date.
	**************/
	//console.log("loading matrixFactory");
	var factory = {};
	var initial_date = new Date('01/01/2011');
	var today = new Date();
	var months_to_date = (today.getFullYear() - 2011) * 12 + today.getMonth() + 1;
	var this_index = function(){
		var start_index = -1;
		var bump = function(bump_or_tell){
			if (bump_or_tell == "bump"){
				return(start_index += 1);
			} else if (bump_or_tell == "tell"){
				return (start_index);
			}
		}
		return bump;  //remember:  "this_index" now contains the ****function**** bump, not its result. So this_index actually does take an argument. 
	}();
	var bump_tell_count = function(){  //for loop indexer slightly modified to be a unit-number iterator for times when it's just not worth the asynchrony trouble to do a server call.
		var start_index = 0;
		var bump = function(bump_tell_count){3
			if (start_index > 29){
				//console.log("Error: bump_tell_count is being forced to iterate too high");
				return ({error: "No mure units to iterate"});
			} else if (bump_tell_count == "tell" && start_index === 29){
				//console.log("bump_tell_count has reached the last unit");
				return ({finished: "bump_tell_count has finished iteration at unit " + start_index});
			} else if (bump_tell_count == "tell"){
				return (start_index);
			} else if (bump_tell_count == "count"){
				return 27;
			} else if (bump_tell_count == "bump" && (start_index === 12 || start_index === 22)){
				return (start_index += 2);
			} else if (bump_tell_count == "bump" && (start_index === 29)){
				return (start_index = 1);
			} else if (bump_tell_count == "bump"){
				return (start_index += 1);
			}
		}
		return bump;
	}();
	var transactionify = function(dues_list, unit_number){
		var date_counter = new Date('01/01/2011');
		var transactionified = [];
		for (dues_index=0;dues_index<dues_list.length;dues_index++){
			transactionified[dues_index] = {"unit_number": Number(unit_number), "unit_string": String(unit_number), "date": new Date(date_counter.setMonth(date_counter.getMonth() + 1)), "amount": (dues_list[dues_index] * 100), "type": "dues", "notes": "", };
		}
		return transactionified;
	}
	factory.dues_as_transactions = [];
	factory.transactionified_dues_index = function(callback){
		factory.dues_as_transactions = []; // if this isn't here, dues replicate each time partial is reloaded
		//console.log("in transactionified_dues_index function in matrixfactory");
		for(i=0;i<bump_tell_count("count");i++){
			//console.log("about to transactionify dues for unit " + bump_tell_count('tell') + " with a bound of " + months_to_date + " months.");
			$http.post('/trim_matrix', {unit: bump_tell_count("bump"), months: months_to_date}).success(function(matrix_result){
				if (matrix_result.error){
					userFactory.log({"error": matrix_result.error});
				} else {
					factory.dues_as_transactions = factory.dues_as_transactions.concat(transactionify(matrix_result.dues_list, matrix_result.unit));
				}
				if (bump_tell_count('tell').finished){
					callback(factory.dues_as_transactions);
				}
			})
		}
	}
	factory.count_months = function(bounds){  // parameter should be in form {start_date: X, end_date: Y}  returns the number of full (& partial!!) months from one date to the next.  Remember to subtract 1 if you only want full months & days aren't identical.
		if (bounds){
			if (!bounds.start_date){
				bounds.start_date = new Date(initial_date);
			} else {
				bounds.start_date = new Date(bounds.start_date);
			}
			if (!bounds.end_date){
				bounds.end_date = new Date();
			} else {
				bounds.end_date = new Date(bounds.end_date);
			}
		} else {
			bounds = {start_date: new Date(initial_date), end_date: new Date()};
		}
		var count_month_result = {count: 0, labels: []};
		var this_month = new Date(bounds.start_date);
		while (this_month < bounds.end_date){
			count_month_result.labels[count_month_result.count] = this_month;  //ensures that .count is number of slots in .labels
			this_month = new Date(bounds.start_date.setMonth(bounds.start_date.getMonth() + 1));  //note that this changes both this_month and bounds.start_date.  Important for when it iterates.
			count_month_result.count += 1;
		}
		return count_month_result;
	}
	factory.index = function(callback){
		var month_count = factory.count_months();
		$http.post('/dues_matrixes', {months: month_count.count}).success(function(data){
			var formatted_data = {};
			if (data.error){
				formatted_data = data;
			} else {
				for (i=0; i<data.rates.length; i++){  //iterates over every unit and assigns whole rows of dues at a time
					if (data.rates[i][0] != null){
						formatted_data[i] = {'highlight': false, 'rates': data.rates[i]};  //reformats matrix as {1: {highlight: false, rates: [320,null,null,335...], {2: {highlight: false, rates: [320,null,null,335...]} for ng-repeat
					}
				}
			}
			callback(formatted_data);
		})
	};
	return factory;
}]);
wc3_services.factory('mortgageFactory', ['$http', 'toolFactory', function($http, toolFactory){
	var factory = {};
	var today = new Date();
	var origin_date = new Date('01/01/2007');
	var add_running_balances = function(raw_mortgages){
		if (!Array.isArray(raw_mortgages)){ //takes either one mortgage or array of mortgages, adds a running balance column, and returns an array for easy ng-repeating;
			raw_mortgages = [raw_mortgages];
		}
		//console.log("raw_mortgages: " + JSON.stringify(raw_mortgages));
		for (i=0;i<raw_mortgages.length;i++){
			raw_mortgages[i].running_balances = [];
			raw_mortgages[i].initial_date = new Date(raw_mortgages[i].initial_date);
			for (payment_index=0;payment_index<raw_mortgages[i].payments.length;payment_index++){
				if (payment_index === 0){
					raw_mortgages[i].running_balances.push(raw_mortgages[i].initial_balance - raw_mortgages[i].payments[0].principal);
					raw_mortgages[i].payments[payment_index].pay_date = new Date(raw_mortgages[i].payments[payment_index].pay_date);
					//console.log("Pushed initial running balance which was the difference of " + raw_mortgages[i].initial_balance + " and " + raw_mortgages[i].payments[0].principal + " which is " + (raw_mortgages[i].initial_balance - raw_mortgages[i].payments[0].principal));
				} else {
					raw_mortgages[i].running_balances.push(raw_mortgages[i].running_balances[payment_index-1] - raw_mortgages[i].payments[payment_index].principal);
					raw_mortgages[i].payments[payment_index].pay_date = new Date(raw_mortgages[i].payments[payment_index].pay_date);
					//console.log("Pushed an additional running balance which was the difference of " + raw_mortgages[i].running_balances[payment_index-1] + " and " + raw_mortgages[i].payments[payment_index].principal + " which is " + (raw_mortgages[i].running_balances[payment_index-1] - raw_mortgages[i].payments[payment_index].principal));
				}
				if (i === raw_mortgages.length - 1 && payment_index === raw_mortgages[i].payments.length-1){
					//console.log("Done iterating over payments.  Made these running balances: " + raw_mortgages[i].running_balances);
					//console.log("add_running_balances is returning " + JSON.stringify(raw_mortgages));
					return raw_mortgages;
				}				
			}
		}
	}
	factory.create_mortgage = function(new_mortgage, callback){
		delete new_mortgage.running_balances;
		//console.log("Factory is sending " + JSON.stringify(new_mortgage) + " for creation");
		$http.post("/mortgages/create", new_mortgage).success(function(data){
			//console.log("Back in factory, sending " + JSON.stringify(data) + " to scope");
			callback(data);
		})
	}
	factory.mortgage_index = function(callback){
		$http.get("/mortgages").success(function(data){
			//console.log("Factory received from server: " + JSON.stringify(data));
			if (data.mortgage_index){		//initial date is just verifying that at least one 
				data.these_complete_mortgages = add_running_balances(data.mortgage_index);
			}
			callback(data);
		})
	}
	factory.index_by_year = function(callback){
		var mortgage_colors = toolFactory.make_rainbowSync({count: 3, groups: 0});
		var mortgage_index_by_year = {
			"for_table": {
				"Mortgage": {
					"Principal": {"2017": 17721.63}, // list contents should be in format {year: amount}
					"Interest": {"2017": 6051.69}, 
					"Total": {"2017": 23773.32}
				}
			},
			"for_chart": [{
				"key": "Mortgage Principal", 
				"color": mortgage_colors.color_strings[0],
				"values": []  // this list's contents should be sub-lists instead: [year, amount]
			}, {
				"key": "Mortgage Interest",
				"color": mortgage_colors.color_strings[1],
				"values": []
			}, {
				"key": "Mortgage Total",
				"color": mortgage_colors.color_strings[2],
				"values": []
			}]
		};
		$http.get("/mortgages/").success(function(result){
			if (result.error){
				callback(result)
			} else {
				//console.log("initial mortgage_index in index_by_year method:");
				//console.dir(result.mortgage_index);
				for (i=0;i<result.mortgage_index.length;i++){															//iterate through each mortgage in the index
					for (payment_index=0;payment_index< result.mortgage_index[i].payments.length;payment_index++){		//iterate through that mortgage's payments
						var this_payment = result.mortgage_index[i].payments[payment_index];
					 	var payment_date = new Date(this_payment.pay_date);											//get the year of each payment
					 	if ((payment_date >= new Date("01/01/2007")) && (payment_date <= new Date("12/31/2016"))){													//disregard payments made before 2007 as they cause chart rendering problems
						 	var this_year = payment_date.getFullYear();
						 	if (!mortgage_index_by_year.for_table.Mortgage.Total[this_year]){							//if the year is unfamiliar, initialize bins for its values to be incremented into
							 	//console.log("Zeroing year " + this_year);
							 	if (this_year === 2013){
							 		mortgage_index_by_year.for_table.Mortgage.Principal[this_year] = -184296.58;					// manual entry of new loan principal - without it, payoff of key loan gives false impression of being a titanic expense
						 			mortgage_index_by_year.for_table.Mortgage.Total[this_year] = -184296.58;
							 	} else {
						 			mortgage_index_by_year.for_table.Mortgage.Principal[this_year] = 0;
							 		mortgage_index_by_year.for_table.Mortgage.Total[this_year] = 0;
						 		}					
						 		mortgage_index_by_year.for_table.Mortgage.Interest[this_year] = 0;
						 	}
						 	if (this_payment.principal + this_payment.interest === this_payment.total){	// this may seem unnecessary, but is crucial for correctly tallying times like in Key Bank Feb 2013 when principal changes for reasons other than a payment (say, for interest that accrues in the absence of a payment)
						 		mortgage_index_by_year.for_table.Mortgage.Total[this_year] += (this_payment.principal / 100 + this_payment.interest / 100);  //increment the yearly table value by that amount
						 		mortgage_index_by_year.for_table.Mortgage.Principal[this_year] += (this_payment.principal / 100);
						 		mortgage_index_by_year.for_table.Mortgage.Interest[this_year] += (this_payment.interest / 100);
						 	}
						}
					}
				}
				for (category_key in mortgage_index_by_year.for_table.Mortgage){										//and (hopefully when done), copy that yearly value over to chart data format too
					for (year_key in mortgage_index_by_year.for_table.Mortgage[category_key]){
						var this_yearly_amount = mortgage_index_by_year.for_table.Mortgage[category_key][year_key];
						if (category_key === "Principal"){
							mortgage_index_by_year.for_chart[0].values.push([year_key, this_yearly_amount]);
						} else if (category_key === "Interest"){
							mortgage_index_by_year.for_chart[1].values.push([year_key, this_yearly_amount]);
						} else if (category_key === "Total"){
							mortgage_index_by_year.for_chart[2].values.push([year_key, this_yearly_amount]);
						}
					}
				}
				//console.log("thing I'm going to callback:");
				//console.dir(mortgage_index_by_year);
				callback(mortgage_index_by_year);
			}
		})
	}
	return factory;
}]);
wc3_services.factory('propertyTaxFactory', ['$http', function($http){
	var factory = {};
	factory.brief_index = {for_chart: {key: "Property Tax", color: "#ffffff", values: []}, for_table: {"Property Tax": []}};
	//factory.index_briefly = function(callback){
	//	$http.post('/property_taxes').success(function(result){
	//		if (result.error){
	//			callback(result);
	//		} else {
	//			for (year_index=0;year_index<result.prop_tax_index.length;year_index++){
	//				var taxes_this_year = result.prop_tax_index[year_index];
	//				factory.brief_index.for_chart.values.push([taxes_this_year.year_paid, (taxes_this_year.bill_main + taxes_this_year.bill_alt)]);
	//				factory.brief_index.for_table["Property Tax"][year_index] = {};
	//				factory.brief_index.for_table["Property Tax"][year_index][String(taxes_this_year.year_paid)] = (taxes_this_year.bill_main + taxes_this_year.bill_alt);
	//			}
	//		}
	//	});
	//}
	//factory.index_briefly(function(this_index){
	//	console.log("done constructing brief prop tax index for " + year_index + " years: ");
	//	console.log(JSON.stringify(factory.brief_index));
	//});
	factory.index = function(callback){
		$http.post('/property_taxes').success(function(result){
			if (result.error){
				callback(result);
			} else {
				var tax_year_keys = ["year_paid", "total", "bill_main", "land_val_main", "imp_val_main", "units_main", "per share", "tax_by_size", "bill_alt", "land_val_alt", "imp_val_alt", "units_alt", "unit_size_shares", "unit_size_numbers", "Actions"];
				var grouped_by_attribute = {};
				var tax_by_size = {"Sr Citizen": [], "small": [], "medium": [], "large": []};
				var distribute_tax = function(unit_size_shares, total_shares, main_bill, sr_bill, unit_3){  // arguments should be 1) the unit_size_shares database response attribute, 2) 93000 for total shares (until our number of sr citizens changes), and 3) & 4) main_bill & sr_bill amounts pulled from database. Only include a 5th unit_3 argument if unit 3 failed to pay that year.  It takes the form {denominator: <26 or 27 or "shares">} depending on the year being calculated.
					//console.log("in distribute_tax method, with arguments: unit_size_shares: " + JSON.stringify(unit_size_shares) + ", total_shares: " + total_shares + ", main_bill: " + main_bill + ", sr_bill: " + sr_bill + ", unit_3:" + JSON.stringify(unit_3));
					var tax_classes = {
						"Sr Citizen": {"base": sr_bill},
						"small": {"base": (main_bill * unit_size_shares["small"] / total_shares)}, 
						"medium": {"base": (main_bill * unit_size_shares["medium"] / total_shares)}, 
						"large":{"base": (main_bill * unit_size_shares["large"] / total_shares)}};  
					if (unit_3){
						//console.log("in 'if unit_3' conditional statement");
						if ((unit_3.denominator === 26) || (unit_3.denominator === 27)){  // here, the unit 3 tax burden is being divided equally among units.  27 is a historical error in year 2013
							//console.log("In denominator 26 or 27 staemewnt, about to iterate through keys in " + JSON.stringify(tax_classes));
							for (class_key in tax_classes){
								tax_classes[class_key].unit_3_burden = (tax_classes["small"].base / unit_3.denominator);
							}
						} else if (unit_3.denominator === "shares"){ //here, the unit 3 tax burden is essentially being distributed by share, though we're doing it by pretending the unit doesn't exist.
							var revised_shares = total_shares - unit_size_shares["small"]; //this should equal 90050 in 2013;
							for (class_key in tax_classes){
								if (class_key === "Sr Citizen"){
									tax_classes[class_key].unit_3_burden = 0;
								} else {
									tax_classes[class_key].unit_3_burden = (main_bill * unit_size_shares[class_key] / revised_shares - tax_classes[class_key].base); //the tax was originally apportioned just using the first three terms without bothering with a separate burden value.  But this lets us compare it with other methods in the view more easily.
								}
							}
						}
					}
					//console.log("distribute_tax is returning " + JSON.stringify(tax_classes));
					return tax_classes;
				}
				for (attribute_index=0;attribute_index<tax_year_keys.length;attribute_index++){ //use first entry to figure out number of attributes per tax year & iterate that many times.
					var attribute_data = [];
					for (year_index=3;year_index<result.prop_tax_index.length;year_index++){ //starting in 2010 (*tax year index 3)
						if (tax_year_keys[attribute_index] === "Actions"){
							attribute_data.push(result.prop_tax_index[year_index]._id);
						} else if (tax_year_keys[attribute_index] === "total"){
							var this_total = result.prop_tax_index[year_index].bill_main;
							if (result.prop_tax_index[year_index].bill_alt){
								this_total += result.prop_tax_index[year_index].bill_alt;
							}
							attribute_data.push(this_total);
						} else if (tax_year_keys[attribute_index] === "units_main"){
							if (result.prop_tax_index[year_index]["units_main"]["small"].indexOf(3) === -1){
								attribute_data.push("No");
							} else {
								attribute_data.push("Yes");
							}
						} else if (tax_year_keys[attribute_index] === "per share"){
							var unit_sizes = ["small", "medium", "large"];
							var total_main_shares = 93000; //this will need to be altered if our Sr Citizens ever change.
							// The following lines were intended to manually count the total number of relevant shares each year.  This ran into trouble because "relevant" depends on context.  It's fine for calcing $/share, but in years where unit 3 is an add-on value, there is no $/share that is accurate for all units.  And it definitely doesn't work to use itr later on when figuring base values.
							//console.log("Calculating total share count, starting at " + total_main_shares);
							//for (size_index in unit_sizes){
							//	total_main_shares += (result.prop_tax_index[year_index].unit_size_shares[unit_sizes[size_index]] * result.prop_tax_index[year_index].units_main[unit_sizes[size_index]].length);  //# of units per size * # shares per size, iterated over 3 sizes
								//console.log("Added " + result.prop_tax_index[year_index].units_main[unit_sizes[size_index]].length + "units at " + result.prop_tax_index[year_index].unit_size_shares[unit_sizes[size_index]] + " shares per unit for a total of " + total_main_shares + " subtotal shares.");
							//}
							attribute_data.push(result.prop_tax_index[year_index].bill_main / total_main_shares);
						} else if (tax_year_keys[attribute_index] === "tax_by_size"){
							if (year_index < 3){
								for (class_key in tax_by_size){
									tax_by_size[class_key].push({base: (result.prop_tax_index[year_index].bill_main + result.prop_tax_index[year_index].bill_alt) / 27});
								}
							} else if (year_index === 3){ // i.3. year =2010
								for (class_key in tax_by_size){
									if (class_key === "Sr Citizen"){
										tax_by_size[class_key].push({base: result.prop_tax_index[year_index].bill_alt});
									} else {
										tax_by_size[class_key].push({base: (result.prop_tax_index[year_index].bill_main / 26)});
									}
								}
							} else if (year_index > 3){ // year 2011+
								var unit_3 = [false, false, false, false, false, false, {denominator: 27}, {denominator: "shares"}, {denominator: 26}];
								if (!unit_3[year_index]){
									unit_3[year_index] = false; //if it's after 2016, assume default parameters for unit 3
								}
								var this_tax_data = distribute_tax(result.prop_tax_index[year_index].unit_size_shares, total_main_shares, result.prop_tax_index[year_index].bill_main, result.prop_tax_index[year_index].bill_alt, unit_3[year_index]);
								for (size_key in tax_by_size){
									tax_by_size[size_key].push({base: this_tax_data[size_key].base});
									//console.log(JSON.stringify(tax_by_size));
									if (this_tax_data[size_key].unit_3_burden){
										tax_by_size[size_key][tax_by_size[size_key].length-1].unit_3_burden = this_tax_data[size_key].unit_3_burden;
									}
								}
							}
						} else {
							attribute_data.push(JSON.stringify(result.prop_tax_index[year_index][tax_year_keys[attribute_index]]));
							//console.log("defaulted to adding " + JSON.stringify(result.prop_tax_index[year_index][tax_year_keys[attribute_index]]) + " to attribute data for attribute " + tax_year_keys[attribute_index]);
						}
					}
					grouped_by_attribute[tax_year_keys[attribute_index]] = attribute_data;
				}
				var index_by_attribute = {};
				index_by_attribute = {
					"Year Paid": grouped_by_attribute.year_paid,
					"Total Tax": grouped_by_attribute.total,
					"Primary Bill": grouped_by_attribute.bill_main,
					"Unit 3 occupied?": grouped_by_attribute.units_main,
					"Sr Citizen Bill": grouped_by_attribute.bill_alt,
					"Tax per share": grouped_by_attribute['per share'],
					"Sr Citizen Tax": tax_by_size["Sr Citizen"],
					"Tax per small unit": tax_by_size["small"],
					"Tax per medium unit": tax_by_size["medium"],
					"Tax per large unit": tax_by_size["large"],
					"Actions": grouped_by_attribute.Actions,
					"Main Improvement Value": grouped_by_attribute.imp_val_main,
					"Main Land Value": grouped_by_attribute.land_val_main, 
					"Sr Citizen Improvement Value": grouped_by_attribute.imp_val_alt,
					"Sr Citizen Land Value": grouped_by_attribute.land_val_alt
				};
				//console.log("constructed this index_by_attribute: " + JSON.stringify(index_by_attribute));
				var brief_index = {for_chart: {"key": "Property Tax", "color": "#442222", "values": []}, for_table: {"2017": 47750}};
				for (i=0;i<result.prop_tax_index.length;i++){
					var this_total = result.prop_tax_index[i].bill_main;
					if (result.prop_tax_index[i].bill_alt){
						this_total += result.prop_tax_index[i].bill_alt;
					}
					brief_index.for_chart.values.push([result.prop_tax_index[i].year_paid, this_total]);
					brief_index.for_table[result.prop_tax_index[i].year_paid] = this_total;
				}
				brief_index.for_chart.values[10] = [2017, 47750];
				//console.log("property tax factory brief index about to be published: " + JSON.stringify(brief_index));
				//console.log("proptax brief index for chart:");
				//console.log(brief_index.for_chart);
				callback({brief_index: brief_index, prop_tax_index: result.prop_tax_index, grouped_by_attribute: grouped_by_attribute, index_by_attribute: index_by_attribute});
			}
		})
	}
	factory.index(function(result){
		factory.brief_index = result.brief_index;  //holy shit it's ugly doing it this way, but the standalone brief_index method at the start of the factory doesn't seem to work.
	});
	factory.create_tax = function(tax_info, callback){
		$http.post('/property_taxes/create', tax_info).success(function(result){
			if (result.error){
				callback(result);
			} else {
				factory.index(function(updated_index){
					callback(updated_index);
				})
			}
		})
	}
	factory.delete_tax = function(bad_tax_id, callback){
		var delete_path = "/property_taxes/" + bad_tax_id + "/delete";
		$http.post(delete_path).success(function(result){
			if (result.error){
				callback(result);
			} else {
				factory.index(function(updated_index){
					callback(updated_index);
				})
			}
		})
	}
	return factory;
}]);
wc3_services.factory('reportFactory', ['$http', '$filter', 'matrixFactory', 'unitFactory', 'transactionFactory', 'userFactory', function($http, $filter, matrixFactory, unitFactory, transactionFactory, userFactory){
	var factory = {};
	var all_dues = [];
	var sum_transactions = function(transaction_list){
		//console.log("reportFactory sum_transactions called with list of length " + transaction_list.length);
		var sum = 0;
		var running_balances = [];
		for (this_index=0;this_index<transaction_list.length;this_index++){
			if (transaction_list[this_index].type === "credit"){
				sum += transaction_list[this_index].amount;
				running_balances.push(sum);
			} else {
				sum -= transaction_list[this_index].amount;
				running_balances.push(sum);
			}
		}
		return {sum: sum, running_balances: running_balances};
	}
	factory.filtered_transactions = [];

	factory.reference_health = function(callback){
		var runaway_transactions = [];
		var rejecting_units = [];
		transactionFactory.index(function(trans_data){
			var sick_transaction_list = trans_data.index;
			unitFactory.index({populate: false}, function(unit_data){
				var sick_unit_list = unit_data.index;
				var comparison_count = 0;
				var this_unit = {};
				var this_transaction = {};
				for (var unit_index = 0;unit_index<sick_unit_list.length;unit_index++){
					for (var trans_index=0; trans_index<sick_transaction_list.length; trans_index++){
						comparison_count++;
						this_unit = sick_unit_list[unit_index];
						this_transaction = sick_transaction_list[trans_index];
						if (this_transaction._unit._id === this_unit._id){ // if this transaction thinks it has found its mother unit
							if (this_unit.transactions.indexOf(this_transaction._id) === (-1)){ //but the mother thinks it's a stranger
								rejecting_units.push({"unit": this_unit, "transaction": this_transaction});
							}
						}
						if (this_unit.transactions.indexOf(this_transaction._id) != (-1)){ // if this trans is on the unit's trans list
							if (this_transaction._unit._id != this_unit._id){ // but the transaction thinks it belongs elsewhere
								runaway_transactions.push({"transaction": this_transaction, "unit_number": this_unit.number});
							}
						}
					}
				}
				//console.log("Finished " + comparison_count + "comparisons of " + sick_unit_list.length + " units and " + sick_transaction_list.length + " transactions. About to return report");
				if (runaway_transactions.length + rejecting_units.length === 0){
					callback("ok");
				} else {
					callback({runaway_transactions: runaway_transactions, rejecting_units: rejecting_units});
				}
			});
		});
	};
	factory.balance_summary = function(callback){
		var these_units = unitFactory.unit_numbers;
		var these_balances = {};
		for(i=0; i<these_units.length;i++){									//go through each one
			factory.full_history(these_units[i], function(this_history){	//and determine its balance
				these_balances[this_history.unit] = this_history.current_balance; //and add the balance to the index hash
				if (Object.keys(these_balances).length === these_units.length){  //and if we have as many balances as units, that means we're done, and should callback the result.
					callback(these_balances);
				}
			})
		}
	}
	factory.format_for_chart = function(unit_number, full_history){
		var this_data = {key: "Unit " + unit_number, values: []};
		//console.log("full_history in format_for_chart:");
		//console.log(full_history);
		for (i=0;i<full_history.transactions.length;i++){
			var this_date = new Date(full_history.transactions[i].date);
			var this_balance = Number(full_history.balances[i]);
			var this_data_point = [this_date, this_balance];
			this_data.values.push([this_date, this_balance]);
		}
		var chart_options = {
			"chart": {
				"type": "lineChart",
				"height": 720,
				"width": 1150,
				"margin": {
					"top": 20,
					"right": 40,
					"bottom": 30,
					"left": 120
				},
				"x": function(d){ return d[0];},
				"y": function(d){ return d[1];},
				"duration": 100,
				"useInteractiveGuideline": true,
				"xAxis": {
					"showMaxMin": true,
					tickFormat: function(d){
						return d3.time.format('%x')(new Date(d));
					}
				},
				"yAxis": {
					tickFormat: function(d){
						return ("$" + d3.format(',.2f')(d));
					}
				},
				"zoom": {
					"enabled": false
				}
			}

		};
		//console.log(chart_options);
		//console.log("format_for_chart is about to return: ");
		//console.log(this_data);
		return {data: this_data, options: chart_options};
	}
	factory.full_history = function(unit, callback){
		var today = new Date();
		var months = (today.getFullYear() - 2011) * 12 + today.getMonth() + 1;
		var show_route = '/units/' + unit;
		var this_full_history = {transactions: [], balances: []};
		$http.post('/trim_matrix', {unit: unit, months: months}).success(function(matrix_result){
			//console.log("In trim-matrix callback in full_history method");
			var these_dues = [];
			var these_payments = [];
			var these_assessments = [];
			var these_fees = [];
			var dues_date = new Date('12/01/2010');
			for (i=0; i<matrix_result.dues_list.length; i++){
				these_dues.push({date: dues_date.setMonth(dues_date.getMonth() + 1), amount: matrix_result.dues_list[i], type: "dues"})
			}
			$http.post(show_route).success(function(unit_result){
				//console.log("In units/show callback in full_history method.  Results received by factory are below.");
				//console.log(unit_result);
				these_transactions = unit_result.unit.transactions;
				for (i=0; i<these_transactions.length; i++){
					these_transactions[i].amount = (these_transactions[i].amount / 100);
				}
				var this_history = these_dues.concat(these_transactions);
				for(i=0; i<this_history.length; i++){
					this_history[i].date = new Date(this_history[i].date);
					this_history[i].date = this_history[i].date.toLocaleDateString();
				}
				this_history.sort(function(a,b){return new Date(a.date) - new Date(b.date)});
				var previous_balance = unit_result.unit.initial_balance;
				for(i=0; i<this_history.length; i++){
					if (this_history[i].type === 'credit'){
						this_history[i].credit_amount = (this_history[i].amount).toFixed(2);
						this_history[i].charge_amount = "";
						previous_balance += Number(this_history[i].amount);
					} else {
						this_history[i].charge_amount = (this_history[i].amount).toFixed(2);
						this_history[i].credit_amount = "";
						previous_balance -= Number(this_history[i].amount);
					}
					this_full_history['balances'].push(previous_balance.toFixed(2));
					this_full_history['transactions'].push(this_history[i]);
				}
				this_full_history['balances'].reverse();
				this_full_history['transactions'].reverse();
				var history_for_chart = factory.format_for_chart(unit, this_full_history);
				callback({unit: unit, full_history: this_full_history, current_balance: this_full_history['balances'][0], initial_balance: unit_result.unit.initial_balance.toFixed(2), chart_data: history_for_chart.data, chart_options: history_for_chart.options});
			})
		})
	}
	return factory;
}]);
wc3_services.factory('transactionFactory', ['$http', 'matrixFactory', function($http, matrixFactory){
	var factory = {};
	var transaction_index = [];
	var transactions_and_dues_index = [];
	var index_by_unit = {};
	factory.allowed_types = ['credit', 'assessment', 'late_fee', 'other_fee', 'dues'];
	var format_transactions = function(these_transactions){
		//console.log("in transactionfactory format_transactions, about to format " + these_transactions.length + " items");
		for (i=0;i<these_transactions.length;i++){
			these_transactions[i].unit_number = these_transactions[i]._unit.number;
			these_transactions[i].unit_string = String(these_transactions[i]._unit.number);
			these_transactions[i].date = new Date(these_transactions[i].date);			
		}
		return these_transactions;	
	}
	var by_unit = function(these_transactions){
		var response = {index_by_unit: {}};
		for (i=0;i<these_transactions.length;i++){
			if (!response.index_by_unit[these_transactions[i].unit_string]){
				response.index_by_unit[these_transactions[i].unit_string] = [];
			}
			response.index_by_unit[these_transactions[i].unit_string].push(these_transactions[i]);			
		}
		return response;
	}
	factory.index = function(callback){
		$http.post("/transactions").success(function(data){
			transaction_index = format_transactions(data.index);
			index_by_unit = by_unit(transaction_index);
			matrixFactory.transactionified_dues_index(function(trans_dues_list){ //these arrive already formatted.
				transactions_and_dues_index = transaction_index.concat(trans_dues_list);
				//console.log("sample transaction in transactions_and_dues: " + JSON.stringify(transactions_and_dues_index[5]));
				callback({index: transaction_index, index_by_unit: index_by_unit, transactions_and_dues_index: transactions_and_dues_index});
			})
		})
	}
	factory.create_transactions = function(credit_chart, callback){  //see update_dues partial for formatting instructions
		var transaction_count = 0;
		var row_index = function(){
			var start_index = 0;
			var bump = function(bump_or_tell){
				if (bump_or_tell == "bump"){
					return(start_index += 1);
				} else if (bump_or_tell == "tell"){
					return (start_index);
				}
			}
			return bump;
		}();
		for(row=1; row<credit_chart.length; row++){					
			var date_list_for_chopping = [];
			for (date_index=0; date_index < credit_chart[0].length; date_index++){  //if I just say chopping = creditchart0, it passes by reference.
				date_list_for_chopping.push(credit_chart[0][date_index]);
			}
			for(col=1; col<credit_chart[row].length; col++){
				var this_amount = Number(credit_chart[row][col]);
				credit_chart[row][col] = {amount: this_amount, date: date_list_for_chopping[col], _unit: credit_chart[row][0], type: "credit", check_number: "", notes: ""};
				if (credit_chart[row][col].amount === 0 || !credit_chart[row][col].amount){
					credit_chart[row].splice(col, 1);
					date_list_for_chopping.splice(col, 1);
					col -= 1;
				}
			}
			transaction_count += credit_chart[row].length - 1;
			$http.post('/transactions/createMany', {credit_row: credit_chart[row_index("bump")]}).success(function(data){
				//console.log(data);
				callback(data);
			})
		}
	}
	factory.create_transaction = function(new_transaction, callback){
		$http.post('/transactions/createOne', {new_transaction: new_transaction}).success(function(data){
			callback(data);
		})
	}
	factory.update = function(updated_transaction, callback){
		var update_path = "/transactions/" + updated_transaction._id + "/update";
		//delete updated_transaction.unit;
		//delete updated_transaction._id;
		$http.post(update_path, {updated_transaction: updated_transaction}).success(function(data){
			callback(data);
		})
	}
	factory.delete_one = function(id, callback){
		var delete_path = "/transactions/" + id + "/delete";
		$http.post(delete_path).success(function(result){
			callback(result);
		})
	}
	factory.delete_all = function(callback){
		$http.post("/transactions/deleteMany").success(function(result){
			callback(result);
		})
	}
	factory.date_for_sorting = function(transaction){
		var this_date = new Date(transaction.date);
		return this_date;
	}
	return factory;
}]);
wc3_services.factory('unitFactory', ['$http', 'userFactory', function($http, userFactory){
	/*************
	UNITFACTORY DOCS
	This is another high-end factory due to many scopes & factories needing access to a unit number list, though it is still one step below userFactory.
	Main Tasks:
	1)  Preload a list of unit numbers in the building, and make it visible everywhere to simplify synchrony management.
	2)  NOT preload a list of entire unit models, which could expose private information.
	3)  Call server for queries about deposit status and other unit traits that might pop up in the future.
	4)  Call server to populate unit profile index, though I'm using this view less & less in favor of trait-specific views.
	5)  Maintain rarely-used ability to update units (shareholder & deposit changes mainly);
	Minor tasks:
	1)  (vestigial) Ability to create new units.  Keep for now since it was a fair amount of work on the html side to make the form.
	*************/
	//console.log("loading unitFactory");
	var factory = {};
	factory.unit_numbers = []; 	// is just a raw list of numbers.  no IDs or objects.  If you want a list with "Admin", go to userfactory
	$http.get('/unit_numbers_index').success(function(data){ //this is intended to replace factory.numbers_index by pre-loading unit numbers & simplifying asynchrony
		if (data.error){
			userFactory.log({error: data.error});
		} else {
			for (i=0; i<data.unit_numbers.length; i++){
				factory.unit_numbers.push(data.unit_numbers[i].number);  // the raw server feedback contains _ids that don't need to be public.
				//console.log("finished preloading unitfactory unitnumbers");  //this has turned out to be of doubtful usefulness
			}
		}
	});
	factory.numbers_index = function(callback){
		$http.get('/unit_numbers_index').success(function(data){
			if (data.error){
				callback({error: data.error});
			} else {
				var unit_numbers = [];
				for (i=0; i<data.unit_numbers.length; i++){
					unit_numbers.push(data.unit_numbers[i].number);
				}
				callback({unit_numbers: unit_numbers}); // is just a raw list of numbers.  no IDs or objects.
			}
		});
	}
	factory.index = function(options, callback){ // options is currently either {populate: true/false} or {deposits: true/false}
		$http.post('/units', {options: options, credentials: {unit: userFactory.current_user, pw: userFactory.current_pw}}).success(function(data){
			data.deposit_index = {};
			if (data.index){
				for (i=0; i<data.index.length; i++){
					if (options.deposits){
						data.deposit_index[data.index[i].number] = {"pet_deposit": data.index[i].pet_deposit, "sublease_deposit": data.index[i].sublease_deposit};
					} else {
						data.index[i].initial_balance_string = data.index[i].initial_balance.toFixed(2);					
					}
				}
			}
			callback(data);
		});
	}
	factory.create = function(new_unit, callback){
		$http.post('/units/create', new_unit).success(function(data){
			if (data.error){
				callback(data);
			} else {
				factory.index(function(these_units){
					callback(these_units);
				})
			}
		});
	}
	factory.update = function(updated_unit, callback){
		var update_path = '/units/'+updated_unit._id+'/update'
		$http.post(update_path, updated_unit).success(function(data){
			if (data.error){
				callback(data);
			} else {
				factory.index({populate: true}, function(these_units){
					callback(these_units);
				})
			}
		});
	}
	return factory;
}]);
wc3_services.factory('toolFactory', ['userFactory', function(userFactory){
	var factory = {};
	factory.random_indices = function(these_criteria){
		//console.log("starting random_indices with arguments: " + JSON.stringify(these_criteria));
		var groups = Number(these_criteria.groups);
		var delta =  Math.floor(255/(Number(these_criteria.count)*2));
		//var delta =  Math.floor(250/(Number(these_criteria).count)); 
		if (!(groups === 0 || groups === 2 || groups === 3)){ // don't miss the exclamation point up front
			console.log("I think group count is invalid");
			return {error: "invalid group count requested"};
		} else {
			var initial_indices = [];
			for (i=0;i<3;i++){
				initial_indices.push(Math.floor(Math.random()*these_criteria.count));
			}
			//console.log("the nth steps for red, green, and blue starting values (initial_indices): " + initial_indices);
			/*var group_breaks = 0;
			for(x=0;x<3;x++){
				if (initial_indices[x] > (these_criteria.count / 2)){ // reactivate here if I want to implement group breaks 
					group_breaks += 1;
				}
			}*/ 
			/*if (initial_indices[0] != initial_indices[1]){
				group_breaks += 1;
			}
			if (initial_indices[1] != initial_indices[2]){
				group_breaks += 1;
			}
			if (initial_indices[2] != initial_indices[0]){
				group_breaks += 1;					// group_breaks will end up either 0, 2, or 3.  Weird but works
			}										// if I want to get reliably zero groups though, I'll need to ensure that starting index is never within spitting distance of rolling over.*/
			/*if (group_breaks != Number(these_criteria.groups)){
				console.log('Repeating random_indices because I needed ' + these_criteria.groups + ' and got ' + group_breaks);
				return factory.random_indices(these_criteria);
			} else {*/
			//console.log("returning " + initial_indices + " from random_indices");
			return initial_indices;
			//}
		}
	}
	factory.make_rainbow = function(these_criteria, callback){ // these_criteria must be in format {count: <number>, groups: <number>}
		//console.log('starting factory make_rainbow with arguments: ' + JSON.stringify(these_criteria));
		var delta =  Math.floor(255/(Number(these_criteria.count)*1.33));
		//console.log("Intended delta for space between rgb values: " + delta);
		var initial_indices = factory.random_indices(these_criteria);
		if (initial_indices.error){
			callback({error: initial_indices});
		}
		var base = [];
		for (i=0;i<3;i++){
			base.push(Math.floor(Math.random()*delta));
		}
		//console.log("starting seed value (< delta): " + base);
		var these_colors = [];
		var these_color_strings = [];
		for (i=0;i<these_criteria.count;i++){
			these_colors.push({"rosso": (base[0] + delta*(initial_indices[0]+=1))%255, "verde": (base[1] + delta*(initial_indices[1]+=1))%255, "azzuro": (base[2] + delta*(initial_indices[2]+=1))%255});
			these_color_strings.push('rgb(' + (base[0] + delta*(initial_indices[0]))%255 + ', ' + (base[1] + delta*(initial_indices[1]))%255 + ', ' + (base[2] + delta*(initial_indices[2]))%255 + ')');
		}
		//console.log("returning these_colors from factory");
		//console.log(these_colors);
		callback({colors: these_colors, color_strings: these_color_strings});
	}
	factory.make_rainbowSync = function(these_criteria){ // these_criteria must be in format {count: <number>, groups: <number>}
		//console.log('starting factory make_rainbow with arguments: ' + JSON.stringify(these_criteria));
		var delta =  Math.floor(255/(Number(these_criteria.count)*1.33));
		//console.log("Intended delta for space between rgb values: " + delta);
		var initial_indices = factory.random_indices(these_criteria);
		if (initial_indices.error){
			return {error: initial_indices};
		}
		var base = [];
		for (i=0;i<3;i++){
			base.push(Math.floor(Math.random()*delta));
		}
		//console.log("starting seed value (< delta): " + base);
		var these_colors = [];
		var these_color_strings = [];
		for (i=0;i<these_criteria.count;i++){
			these_colors.push({"rosso": (base[0] + delta*(initial_indices[0]+=1))%255, "verde": (base[1] + delta*(initial_indices[1]+=1))%255, "azzuro": (base[2] + delta*(initial_indices[2]+=1))%255});
			these_color_strings.push('rgb(' + (base[0] + delta*(initial_indices[0]))%255 + ', ' + (base[1] + delta*(initial_indices[1]))%255 + ', ' + (base[2] + delta*(initial_indices[2]))%255 + ')');
		}
		//console.log("returning these_colors from factory");
		//console.log(these_colors);
		return {colors: these_colors, color_strings: these_color_strings};
	}
	return factory;
}]);