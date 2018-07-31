var big_f = {
	position: [100, 150],
	shape: [
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
	]
};

var little_square = {
	position: [10, 10],
	shape: [
		0, 0,
		30, 0,
		0, 30,
		0, 30,
		30, 0,
		30, 30,
	]
};

window.onload = function(){
	gworld = initialize_webgl(document.getElementById("gameCanvas"));
	
	gworld.objects.push(big_f);
	gworld.objects.push(little_square);
}
