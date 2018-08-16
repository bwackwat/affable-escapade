
sub_scripts.push(function(){

var status = document.getElementById("status");

//ELEMENTS

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

//START MAP SCRIPT

map = new OpenLayers.Map("theMap",{
	theme: false
});

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

var size = new OpenLayers.Size(21, 25);
var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
var icon = new OpenLayers.Icon("https://maps.google.com/intl/en_us/mapfiles/ms/micons/orange-dot.png", size, offset);

var json_markers = [];
var selected_poi_id = null;
var markers = new OpenLayers.Layer.Markers("Markers");
map.addLayer(markers);
var currentmarker = null;

map.events.register("click touchend", map, function(e){
	menu.style.display = "none";

	if(currentmarker != null){
		markers.removeMarker(currentmarker);
	}
	
	if(localStorage.getItem(localStorageTokenKey) === null){
		login.style.display = "block";
		username.focus();
	}else{
		newPoi.style.display = "none";
		poi.style.display = "none";
		
		var position = map.getLonLatFromPixel(e.xy);
		
		for(i in json_markers){
			var position_check = new OpenLayers.LonLat(json_markers[i].location.coordinates[0], json_markers[i].location.coordinates[1]);
			position_check.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
			var pixel = map.getPixelFromLonLat(position_check);
			
			if(Math.abs(e.clientX - pixel.x) <= 20 && Math.abs(e.clientY - pixel.y - 15) <= 20){
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

		currentmarker = new OpenLayers.Marker(position, icon.clone());
		markers.addMarker(currentmarker);
		
		position.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
		poiLabel.value = "";
		poiDescription.value = "";
		poiLongitude.innerHTML = position.lon.toFixed(5);
		poiLatitude.innerHTML = position.lat.toFixed(5);

		newPoi.style.display = "block";
	}
});

map.zoomToMaxExtent();


function logout(){
	localStorage.removeItem(localStorageTokenKey);
	status.innerHTML = "Welcome! You are not logged in.";
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
			status.innerHTML = response.error;
			logout();
		}
	});
}

//LOGIN MODAL SCRIPT

function authSuccess(){
	status.innerHTML = "Welcome! You are logged in as " + localStorage.getItem(localStorageUsernameKey);
	updateMarkers();
}

document.getElementById("loginButton").onclick = function(){
	callAPI("POST", "/login", {"username": username.value, "password": password.value}, function(response){
		if(typeof(response.error) === 'undefined'){
			localStorage.setItem(localStorageUsernameKey, username.value);
			localStorage.setItem(localStorageTokenKey, response.token);
			login.style.display = "none";
			authSuccess();
		}else{
			status.innerHTML = response.error;
		}
	});
};

document.getElementById("cancelLoginButton").onclick = function(){
	login.style.display = "none";
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
	callAPI("POST", "/poi", {"token": localStorage.getItem(localStorageTokenKey), "values":
	{"label": poiLabel.value,
	"description": poiDescription.value,
	"longitude": poiLongitude.innerHTML,
	"latitude": poiLatitude.innerHTML}}, function(response){
		if(typeof(response.error) === 'undefined'){
			newPoi.style.display = "none";
			status.innerHTML = "Successfully saved the POI!";
			updateMarkers();
		}else{
			status.innerHTML = response.error;
		}
	});
};

document.getElementById("cancelPoi").onclick = function(){
	markers.removeMarker(currentmarker);
	newPoi.style.display = "none";
};

document.getElementById("cancelEditPoi").onclick = function(){
	poi.style.display = "none";
};

document.getElementById("logoutButton").onclick = function(){
	logout();
};

document.getElementById("updatePoi").onclick = function(){
	callAPI("PUT", "/poi", {"token": localStorage.getItem(localStorageTokenKey), "id": selected_poi_id, "values":
	{"label": editPoiLabel.value,
	"description": editPoiDescription.value}}, function(response){
		if(typeof(response.error) === 'undefined'){
			status.innerHTML = "Successfully saved the POI!";
			updateMarkers();
		}else{
			status.innerHTML = response.error;
		}
	});
};

document.getElementById("deletePoi").onclick = function(){
	if(confirm("Are you sure you want to delete this POI?") === false){
		return;
	}
	
	callAPI("DELETE", "/poi", {"token": localStorage.getItem(localStorageTokenKey), "id": selected_poi_id}, function(response){
		if(typeof(response.error) === 'undefined'){
			status.innerHTML = "POI deleted.";
			poi.style.display = "none";
			updateMarkers();
		}else{
			status.innerHTML = response.error;
		}
	});
};

document.getElementById("findUserPoi").onclick = function(){
	var find_username = prompt("Enter a username to find:", "");
	if(find_username === null){
		return;
	}
	
	callAPI("GET", "/poi/by/username?username=" + find_username, {}, function(response){
		if(typeof(response.error) === 'undefined'){
		
		
			markers.clearMarkers();
			for(var i = 0, len = response.length; i < len; i++){
				response[i].location = JSON.parse(response[i].location);
				markers.addMarker(getMarkerFromLocation(response[i].location));
			}
			json_markers = response;
			
			
		}else{
			status.innerHTML = response.error;
		}
	});
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
	callAPI("GET", "/poi?id=" + urlParams["id"], {}, function(response){
	
		if(typeof(response.error) === 'undefined'){
			for(var i = 0, len = response.length; i < len; i++){
				response[i].location = JSON.parse(response[i].location);
				var lonlat = new OpenLayers.LonLat(response[i].location.coordinates[0], response[i].location.coordinates[1]);
				lonlat.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
				markers.addMarker(new OpenLayers.Marker(lonlat, icon.clone()));
				
				map.setCenter(lonlat, 10);
			}
		}else{
			status.innerHTML = response.error;
		}
	});
}

});


