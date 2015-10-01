// this is our customers.js file located at /server/controllers/customers.js

// First add the following two lines at the top of the customers controller so that we can access our model through var Customer
// need to require mongoose to be able to run mongoose.model()
var mongoose = require('mongoose');
var Customer = mongoose.model('Customer');

// note the immediate function and the object that is returned
module.exports = {
	show: function(req, res) {
		Customer.find({}, function(err, results) {
			if (err) {
				console.log(err);
			} else {
				res.json(results);
			}
		});
	},
	create: function(req, res) {
		var customer = new Customer(req.body);
		customer.save(function(err, results) {
			// if there is an error console.log that something went wrong!
			if(err){
				console.log('something went wrong');
			}
			else{ // else console.log that we did well and then redirect to the root route
				console.log('successfully added a customer!');
				Customer.find({}, function(err, results) {
					if (err) {
						console.log(err);
					} else {
						res.json(results);
					}
				});
			}
		});
	},
	destroy: function(req, res) {
		console.log(req.params);
		Customer.remove({_id: req.params.id}, function(err, results) {
			// if there is an error console.log that something went wrong!
			if(err){
				console.log('something went wrong');
			}
			else{ // else console.log that we did well and then redirect to the root route
				console.log('successfully deleted a customer!');
				Customer.find({}, function(err, results) {
					if (err) {
						console.log(err);
					} else {
						res.json(results);
					}
				});
			}
		});
	}
};