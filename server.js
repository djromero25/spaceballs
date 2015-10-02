// require express so that we can build an express app
var express = require('express');
// require path so that we can use path stuff like path.join
var path = require('path');

// Import the gameSocket file.
var game = require('./client/static/js/gameSocket');

// instantiate the app
var app = express();

// This goes in our server.js file so that we actually use the mongoose config file!
// require('./server/config/mongoose.js');

// store the function in a variable
// var routes_setter = require('./server/config/routes.js');
// invoke the function stored in routes_setter and pass it the "app" variable
// routes_setter(app);

// set up a static file server that points to the "client" directory
app.use(express.static(path.join(__dirname, './client')));
var server = app.listen(8888, function() {
	console.log('cool stuff on: 8888');
});

// this gets the socket.io module *new code!* 
var io = require('socket.io').listen(server);  // notice we pass the server object

// Reduce the logging output of Socket.IO
// io.set('log level',1);

// Whenever a connection event happens (the connection event is built in) run the following code
io.sockets.on('connection', function (socket) {
	game.initGame(io, socket);
});