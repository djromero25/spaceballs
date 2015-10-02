var io;
var gameSocket;
var playground;

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket) {
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', {
        message: "You are connected!"
    });

    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerRestart', playerRestart);
    gameSocket.on('upButtonPressed', onUpButtonPressed);
    gameSocket.on('leftButtonPressed', onLeftButtonPressed);
    gameSocket.on('rightButtonPressed', onRightButtonPressed);
    gameSocket.on('downButtonPressed', onDownButtonPressed);
    gameSocket.on('upButtonReleased', onUpButtonReleased);
    gameSocket.on('leftButtonReleased', onLeftButtonReleased);
    gameSocket.on('rightButtonReleased', onRightButtonReleased);
    gameSocket.on('downButtonReleased', onDownButtonReleased);
    gameSocket.on('playerCounted', function(data){io.to(data.mySocketId).emit('shipMade', data.shipNum);});
    gameSocket.on('playerReady', onPlayerReady);
    gameSocket.on('newFrame', runLoop);
    gameSocket.on('joystickMoved', onJoystickMove);
    gameSocket.on('swipeOccurred', onSwipe);
};

/* *******************************
 *                             *
 *       HOST FUNCTIONS        *
 *                             *
 ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
function hostCreateNewGame(w,h) {
    // Create a unique Socket.IO Room
    var thisGameId = 1;//(Math.random() * 100000) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {
        gameId: thisGameId,
        mySocketId: this.id
    });
    gameOver = false;
    playground = new PlayGround(thisGameId);
    playground.setWindow(w,h);
    // Join the Room and wait for the players
    this.join(thisGameId.toString());
}

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareGame(gameId) {
    var sock = this;
    var data = {
        mySocketId: sock.id,
        gameId: gameId
    };
    // console.log("All Players Present. Preparing game...");
    
    io.sockets.in(gameId).emit('beginNewGame', data);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
    console.log('Game Started.');
    playground.init();
    io.sockets.in(gameId).emit('gameStart');
}

/* *****************************
 *                           *
 *     PLAYER FUNCTIONS      *
 *                           *
 ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
    // console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );
    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = io.sockets.adapter.rooms[data.gameId];

    // If the room exists...
    if (room != undefined) {
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        io.to(sock.id).emit('error', {
            message: "This room does not exist."
        });
    }
}
/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
    // console.log('Player: ' + data.playerName + ' ready for new game.');

    // Emit the player's data back to the clients in the game room.
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom', data);
}

var onUpButtonPressed = function(shipNum){ playground.setVelocity(shipNum-1,'vy', -1); };
var onLeftButtonPressed = function(shipNum) { playground.setVelocity(shipNum-1,'vx', -1); };
var onRightButtonPressed = function(shipNum) { playground.setVelocity(shipNum-1,'vx', 1); };
var onDownButtonPressed = function(shipNum) { playground.setVelocity(shipNum-1,'vy', 1); };
var onUpButtonReleased = function(shipNum) { playground.setVelocity(shipNum-1,'vy', 1); };
var onLeftButtonReleased = function(shipNum) { playground.setVelocity(shipNum-1,'vx', 1); };
var onRightButtonReleased = function(shipNum) { playground.setVelocity(shipNum-1,'vx', -1); };
var onDownButtonReleased = function(shipNum) { playground.setVelocity(shipNum-1,'vy', -1); };
var onPlayerReady = function(pId){ playground.addPlayer(pId); };
var runLoop = function(timestamp){ playground.loop(timestamp); };
var onJoystickMove = function(data){
    var maxVel = 10;
    var vx = data.dx / 10;
    if(vx > maxVel) vx = maxVel;
    else if(vx < -1*maxVel) vx = -1*maxVel;
    var vy = data.dy / 10;
    if(vy > maxVel) vy = maxVel;
    else if(vy < -1*maxVel) vy = -1*maxVel;
    playground.setBothVelocity(data.pId-1, vx, vy);
};
var onSwipe = function(data){
    var maxVel = 15;
    var vx = data.vx * -8;
    if(vx > maxVel) vx = maxVel;
    else if(vx < -1*maxVel) vx = -1*maxVel;
    var vy = data.vy * -8;
    if(vy > maxVel) vy = maxVel;
    else if(vy < -1*maxVel) vy = -1*maxVel;
    playground.shootBullet(data.pId-1, vx, vy);
};


/* *************************
 *                       *
 *      GAME LOGIC       *
 *                       *
 ************************* */

