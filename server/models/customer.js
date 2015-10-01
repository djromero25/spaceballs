// This is the customer.js file located at /server/models/customer.js
// We want to create a file that has the schema for our customers and creates a model that we can then call upon in our controller
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
// create our customerSchema
var CustomersSchema = new mongoose.Schema({
	name: String,
	created_at: String
});
CustomersSchema.plugin(timestamps);
// use the schema to create the model
// Note that creating a model CREATES the collection in the database (makes the collection plural)
var Customer = mongoose.model('Customer', CustomersSchema);
// notice that we aren't exporting anything -- this is because this file will be run when we require it using our config file and
// then since the model is defined we'll be able to access it from our controller