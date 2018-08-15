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
var editPoiLongitude = document.getElementById("editPoiLongitude");
var editPoiLatitude = document.getElementById("editPoiLatitude");
var editPoiLabel = document.getElementById("editPoiLabel");
var editPoiDescription = document.getElementById("editPoiDescription");

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
var markers = new OpenLayers.Layer.Markers("Markers");
map.addLayer(markers);
var currentmarker = null;

map.events.register("click", map, function(e) {
	if(localStorage.getItem(localStorageTokenKey) === null){
		login.style.display = "block";
		username.focus();
	}else{
		newPoi.style.display = "none";
		poi.style.display = "none";
		
		var position = map.getLonLatFromPixel(e.xy);
		
		if(currentmarker != null){
			markers.removeMarker(currentmarker);
		}
		
		for(i in json_markers){
			var position_check = new OpenLayers.LonLat(json_markers[i].location.coordinates[0], json_markers[i].location.coordinates[1]);
			position_check.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
			var pixel = map.getPixelFromLonLat(position_check);
			
			if(Math.abs(e.clientX - pixel.x) <= 20 && Math.abs(e.clientY - pixel.y - 15) <= 20){
				editPoiLabel.value = json_markers[i].label;
				editPoiDescription.value = json_markers[i].description
				editPoiLongitude.innerHTML = json_markers[i].location.coordinates[0].toFixed(5);
				editPoiLatitude.innerHTML = json_markers[i].location.coordinates[1].toFixed(5);;
				
				poi.style.display = "block";
				return;
			}
		}

		currentmarker = new OpenLayers.Marker(position, icon.clone());
		markers.addMarker(currentmarker);
		
		position.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
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
}

function updateMarkers(){
	callAPI("POST", "/my/poi", {"token": localStorage.getItem(localStorageTokenKey)}, function(response){
		if(typeof(response.error) === 'undefined'){
			markers.clearMarkers();
			for(var i = 0, len = response.length; i < len; i++){
				response[i].location = JSON.parse(response[i].location);
				var geoloc = response[i].location;
				var lonlat = new OpenLayers.LonLat(geoloc.coordinates[0], geoloc.coordinates[1]);
				lonlat.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
				var newmarker = new OpenLayers.Marker(lonlat, icon.clone());
				markers.addMarker(newmarker);
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

document.getElementById("loginButton").onclick = function() {
	callAPI("POST", "/login", {"username": username.value, "password": password.value}, function(response){
		if(typeof(response.error) === 'undefined'){
			localStorage.setItem(localStorageUsernameKey, username.value);
			localStorage.setItem(localStorageTokenKey, response.token);
			login.style.display = "none";
			authSuccess();
		}else{
			loginResult.innerHTML = response.error;
		}
	});
};

document.getElementById("cancelLoginButton").onclick = function() {
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

document.getElementById("savePoi").onclick = function() {
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
	poiLabel.value = "";
	poiDescription.value = "";
};

document.getElementById("cancelPoi").onclick = function() {
	markers.removeMarker(currentmarker);
	newPoi.style.display = "none";
	poiLabel.value = "";
	poiDescription.value = "";
};

document.getElementById("cancelEditPoi").onclick = function() {
	poi.style.display = "none";
	poiLabel.value = "";
	poiDescription.value = "";
};

//document.getElementById("logout").onclick = function() {
//	logout();
//	poiLabel.value = "";
//	poiDescription.value = "";
//};

document.getElementById("goToSignup").onclick = function() {
	window.location.href = "/cms/register.html";
};

});


