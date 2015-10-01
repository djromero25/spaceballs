// This is the customer.js file located at /server/models/customer.js
// We want to create a file that has the schema for our customers and creates a model that we can then call upon in our controller
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
// create our customerSchema
var ProductsSchema = new mongoose.Schema({
	name: String,
	image_url: String,
	description: String,
	quantity: Number
});
ProductsSchema.plugin(timestamps);
// use the schema to create the model
// Note that creating a model CREATES the collection in the database (makes the collection plural)
var Product = mongoose.model('Product', ProductsSchema);
// notice that we aren't exporting anything -- this is because this file will be run when we require it using our config file and
// then since the model is defined we'll be able to access it from our controller