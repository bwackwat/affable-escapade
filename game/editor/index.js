
var square = [
	0, 0,
	10, 0,
	0, 10,
	0, 10,
	10, 0,
	10, 10,
];

square = [8, 8, 5, 20, 0, 0, 0, 0, 20, 5, 8, 8];

window.onload = function(){
	var gameCanvas = document.getElementById("gameCanvas");
	var textCanvas = document.getElementById("textCanvas");

	var glworld = initialize_webgl(
		gameCanvas,
		textCanvas,
		true
	);
	
	glworld.create_object("next", square, 0, 0, [1.0, 0.0, 0.0, 0.5]);
	glworld.text("d1", "", 10, 30);
	glworld.text("d2", "", 10, 40);
	glworld.text("d3", "", 10, 50);
	glworld.text("d4", "", 10, 60);
	
	/////////////////////////////
	//      START ACTIONS
	/////////////////////////////
	
	var buttons = [];
	
	glworld.create_object("saveButtonBezel",
		[0, 0, 100, 0, 100, 50, 100, 50, 0, 50, 0, 0],
		20, 20,
		[0.5, 0.5, 0.5, 1]);
	glworld.objects["saveButtonBezel"].text = null;
	
	glworld.create_object("saveButton",
		[0, 0, 90, 0, 90, 40, 90, 40, 0, 40, 0, 0],
		25, 25,
		[0, 0, 0, 1]);
	glworld.objects["saveButton"].text = "Save";
	glworld.objects["saveButton"].font = "italic 28pt Calibri";
	glworld.objects["saveButton"].fillStyle = "white";
	glworld.objects["saveButton"].textX = 10;
	glworld.objects["saveButton"].textY = 43;
	
	var next_triangle = 0;
	var triangle = [];
	
	textCanvas.addEventListener('mouseup', function(e){
		if(e.clientX < 120 && e.clientX > 20 && e.clientY > 20 && e.clientY < 70){
			var shape = "var shape = [";
			var index = next_triangle;
			console.log(index);
			console.log(glworld.objects);
			while(index > 0){
				for(v in glworld.objects["sample" + index].shape){
					shape += glworld.objects["sample" + index].shape[v] + ", ";
				}
				index -= 3;
			}
			shape = shape.substring(0, shape.length - 2);
			shape += "];";
			alert(shape);
		}
		
		if(e.clientX > 160 && e.clientY > 160){
			glworld.create_object("next" + next_triangle, square, Math.round(e.clientX / 20) * 20 - 20, Math.round(e.clientY / 20) * 20 - 20, [0, 1, 0, 0.5]);
			glworld.objects["next" + next_triangle].text = (Math.round(e.clientX / 20) - 9) + ", " + (Math.round(e.clientY / 20) - 9);
			next_triangle++;
		
			triangle.push(Math.round(e.clientX / 20) * 20);
			triangle.push(Math.round(e.clientY / 20) * 20);
		
			if(next_triangle % 3 == 0){
				delete glworld.objects["next" + (next_triangle - 1)];
				delete glworld.objects["next" + (next_triangle - 2)];
				delete glworld.objects["next" + (next_triangle - 3)];
			
				glworld.create_object("done" + next_triangle, [
					triangle[0] - 20,
					triangle[1] - 20,
					triangle[2] - 20,
					triangle[3] - 20,
					triangle[4] - 20,
					triangle[5] - 20]
				, 0, 0, [0, 0, 1, 0.5]);
			
				glworld.create_object("sample" + next_triangle, [
					Math.round(triangle[0] / 20) - 9,
					Math.round(triangle[1] / 20) - 9,
					Math.round(triangle[2] / 20) - 9,
					Math.round(triangle[3] / 20) - 9,
					Math.round(triangle[4] / 20) - 9,
					Math.round(triangle[5] / 20) - 9]
				, 150, 20, [0, 0, 1, 0.5]);
				glworld.objects["sample" + next_triangle].text = null;
			
				triangle = [];
			}
		}
	}, false);
	
	textCanvas.addEventListener('mousedown', function(e){
	}, false);
	
	textCanvas.addEventListener('mousemove', function(e){
		if(e.clientX < 120 && e.clientX > 20 && e.clientY > 20 && e.clientY < 70){
			glworld.objects["saveButtonBezel"].color = [1, 0, 0, 1];
			textCanvas.style.cursor = "pointer";
		}else{
			glworld.objects["saveButtonBezel"].color = [0.5, 0.5, 0.5, 1];
			textCanvas.style.cursor = "default";
		}
		
		if(e.clientX > 160 && e.clientY > 160){
			glworld.objects["next"].x = Math.round(e.clientX / 20) * 20 - 20;
			glworld.objects["next"].y = Math.round(e.clientY / 20) * 20 - 20;
			glworld.objects["next"].text = (Math.round(e.clientX / 20) - 9) + ", " + (Math.round(e.clientY / 20) - 9);
		}
	}, false);
	
	
};


