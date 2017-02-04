load_sub_script = function(){

var map = new ol.Map({
	layers: [
		new ol.layer.Tile({
			source: new ol.source.OSM()
		})
	],
	target: 'poiMap',
	controls: ol.control.defaults({
		attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
			collapsible: false
		})
	}),
	view: new ol.View({
		center: [0, 0],
		zoom: 2
	})
});

map.on('click', function(evt) {
	var lonlat = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
	var lon = lonlat[0];
	var lat = lonlat[1];
	status.innerHTML = "clicked on: " + lon + ", " + lat;
});

}
