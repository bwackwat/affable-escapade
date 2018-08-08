
var f = [
	// left column
	0, 0,
	30, 0,
	0, 150,
	0, 150,
	30, 0,
	30, 150,

	// top rung
	30, 0,
	100, 0,
	30, 30,
	30, 30,
	100, 0,
	100, 30,

	// middle rung
	30, 60,
	67, 60,
	30, 90,
	30, 90,
	67, 60,
	67, 90,
];

var square = [
	0, 0,
	30, 0,
	0, 30,
	0, 30,
	30, 0,
	30, 30,
];

var tank = [
	0, 0,
	50, 0,
	0, 30,
	0, 30,
	50, 0,
	50, 30,
	
	10, -5,
	20, -5,
	10, 35,
	10, 35,
	20, 35,
	20, -5,
	
	30, -5,
	40, -5,
	30, 35,
	30, 35,
	40, 35,
	40, -5,
];

sub_scripts.push(function(){
	var debugging = false;
	if("debug" in urlParams){
		debugging = true;
	}

	var gameCanvas = document.getElementById("gameCanvas");
	var textCanvas = document.getElementById("textCanvas");

	var glworld = initialize_webgl(
		gameCanvas,
		textCanvas,
		true
	);
	
	glworld.offset_shape(tank, -25, -15);
	
	//glworld.create_object("f", f, 150, 200);
	//glworld.create_object("square", square, 200, 20);
	
	if(debugging){
		glworld.text("status", "Welcome.", 10, 20);
		glworld.text("latency", "", 10, 30);
		glworld.text("d1", "", 10, 40);
		glworld.text("d2", "", 10, 50);
		glworld.text("d3", "", 10, 60);
		glworld.text("d4", "", 10, 60);
		glworld.text("d5", "", 10, 60);
	}
	
	////////////////////////////////
	//        START NETWORKING
	////////////////////////////////
	
	var client = websocket_client();

	function connected(e){
		//console.log(e);
		if(debugging){
			glworld.texts["status"].text = "Connected.";
		}
		//client.ws.send("\"get_users\"");
	}
	
	var spawned = {};

	function receive(msg){
		if(typeof msg.status !== 'undefined'){
			if(debugging){
				glworld.texts["status"].text = msg.status;
			}
		}else if(typeof msg.disconnect !== 'undefined'){
			delete glworld.objects[msg.disconnect];
		}else if(typeof msg.players !== 'undefined'){
			if(debugging){
				console.log(JSON.stringify(msg));
			}
			for(playerH in msg.players){
				for(tankH in glworld.objects){
					if(glworld.objects[tankH].owned && !(tankH in msg.players)){
						delete glworld.objects[tankH];
						continue;
					}
				}
				if(playerH in glworld.objects){
					glworld.objects[playerH].x = msg.players[playerH].x;
					glworld.objects[playerH].y = msg.players[playerH].y;
					glworld.objects[playerH].rotation = msg.players[playerH].r;
				}else{
					glworld.create_object(playerH, tank, msg.players[playerH].x, msg.players[playerH].y);
					
				//	Old code to reset ghost on "reconnect" not "refresh" here.
				//	if(debugging && playerH == client.handle){
				//		glworld.objects[playerH + " GHOST"].x = msg.players[playerH].x;
				//		glworld.objects[playerH + " GHOST"].y = msg.players[playerH].y;
				//		glworld.objects[playerH + " GHOST"].rotation = msg.players[playerH].r;
				//		glworld.objects[playerH + " GHOST"].color = msg.players[playerH].c;
				//	}

					glworld.objects[playerH].textX = 45.0;
					glworld.objects[playerH].textY = 45.0;
					glworld.objects[playerH].text = playerH + " tank";
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
		if(debugging){
			glworld.texts["status"].text = client.status;
		}
	}

	function errored(e){
		//console.log(e);
		if(debugging){
			glworld.texts["status"].text = "Error.";
		}
	}

	client.setupWebsocket(connected, receive, closed, errored);
	
	/////////////////////////////
	//      START ACTIONS
	/////////////////////////////
	
	var msg = {};
	
	var mouseDown = false;
	var mouseX = 0;
	var mouseY = 0;
	var spawned = false;
	
	var maxSpeed = 15.0;
	var speed = 0.0;
	var acceleration = 0.04;
	
	var maxTurnSpeed = 0.1;
	var turnSpeed = 0.0;
	var turnAcceleration = 0.001;
	
	textCanvas.addEventListener('click', function(e){
		if(client.failed){
			console.log("Cannot spawn.");
			return;
		}else if(!spawned){
			if(client.color !== null){
				var new_color = convertToRGB(client.color);
				client.color = [new_color[0], new_color[1], new_color[2], 1.0];
			}
			
			glworld.create_object(client.handle + " GHOST", tank, e.clientX, e.clientY, client.color);
			
			if(!debugging){
				glworld.objects[client.handle + " GHOST"].invisible = true;
			}
			
			glworld.objects[client.handle + " GHOST"].textX = 45.0;
			glworld.objects[client.handle + " GHOST"].textY = 45.0;
			
			spawned = true;
		}
		
		msg = {};
		msg.handle = client.handle;
		//msg.color = glworld.objects[client.handle + " GHOST"].color;
		msg.x = e.clientX.toString();
		msg.y = e.clientY.toString();
		console.log(JSON.stringify(msg));
		client.send(msg);
		
		glworld.objects[client.handle + " GHOST"].color[3] = 0.5
		
		//glworld.objects["square"].timed_animation("x", e.clientX - 10, 750);
		//glworld.objects["square"].timed_animation("y", e.clientY - 10, 750);
		
		//client.ws.send("\"get_users\"");
	}, false);
	
	var buttons = [];
	
	textCanvas.addEventListener('mouseup', function(e){
		mouseDown = false;
		keys[37] = false;
		keys[38] = false;
		keys[39] = false;
		keys[40] = false;
		update_input();
	}, false);
	
	textCanvas.addEventListener('mousedown', function(e){
		mouseX = e.clientX;
		mouseY = e.clientY;
		mouseDown = true;
	}, false);
	
	textCanvas.addEventListener('mousemove', function(e){
		if(mouseDown){
			mouseX = e.clientX;
			mouseY = e.clientY;
		}
	}, false);
	
	var keys = {};
	
	function update_input(){
		if(client.failed){
			return;
		}
		
		msg = {};
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
		//console.log(msg.input);
		if(debugging){
			glworld.texts["d3"].text = turnSpeed;
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
	
	// Client simulation.
	setInterval(function(){
		if(spawned){
			
			if(keys[38] && !keys[40]){
				if(speed < maxSpeed){
					speed += acceleration;
				}
			}else if(keys[40] && !keys[38]){
				if(speed > -maxSpeed){
					speed -= acceleration;
				}
			}else if(!mouseDown){
				if(Math.abs(speed) <= acceleration){
					speed = 0;
				}else if(speed > 0){
					speed -= acceleration;
				}else if(speed < 0){
					speed += acceleration;
				}
			}
			
			if(keys[39] && !keys[37]){
				//console.log("LEFT")
				if(turnSpeed < maxTurnSpeed){
					turnSpeed += turnAcceleration;
				}
				glworld.objects[client.handle + " GHOST"].rotation -= turnSpeed;
			}else if(keys[37] && !keys[39]){
				//console.log("RIGHT")
				if(turnSpeed < maxTurnSpeed){
					turnSpeed += turnAcceleration;
				}
				glworld.objects[client.handle + " GHOST"].rotation += turnSpeed;
			}else if(!mouseDown){
				if(turnSpeed <= turnAcceleration){
					turnSpeed = 0;
				}else if(turnSpeed > 0){
					turnSpeed -= turnAcceleration;
				}
			}
		
			glworld.objects[client.handle + " GHOST"].x += speed *
				Math.cos(glworld.objects[client.handle + " GHOST"].rotation);
			glworld.objects[client.handle + " GHOST"].y += speed * -1 *
				Math.sin(glworld.objects[client.handle + " GHOST"].rotation);
		}
	}, 16);
	
	glworld.afterRender = function(){
		if(spawned && mouseDown){
			var xdiff = mouseX - glworld.objects[client.handle].x;
			var ydiff = mouseY - glworld.objects[client.handle].y;
			
			glworld.objects[client.handle].rotation = glworld.objects[client.handle].rotation % (Math.PI * 2);
			
			var angle = glworld.objects[client.handle].rotation - Math.atan2(ydiff, -xdiff);
			
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
			}else{
				if(keys[40] != true){
					needUpdate = true;
				}
				keys[40] = true;
				keys[38] = false;
			}
			
			//console.log(turnSpeed);
			//console.log(Math.abs(Math.PI - angle));
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
				//console.log("CENTER")
				if(keys[39] != false || 
				keys[37] != false){
					needUpdate = true;
				}
				keys[39] = false;
				keys[37] = false;
			}
			
			if(needUpdate){
				update_input();
			}
		}
		
		if(debugging){
			glworld.texts["latency"].text = "Latency: " + client.ping_ms + "ms";
		}
	};
	
});


