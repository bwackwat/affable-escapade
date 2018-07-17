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

////////////////////////////////////////////////////////////////
// INITIALIZE FRAMEWORK
////////////////////////////////////////////////////////////////

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
	//console.log("CALL " + method + " " + route);
	
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

////////////////////////////////////////////////////////////////
// DOM ELEMENT INITIALIZATIONS
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

var threadId;
var messageId;

var createThreadButton = document.getElementById("createThreadButton");
var editThreadButton = document.getElementById("editThreadButton");
var saveThreadButton = document.getElementById("saveThreadButton");
var deleteThreadButton = document.getElementById("deleteThreadButton");

var messageEdit = document.getElementById("messageEdit");
var backToThreadButton = document.getElementById("backToThreadButton");
var editMessageButton = document.getElementById("editMessageButton");
var deleteMessageButton = document.getElementById("deleteMessageButton");
var messageTitleField = document.getElementById("messageTitleField");
var messageContentField = document.getElementById("messageContentField");
var newMessageButton = document.getElementById("newMessageButton");
var createMessageButton = document.getElementById("createMessageButton");

////////////////////////////////////////////////////////////////
// BASIC ROUTES
////////////////////////////////////////////////////////////////

var loggedIn = false;

if(status !== null && status !== "undefined" && logoutButton !== null && logoutButton != "undefined"){
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

////////////////////////////////////////////////////////////////
// THREAD AND MESSAGE ROUTES
////////////////////////////////////////////////////////////////

if(editMessageButton !== null && editMessageButton !== "undefined" &&
backToThreadButton !== null && backToThreadButton !== "undefined" &&
deleteMessageButton !== null && deleteMessageButton !== "undefined"){
	if(!("tid" in urlParams) || !("mid" in urlParams)){
		window.location.href = "/cms/threads.html";
	}
	
	backToThreadButton.onclick = function() {
		window.location.href = "/cms/thread.html?id=" + urlParams["tid"];
	}
	
	editMessageButton.onclick = function() {
		window.location.href = "/cms/edit_message.html?mid=" + urlParams["mid"] + "&tid=" + urlParams["tid"];
	}
	
	callAPI("POST", "/get/thread/message", {"id": urlParams["mid"]}, function(response){
		if(typeof(response.error) === 'undefined'){
			messageId = response["id"];
			messageTitleField.innerHTML = response["title"];
			messageContentField.innerHTML = response["content"];
		}else{
			status.innerHTML = response.error;
		}
	});
	
	deleteMessageButton.onclick = function() {
		if(window.confirm("Delete message " + messageTitleField.innerHTML + " ?")){
			callAPI("DELETE", "/message", {"token": localStorage.getItem(localStorageTokenKey), "id": messageId}, function(response){
				if(typeof(response.error) === 'undefined'){
					redirect_flash("/cms/thread.html?id=" + urlParams["tid"], "Message deleted!");
				}else{
					status.innerHTML = response.error;
				}
			});
		}
	};
}

if(messageEdit !== null && messageEdit !== "undefined" &&
saveMessageButton !== null && saveMessageButton !== "undefined" &&
backToMessageButton !== null && backToMessageButton !== "undefined"){
	if(!("tid" in urlParams) || !("mid" in urlParams)){
		window.location.href = "/cms/threads.html";
	}
	
	backToMessageButton.onclick = function() {
		window.location.href = "/cms/message.html?mid=" + urlParams["mid"] + "&tid=" + urlParams["tid"];
	}

	callAPI("POST", "/get/thread/message", {"id": urlParams["mid"]}, function(response){
		if(typeof(response.error) === 'undefined'){
			messageId = response["id"];
			messageTitleField.value = response["title"];
			messageContentField.value = response["content"];
		}else{
			status.innerHTML = response.error;
		}
	});
	
	saveMessageButton.onclick = function() {
		callAPI("PUT", "/message", {"token": localStorage.getItem(localStorageTokenKey), "id": messageId, "values": {"title": messageTitleField.value, "content": messageContentField.value}}, function(response){
			if(typeof(response.error) === 'undefined'){
				redirect_flash("/cms/message.html?mid=" + urlParams["mid"] + "&tid=" + urlParams["tid"], "Message saved!");
			}else{
				status.innerHTML = response.error;
			}
		});
	};
}

if(threadMessages !== null && threadMessages !== "undefined" &&
editThreadButton !== null && editThreadButton !== "undefined" &&
deleteThreadButton !== null && deleteThreadButton !== "undefined" &&
newMessageButton !== null && newMessageButton !== "undefined"){
	if(!("id" in urlParams)){
		window.location.href = "/cms/threads.html";
	}
	
	editThreadButton.onclick = function() {
		window.location.href = "/cms/edit_thread.html?id=" + urlParams["id"];
	}
	
	newMessageButton.onclick = function() {
		window.location.href = "/cms/new_message.html?tid=" + urlParams["id"];
	}
	
	callAPI("POST", "/get/user/thread", {"token": localStorage.getItem(localStorageTokenKey), "id": urlParams["id"]}, function(response){
		if(typeof(response.error) === 'undefined'){
			threadId = response["id"];
			threadName.innerHTML = response["name"];
			threadDescription.innerHTML = response["description"];
			
			callAPI("POST", "/get/thread/messages", {"id": urlParams["id"]}, function(response){
				if(typeof(response.error) === 'undefined'){
					var newhtml = "<h4>Messages:</h4>";
					if(response.length == 0){
						newhtml += "No messages.";
					}
					for(var i = 0, len = response.length; i < len; i++){
						newhtml += "<a href='/cms/message.html?tid=" + urlParams["id"] + "&mid=" + response[i].id + "'>" + (response.length - i) + ". " + response[i].title + "</a><br>";
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
	
	deleteThreadButton.onclick = function() {
		if(window.confirm("Delete thread " + threadName.innerHTML + " ?")){
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

if(threads !== null && threads !== "undefined"){
	callAPI("POST", "/get/user/threads", {"token": localStorage.getItem(localStorageTokenKey)}, function(response){
		if(typeof(response.error) === 'undefined'){
			var newhtml = "<h4>Threads:</h4>";
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

if(createMessageButton !== null && createMessageButton !== "undefined"){
	if(!("tid" in urlParams)){
		window.location.href = "/cms/threads.html";
	}
	
	createMessageButton.onclick = function() {
		callAPI("POST", "/message", {"token": localStorage.getItem(localStorageTokenKey), "values": [urlParams["tid"], messageTitleField.value, messageContentField.value]}, function(response){
			if(typeof(response.error) === 'undefined'){
				redirect_flash("/cms/thread.html?id=" + urlParams["tid"], "Message created!");
			}else{
				status.innerHTML = response.error;
			}
		});
	};
}

if(threadEdit !== null && threadEdit !== "undefined" &&
saveThreadButton !== null && saveThreadButton !== "undefined"){
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

////////////////////////////////////////////////////////////////
// BLOG
////////////////////////////////////////////////////////////////

var content = document.getElementById("blog-content");

if(content !== null && content !== "undefined"){
	callAPI("POST", "/get/thread/messages/by/title", {"name": "GROKKING EQUANIMITY"}, function(response){
		if(typeof(response.error) === 'undefined'){
			var newhtml = "<div id='posts'>";
			for(var i = 0, len = response.length; i < len; i++){
				newhtml += "<div id='post'><div id='posttitle'>" + response[i].title;
				newhtml += "</div><div id='postdate'>" + response[i].created;
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

////////////////////////////////////////////////////////////////
// END ROUTES WRAPUP
////////////////////////////////////////////////////////////////

if(load_sub_script != null){
	load_sub_script();
}

}