/* **************************
         PLAYGROUND CODE
  ************************** */
var _W = 0;
var _H = 0;
var vFactor = 25;
var gameOver = false;

var PlayGround = function(gameId) {
    var _this = this;
    var counter = 0; //counts the number of circles created
    var currentCorner = 0;
    var cornerCoord;
    var asteroids = []; //array that will hold all the circles created in the app
    this.players = [];
    this.bullets = {};
    var bulletActive = [true,true,true,true];
    var astTime = 300;
    var delta = 0;
    var lastFrameTimeMS = 0;
    // We want to simulate 1000 ms / 60 FPS = 16.667 ms per frame every time we run update()
    var timestep = 1000 / 60;
    var firstLoop = true;
    this.deadPlayers = [false,false,false,false];

    this.addPlayer = function(pId) {
        var player = new Ship(_W/2, _H*pId/5, 25, pId, gameId);
        this.players.push(player);
    };
    this.setVelocity = function(shipNum, a, b) {
        if(this.players[shipNum]) this.players[shipNum].setVelocity(a, b);
    };
    this.setBothVelocity = function(shipNum, vx, vy) {
        if(this.players[shipNum]) this.players[shipNum].setBothVelocity(vx, vy);
    };
    this.shootBullet = function (shipNum, vx, vy){
        if(!this.players[shipNum]) return;
        if(!bulletActive[shipNum]) return;
        bulletActive[shipNum] =  false;
        var cx = this.players[shipNum].info.cx + (this.players[shipNum].info.r + 15) * vx/Math.sqrt(vx*vx + vy*vy);
        var cy = this.players[shipNum].info.cy + (this.players[shipNum].info.r + 15) * vy/Math.sqrt(vx*vx + vy*vy);
        var bullet = new Bullet(cx, cy, 10, vx, vy, 'bullet'+shipNum, 'purple', gameId);
        this.bullets['bullet'+shipNum] = bullet;
        setTimeout(function(){
            _this.bullets['bullet'+shipNum] = false;
            io.sockets.in(gameId).emit('removeCircle', 'bullet'+shipNum);
        }, 3000);
        io.sockets.in(gameId).emit('bulletFired', _this.players[shipNum].info.html_id);
        setTimeout(function(){
            bulletActive[shipNum] =  true;
            if(_this.players[shipNum]) io.sockets.in(gameId).emit('bulletReady', _this.players[shipNum].info.html_id);
        }, 5000);
    };
    this.setWindow = function(w,h) {
        console.log("setting window");
        _W = w;
        _H = h;
    };

    //a loop that updates the asteroid's position on the screen
    this.loop = function(timestamp) {
        if(gameOver) return;
        var data;
        if(timestamp === undefined) delta = 0;
        else {
            delta += timestamp - lastFrameTimeMS;
            if(firstLoop){
                delta = 0;
                firstLoop = false;
            }
            lastFrameTimeMS = timestamp;
        }
        //Update positions
        var numUpdateSteps = 0;
        var asteroid, bullet, player, playerData;
        while (delta >= timestep) {
            data = [];
            for (asteroid in asteroids) {
                data.push(asteroids[asteroid].update(timestep));
            }
            for (player in this.players) {
                if(this.players[player]){
                    playerData = this.players[player].update(timestep);
                    if(!playerData) someoneDied(this.players[player].info.html_id,player);
                    else data.push(playerData);
                }
            }
            for (bullet in this.bullets) {
               if(this.bullets[bullet]) data.push(this.bullets[bullet].update(timestep));
            }
            delta -= timestep;
            if (++numUpdateSteps >= 240) {
                delta = 0; // fix things
                break; // bail out
            }
        }
        io.sockets.in(gameId).emit('gameLoop', data);
        for (player in this.players) {
            if(this.players[player]){
                collisionCheck(this.players[player], player);
            }
        }
        if (astTime-- === 0) {
            astTime = 300;
            addAsteroid();
        }
    };
    this.createNewAsteroid = function(x, y, r) {
        var new_asteroid = new Asteroid(x, y, r, counter++, gameId);
        // $("#" + (counter - 1)).hide();
        // $("#" + (counter - 1)).fadeTo(1000, 1);
        asteroids.push(new_asteroid);
    };
    var addAsteroid = function() {
        var r = Math.floor(Math.random() * (50 - 5 + 1)) + 5;
        _this.createNewAsteroid(cornerCoord[currentCorner].x, cornerCoord[currentCorner].y, r);
        if (currentCorner == 3) currentCorner = 0;
        else currentCorner++;
    };

    function collisionCheck(player, playerIndex) {
        var dist;
        var minDist;
        var dx, dy, i;
        for (i in asteroids) {
            dx = Math.abs(player.info.cx - asteroids[i].info.cx);
            dy = Math.abs(player.info.cy - asteroids[i].info.cy);
            if (dx <= 100 || dy <= 100) {
                minDist = player.info.r + asteroids[i].info.r;
                dist = Math.sqrt(dx * dx + dy * dy);
                if(dist < minDist){
                    someoneDied(player.info.html_id,playerIndex);
                    break;
                }
            }
        }
        var keys = Object.keys(_this.bullets);
        for (i=0;i<keys.length;i++) {
            if(_this.bullets[keys[i]]){
                dx = Math.abs(player.info.cx - _this.bullets[keys[i]].info.cx);
                dy = Math.abs(player.info.cy - _this.bullets[keys[i]].info.cy);
                minDist = player.info.r + _this.bullets[keys[i]].info.r;
                dist = Math.sqrt(dx * dx + dy * dy);
                if(dist < minDist){
                    someoneDied(player.info.html_id,playerIndex);
                    break;
                }
            }
        }
    }
    function someoneDied(html_id, playerIndexToRemove){
        _this.deadPlayers[playerIndexToRemove] = _this.players[playerIndexToRemove];
        _this.players[playerIndexToRemove] = false;
        io.sockets.in(gameId).emit('removeCircle', html_id);
        var count = 0;
        var playerIndex = 0;
        for(var i in _this.players){
            if(_this.players[i]){
                count++;
                playerIndex = i;
            }
        }
        if(count <= 1){
            gameOver = true;
            io.to(gameId).emit('gameOver', _this.players[playerIndex].info.html_id || false);
        }
    }
    this.init = function() {
        cornerCoord = [{
            x: 100,
            y: 100
        }, {
            x: _W - 100,
            y: 100
        }, {
            x: _W - 100,
            y: _H - 100
        }, {
            x: 100,
            y: _H - 100
        }];
        astTime = 300;
        delta = 0;
        lastFrameTimeMS = 0;
        firstLoop = true;
        var i;
        for(i in _this.deadPlayers){
            if(_this.deadPlayers[i] ){
                _this.players[i] = _this.deadPlayers[i];
                _this.deadPlayers[i] = false;
            }
        }
        for(i in _this.players){
            _this.players[i].loadHome();
            _this.players[i].initialize();
            bulletActive[i] =  false;
            noBulletOnStart(i);
        }
        asteroids = [];
        gameOver = false;
        for (i = 0; i < 10; i++) {
            addAsteroid();
        }
        _this.loop();
    };
    function noBulletOnStart(index){
        setTimeout(function(){
            bulletActive[index] =  true;
            if(_this.players[index]) io.sockets.in(gameId).emit('bulletReady', _this.players[index].info.html_id);
        }, 3000);
    }
};
/* **************************
          ASTEROID CODE
   ************************** */
