// this is our products.js file located at /server/controllers/products.js

// First add the following two lines at the top of the products controller so that we can access our model through var Product
// need to require mongoose to be able to run mongoose.model()
var mongoose = require('mongoose');
var Product = mongoose.model('Product');

// note the immediate function and the object that is returned
module.exports = {
	show: function(req, res) {
		Product.find({}, function(err, results) {
			if (err) {
				console.log(err);
			} else {
				res.json(results);
			}
		});
	},
	create: function(req, res) {
		var product = new Product(req.body);
		product.save(function(err, results) {
			// if there is an error console.log that something went wrong!
			if(err){
				console.log('something went wrong');
			}
			else{ // else console.log that we did well and then redirect to the root route
				console.log('successfully added a product!');
				Product.find({}, function(err, results) {
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
		Product.remove({_id: req.params.id}, function(err, results) {
			// if there is an error console.log that something went wrong!
			if(err){
				console.log('something went wrong');
			}
			else{ // else console.log that we did well and then redirect to the root route
				console.log('successfully deleted a product!');
				Product.find({}, function(err, results) {
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