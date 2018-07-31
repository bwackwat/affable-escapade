
var big_f = {
	x: 100,
	y: 150,
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
	name: "Test Square",
	x: 200,
	y: 20,
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
	var gameCanvas = document.getElementById("gameCanvas");
	var textCanvas = document.getElementById("textCanvas");

	var glworld = initialize_webgl(
		gameCanvas,
		textCanvas,
		true
	);
	
	glworld.create_object(big_f);
	glworld.create_object(little_square);
	
	textCanvas.addEventListener('click', function(e){
		//little_square.position[0] = e.clientX;
		//little_square.position[1] = e.clientY;
		
		little_square.timed_animation("x", e.clientX, 750);
		little_square.timed_animation("y", e.clientY, 750);
		
	}, false);
}