var Asteroid = function (cx, cy, r, html_id, gameId) {
    // var html_id = html_id;
    this.info = {
        cx: cx,
        cy: cy,
        r: r,
        html_id: "asteroid" + html_id
    };

    //private function that generates a random number
    var randomNumberBetween = function(min, max) {
        return Math.random() * (max - min) + min;
    };

    this.initialize = function() {
        //give a random velocity for the circle
        this.info.velocity = {
            x: randomNumberBetween(-3, 3),
            y: randomNumberBetween(-3, 3)
        };
        var data = {
            cx: this.info.cx,
            cy: this.info.cy,
            r: this.info.r,
            id: this.info.html_id,
            style: "fill: #5C1F00",
            'stroke-width': 3,
            stroke: 'white'
        };
        io.sockets.in(gameId).emit('newCircle', data);
    };

    this.update = function(time) {
        //see if the circle is going outside the browser. if it is, reverse the velocity
        if ((this.info.cx > (_W - this.info.r) && this.info.velocity.x > 0) || (this.info.cx < (0 + this.info.r) && this.info.velocity.x < 0)) {
            this.info.velocity.x = this.info.velocity.x * -1;
        }
        if ((this.info.cy > (_H - this.info.r) && this.info.velocity.y > 0) || (this.info.cy < (0 + this.info.r) && this.info.velocity.y < 0)) {
            this.info.velocity.y = this.info.velocity.y * -1;
        }

        this.info.cx = this.info.cx + this.info.velocity.x * time / vFactor;
        this.info.cy = this.info.cy + this.info.velocity.y * time / vFactor;
        return {cx: this.info.cx, cy: this.info.cy, html_id: this.info.html_id};
    };

    this.initialize();
};
var Ship = function(cx, cy, r, shipNum, gameId) {
    var color = ['green',' red','blue','yellow'];
    var _this = this;
    var fillColor = color[shipNum - 1];
    var initX = cx;
    var initY = cy;

    this.info = {
        cx: cx,
        cy: cy,
        r: r,
        vx: 0,
        vy: 0,
        html_id: 'player' + shipNum
    };
    this.initialize = function() {
        var data = {
            cx: this.info.cx,
            cy: this.info.cy,
            r: this.info.r,
            id: this.info.html_id,
            style: "fill: " + fillColor
            // 'stroke-width': 8,
            // stroke: 'purple'
        };
        io.sockets.in(gameId).emit('newCircle', data);
    };
    this.setVelocity = function(axis, dir){
        if(axis == 'vx') this.info.vx += 5 * dir;
        else if(axis == 'vy') this.info.vy += 5 * dir;
    };
    this.setBothVelocity = function(vx, vy) {
        this.info.vx = vx;
        this.info.vy = vy;
    };
    this.update = function(time) {
        // see if the ship touches the browser edge. If it does they lose.
        if (this.info.cx > _W - this.info.r || this.info.cx < 0 + this.info.r || this.info.cy > _H - this.info.r || this.info.cy < 0 + this.info.r) {
            return false;
        }
        // console.log(this.info.vx);
        this.info.cx = this.info.cx + this.info.vx * time / vFactor;
        this.info.cy = this.info.cy + this.info.vy * time / vFactor;
        return {cx: this.info.cx, cy: this.info.cy, html_id: this.info.html_id};
    };
    this.loadHome = function(){
        this.info.cx = initX;
        this.info.cy = initY;
        this.info.vx = 0;
        this.info.vy = 0;
    }
    this.initialize();
};
var Bullet = function(cx, cy, r, vx, vy, html_id, color, gameId) {
    // var html_id = html_id;
    this.info = {
        cx: cx,
        cy: cy,
        r: r,
        html_id: html_id,
        color: color,
        velocity: {
            x: vx,
            y: vy,
        }
    };

    //private function that generates a random number
    var randomNumberBetween = function(min, max) {
        return Math.random() * (max - min) + min;
    };

    this.initialize = function() {
        
        //create a bullet
        var data = {
            cx: this.info.cx,
            cy: this.info.cy,
            r: this.info.r,
            id: html_id,
            fill: 'none',
            'stroke-width': (this.info.r/2),
            stroke: this.info.color
        };
        io.sockets.in(gameId).emit('newCircle', data);
    };

    this.update = function(time) {
        //see if the bullet is going outside the browser. if it is, reverse the velocity
        if (this.info.cx > _W - this.info.r || this.info.cx < 0 + this.info.r) {
            this.info.velocity.x = this.info.velocity.x * -1;
        }
        if (this.info.cy > _H - this.info.r || this.info.cy < 0 + this.info.r) {
            this.info.velocity.y = this.info.velocity.y * -1;
        }

        this.info.cx = this.info.cx + this.info.velocity.x * time / vFactor;
        this.info.cy = this.info.cy + this.info.velocity.y * time / vFactor;
        return {cx: this.info.cx, cy: this.info.cy, html_id: this.info.html_id};
    };
    this.initialize();
};