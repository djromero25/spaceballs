 // This is our routes.js file located in server/config/routes.js
// This is where we will define all of our routing rules!
// We will have to require this in the server.js file (and pass it app!)

// First at the top of your routes.js file you'll have to require the controller
var appointments = require('../controllers/appointments.js');

module.exports = function(app) {

	//appointments routes
	app.get('/appointments', function(req, res) {
		appointments.show(req, res);
	});
	app.post('/appointments', function(req, res) {
		appointments.create(req, res);
	});
	app.delete('/appointments/:id/destroy', function(req, res) {
		appointments.destroy(req, res);
	});
};