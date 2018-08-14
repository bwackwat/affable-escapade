
var f = [
	0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,// left column
	30, 0, 100, 0, 30, 30,30, 30, 100, 0,100, 30,// top rung
	30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90];// middle rung

var square = [0, 0, 30, 0, 0, 30, 0, 30, 30, 0, 30, 30];// 30px wide

var tank = [-25, -15, 25, -15, -25, 15, -25, 15, 25, -15, 25, 15, -15, -20, -5, -20, -15, 20, -15, 20, -5, 20, -5, -20, 5, -20, 15, -20, 5, 20, 5, 20, 15, 20, 15, -20];

var smasherTank = [25, 5, 35, 10, 25, 15, 25, -5, 35, 0, 25, 5, 25, -15, 35, -10, 25, -5, 5, 20, 15, -20, 5, -20, 15, -20, 5, 20, 15, 20, -15, 20, -5, -20, -5, 20, -15, -20, -5, -20, -15, 20, 25, 15, -25, -15, -25, 15, -25, -15, 25, -15, 25, 15];
var sniperTank = [45, 3, 45, -3, 25, -3, 25, -3, 25, 3, 45, 3, 5, 20, 15, -20, 5, -20, 15, -20, 5, 20, 15, 20, -15, 20, -5, -20, -5, 20, -15, -20, -5, -20, -15, 20, 25, 15, -25, -15, -25, 15, -25, -15, 25, -15, 25, 15];
var flakkerTank = [35, 10, 35, -10, 25, 0, 25, 0, 25, 5, 35, 10, 25, -5, 35, -10, 25, 0, 5, 20, 15, -20, 5, -20, 15, -20, 5, 20, 15, 20, -15, 20, -5, -20, -5, 20, -15, -20, -5, -20, -15, 20, 25, 15, -25, -15, -25, 15, -25, -15, 25, -15, 25, 15];

var leftTankChunk = [0, -15, 10, -3, 0, 0, -5, -15, -5, -20, -15, -15, -15, -15, -15, -20, -5, -20, 0, -15, -25, -15, -10, -3, -10, -3, 0, 0, 0, -15, -25, -15, -25, 5, -10, -3];
var rightTankChunk = [10, -3, 10, 3, 25, -15, 10, 3, 0, 0, 10, -3, 25, -15, 25, -5, 10, 3, 15, -20, 15, -15, 5, -15, 5, -15, 5, -20, 15, -20, 0, -15, 10, -3, 25, -15];

// These are synchronized with the server's constants.
var maxSpeed = 10.0;
var acceleration = 0.05;
var backAcceleration = 0.03;
var maxTurnSpeed = 0.05;
var turnAcceleration = 0.0005;

