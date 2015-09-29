var numShip = 0;
var controlScheme = [
	{
		up: 38,
		left: 37,
		right: 39,
		down: 40
	},
	{
		up: 87,
		left: 65,
		right: 68,
		down: 83
	},
	{
		up: false,
		left: false,
		right: false,
		down: false
	},
	{
		up: false,
		left: false,
		right: false,
		down: false
	}
];
var color = ['green',' red','blue','yellow'];

function Player(cx, cy, r) {
	var _this = this;
	var bulletCounter = 0
	var keyID = controlScheme[numShip];
	var fillColor = color[numShip];
	numShip++;
	var keysPressed = {
		up: false,
		left: false,
		right: false,
		down: false
	};

	this.info = {
		cx: cx,
		cy: cy,
		r: r,
		vx: 0,
		vy: 0,
		html_id: 'player'+numShip
	};

	this.initialize = function() {
		//create a circle
		var circle = makeSVG('circle', {
			cx: this.info.cx,
			cy: this.info.cy,
			r: this.info.r,
			id: this.info.html_id,
			style: "fill: " + fillColor
		});

		document.getElementById('svg').appendChild(circle);
	};
	//up: 38, left: 37, right: 39, down: 40
	$(document).keydown(function(e) {
		// console.log(e.keyCode);
		if (e.keyCode == keyID.up && !keysPressed['up']) {
			keysPressed['up'] = true;
			keysPressed['down'] = false;
		} else if (e.keyCode == keyID.left && !keysPressed['left']) {
			keysPressed['left'] = true;
			keysPressed['right'] = false;
		} else if (e.keyCode == keyID.right && !keysPressed['right']) {
			keysPressed['left'] = false;
			keysPressed['right'] = true;
		} else if (e.keyCode == keyID.down && !keysPressed['down']) {
			keysPressed['up'] = false;
			keysPressed['down'] = true;
		} else if (e.keyCode == 32) { //32 is spacebar
			var bullet = new Bullet(_this.info.cx, _this.info.cy, 15, fillColor+bulletCounter++,fillColor);
			bulletArray.push(bullet);
		}
	});
	//to detect multiple keys being pressed 
	$(document).keyup(function(e) {
		if (e.keyCode == keyID.up) keysPressed['up'] = false;
		else if (e.keyCode == keyID.left) keysPressed['left'] = false;
		else if (e.keyCode == keyID.right) keysPressed['right'] = false;
		else if (e.keyCode == keyID.down) keysPressed['down'] = false;
	});
	this.update = function(time) {
		var el = document.getElementById(this.info.html_id);

		// see if the ship touches the browser edge. If it does they lose.
		if (this.info.cx > document.body.clientWidth - this.info.r || this.info.cx < 0 + this.info.r) {
			gameOverEvent.player = this.info.html_id;
			document.dispatchEvent(gameOverEvent);
		}
		if (this.info.cy > document.body.clientHeight - this.info.r || this.info.cy < 0 + this.info.r) {
			gameOverEvent.player = this.info.html_id;
			document.dispatchEvent(gameOverEvent);
		}

		if (keysPressed['up']) this.info.vy = -5;
		else if (keysPressed['down']) this.info.vy = 5;
		else this.info.vy = 0;

		if (keysPressed['left']) this.info.vx = -5;
		else if (keysPressed['right']) this.info.vx = 5;
		else this.info.vx = 0;

		this.info.cx = this.info.cx + this.info.vx * time;
		this.info.cy = this.info.cy + this.info.vy * time;

		el.setAttribute("cx", this.info.cx);
		el.setAttribute("cy", this.info.cy);
	};

	//creates the SVG element and returns it
	var makeSVG = function(tag, attrs) {
		var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
		for (var k in attrs) {
			el.setAttribute(k, attrs[k]);
		}
		return el;
	};

	this.initialize();
}