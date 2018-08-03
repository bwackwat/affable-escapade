var websocket_server_url = "wss://" + window.location.hostname + ":8000/";

function get_anonymous_name(){
	return adjectives[Math.floor(Math.random() * adjectives.length)] + " " + 
		nouns[Math.floor(Math.random() * nouns.length)];
};

var websocket_client = function(){
	var client = {};
	client.is_done = false;
	client.status = "Connecting...";
	client.handle = get_anonymous_name();
	client.color = null;
	client.ws;
	
	if(localStorage.getItem(localStorageTokenKey) !== null){
		callAPI("POST", "/token", {"token": localStorage.getItem(localStorageTokenKey)}, function(response){
			if(typeof(response.error) !== 'undefined'){
				localStorage.removeItem(localStorageUsernameKey);
				localStorage.removeItem(localStorageTokenKey);
				
				window.location.reload();
			}else{
				
				callAPI("POST", "/get/my/user", {"token": localStorage.getItem(localStorageTokenKey)}, function(response){
					if(typeof(response.error) === 'undefined'){
						client.handle = response[0]["username"];
						client.color = response[0]["color"];
					}else{
						window.location.reload();
					}
				});
			}
		});
	}
	
	client.session_token = null;
	if(localStorage.getItem(localStorageTokenKey) !== null){
		client.session_token = localStorage.getItem(localStorageTokenKey);
	}
	
	client.resetWebsocket = function(){
		client.ws = new WebSocket(websocket_server_url);
		client.ws.onopen = client.connected;
		client.ws.onmessage = client.receive;
		client.ws.onclose = client.closed;
		client.ws.onerror = client.errored;
		client.pinger = setInterval(client.ping, 1000);
	}
	
	client.receive = function(e){
		if(e.data == "pong"){
			//console.log("good ping " + client.ws.readyState);
			return;
		}
		
		//console.log("RECV:" + e.data);
	
		msg = JSON.parse(e.data);
		
		return client.next_receive(msg);
	}
	
	client.setupWebsocket = function(connected, receive, closed, errored){
		client.connected = connected;
		client.next_receive = receive;
		client.closed = closed;
		client.errored = errored;
		client.resetWebsocket();
	}
	
	client.ping = function(){
		if(client.is_done){
			return;
		}

		//console.log("ping " + ws.readyState);

		// 0 - Connecting
		// 1 - Open
		// 2 - Closing
		// 3 - Closed
		if(client.ws.readyState === client.ws.CLOSED){
			client.resetWebsocket();
			client.status = "Connecting...";
		}else if(client.ws.readyState === client.ws.OPEN){
			client.status = "Connected.";
			client.ws.send("ping");
		}else if(client.ws.readyState === client.ws.CLOSING){
			client.status = "Disconnected.";
		}else{
			client.status = "Working...";
		}
	}
	
	client.send = function(msg){
		client.status = "Sending...";
		clearInterval(client.pinger);
		client.pinger = setInterval(client.ping, 1000);
		if(client.session_token !== null){
			msg.token = client.session_token;
		}
		console.log("SEND: " + msg);
		client.ws.send(JSON.stringify(msg));
	}
	
	return client;
}

