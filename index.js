
var urlParams;
window.onpopstate = function () {
	var match;
	var pl = /\+/g;  // Regex for replacing addition symbol with a space
	var search = /([^&=]+)=?([^&]*)/g;
	var decode = function (s) {
		return decodeURIComponent(s.replace(pl, " "));
	};
	var query  = window.location.search.substring(1);

	urlParams = {};
	while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);
}();

var state = {};
var sub_scripts = [];
var flashed;

var localStorageUsernameKey = "JPH2_USERNAME_KEY";
var localStorageTokenKey = "JPH2_TOKEN_KEY";
var localStorageFlashKey = "JPH2_FLASH_KEY";

var apiUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/api";
function callAPI(method, route, data, callback){
	var sendData = JSON.stringify(data);
	//console.log("CALL " + method + " " + route);
	
	for (var key in data) {
		if (data.hasOwnProperty(key)){
			if(data[key] === "undefined" ||
			data[key] === null){
				console.log("Parameter is null or undefined, skipping call: " + key);
				return;
			}
		}
	}
	
	var http = new XMLHttpRequest();
	http.open(method, apiUrl + route, true);
	http.setRequestHeader("Content-type", "application/json");
	http.onreadystatechange = function(){
		//console.log("RECV: " + http.responseText);
		if(http.readyState == 4){
			if(http.status == 200){
				callback(JSON.parse(http.responseText));
			}else{
				callback({"error":"Bad response from server."})
			}
		}else if(http.readyState == 3){
			//Bogus OPTIONS response...
			
			//0: request not initialized
			//1: server connection established
			//2: request received
			//3: processing request
			//4: request finished and response is ready
		}else if(http.readyState === 2){
			// Headers received...

			// callback({"error":"Could not receive data."})
		}else if(http.readyState == 1){
			callback({"error":"Could not establish connection."})
		}else if(http.readyState == 0){
			callback({"error":"Did not start connection."})
		}else{
			//Invalid API usage...
			alert("HTTP ERROR!");
		}
	};
	//console.log("SEND: " + sendData);
	http.send(sendData);
}

function redirect_flash(url, flash){
	localStorage.setItem(localStorageFlashKey, flash);
	window.location.href = url;
}

window.onload = function() {

	var status = document.getElementById("status");

	flashed = false;

	if(status !== null && status !== "undefined" &&
	localStorage.getItem(localStorageFlashKey) !== null &&
	localStorage.getItem(localStorageFlashKey) !== "undefined"){
		status.innerHTML = localStorage.getItem(localStorageFlashKey);
		localStorage.removeItem(localStorageFlashKey);
		flashed = true;
	}

	for(var i = 0, len = sub_scripts.length; i < len; i++){
		sub_scripts[i]();
	}

}


