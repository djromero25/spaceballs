function Bullet(cx, cy, r, html_id, color) {
	// var html_id = html_id;
	this.info = {
		cx: cx,
		cy: cy,
		r: r,
		html_id: html_id,
		color: color
	};

	//private function that generates a random number
	var randomNumberBetween = function(min, max) {
		return Math.random() * (max - min) + min;
	};

	this.initialize = function() {
		//give a random velocity for the bullet
		this.info.velocity = {
			x: randomNumberBetween(-3, 3),
			y: randomNumberBetween(-3, 3)
		};
		
		//create a bullet
		var bullet = makeSVG('circle', {
			cx: this.info.cx,
			cy: this.info.cy,
			r: this.info.r,
			id: html_id,
			fill: 'none',
			'stroke-width': (this.info.r/2),
			stroke: this.info.color,
		});

		document.getElementById('svg').appendChild(bullet);
	};

	this.update = function(time) {
		var el = document.getElementById(html_id);

		//see if the bullet is going outside the browser. if it is, reverse the velocity
		if (this.info.cx > document.body.clientWidth - this.info.r || this.info.cx < 0 + this.info.r) {
			this.info.velocity.x = this.info.velocity.x * -1;
		}
		if (this.info.cy > document.body.clientHeight - this.info.r || this.info.cy < 0 + this.info.r) {
			this.info.velocity.y = this.info.velocity.y * -1;
		}

		this.info.cx = this.info.cx + this.info.velocity.x * time;
		this.info.cy = this.info.cy + this.info.velocity.y * time;

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