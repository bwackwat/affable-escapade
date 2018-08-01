
var big_f = [
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

var little_square = [
	0, 0,
	30, 0,
	0, 30,
	0, 30,
	30, 0,
	30, 30,
];

sub_scripts.push(function(){
	var gameCanvas = document.getElementById("gameCanvas");
	var textCanvas = document.getElementById("textCanvas");

	var glworld = initialize_webgl(
		gameCanvas,
		textCanvas,
		true
	);
	
	glworld.create_object("f", big_f, 150, 200);
	glworld.create_object("square", little_square, 20, 20);
	glworld.text("status", "Welcome.", 10, 20);
	
	////////////////////////////////
	//        START NETWORKING
	////////////////////////////////
	
	var client = websocket_client();
	var msg = {};

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
					glworld.create_object(msg.users[i].handle, little_square, msg.users[i].x, msg.users[i].y);
				}else{
					glworld.objects[msg.users[i].handle].x = msg.users[i].x;
					glworld.objects[msg.users[i].handle].y = msg.users[i].y;
				}
			}
			client.ws.send("\"get_users\"");
		}else{
			console.log("Received junk?");
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
	
	textCanvas.addEventListener('click', function(e){
		//little_square.position[0] = e.clientX;
		//little_square.position[1] = e.clientY;
		
		msg = {};
		msg.handle = client.handle;
		msg.x = e.clientX.toString();
		msg.y = e.clientY.toString();
		
		client.send(msg);
		
		glworld.objects["square"].timed_animation("x", e.clientX - 10, 750);
		glworld.objects["square"].timed_animation("y", e.clientY - 10, 750);
		
	}, false);
});


