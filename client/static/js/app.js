var superDoc = document;
var keysPressed = {
    up: false,
    left: false,
    right: false,
    down: false
};

jQuery(function($){
    'use strict';

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     *
     * @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, playerJoinedRoom: Function, beginNewGame: Function, onNewWordData: Function, hostCheckAnswer: Function, gameOver: Function, error: Function}}
     */
    var IO = {

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('error', IO.error );
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.io.engine.id;
        },

        /**
         * A new game has been created and a random game ID has been generated.
         * @param data {{ gameId: int, mySocketId: * }}
         */
        onNewGameCreated : function(data) {
            App.Host.gameInit(data);
        },

        /**
         * A player has successfully joined the game.
         * @param data {{playerName: string, gameId: int, mySocketId: int}}
         */
        playerJoinedRoom : function(data) {
            // When a player joins a room, do the updateWaitingScreen funciton.
            // There are two versions of this function: one for the 'host' and
            // another for the 'player'.
            //
            // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
            // And on the player's browser, App.Player.updateWaitingScreen is called.
            App[App.myRole].updateWaitingScreen(data);
        },

        /**
         * Both players have joined the game.
         * @param data
         */
        beginNewGame : function(data) {
            App[App.myRole].gameCountdown(data);
        },

        /**
         * An error has occurred.
         * @param data
         */
        error : function(data) {
            alert(data.message);
        }
    };

    var App = {

        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         *
         */
        gameId: 0,

        /**
         * This is used to differentiate between 'Host' and 'Player' browsers.
         */
        myRole: '',   // 'Player' or 'Host'

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        player: false,

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();

            // Initialize the fastclick library
            // FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function () {
            App.$doc = $(document);
            App.$window = $(window);

            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
            App.$hootpad = $('#hootpad-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {
            // Host
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);

            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /**
         * Show the initial Anagrammatix Title Screen
         * (with Start and Join buttons)
         */
        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
        },


        /* *******************************
           *         HOST CODE           *
           ******************************* */
        Host : {

            /**
             * Contains references to player data
             */
            players : [],

            circles : {},

            /**
             * Flag to indicate if a new game is starting.
             * This is used after the first game ends, and players initiate a new game
             * without refreshing the browser windows.
             */
            isNewGame : false,

            /**
             * Keep track of the number of players that have joined the game.
             */
            numPlayersInRoom: 0,

            scores: [],

            gameStarted: false,

            /**
             * Handler for the "Start" button on the Title Screen.
             */
            onCreateClick: function () {
                // console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame',App.$window.width(), App.$window.height());
            },

            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: * }}
             */
            gameInit: function (data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;

                App.Host.displayNewGameScreen();
                IO.socket.on('gameLoop', App.Host.draw );
                IO.socket.on('newCircle', App.Host.addCircle);
                IO.socket.on('removeCircle', App.Host.removeCircle);
                IO.socket.on('gameOver', App.Host.gameOver);
                IO.socket.on('bulletFired', App.Host.removeRing);
                IO.socket.on('bulletReady', App.Host.addRing);
                // console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
            },

            /**
             * Show the Host screen containing the game URL and unique game ID
             */
            displayNewGameScreen : function() {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateNewGame);

                // Display the URL on screen
                $('#gameURL').text(window.location.href);

                // Show the gameId / room id on screen
                $('#spanNewGameCode').text(App.gameId);
            },

            /**
             * Update the Host screen when the first player joins
             * @param data{{playerName: string}}
             */
            updateWaitingScreen: function(data) {
                // If this is a restarted game, show the screen.
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }
                // Update host screen
                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player ' + data.playerName + ' joined the game.');

                App.Host.scores.push({name: data.playerName,score: 0});

                // Store the new player's data on the Host.
                App.Host.players.push(data);

                // Increment the number of players in the room
                App.Host.numPlayersInRoom += 1;
                // console.log(App.Host.numPlayersInRoom);
                data = {mySocketId: data.mySocketId, shipNum: App.Host.numPlayersInRoom};
                IO.socket.emit('playerCounted', data);
                IO.socket.emit('socket',App.$window.width(), App.$window.height(), App.gameId);

                // If two players have joined, start the game!
                if (App.Host.numPlayersInRoom === 1){
                    App.Host.gameStarted = true;
                    $(".createGameWrapper").prepend("<button id='quickStart'>Start Game Now</button>");
                    $("#quickStart").click(function(){
                        IO.socket.emit('hostRoomFull', App.gameId);
                    });
                }

                if (App.Host.numPlayersInRoom === 4) {
                    // console.log('Room is full. Almost ready!');

                    // Let the server know that two players are present.
                    if(!App.Host.gameStarted) IO.socket.emit('hostRoomFull', App.gameId);
                    App.Host.gameStarted = true;
                }
            },

            /**
             * Show the countdown screen
             */
            gameCountdown : function() {

                // Prepare the game screen with new HTML
                App.$gameArea.html(App.$hostGame);
                $('body').attr('background','/static/img/spaceBackground.jpg');

                // Begin the on-screen countdown timer
                var $secondsLeft = $('#hostWord');
                App.countDown( $secondsLeft, 5, function(){
                    $('#svg').empty();
                    $secondsLeft.hide();
                    IO.socket.emit('hostCountdownFinished', App.gameId);
                });

                // Display the players' names on screen
                // $('#player1Score')
                //     .find('.playerName')
                //     .html(App.Host.players[0].playerName);

                // $('#player2Score')
                //     .find('.playerName')
                //     .html(App.Host.players[1].playerName);

                // Set the Score section on screen to 0 for each player.
                // $('#player1Score').find('.score').attr('id',App.Host.players[0].mySocketId);
                // $('#player2Score').find('.score').attr('id',App.Host.players[1].mySocketId);
            },
            draw: function(circles){
                var el;
                for(var i in circles){
                    el = $('#'+circles[i].html_id);
                    el.attr("cx", circles[i].cx);
                    el.attr("cy", circles[i].cy);
                }
                // console.log(circles);
                requestAnimationFrame(function (timestamp){
                    IO.socket.emit('newFrame', timestamp);
                });
            },
            removeCircle: function(html_id){
                $('#' + html_id).remove();
            },
            addCircle: function(attrs){
                var el = superDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
                for (var k in attrs) {
                    el.setAttribute(k, attrs[k]);
                }
                // console.log(attrs);
                $('#svg').append(el);
                $('#' + el.id).hide();
                // if(el.id[0] == 'a') $('#' + el.id).show('fade', 1000);
                $('#' + el.id).show();
            },
            removeRing: function(html_id){
                $('#' + html_id).removeAttr('stroke-width');
                $('#' + html_id).removeAttr('stroke');
            },
            addRing: function(html_id){
                $('#' + html_id).attr('stroke-width', 8);
                $('#' + html_id).attr('stroke', 'purple');
            },
            /**
             * Let everyone know the game has ended.
             * @param data
             */
            gameOver : function(player) {
                var str;
                var color = ['green',' red','blue','yellow'];
                if(player){
                    str = "<div style='font-size: 3vw; text-align: center'><p style='font-size: 3vw; text-align: center;'>"+player+": " + App.Host.scores[player[player.length-1]-1].name + " is the winner!</p>";
                    App.Host.scores[player[player.length-1]-1].score++;
                }
                else str = "<div style='font-size: 3vw; text-align: center'><p style='font-size: 3vw; text-align: center;'>Tie Game!</p>";
                for(var i in App.Host.scores){
                    str += "<p style='font-size: 3vw; text-align: center; color:" + color[i] + "'>" + App.Host.scores[i].name + ": " + App.Host.scores[i].score + "</p>";
                }
                str += "<button id='resetButton' class='btn' style='font-size: 3vw; text-align: center'>Play Again</button></div>";
                App.$gameArea.html(str);
                $('#resetButton').click(function(){
                    App.Host.gameCountdown();
                });
            },

            /**
             * All 10 rounds have played out. End the game.
             * @param data
             */
            endGame : function(data) {
                // Get the data for player 1 from the host screen
                var $p1 = $('#player1Score');
                var p1Score = +$p1.find('.score').text();
                var p1Name = $p1.find('.playerName').text();

                // Get the data for player 2 from the host screen
                var $p2 = $('#player2Score');
                var p2Score = +$p2.find('.score').text();
                var p2Name = $p2.find('.playerName').text();

                // Find the winner based on the scores
                var winner = (p1Score < p2Score) ? p2Name : p1Name;
                var tie = (p1Score === p2Score);

                // Display the winner (or tie game message)
                if(tie){
                    $('#hostWord').text("It's a Tie!");
                } else {
                    $('#hostWord').text( winner + ' Wins!!' );
                }

                // Reset game data
                App.Host.numPlayersInRoom = 0;
                App.Host.isNewGame = true;
            },

            /**
             * A player hit the 'Start Again' button after the end of a game.
             */
            restartGame : function() {
                App.$gameArea.html(App.$templateNewGame);
                $('#spanNewGameCode').text(App.gameId);
            }
        },


        /* *****************************
           *        PLAYER CODE        *
           ***************************** */

        Player : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',

            /**
             * Click handler for the 'JOIN' button
             */
            onJoinClick: function () {
                // console.log('Clicked "Join A Game"');

                // Display the Join Game HTML on the player's screen.
                App.$gameArea.html(App.$templateJoinGame);
            },

            /**
             * The player entered their name and gameId (hopefully)
             * and clicked Start.
             */
            onPlayerStartClick: function() {
                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName : $('#inputPlayerName').val() || 'anon'
                };
                // Send the gameId and playerName to the server
                IO.socket.on('shipMade', App.Player.onShipMade);
                App.$gameArea.html(App.$hootpad);
                $.ajax({
                    type: 'GET',
                    url: "http://192.168.1.3:8888/gamepads/Touch",
                    dataType: 'jsonp',
                    success: function (response) {
                        // buttons = data[0].buttons;
                        IO.socket.emit('playerJoinGame', data);
                        console.log()
                        $( "#gameArea" ).html( response[0].code );
                        // for(i in buttons){
                        //     $("#"+buttons[i]).click()
                        // }
                    },
                    error: function (response) {
                        IO.socket.emit('playerJoinGame', data);
                        $('#gameArea').html('</script><style>#joystick, #swiper{display: inline-block;width: 50%;height: 100%;}</style><div id="joystick"></div><div id="swiper"></div>');

                    }
                });

                //Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
            },

            onShipMade: function(pId){
                IO.socket.emit('playerReady', pId);
                var joystick = superDoc.getElementById('joystick');
                var mcj = new Hammer.Manager(joystick);
                mcj.add( new Hammer.Pan() );
                // mc.add( new Hammer.Press({event: pressup}) );
                mcj.on("panmove", function(e){
                    IO.socket.emit('joystickMoved', {dx: e.deltaX, dy: e.deltaY, pId: pId});
                });
                mcj.on("panend pancancel", function(e){
                    IO.socket.emit('joystickMoved', {dx: 0, dy: 0, pId: pId});
                });
                var swiper = superDoc.getElementById('swiper');
                var mcs = new Hammer.Manager(swiper);
                mcs.add( new Hammer.Swipe() );
                // mc.add( new Hammer.Press({event: pressup}) );
                mcs.on("swipe", function(e){
                    IO.socket.emit('swipeOccurred', {vx: e.velocityX, vy: e.velocityY, pId: pId});
                });
                //up: 38, left: 37, right: 39, down: 40 
                $(document).keydown(function(e) {
                    // console.log(e.keyCode);
                    var keyEvent = false;
                    if (e.keyCode == 38 && !keysPressed['up']) {
                        keysPressed['up'] = true;
                        keyEvent = 'upButtonPressed';
                    } else if (e.keyCode == 37 && !keysPressed['left']) {
                        keysPressed['left'] = true;
                        keyEvent = 'leftButtonPressed';
                    } else if (e.keyCode == 39 && !keysPressed['right']) {
                        keysPressed['right'] = true;
                        keyEvent = 'rightButtonPressed';
                    } else if (e.keyCode == 40 && !keysPressed['down']) {
                        keysPressed['down'] = true;
                        keyEvent = 'downButtonPressed';
                    }
                    if(keyEvent) IO.socket.emit(keyEvent, pId);
                });
                //to detect multiple keys being pressed 
                $(document).keyup(function(e) {
                    var keyEvent = false;
                    if (e.keyCode == 38){
                        keysPressed['up'] = false;
                        keyEvent = 'upButtonReleased';
                    }
                    else if (e.keyCode == 37){
                        keysPressed['left'] = false;
                        keyEvent = 'leftButtonReleased';
                    }
                    else if (e.keyCode == 39){
                        keysPressed['right'] = false;
                        keyEvent = 'rightButtonReleased';
                    }
                    else if (e.keyCode == 40){
                        keysPressed['down'] = false;
                        keyEvent = 'downButtonReleased';
                    }
                    if(keyEvent) IO.socket.emit(keyEvent, pId);
                });
            },

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            onPlayerRestart : function() {
                var data = {
                    gameId : App.gameId,
                    playerName : App.Player.myName
                };
                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },

            /**
             * Display the waiting screen for player 1
             * @param data
             */
            updateWaitingScreen : function(data) {
                if(IO.socket.io.engine.id === data.mySocketId){
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
                }
            },

            /**
             * Display 'Get Ready' while the countdown timer ticks down.
             * @param hostData
             */
            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.mySocketId;
                // $('#gameArea').html('<div class="gameOver">Get Ready!</div>');
            },

            /**
             * Show the "Game Over" screen.
             */
            endGame : function() {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                        // Create a button to start a new game.
                        $('<button>Start Again</button>')
                            .attr('id','btnPlayerRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            }
        },
        /* **************************
                  UTILITY CODE
           ************************** */

        /**
         * Display the countdown timer on the Host screen
         *
         * @param $el The container element for the countdown timer
         * @param startTime
         * @param callback The function to call when the timer ends.
         */
        countDown : function( $el, startTime, callback) {

            // Display the starting time on the screen.
            $el.text(startTime);

            // console.log('Starting Countdown...');

            // Start a 1 second timer
            var timer = setInterval(countItDown,1000);
            // Decrement the displayed timer value on each 'tick'
            function countItDown(){
                startTime -= 1;
                $el.text(startTime);

                if( startTime <= 0 ){
                    // console.log('Countdown Finished.');

                    // Stop the timer and do the callback.
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        }
    };
    IO.init();
    App.init();

}($));
