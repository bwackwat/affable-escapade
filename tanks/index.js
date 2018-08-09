
var f = [
	0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,// left column
	30, 0, 100, 0, 30, 30,30, 30, 100, 0,100, 30,// top rung
	30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90];// middle rung

var square = [0, 0, 30, 0, 0, 30, 0, 30, 30, 0, 30, 30];// 30px wide

var tank = [0, 0, 50, 0, 0, 30, 0, 30, 50, 0,50, 30,// body
	10, -5, 20, -5, 10, 35, 10, 35, 20, 35, 20, -5,// back wheels
	30, -5, 40, -5, 30, 35, 30, 35, 40, 35, 40, -5];// front wheels

var smashtank = [50, 20, 59, 25, 50, 30, 50, 10, 59, 15, 50, 20, 50, 0, 59, 5, 50, 10, 30, 35, 40, -5, 30, -5, 40, -5, 30, 35, 40, 35, 10, 35, 20, -5, 20, 35, 10, -5, 20, -5, 10, 35, 50, 30, 0, 0, 0, 30, 0, 0, 50, 0, 50, 30];



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
	
	glworld.text("status", "Welcome.", 10, 20);
	glworld.text("latency", "", 10, 30);
	
	if(debugging){
		glworld.text("state", "", 100, 10);
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
	}
	
	var spawned = {};

	var tag = 0;

	function receive(msg){
		if(debugging){
			if(tag < 2){
				tag++;
				return;
			}else{
				tag = 0;
			}
		}
	
		if(typeof msg.status !== 'undefined'){
			glworld.texts["status"].text = msg.status;
		}else if(typeof msg.disconnect !== 'undefined'){
			delete glworld.objects[msg.disconnect];
		}else if(typeof msg.players !== 'undefined'){
			if(debugging){
				glworld.texts["state"].text = "State: " + JSON.stringify(msg);
			}
			for(playerH in msg.players){
				for(tankH in glworld.objects){
					if(glworld.objects[tankH].owned && !(tankH in msg.players)){
						delete glworld.objects[tankH];
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
					
				//	Old code to reset ghost on "reconnect" not "refresh" here.
				//	if(debugging && playerH == client.handle){
				//		glworld.objects[playerH + " GHOST"].x = msg.players[playerH].x;
				//		glworld.objects[playerH + " GHOST"].y = msg.players[playerH].y;
				//		glworld.objects[playerH + " GHOST"].rotation = msg.players[playerH].r;
				//		glworld.objects[playerH + " GHOST"].color = msg.players[playerH].c;
				//	}
					glworld.objects[playerH].i = "nn";
					glworld.objects[playerH].s = 0;
					glworld.objects[playerH].ts = 0;
					glworld.objects[playerH].rotation = parseFloat(msg.players[playerH].r);

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
	
	// Local ghost tank.
	var spawned = false;
	var speed = 0.0;
	var turnSpeed = 0.0;
	
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
			
			//if(!debugging){
				glworld.objects[client.handle + " GHOST"].invisible = true;
			//}
			
			glworld.objects[client.handle + " GHOST"].textX = 45.0;
			glworld.objects[client.handle + " GHOST"].textY = 45.0;
			
			spawned = true;
		}
		
		var msg = {};
		msg.handle = client.handle;
		msg.x = e.clientX.toString();
		msg.y = e.clientY.toString();
		client.send(msg);
		
		glworld.objects[client.handle + " GHOST"].color[3] = 0.5;
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
		if(!debugging){
			for(tankH in glworld.objects){
				if(glworld.objects[tankH].owned === undefined){
					continue;
				}
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
				}
				
				glworld.objects[tankH].x += glworld.objects[tankH].s * Math.cos(glworld.objects[tankH].rotation);
				glworld.objects[tankH].y += glworld.objects[tankH].s * -1 * Math.sin(glworld.objects[tankH].rotation);
			}
		}
		
		// ALL THIS CODE IS FOR THE LOCAL GHOST
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
	
	//TODO: Every frame? Can this just be in the client game simulator loop?
	glworld.afterRender = function(){
		if(spawned && mouseDown && client.handle in glworld.objects){
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
		
		glworld.texts["latency"].text = "Latency: " + client.ping_ms + "ms";
	};
});