sub_scripts.push(function(){
	var debugging = false;
	if("debug" in urlParams){
		debugging = true;
	}
	
	var explode = new Audio('/tanks/explode.mp3');

	var gameCanvas = document.getElementById("gameCanvas");
	var textCanvas = document.getElementById("textCanvas");

	var glworld = initialize_webgl(
		gameCanvas,
		textCanvas,
		true
	);
	
	//glworld.create_object("f", f, 150, 200);
	//glworld.create_object("square", square, 200, 20);
	
	glworld.text("status", "Welcome.", 10, 20);
	glworld.text("latency", "", 10, 30);
	
	if(debugging){
		glworld.text("state", "", 150, 10);
		glworld.text("client_state", "", gameCanvas.width / 2 + 50, 10);
		glworld.text("d1", "", 10, 40);
		glworld.text("d2", "", 10, 50);
		glworld.text("d3", "", 10, 60);
		glworld.text("d4", "", 10, 70);
		glworld.text("d5", "", 10, 80);
	}
	
	///////////////////////////////////////
	//        START NETWORKING
	///////////////////////////////////////
	
	var client = websocket_client();

	function connected(e){
		glworld.texts["status"].text = "Connected.";
		
		// Annouce my player.
		var msg = {};
		msg.announce = client.handle;
		msg.color = client.color;
		client.send(msg);
	}

	//var tag = 0;

	function receive(msg){
	
		// THIS IS NOT A SOLUTION.
		// TCP IS RELIABLE, YET THIS STOPS HALF GAME EVENTS FROM COMING THROUGH!
	
		//if(debugging){
		//	if(tag < 2){
		//		tag++;
		//		return;
		//	}else{
		//		tag = 0;
		//	}
		//}
	
		if(typeof msg.status !== 'undefined'){
			glworld.texts["status"].text = msg.status;
		}else if(typeof msg.connect !== 'undefined'){
			
		}else if(typeof msg.disconnect !== 'undefined'){
			delete glworld.objects[msg.disconnect + "tank"];
		}else if(typeof msg.explode !== 'undefined'){
		
			console.log(msg.explode + " exploded!");
		
			// Clear old explosion.
			
			if(msg.explode + "l1" in glworld.objects){
				delete glworld.objects[msg.explode + "l1"];
			}
			if(msg.explode + "r1" in glworld.objects){
				delete glworld.objects[msg.explode + "r1"];
			}
			if(msg.explode + "l2" in glworld.objects){
				delete glworld.objects[msg.explode + "l2"];
			}
			if(msg.explode + "r2" in glworld.objects){
				delete glworld.objects[msg.explode + "r2"];
			}
		
		
			// Create an explosion.
		
			glworld.create_object(msg.explode + "l1", leftTankChunk,
				glworld.objects[msg.explode].x,
				glworld.objects[msg.explode].y,
				glworld.objects[msg.explode].color, 1.0, 1.0,
				glworld.objects[msg.explode].rotation);
			glworld.objects[msg.explode + "l1"].owned = true;
			glworld.objects[msg.explode + "l1"].text = null;
			
			glworld.objects[msg.explode + "l1"].timed_animation("x",
				glworld.objects[msg.explode].x
				- 75 * Math.cos(glworld.objects[msg.explode].rotation - Math.PI / 4), 1000);
			glworld.objects[msg.explode + "l1"].timed_animation("y",
				glworld.objects[msg.explode].y
				- 75 * -1 * Math.sin(glworld.objects[msg.explode].rotation - Math.PI / 4), 1000);
			glworld.objects[msg.explode + "l1"].timed_animation("rotation",
				glworld.objects[msg.explode].rotation + Math.PI * 2, 1000);
			
			glworld.create_object(msg.explode + "r1", rightTankChunk,
				glworld.objects[msg.explode].x,
				glworld.objects[msg.explode].y,
				glworld.objects[msg.explode].color, 1.0, 1.0,
				glworld.objects[msg.explode].rotation);
			glworld.objects[msg.explode + "r1"].owned = true;
			glworld.objects[msg.explode + "r1"].text = null;
			
			glworld.objects[msg.explode + "r1"].timed_animation("x",
				glworld.objects[msg.explode].x
				+ 75 * Math.cos(glworld.objects[msg.explode].rotation - Math.PI / 4), 1000);
			glworld.objects[msg.explode + "r1"].timed_animation("y",
				glworld.objects[msg.explode].y
				- 75 * -1 * Math.sin(glworld.objects[msg.explode].rotation - Math.PI / 4), 1000);
			glworld.objects[msg.explode + "r1"].timed_animation("rotation",
				glworld.objects[msg.explode].rotation + Math.PI * 2, 1000);
			
			glworld.create_object(msg.explode + "l2", leftTankChunk,
				glworld.objects[msg.explode].x,
				glworld.objects[msg.explode].y,
				glworld.objects[msg.explode].color, 1.0, 1.0,
				glworld.objects[msg.explode].rotation + Math.PI);
			glworld.objects[msg.explode + "l2"].owned = true;
			glworld.objects[msg.explode + "l2"].text = null;
			
			glworld.objects[msg.explode + "l2"].timed_animation("x",
				glworld.objects[msg.explode].x
				+ 75 * Math.cos(glworld.objects[msg.explode].rotation - Math.PI / 4), 1000);
			glworld.objects[msg.explode + "l2"].timed_animation("y",
				glworld.objects[msg.explode].y
				+ 75 * -1 * Math.sin(glworld.objects[msg.explode].rotation - Math.PI / 4), 1000);
			glworld.objects[msg.explode + "l2"].timed_animation("rotation",
				glworld.objects[msg.explode].rotation + Math.PI * 2, 1000);
			
			glworld.create_object(msg.explode + "r2", rightTankChunk,
				glworld.objects[msg.explode].x,
				glworld.objects[msg.explode].y,
				glworld.objects[msg.explode].color, 1.0, 1.0,
				glworld.objects[msg.explode].rotation + Math.PI);
			glworld.objects[msg.explode + "r2"].owned = true;
			glworld.objects[msg.explode + "r2"].text = null;
			
			glworld.objects[msg.explode + "r2"].timed_animation("x",
				glworld.objects[msg.explode].x
				- 75 * Math.cos(glworld.objects[msg.explode].rotation - Math.PI / 4), 1000);
			glworld.objects[msg.explode + "r2"].timed_animation("y",
				glworld.objects[msg.explode].y
				+ 75 * -1 * Math.sin(glworld.objects[msg.explode].rotation - Math.PI / 4), 1000);
			glworld.objects[msg.explode + "r2"].timed_animation("rotation",
				glworld.objects[msg.explode].rotation + Math.PI * 2, 1000);
			
			delete glworld.objects[msg.explode];
			
			explode.play();
		}else if(typeof msg.players !== 'undefined'){
			if(debugging){
				glworld.texts["state"].text = "Server State: " + JSON.stringify(msg);
				glworld.texts["client_state"].text = "Client State: " + JSON.stringify(glworld.objects);
			}
			for(playerH in msg.players){
				for(tankH in glworld.objects){
					if(glworld.objects[tankH].owned && !(tankH in msg.players)){
					//	delete glworld.objects[tankH];
						continue;
					}
				}
				if(playerH in glworld.objects){
					glworld.objects[playerH].i = msg.players[playerH].i;
					glworld.objects[playerH].x = parseFloat(msg.players[playerH].x);
					glworld.objects[playerH].y = parseFloat(msg.players[playerH].y);
					glworld.objects[playerH].s = parseFloat(msg.players[playerH].s);
					glworld.objects[playerH].ts = parseFloat(msg.players[playerH].ts);
					glworld.objects[playerH].rotation = parseFloat(msg.players[playerH].r);
				}else{
					glworld.create_object(playerH, tank, msg.players[playerH].x, msg.players[playerH].y);
					
					glworld.objects[playerH].i = "nn";
					glworld.objects[playerH].s = 0;
					glworld.objects[playerH].ts = 0;
					glworld.objects[playerH].rotation = parseFloat(msg.players[playerH].r);

					glworld.objects[playerH].textX = 45.0;
					glworld.objects[playerH].textY = 45.0;
					glworld.objects[playerH].text = playerH;
					glworld.objects[playerH].owned = true;
				}
			}
			
		}else{
			console.log(JSON.stringify(msg));
			//console.log("Received junk?");
		}
	}

	function closed(e){
		console.log("CLOSED!");
		glworld.texts["status"].text = client.status;
	}

	function errored(e){
		//console.log(e);
		glworld.texts["status"].text = "Error.";
	}

	client.setupWebsocket(connected, receive, closed, errored);
	
	/////////////////////////////
	//      START ACTIONS
	/////////////////////////////
	
	// Local controls.
	var keys = {};
	var mouseDown = false;
	var mouseX = 0;
	var mouseY = 0;
	
	textCanvas.addEventListener('click', function(e){
		if(client.failed){
			console.log("Cannot spawn.");
			return;
		}
		var msg = {};
		msg.handle = client.handle;
		msg.x = e.clientX.toString();
		msg.y = e.clientY.toString();
		client.send(msg);
	}, false);
	
	textCanvas.addEventListener('mouseup', function(e){
		mouseDown = false;
		keys[37] = false;
		keys[38] = false;
		keys[39] = false;
		keys[40] = false;
		update_input();
	}, false);
	
	textCanvas.addEventListener('mousedown', function(e){
		mouseDown = true;
		mouseX = e.clientX;
		mouseY = e.clientY;
	}, false);
	
	textCanvas.addEventListener('mousemove', function(e){
		if(mouseDown){
			mouseX = e.clientX;
			mouseY = e.clientY;
		}
	}, false);
	
	// Send a client event. Only regarding movement changes currently.
	function update_input(){
		if(client.failed){
			return;
		}
		
		var msg = {};
		msg.handle = client.handle;
		msg.i = "";
		
		if(keys[38] && !keys[40]){
			msg.i += 'f';
		}else if(keys[40] && !keys[38]){
			msg.i += 'b';
		}else{
			msg.i += 'n';
		}
		
		if(keys[39] && !keys[37]){
			msg.i += 'r';
		}else if(keys[37] && !keys[39]){
			msg.i += 'l';
		}else{
			msg.i += 'n';
		}
		
		if(debugging){
			glworld.texts["d3"].text = JSON.stringify(msg);
		}
		
		client.send(msg);
	}
	
	window.onkeydown = function(e){
		if(!keys[e.keyCode]){
			keys[e.keyCode] = true;
			update_input();
		}
	};
	
	window.onkeyup = function(e){
		keys[e.keyCode] = false;
		update_input();
	};
	
	// Client game simulation loop.
	setInterval(function(){
		glworld.texts["status"].text = client.status;
		glworld.texts["latency"].text = "Latency: " + client.ping_ms + "ms";
		
		// This conditional is for mouse-controlled movement.
		if(mouseDown && client.handle + "tank" in glworld.objects){
			var xdiff = mouseX - glworld.objects[client.handle + "tank"].x;
			var ydiff = mouseY - glworld.objects[client.handle + "tank"].y;
			
			glworld.objects[client.handle + "tank"].rotation = glworld.objects[client.handle + "tank"].rotation % (Math.PI * 2);
			var turnSpeed = glworld.objects[client.handle + "tank"].ts;
			
			var angle = glworld.objects[client.handle + "tank"].rotation - Math.atan2(ydiff, -xdiff);
			
			angle = (angle + Math.PI * 2) % (Math.PI * 2);
			
			if(angle < 0){
				angle += 2 * Math.PI;
			}
			
			var needUpdate = false;
			
			if(angle > Math.PI / 2 && angle < Math.PI * 3 / 2){
				if(keys[38] != true){
					needUpdate = true;
				}
				keys[40] = false;
				keys[38] = true;
				//console.log("FORWARD");
			}else{
				if(keys[40] != true){
					needUpdate = true;
				}
				keys[40] = true;
				keys[38] = false;
				//console.log("BACKWARD");
			}
			
			if(debugging){
				glworld.texts["d1"].text = Math.PI - angle;
				glworld.texts["d2"].text = turnSpeed;
			}
			
			if(Math.abs(Math.PI - angle) > turnSpeed * 2){
				if(angle > Math.PI){
					if(keys[39] != true){
						needUpdate = true;
					}
					keys[39] = true;
					keys[37] = false;
					//console.log("LEFT")
				}else{
					if(keys[37] != true){
						needUpdate = true;
					}
					keys[39] = false;
					keys[37] = true;
					//console.log("RIGHT")
				}
			}else{
				if(keys[39] != false || 
				keys[37] != false){
					needUpdate = true;
				}
				keys[39] = false;
				keys[37] = false;
				//console.log("CENTER")
			}
			
			if(needUpdate){
				update_input();
			}
		}
		
		if(!debugging){
			for(tankH in glworld.objects){
				// Compensate only for owned items.
				if(glworld.objects[tankH].owned === undefined){
					continue;
				}
				// Compensat only for objects with input.
				if("i" in glworld.objects[tankH]){
					// THESE CALCULATIONS MATCH THE SERVER CALCULATIONS.
					if(glworld.objects[tankH].i.charAt(0) === 'f'){
						if(glworld.objects[tankH].s < maxSpeed){
							glworld.objects[tankH].s += acceleration;
						}
					}else if(glworld.objects[tankH].i.charAt(0) === 'b'){
						if(glworld.objects[tankH].s > -maxSpeed){
							glworld.objects[tankH].s -= backAcceleration;
						}
					}else{
						if(Math.abs(glworld.objects[tankH].s) <= acceleration){
							glworld.objects[tankH].s = 0;
						}else if(glworld.objects[tankH].s > 0){
							glworld.objects[tankH].s -= acceleration;
						}else if(glworld.objects[tankH].s < 0){
							glworld.objects[tankH].s += acceleration;
						}
					}
					
					if(glworld.objects[tankH].i.charAt(1) === 'l'){
						if(glworld.objects[tankH].ts < maxTurnSpeed){
							glworld.objects[tankH].ts += turnAcceleration;
						}
						glworld.objects[tankH].rotation += glworld.objects[tankH].ts;
					}else if(glworld.objects[tankH].i.charAt(1) === 'r'){
						if(glworld.objects[tankH].ts < maxTurnSpeed){
							glworld.objects[tankH].ts += turnAcceleration;
						}
						glworld.objects[tankH].rotation -= glworld.objects[tankH].ts;
					}else{
						if(glworld.objects[tankH].ts <= turnAcceleration){
							glworld.objects[tankH].ts = 0;
						}else if(glworld.objects[tankH].ts > 0){
							glworld.objects[tankH].ts -= acceleration;
						}
					}
					glworld.objects[tankH].x += glworld.objects[tankH].s * Math.cos(glworld.objects[tankH].rotation);
					glworld.objects[tankH].y += glworld.objects[tankH].s * -1 * Math.sin(glworld.objects[tankH].rotation);
				}
			}
		}
	}, 16);
	
	//TODO: Every frame? Can this just be in the client game simulator loop?
	glworld.afterRender = function(){
	};
});


