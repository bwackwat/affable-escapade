
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

var car = [
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
	var gameCanvas = document.getElementById("gameCanvas");
	var textCanvas = document.getElementById("textCanvas");

	var glworld = initialize_webgl(
		gameCanvas,
		textCanvas,
		true
	);
	
	glworld.create_object("f", f, 150, 200);
	glworld.create_object("square", square, 200, 20);
	glworld.text("status", "Welcome.", 10, 20);
	glworld.text("d1", "", 10, 30);
	glworld.text("d2", "", 10, 40);
	glworld.text("d3", "", 10, 50);
	glworld.text("d4", "", 10, 60);
	
	////////////////////////////////
	//        START NETWORKING
	////////////////////////////////
	
	var client = websocket_client();

	function connected(e){
		//console.log(e);
		glworld.texts["status"].text = "Connected.";
		client.ws.send("\"get_users\"");
	}

	function receive(msg){
		if(typeof msg.status !== 'undefined'){
			glworld.texts["status"].text = msg.status;
		}else if(typeof msg.users !== 'undefined'){
			for(var i = 0, len = msg.users.length; i < len; i++){
				if(!(msg.users[i].handle in glworld.objects)){
					glworld.create_object(msg.users[i].handle, square, msg.users[i].x, msg.users[i].y);
				}else{
					glworld.objects[msg.users[i].handle].x = msg.users[i].x;
					glworld.objects[msg.users[i].handle].y = msg.users[i].y;
				}
			}
		}else{
			//console.log(JSON.stringify(msg));
			//console.log("Received junk?");
		}
	}

	function closed(e){
		//console.log(e);
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
	
	var msg = {};
	
	var mouseDown = false;
	var mouseX = 0;
	var mouseY = 0;
	var spawned = false;
	
	var maxSpeed = 10.0;
	var speed = 0.0;
	var acceleration = 0.05;
	
	var maxTurnSpeed = 0.1;
	var turnSpeed = 0.0;
	var turnAcceleration = 0.001;
	
	textCanvas.addEventListener('click', function(e){
		if(!spawned){
			
			if(client.color !== null){
				var new_color = convertToRGB(client.color);
				client.color = [new_color[0], new_color[1], new_color[2], 1.0];
			}
			
			glworld.create_object(client.handle + "car", car, e.clientX, e.clientY, client.color, 1.0, 1.0, 0.0, -25, -15);
			//glworld.create_object(client.handle + "car Angle", square, e.clientX + (100 * Math.cos(0.0)), e.clientY + (100 * Math.sin(0.0)) + 10, null, 0.5, 0.5);
			spawned = true;
		}
		
		msg = {};
		msg.handle = client.handle;
		msg.x = e.clientX.toString();
		msg.y = e.clientY.toString();
		//client.send(msg);
		
		//glworld.objects["square"].timed_animation("x", e.clientX - 10, 750);
		//glworld.objects["square"].timed_animation("y", e.clientY - 10, 750);
		
		//client.ws.send("\"get_users\"");
	}, false);
	
	var buttons = [];
	
	saveButton =
	
	textCanvas.addEventListener('mouseup', function(e){
		mouseDown = false;
		//console.log("mouseup");
		
	}, false);
	
	textCanvas.addEventListener('mousedown', function(e){
		mouseX = e.clientX;
		mouseY = e.clientY;
		mouseDown = true;
		//console.log("mousedown");
	}, false);
	
	textCanvas.addEventListener('mousemove', function(e){
		if(mouseDown){
			mouseX = e.clientX;
			mouseY = e.clientY;
		}
		//console.log("mousemove");
	}, false);
	
	var keys = {};
	
	window.onkeydown = function(e){
		keys[e.keyCode] = true;
	};
	
	window.onkeyup = function(e){
		keys[e.keyCode] = false;
		glworld.texts["d1"].text = e.keyCode;
	};
	
	glworld.afterRender = function(){
		
		if(spawned){
		
			if(keys[39] && !keys[37]){
				if(turnSpeed < maxTurnSpeed){
					turnSpeed += turnAcceleration;
				}
				glworld.objects[client.handle + "car"].rotation -= turnSpeed;
			}else if(keys[37] && !keys[39]){
				if(turnSpeed < maxTurnSpeed){
					turnSpeed += turnAcceleration;
				}
				glworld.objects[client.handle + "car"].rotation += turnSpeed;
			}
			if(keys[38] && !keys[40]){
				if(speed < maxSpeed){
					speed += acceleration;
				}
			}else if(keys[40] && !keys[38]){
				if(speed > -maxSpeed){
					speed -= acceleration;
				}
			}else if(!mouseDown){
				if(speed > 0){
					speed -= acceleration;
				}else if(speed < 0){
					speed += acceleration;
				}
			}
		
			glworld.objects[client.handle + "car"].x +=
				glworld.objects[client.handle + "car"].velX;
			glworld.objects[client.handle + "car"].y +=
				glworld.objects[client.handle + "car"].velY;
	
			glworld.objects[client.handle + "car"].velX = speed *
				Math.cos(glworld.objects[client.handle + "car"].rotation);
			glworld.objects[client.handle + "car"].velY = speed * -1 *
				Math.sin(glworld.objects[client.handle + "car"].rotation);
				
			//glworld.objects[client.handle + "car Angle"].x =
			//	glworld.objects[client.handle + "car"].x +
			//	(100 * Math.cos(glworld.objects[client.handle + "car"].rotation));
			//glworld.objects[client.handle + "car Angle"].y =
			//	glworld.objects[client.handle + "car"].y +
			//	(-100 * Math.sin(glworld.objects[client.handle + "car"].rotation));
		
			if(mouseDown){			
				var xdiff = mouseX - glworld.objects[client.handle + "car"].x;
				var ydiff = mouseY - glworld.objects[client.handle + "car"].y;
				
				glworld.texts["d1"].text = Math.atan2(ydiff, xdiff);
			
				glworld.objects[client.handle + "car"].rotation = glworld.objects[client.handle + "car"].rotation % (Math.PI * 2);
				
		
				var angle = glworld.objects[client.handle + "car"].rotation - Math.atan2(ydiff, -xdiff);
				
				angle = (angle + Math.PI * 2) % (Math.PI * 2);
				
				if(angle < 0){
					angle += 2 * Math.PI;
				}
				
				glworld.texts["d2"].text = angle;
				
				if(angle > Math.PI / 2 && angle < Math.PI * 3 / 2){
					if(speed < maxSpeed){
						speed += acceleration;
					}
				}else{
					if(speed > -maxSpeed){
						speed -= acceleration;
					}
				}
				
				if(turnSpeed < maxTurnSpeed){
					turnSpeed += turnAcceleration;
				}
				
				if(Math.abs(Math.PI - angle) > turnSpeed){
					if(angle > Math.PI){
						glworld.objects[client.handle + "car"].rotation -= turnSpeed;
					}else{
						glworld.objects[client.handle + "car"].rotation += turnSpeed;
					}
				}
			}else{
				if(Math.abs(speed) < acceleration){
					speed = 0;
					turnSpeed = 0;
				}
			}
		}
	};
	
});


