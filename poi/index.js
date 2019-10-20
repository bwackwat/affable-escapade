
sub_scripts.push(function(){

var login = document.getElementById("loginModal");
var loginResult = document.getElementById("loginResult");
var username = document.getElementById("username");
var password = document.getElementById("password");

var newPoi = document.getElementById("newPoiModal");
var poiLongitude = document.getElementById("poiLongitude");
var poiLatitude = document.getElementById("poiLatitude");
var poiLabel = document.getElementById("poiLabel");
var poiDescription = document.getElementById("poiDescription");

var poi = document.getElementById("poiModal");
var editLink = document.getElementById("editPoiLink");
var editPoiLongitude = document.getElementById("editPoiLongitude");
var editPoiLatitude = document.getElementById("editPoiLatitude");
var editPoiLabel = document.getElementById("editPoiLabel");
var editPoiDescription = document.getElementById("editPoiDescription");

var menu = document.getElementById("menuModal");
var theMap = document.getElementById("theMap");

var mobile = false;
if('ontouchstart' in theMap){
	mobile = true;
}

//START MAP SCRIPT

map = new OpenLayers.Map("theMap",{});
map.addControl(new OpenLayers.Control.PanZoomBar());
map.addLayer(new OpenLayers.Layer.OSM(
	"OpenStreetMap", 
	[
		//Chrome will use HTTPS
		'//a.tile.openstreetmap.org/${z}/${x}/${y}.png',
		'//b.tile.openstreetmap.org/${z}/${x}/${y}.png',
		'//c.tile.openstreetmap.org/${z}/${x}/${y}.png'
	], 
	null
));
map.getNumZoomLevels = function(){
	return 19;
};

// Start in the four corners.
var start_position = new OpenLayers.LonLat(-109.04518, 36.99896);
start_position.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
map.setCenter(start_position, 6);

// Bigger markers on mobile.
var size;
if(mobile){
	size = new OpenLayers.Size(50, 50);
}else{
	size = new OpenLayers.Size(25, 25);
}
var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
var icon = new OpenLayers.Icon("https://maps.google.com/intl/en_us/mapfiles/ms/micons/orange-dot.png", size, offset);

var markers = new OpenLayers.Layer.Markers("Markers");
map.addLayer(markers);
var currentmarker = null;

var json_markers = [];
var selected_poi_index = null;
var selected_poi_id = null;
var new_position = null;

var threshold = 10;
if(mobile){
	threshold = 25;
}

function map_click(e){
	menu.style.display = "none";
	newPoi.style.display = "none";
	poi.style.display = "none";
	
	if(currentmarker != null){
		markers.removeMarker(currentmarker);
	}
	
	for(i in json_markers){
		var position_check = new OpenLayers.LonLat(json_markers[i].location.coordinates[0], json_markers[i].location.coordinates[1]);
		position_check.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
		var pixel = map.getPixelFromLonLat(position_check);
		
		if(Math.abs(e.xy.x - pixel.x) <= threshold && Math.abs(e.xy.y - pixel.y + 10) <= threshold){
			selected_poi_index = i;
			selected_poi_id = json_markers[i].id;
			editLink.href = "/poi?id=" + json_markers[i].id;
			editPoiLabel.value = json_markers[i].label;
			editPoiDescription.value = json_markers[i].description
			editPoiLongitude.innerHTML = json_markers[i].location.coordinates[0].toFixed(5);
			editPoiLatitude.innerHTML = json_markers[i].location.coordinates[1].toFixed(5);
			
			poi.style.display = "block";
			return;
		}
	}
	
	if(localStorage.getItem(localStorageTokenKey) === null){
		status("Login to save and share POI.");
		login.style.display = "block";
		username.focus();
	}else{
		var position = map.getLonLatFromPixel(e.xy);
		currentmarker = new OpenLayers.Marker(position, icon.clone());
		markers.addMarker(currentmarker);
		
		new_position = [position.lon, position.lat];
		position.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
		
		
		poiLabel.value = "";
		poiDescription.value = "";
		poiLongitude.innerHTML = position.lon.toFixed(5);
		poiLatitude.innerHTML = position.lat.toFixed(5);

		newPoi.style.display = "block";
		
		selected_poi_id = null;
		poiLabel.focus();
	}
}


// Clear markers when the map moves and you haven't selected a POI.
map.events.register("movestart", map, function(e){
	status("Mapping...");

	if(selected_poi_id === null){
		newPoi.style.display = "none";
		poi.style.display = "none";
		menu.style.display = "none";
		login.style.display = "none";
		if(currentmarker != null){
			markers.removeMarker(currentmarker);
		}
	}
});

// Regular click.
map.events.register("click", map, map_click);

// Track mobile touch.
var touch_moved = false;
map.events.register("touchmove", map, function(e){
	touch_moved = true;
});

// If mobile touch is moving the map, dont click!
map.events.register("touchend", map, function(e){
	if(touch_moved){
		touch_moved = false;
	}else{
		map_click(e);
	}
});

function logout(){
	localStorage.removeItem(localStorageTokenKey);
	status("Welcome! Logged out.");
	markers.clearMarkers();
	newPoi.style.display = "none";
	menu.style.display = "none";
}

function getMarkerFromLocation(location){
	var lonlat = new OpenLayers.LonLat(location.coordinates[0], location.coordinates[1]);
	lonlat.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
	return new OpenLayers.Marker(lonlat, icon.clone());
}

function updateMarkers(){
	callAPI("POST", "/my/poi", {"token": localStorage.getItem(localStorageTokenKey)}, function(response){
		if(typeof(response.error) === 'undefined'){
			
			
			markers.clearMarkers();
			for(var i = 0, len = response.length; i < len; i++){
				response[i].location = JSON.parse(response[i].location);
				markers.addMarker(getMarkerFromLocation(response[i].location));
			}
			json_markers = response;
			
			
		}else{
			status(response.error);
			logout();
		}
	});
}

//LOGIN MODAL SCRIPT

function authSuccess(){
	status("Welcome, " + localStorage.getItem(localStorageUsernameKey) + "!");
	updateMarkers();
}

document.getElementById("loginButton").onclick = function(){
	status("Logging...");
	callAPI("POST", "/login", {"username": username.value, "password": password.value}, function(response){
		if(typeof(response.error) === 'undefined'){
			localStorage.setItem(localStorageUsernameKey, username.value);
			localStorage.setItem(localStorageTokenKey, response.token);
			login.style.display = "none";
			authSuccess();
		}else{
			status(response.error);
		}
	});
};

document.getElementById("cancelLoginButton").onclick = function(){
	login.style.display = "none";
};

if(localStorage.getItem(localStorageTokenKey) !== null &&
localStorage.getItem(localStorageTokenKey) !== "undefined"){
	callAPI("POST", "/token", {"token": localStorage.getItem(localStorageTokenKey)}, function(response){
		if(typeof(response.error) === 'undefined'){
			authSuccess();
		}else{
			logout();
		}
	});
}

//POI MODAL SCRIPT

document.getElementById("savePoi").onclick = function(){
	status("Saving...");
	callAPI("POST", "/poi", {"token": localStorage.getItem(localStorageTokenKey), "values":
	{"label": poiLabel.value,
	"description": poiDescription.value,
	"longitude": poiLongitude.innerHTML,
	"latitude": poiLatitude.innerHTML}}, function(response){
		if(typeof(response.error) === 'undefined'){
			newPoi.style.display = "none";
			status("Successfully saved the POI!");
			updateMarkers();
		}else{
			status(response.error);
		}
	});
};

document.getElementById("cancelPoi").onclick = function(){
	selected_poi_id = null;
	markers.removeMarker(currentmarker);
	newPoi.style.display = "none";
};

document.getElementById("cancelEditPoi").onclick = function(){
	poi.style.display = "none";
};

document.getElementById("logoutButton").onclick = function(){
	logout();
};

document.getElementById("zoomOutLink").onclick = function(){
	map.zoomToMaxExtent();
};

document.getElementById("zoomToNewPoi").onclick = function(){
	var lonlat = new OpenLayers.LonLat(new_position[0], new_position[1]);
	
	console.log(map.getZoom());
	if(map.getZoom() < 4){
		map.setCenter(lonlat, 5);
	}else if(map.getZoom() < 8){
		map.setCenter(lonlat, 9);
	}else if(map.getZoom() < 12){
		map.setCenter(lonlat, 13);
	}else if(map.getZoom() < 16){
		map.setCenter(lonlat, 17);
	}
}
document.getElementById("zoomToPoi").onclick = function(){
	var lonlat = new OpenLayers.LonLat(json_markers[selected_poi_index].location.coordinates[0], json_markers[selected_poi_index].location.coordinates[1]);
	lonlat.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
	markers.addMarker(new OpenLayers.Marker(lonlat, icon.clone()));
	
	console.log(map.getZoom());
	if(map.getZoom() < 4){
		map.setCenter(lonlat, 5);
	}else if(map.getZoom() < 8){
		map.setCenter(lonlat, 9);
	}else if(map.getZoom() < 12){
		map.setCenter(lonlat, 13);
	}else if(map.getZoom() < 16){
		map.setCenter(lonlat, 17);
	}
};

document.getElementById("updatePoi").onclick = function(){
	status("Saving...");
	callAPI("PUT", "/poi", {"token": localStorage.getItem(localStorageTokenKey), "id": selected_poi_id, "values":
	{"label": editPoiLabel.value,
	"description": editPoiDescription.value}}, function(response){
		if(typeof(response.error) === 'undefined'){
			status("Successfully saved the POI!");
			updateMarkers();
		}else{
			status(response.error);
		}
	});
};

document.getElementById("deletePoi").onclick = function(){
	if(confirm("Are you sure you want to delete this POI?") === false){
		return;
	}
	
	status("Deleting...");
	callAPI("DELETE", "/poi", {"token": localStorage.getItem(localStorageTokenKey), "id": selected_poi_id}, function(response){
		if(typeof(response.error) === 'undefined'){
			status("POI deleted.");
			poi.style.display = "none";
			updateMarkers();
		}else{
			status(response.error);
		}
	});
};

function loadPoiFromUsername(from_username){
	status("Loading...");
	callAPI("GET", "/poi/by/username?username=" + from_username, {}, function(response){
		if(typeof(response.error) === 'undefined'){
		
			for(var i = 0, len = response.length; i < len; i++){
				response[i].location = JSON.parse(response[i].location);
				markers.addMarker(getMarkerFromLocation(response[i].location));
				json_markers.push(response[i]);
			}
			
			status("Loaded POI from user " + from_username + "!");
			menu.style.display = "none";
			
		}else{
			status(response.error);
		}
	});
}

if("username" in urlParams){
	loadPoiFromUsername(urlParams["username"]);
}

document.getElementById("findUserPoi").onclick = function(){
	var find_username = prompt("Enter a username to find:", "");
	if(find_username === null){
		return;
	}
	loadPoiFromUsername(find_username);
};

document.getElementById("menuLink").onclick = function(){
	login.style.display = "none";
	poi.style.display = "none";
	newPoi.style.display = "none";
	menu.style.display = "block";
};

document.getElementById("back").onclick = function(){
	window.location.href = "/";
};

document.getElementById("goToSignup").onclick = function(){
	window.location.href = "/cms/register.html";
};

if("id" in urlParams){
	status("Seeking...");
	callAPI("GET", "/poi?id=" + urlParams["id"], {}, function(response){
	
		if(typeof(response.error) === 'undefined'){
			for(var i = 0, len = response.length; i < len; i++){
				response[i].location = JSON.parse(response[i].location);
				var lonlat = new OpenLayers.LonLat(response[i].location.coordinates[0], response[i].location.coordinates[1]);
				lonlat.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
				markers.addMarker(new OpenLayers.Marker(lonlat, icon.clone()));
				
				map.setCenter(lonlat, 13);
				json_markers.push(response[i]);
				
				selected_poi_index = i;
				selected_poi_id = response[i].id;
				editLink.href = "/poi?id=" + response[i].id;
				editPoiLabel.value = response[i].label;
				editPoiDescription.value = response[i].description
				editPoiLongitude.innerHTML = response[i].location.coordinates[0].toFixed(5);
				editPoiLatitude.innerHTML = response[i].location.coordinates[1].toFixed(5);
			
				poi.style.display = "block";
				status("Check out this Point!");
			}
		}else{
			status(response.error);
		}
	});
}

});


