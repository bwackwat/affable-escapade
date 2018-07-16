var load_sub_script = null;

var status;

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

window.onload = function() {

var localStorageUsernameKey = "JPH2_USERNAME_KEY";
var localStorageTokenKey = "JPH2_TOKEN_KEY";
var localStorageFlashKey = "JPH2_FLASH_KEY";
var apiUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/api";

var status = document.getElementById("status");
flashed = false;

if(status !== null && status !== "undefined" &&
localStorage.getItem(localStorageFlashKey) !== null &&
localStorage.getItem(localStorageFlashKey) !== "undefined"){
	status.innerHTML = localStorage.getItem(localStorageFlashKey);
	localStorage.removeItem(localStorageFlashKey);
	flashed = true;
}

function redirect_flash(url, flash){
	localStorage.setItem(localStorageFlashKey, flash);
	window.location.href = url;
}

function callAPI(method, route, data, callback){
	var sendData = JSON.stringify(data);

	var http = new XMLHttpRequest();
	http.open(method, apiUrl + route, true);
	http.setRequestHeader("Content-type", "application/json");
	http.onreadystatechange = function(){
		console.log("RECV: " + http.responseText);
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
	console.log("SEND: " + sendData);
	http.send(sendData);
}

////////////////////////////////////////////////////////////////
// CMS
////////////////////////////////////////////////////////////////

var loggedInLinks = document.getElementById("loggedInLinks");
var loggedOutLinks = document.getElementById("loggedOutLinks");

var logoutButton = document.getElementById("logoutButton");


var username = document.getElementById("usernameField");
var password = document.getElementById("passwordField");
var email = document.getElementById("emailField");
var firstName = document.getElementById("firstNameField");
var lastName = document.getElementById("lastNameField");

var loginButton = document.getElementById("loginButton");
var registerButton = document.getElementById("registerButton");


var threadName = document.getElementById("threadNameField");
var threadDescription = document.getElementById("threadDescriptionField");
var threads = document.getElementById("threads");
var threadEdit = document.getElementById("threadEdit");
var threadMessages = document.getElementById("threadMessages");

var createThreadButton = document.getElementById("createThreadButton");
var saveThreadButton = document.getElementById("saveThreadButton");
var deleteThreadButton = document.getElementById("deleteThreadButton");


function checkLogin(){
	var loggedIn = false;

	if(localStorage.getItem(localStorageTokenKey) !== null &&
	localStorage.getItem(localStorageTokenKey) !== "undefined"){
		callAPI("POST", "/token", {"token": localStorage.getItem(localStorageTokenKey)}, function(response){
			if(typeof(response.error) === 'undefined'){
				if(!flashed){
					status.innerHTML = "Logged in as " + localStorage.getItem(localStorageUsernameKey);
				}
				
				loggedInLinks.style.display = "inline";
				loggedOutLinks.style.display = "none";
			}else{
				loggedInLinks.style.display = "none";
				loggedOutLinks.style.display = "inline";
				
				localStorage.removeItem(localStorageUsernameKey);
				localStorage.removeItem(localStorageTokenKey);
				
				redirect_flash("/cms/login.html", "Not logged in.");
			}
		});
	}else{
		if(!flashed){
			status.innerHTML = "Not logged in.";
		}
		
		loggedInLinks.style.display = "none";
		loggedOutLinks.style.display = "inline";
	}
}

if(loginButton !== null && loginButton !== "undefined"){
	loginButton.onclick = function() {
		callAPI("POST", "/login", {"username": username.value, "password": password.value}, function(response){
			if(typeof(response.error) === 'undefined'){
				localStorage.setItem(localStorageUsernameKey, username.value);
				localStorage.setItem(localStorageTokenKey, response.token);
				
				window.location.href = "/cms/account.html";
			}else{
				status.innerHTML = response.error;
			}
		});
	};
}

if(registerButton !== null && registerButton !== "undefined"){
	registerButton.onclick = function() {
		callAPI("POST", "/user", {"values": [username.value, password.value, "", "", email.value, firstName.value, lastName.value]}, function(response){
			if(typeof(response.error) === 'undefined'){
				redirect_flash("/cms/login.html", "You signed up successfully!");
			}else{
				status.innerHTML = response.error;
			}
		});
	};
}

if(logoutButton !== null && logoutButton !== "undefined"){
	logoutButton.onclick = function() {
		localStorage.removeItem(localStorageUsernameKey);
		localStorage.removeItem(localStorageTokenKey);
		window.location.href = "/cms/index.html";
	};
}

var threadId;

if(threadEdit !== null && threadEdit !== "undefined"){
	if(!("id" in urlParams)){
		window.location.href = "/cms/threads.html";
	}

	callAPI("POST", "/get/user/thread", {"token": localStorage.getItem(localStorageTokenKey), "id": urlParams["id"]}, function(response){
		if(typeof(response.error) === 'undefined'){
			threadId = response["id"];
			threadName.value = response["name"];
			threadDescription.value = response["description"];
		}else{
			status.innerHTML = response.error;
		}
	});
}

if(threadMessages !== null && threadMessages !== "undefined"){
	if(!("id" in urlParams)){
		window.location.href = "/cms/threads.html";
	}
	
	callAPI("POST", "/get/user/thread", {"token": localStorage.getItem(localStorageTokenKey), "id": urlParams["id"]}, function(response){
		if(typeof(response.error) === 'undefined'){
			threadId = response["id"];
			threadName.innerHTML = response["name"];
			threadDescription.innerHTML = response["description"];
			
			callAPI("POST", "/get/thread/messages", {"token": localStorage.getItem(localStorageTokenKey), "id": urlParams["id"]}, function(response){
				if(typeof(response.error) === 'undefined'){
					var newhtml = "";
					if(response.length == 0){
						newhtml += "No messages.";
					}
					for(var i = 0, len = response.length; i < len; i++){
						newhtml += "<a href='/cms/message.html?id=" + response[i].id + "'>" + (response.length - i) + ". " + response[i].name + "</a><br>";
					}
					threadMessages.innerHTML = newhtml;
				}else{
					status.innerHTML = response.error;
				}
			});
		}else{
			status.innerHTML = response.error;
		}
	});
	
}

if(threads !== null && threads !== "undefined"){
	callAPI("POST", "/get/user/threads", {"token": localStorage.getItem(localStorageTokenKey)}, function(response){
		if(typeof(response.error) === 'undefined'){
			var newhtml = "";
			if(response.length == 0){
				newhtml += "No threads.";
			}
			for(var i = 0, len = response.length; i < len; i++){
				newhtml += "<a href='/cms/thread.html?id=" + response[i].id + "'>" + (response.length - i) + ". " + response[i].name + "</a><br>";
			}
			threads.innerHTML = newhtml;
		}else{
			status.innerHTML = response.error;
		}
	});
}

if(createThreadButton !== null && createThreadButton !== "undefined"){
	createThreadButton.onclick = function() {
		callAPI("POST", "/thread", {"token": localStorage.getItem(localStorageTokenKey), "values": [threadName.value, threadDescription.value]}, function(response){
			if(typeof(response.error) === 'undefined'){
				redirect_flash("/cms/threads.html", "Thread created!");
			}else{
				status.innerHTML = response.error;
			}
		});
	};
}

if(saveThreadButton !== null && saveThreadButton !== "undefined"){
	saveThreadButton.onclick = function() {
		callAPI("PUT", "/thread", {"token": localStorage.getItem(localStorageTokenKey), "id": threadId, "values": {"name": threadName.value, "description": threadDescription.value}}, function(response){
			if(typeof(response.error) === 'undefined'){
				redirect_flash("/cms/threads.html", "Thread saved!");
			}else{
				status.innerHTML = response.error;
			}
		});
	};
}

if(deleteThreadButton !== null && deleteThreadButton !== "undefined"){
	deleteThreadButton.onclick = function() {
		if(window.confirm("Delete thread " + threadName.value + " ?")){
			callAPI("DELETE", "/thread", {"token": localStorage.getItem(localStorageTokenKey), "id": threadId}, function(response){
				if(typeof(response.error) === 'undefined'){
					redirect_flash("/cms/threads.html", "Thread deleted!");
				}else{
					status.innerHTML = response.error;
				}
			});
		}
	};
}

////////////////////////////////////////////////////////////////
// BLOG
////////////////////////////////////////////////////////////////

var content = document.getElementById("blog-content");

if(content !== null && content !== "undefined"){
	callAPI("GET", "/thread?name=\"Grokking Equanimity\"", {}, function(response){
		if(typeof(response.error) === 'undefined'){
			var newhtml = "<div id='posts'>";
			for(var i = 0, len = response.length; i < len; i++){
				newhtml += "<div id='post'><div id='posttitle'>" + response[i].title;
				newhtml += "</div><div id='postdate'>" + response[i].created_on;
				newhtml += "</div><br><div id='posttext'>" + response[i].content;
				newhtml += "</div></div><hr>";
			}
			newhtml += "</div>";
			content.innerHTML = newhtml;
		}else{
			content.innerHTML = response.error;
		}
	});
}

if(status !== null && status !== "undefined" && logoutButton !== null && logoutButton != "undefined"){
	checkLogin();
}

if(load_sub_script != null){
	load_sub_script();
}

}


