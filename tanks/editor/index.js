
var square = [
	0, 0,
	10, 0,
	0, 10,
	0, 10,
	10, 0,
	10, 10,
];

square = [8, 8, 5, 20, 0, 0, 0, 0, 20, 5, 8, 8];

var gridSize = 20;

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
	glworld.objects["saveButton"].textX = -8;
	glworld.objects["saveButton"].textY = -32;
	
	
	glworld.create_object("undoButtonBezel",
		[0, 0, 100, 0, 100, 50, 100, 50, 0, 50, 0, 0],
		20, 80,
		[0.5, 0.5, 0.5, 1]);
	glworld.objects["undoButtonBezel"].text = null;
	glworld.create_object("undoButton",
		[0, 0, 90, 0, 90, 40, 90, 40, 0, 40, 0, 0],
		25, 85,
		[0, 0, 0, 1]);
	glworld.objects["undoButton"].text = "Undo";
	glworld.objects["undoButton"].font = "italic 28pt Calibri";
	glworld.objects["undoButton"].fillStyle = "white";
	glworld.objects["undoButton"].textX = -5;
	glworld.objects["undoButton"].textY = -32;
	
	
	glworld.create_object("loadButtonBezel",
		[0, 0, 100, 0, 100, 50, 100, 50, 0, 50, 0, 0],
		20, 140,
		[0.5, 0.5, 0.5, 1]);
	glworld.objects["loadButtonBezel"].text = null;
	glworld.create_object("loadButton",
		[0, 0, 90, 0, 90, 40, 90, 40, 0, 40, 0, 0],
		25, 145,
		[0, 0, 0, 1]);
	glworld.objects["loadButton"].text = "Load";
	glworld.objects["loadButton"].font = "italic 28pt Calibri";
	glworld.objects["loadButton"].fillStyle = "white";
	glworld.objects["loadButton"].textX = -5;
	glworld.objects["loadButton"].textY = -32;
	
	
	var next_triangle = 0;
	var triangle = [];
	
	textCanvas.addEventListener('mouseup', function(e){
		if(e.clientX < 120 && e.clientX > 20 && e.clientY > 20 && e.clientY < 70){
			var shape = "[";
			var index = next_triangle - next_triangle % 3;
			if(index > 0){
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
		}
		
		if(e.clientX < 120 && e.clientX > 20 && e.clientY > 80 && e.clientY < 130){
			if(next_triangle % 3 === 0 && next_triangle !== 0){
				if(glworld.objects["done" + next_triangle].shape.length <= 6){
					delete glworld.objects["done" + next_triangle];
					delete glworld.objects["sample" + next_triangle];
					next_triangle -= 3;
				}else{
					glworld.objects["done" + next_triangle].shape.shift();
					glworld.objects["done" + next_triangle].shape.shift();
					glworld.objects["done" + next_triangle].shape.shift();
					glworld.objects["done" + next_triangle].shape.shift();
					glworld.objects["done" + next_triangle].shape.shift();
					glworld.objects["done" + next_triangle].shape.shift();
					
					glworld.objects["sample" + next_triangle].shape.shift();
					glworld.objects["sample" + next_triangle].shape.shift();
					glworld.objects["sample" + next_triangle].shape.shift();
					glworld.objects["sample" + next_triangle].shape.shift();
					glworld.objects["sample" + next_triangle].shape.shift();
					glworld.objects["sample" + next_triangle].shape.shift();
				}
			}
		}
		
		
		if(e.clientX < 120 && e.clientX > 20 && e.clientY > 140 && e.clientY < 190){
			var newShape = window.prompt("Please enter shape JSON:", "");

			if(newShape !== null){
				next_triangle += 3;
				
				var shapeJSON = JSON.parse(newShape);
				
				glworld.create_object("done" + next_triangle, [], 150, 20, [0, 0, 1, 0.5]);
				var i = 0;
				for(v in shapeJSON){
					if(i % 2 == 0){// - (shapeJSON[v] % gridSize)
						glworld.objects["done" + next_triangle].shape.push(shapeJSON[v] * gridSize + gridSize * 11.5);
					}else{
						glworld.objects["done" + next_triangle].shape.push(shapeJSON[v] * gridSize + gridSize * 18);
					}
					i++;
				}
				glworld.objects["done" + next_triangle].text = null;
				
				glworld.create_object("sample" + next_triangle, [], 150, 20, [0, 0, 1, 0.5]);
				for(v in shapeJSON){
					glworld.objects["sample" + next_triangle].shape.push(shapeJSON[v]);
				}
				glworld.objects["sample" + next_triangle].text = null;
			}
		}
		
		
		if(e.clientX > 160 && e.clientY > 160){
			glworld.create_object("next" + next_triangle, square, Math.round(e.clientX / gridSize) * gridSize - gridSize, Math.round(e.clientY / gridSize) * gridSize - gridSize, [0, 1, 0, 0.5]);
			glworld.objects["next" + next_triangle].text = (Math.round(e.clientX / gridSize) - gridSize) + ", " + (Math.round(e.clientY / gridSize) - gridSize);
			glworld.objects["next" + next_triangle].font = "20px arial";
			next_triangle++;
		
			triangle.push(Math.round(e.clientX / gridSize) * gridSize);
			triangle.push(Math.round(e.clientY / gridSize) * gridSize);
		
			if(next_triangle % 3 == 0){
				delete glworld.objects["next" + (next_triangle - 1)];
				delete glworld.objects["next" + (next_triangle - 2)];
				delete glworld.objects["next" + (next_triangle - 3)];
			
				glworld.create_object("done" + next_triangle, [
					triangle[0] - gridSize,
					triangle[1] - gridSize,
					triangle[2] - gridSize,
					triangle[3] - gridSize,
					triangle[4] - gridSize,
					triangle[5] - gridSize]
				, 0, 0, [0, 0, 1, 0.5]);
			
				glworld.create_object("sample" + next_triangle, [
					Math.round(triangle[0] / gridSize) - gridSize,
					Math.round(triangle[1] / gridSize) - gridSize,
					Math.round(triangle[2] / gridSize) - gridSize,
					Math.round(triangle[3] / gridSize) - gridSize,
					Math.round(triangle[4] / gridSize) - gridSize,
					Math.round(triangle[5] / gridSize) - gridSize]
				, 150, 20, [0, 0, 1, 0.5]);
				glworld.objects["sample" + next_triangle].text = null;
			
				triangle = [];
			}
		}
	}, false);
	
	textCanvas.addEventListener('mousedown', function(e){
	}, false);
	
	textCanvas.addEventListener('mousemove', function(e){
		textCanvas.style.cursor = "default";
		if(e.clientX < 120 && e.clientX > 20 && e.clientY > 20 && e.clientY < 70){
			glworld.objects["saveButtonBezel"].color = [1, 0, 0, 1];
			textCanvas.style.cursor = "pointer";
		}else if(e.clientX < 120 && e.clientX > 20 && e.clientY > 80 && e.clientY < 130){
			glworld.objects["undoButtonBezel"].color = [1, 0, 0, 1];
			textCanvas.style.cursor = "pointer";
		}else if(e.clientX < 120 && e.clientX > 20 && e.clientY > 140 && e.clientY < 190){
			glworld.objects["loadButtonBezel"].color = [1, 0, 0, 1];
			textCanvas.style.cursor = "pointer";
		}else{
			textCanvas.style.cursor = "default";
			glworld.objects["loadButtonBezel"].color = [0.5, 0.5, 0.5, 1];
			glworld.objects["undoButtonBezel"].color = [0.5, 0.5, 0.5, 1];
			glworld.objects["saveButtonBezel"].color = [0.5, 0.5, 0.5, 1];
		}
		
		
		if(e.clientX > 160 && e.clientY > 160){
			glworld.objects["next"].x = Math.round(e.clientX / gridSize) * gridSize - gridSize;
			glworld.objects["next"].y = Math.round(e.clientY / gridSize) * gridSize - gridSize;
			glworld.objects["next"].text = (Math.round(e.clientX / gridSize) - gridSize) + ", " + (Math.round(e.clientY / gridSize) - gridSize);
			glworld.objects["next"].font = "20px arial";
		}
	}, false);
	
	
};


