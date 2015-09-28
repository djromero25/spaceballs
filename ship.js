function Player(cx, cy, r) {
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
		html_id: 'player'
	};

	this.initialize = function() {
		//create a circle 
		var circle = makeSVG('circle', {
			cx: this.info.cx,
			cy: this.info.cy,
			r: this.info.r,
			id: this.info.html_id,
			style: "fill: red"
		});

		document.getElementById('svg').appendChild(circle);
	};
	//up: 38, left: 37, right: 39, down: 40
	$(document).keydown(function(e) {
		if (e.keyCode == 38 && !keysPressed['up']) {
			keysPressed['up'] = true;
			keysPressed['down'] = false;
		} else if (e.keyCode == 37 && !keysPressed['left']) {
			keysPressed['left'] = true;
			keysPressed['right'] = false;
		} else if (e.keyCode == 39 && !keysPressed['right']) {
			keysPressed['left'] = false;
			keysPressed['right'] = true;
		} else if (e.keyCode == 40 && !keysPressed['down']) {
			keysPressed['up'] = false;
			keysPressed['down'] = true;
		}
	});
	//to detect multiple keys being pressed 
	$(document).keyup(function(e) {
		if (e.keyCode == 38) keysPressed['up'] = false;
		else if (e.keyCode == 37) keysPressed['left'] = false;
		else if (e.keyCode == 39) keysPressed['right'] = false;
		else if (e.keyCode == 40) keysPressed['down'] = false;
	});
	this.update = function(time) {
		var el = document.getElementById(this.info.html_id);

		//see if the circle is going outside the browser. if it is, reverse the velocity
		// if (this.info.cx > document.body.clientWidth - this.info.r || this.info.cx < 0 + this.info.r) {
		// 	this.info.velocity.x = this.info.velocity.x * -1;
		// }
		// if (this.info.cy > document.body.clientHeight - this.info.r || this.info.cy < 0 + this.info.r) {
		// 	this.info.velocity.y = this.info.velocity.y * -1;
		// }
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