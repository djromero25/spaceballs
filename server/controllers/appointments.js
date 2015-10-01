// this is our appointments.js file located at /server/controllers/appointments.js

// First add the following two lines at the top of the appointments controller so that we can access our model through var Appointment
// need to require mongoose to be able to run mongoose.model()
var mongoose = require('mongoose');
var Appointment = mongoose.model('Appointment');

// note the immediate function and the object that is returned
module.exports = {
	show: function(req, res) {
		console.log(new Date());
		var ndate = new Date();
		Appointment.find({}, function(err, results) {
			if (err) {
				console.log(err);
			} else {
				var newRes = [];
				var today = new Date();
				for(i in results){
					if(new Date(results[i].dateTime) >= today) newRes.push(results[i]);
				}
				res.json(newRes);
			}
		});
	},
	create: function(req, res) {
		var appointment = new Appointment(req.body);
		appointment.save(function(err, results) {
			// if there is an error console.log that something went wrong!
			if(err){
				console.log('something went wrong');
				res.send(err);
			}
			else{ // else console.log that we did well and then redirect to the root route
				console.log('successfully added a appointment!');
				Appointment.find({}, function(err, results) {
					if (err) {
						console.log(err);
					} else {
						res.send(false);
					}
				});
			}
		});
	},
	destroy: function(req, res) {
		console.log(req.params);
		Appointment.remove({_id: req.params.id}, function(err, results) {
			// if there is an error console.log that something went wrong!
			if(err){
				console.log('something went wrong');
			}
			else{ // else console.log that we did well and then redirect to the root route
				console.log('successfully deleted a appointment!');
				Appointment.find({}, function(err, results) {
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