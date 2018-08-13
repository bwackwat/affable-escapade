
var websocket_server_url = "wss://" + window.location.hostname + ":8000/";

var websocket_client = function(){
	var client = {};
	client.is_done = false;
	client.status = "Connecting...";
	client.failed = true;
	client.handle = get_anonymous_name();
	client.color = [Math.random(), Math.random(), Math.random(), 1];
	client.last_ping = 0;
	client.ping_ms = 0;
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
		try{
			client.ws = new WebSocket(websocket_server_url);
		}catch(e){
			//console.log(e);
			client.status = "Couldn't connect.";
			console.log(client.status);
			return;
		}
		client.ws.onopen = client.connected;
		client.ws.onmessage = client.receive;
		client.ws.onclose = client.closed;
		client.ws.onerror = client.errored;
		client.pinger = setInterval(client.ping, 1000);
		client.failed = false;
	}
	
	client.receive = function(e){
		if(e.data == "pong"){
			client.ping_ms = Date.now() - client.last_ping;
			//console.log("pong " + client.ws.readyState);
			return;
		}
		
		//console.log("RECV:" + e.data);
	
		var msg = JSON.parse(e.data);
		
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
			client.failed = true;
			client.resetWebsocket();
			client.status = "Connecting...";
		}else if(client.ws.readyState === client.ws.OPEN){
			client.status = "Connected.";
			client.last_ping = Date.now();
			client.ws.send("ping");
			//console.log("ping");
		}else if(client.ws.readyState === client.ws.CLOSING){
			client.status = "Disconnected.";
		}else{
			client.status = "Disconnected...";
		}
	}
	
	client.send = function(msg){
		
		// The lines below will stop pings until nothing is being sent.
		// clearInterval(client.pinger);
		// client.pinger = setInterval(client.ping, 1000);
		
		if(!client.failed && client.ws.readyState === client.ws.OPEN){
			try{
				//client.status = "Sending...";
				client.ws.send(JSON.stringify(msg));
			}catch(e){
				client.ws.close(1000);
				console.log("Couldn't send.");
				client.failed = true;
			}
		}
	}
	
	return client;
}

