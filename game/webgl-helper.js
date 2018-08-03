
var m3 = {
	translation: function(tx, ty) {
		return [
			1, 0, 0,
			0, 1, 0,
			tx, ty, 1,
		];
	},

	rotation: function(angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);
		return [
			c,-s, 0,
			s, c, 0,
			0, 0, 1,
		];
	},

	scaling: function(sx, sy) {
		return [
			sx, 0, 0,
			0, sy, 0,
			0, 0, 1,
		];
	},

	multiply: function(a, b) {
		var a00 = a[0 * 3 + 0];
		var a01 = a[0 * 3 + 1];
		var a02 = a[0 * 3 + 2];
		var a10 = a[1 * 3 + 0];
		var a11 = a[1 * 3 + 1];
		var a12 = a[1 * 3 + 2];
		var a20 = a[2 * 3 + 0];
		var a21 = a[2 * 3 + 1];
		var a22 = a[2 * 3 + 2];
		var b00 = b[0 * 3 + 0];
		var b01 = b[0 * 3 + 1];
		var b02 = b[0 * 3 + 2];
		var b10 = b[1 * 3 + 0];
		var b11 = b[1 * 3 + 1];
		var b12 = b[1 * 3 + 2];
		var b20 = b[2 * 3 + 0];
		var b21 = b[2 * 3 + 1];
		var b22 = b[2 * 3 + 2];
		return [
			b00 * a00 + b01 * a10 + b02 * a20,
			b00 * a01 + b01 * a11 + b02 * a21,
			b00 * a02 + b01 * a12 + b02 * a22,
			b10 * a00 + b11 * a10 + b12 * a20,
			b10 * a01 + b11 * a11 + b12 * a21,
			b10 * a02 + b11 * a12 + b12 * a22,
			b20 * a00 + b21 * a10 + b22 * a20,
			b20 * a01 + b21 * a11 + b22 * a21,
			b20 * a02 + b21 * a12 + b22 * a22,
		];
	},
};

function convertToRGB(color) {
	var elemDiv = document.createElement('div');
	elemDiv.style.cssText = "background-color:" + color;
	document.body.appendChild(elemDiv);
	var computedStyle = window.getComputedStyle(elemDiv);
	var computedColor = computedStyle.backgroundColor;
	elemDiv.remove();
	computedColor = computedColor.replace(/[^\d,.]/g, '').split(',');
	computedColor[0] = parseFloat(computedColor[0]) / 255;
	computedColor[1] = parseFloat(computedColor[1]) / 255;
	computedColor[2] = parseFloat(computedColor[2]) / 255;
	return computedColor;
};

initialize_webgl = function(glcanvas, textcanvas, show_fps = false){
	var gl = glcanvas.getContext("webgl");
	var text = textcanvas.getContext("2d");
	
	if (!gl) {
		alert("Your browser doesn't support WebGL!");
		return;
	}
	
	resize_canvas = function(event) {	
		if (gl.canvas.width !== gl.canvas.clientWidth ||  gl.canvas.height !== gl.canvas.clientHeight) {
			gl.canvas.width  = gl.canvas.clientWidth;
			gl.canvas.height = gl.canvas.clientHeight;
			
			text.canvas.width  = gl.canvas.clientWidth;
			text.canvas.height = gl.canvas.clientHeight;
		}

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	};
	window.addEventListener("resize", resize_canvas, false);
	resize_canvas();
	
	var vertCode =
		'attribute vec2 a_position;' +
		'uniform vec2 u_resolution;' +
		'uniform mat3 u_matrix;' +
		'void main(void) {' +
			// Multiply the position by the matrix.
			'vec2 position = (u_matrix * vec3(a_position, 1)).xy;' +
			// convert the position from pixels to 0.0 to 1.0
			'vec2 zeroToOne = position / u_resolution;' +
			// convert from 0->1 to 0->2
			'vec2 zeroToTwo = zeroToOne * 2.0;' +
			// convert from 0->2 to -1->+1 (clipspace)
			'vec2 clipSpace = zeroToTwo - 1.0;' +
			'gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);' +
		'}';
	var vertShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertShader, vertCode);
	gl.compileShader(vertShader);

	var fragCode =
		'precision mediump float;' + 
		'uniform vec4 u_color;' + 
		'void main(void) {' +
			'gl_FragColor = u_color;' +
		'}';
	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragShader, fragCode);
	gl.compileShader(fragShader);

	var program = gl.createProgram();
	gl.attachShader(program, vertShader);
	gl.attachShader(program, fragShader);
	gl.linkProgram(program);

	// look up where the vertex data needs to go.
	var positionLocation = gl.getAttribLocation(program, "a_position");

	// lookup uniforms
	var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
	var colorLocation = gl.getUniformLocation(program, "u_color");
	var matrixLocation = gl.getUniformLocation(program, "u_matrix");

	// Create a buffer to put positions in
	var positionBuffer = gl.createBuffer();
	
	// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	
	// Initialzie the actual framework.
	glworld = {};
	glworld.objects = {};
	glworld.texts = {};
	glworld.state = "playing";
	glworld.afterRender = null;
	glworld.text = text;
	
	console.log(text.font);
	
	glworld.create_object = function(name, shape, x, y, color = null, scaleX = 1.0, scaleY = 1.0, rotation = 0.0, offsetX = 0.0, offsetY = 0.0){
	
		object = {};
		
		object.text = name;
		object.textX = 0;
		object.textY = 0;
		
		for(var i = 0; i < shape.length; i++){
			if(i % 2 === 0){
				shape[i] += offsetX;
			}else{
				shape[i] += offsetY;
			}
		}
		object.shape = shape;
		
		object.x = x;
		object.y = y;
		
		object.color = color;
		if(color === null){
			object.color = [Math.random(), Math.random(), Math.random(), 1];
		}
		
		object.scaleX = scaleX;
		object.scaleY = scaleY;
		object.velX = 0.0;
		object.velY = 0.0;
		object.rotation = rotation;
	
		object.timed_animations = {};
		object.timed_animation = function(key, value, time){
			//console.log("starting animation for " + name + " on " + key);
			glworld.objects[name].timed_animations[key] = {
				step: ((value - glworld.objects[name][key]) / (time / (1000 / 60))),
				end_value: value
			};
		};
	
		object.speed_animations = {};
		object.speed_animation = function(key, value, speed){
			if(value < glworld.objects[name][key] && speed > 0){
				speed *= -1;
			}
			glworld.objects[name].speed_animations[key] = {
				speed: speed,
				end_value: value
			};
		};
		
		glworld.objects[name] = object;
	};
	
	glworld.text = function(name, text, x, y){
		glworld.texts[name] = {};
		glworld.texts[name].text = text;
		glworld.texts[name].x = x;
		glworld.texts[name].y = y;
	}
	
	var fps_time = 0;
	var fps_delta = 0;
	var fps = 0;
	
	// Draw the scene.
	function render(time) {

		// Tell WebGL how to convert from clip space to pixels
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		// Clear the canvas.
		gl.clear(gl.COLOR_BUFFER_BIT);

		// Tell it to use our program (pair of shaders)
		gl.useProgram(program);

		// Turn on the attribute
		gl.enableVertexAttribArray(positionLocation);

		// Bind the position buffer.
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

		// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
		var size = 2;          // 2 components per iteration
		var type = gl.FLOAT;   // the data is 32bit floats
		var normalize = false; // don't normalize the data
		var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
		var offset = 0;        // start at the beginning of the buffer
		gl.vertexAttribPointer(
		positionLocation, size, type, normalize, stride, offset)

		// set the resolution
		gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
		
		text.clearRect(0, 0, text.canvas.width, text.canvas.height);
		
		for(key in glworld.objects){
			if(glworld.objects[key].text != null){
				if(glworld.objects[key].font != undefined){
					text.font = glworld.objects[key].font;
				}
				if(glworld.objects[key].fillStyle != undefined){
					text.fillStyle = glworld.objects[key].fillStyle;
				}
				
				text.fillText(glworld.objects[key].text,
					glworld.objects[key].x + glworld.objects[key].textX,
					glworld.objects[key].y - 10 + glworld.objects[key].textY);
				
				if(glworld.objects[key].font != undefined){
					text.font = '10px sans-serif';
				}
				if(glworld.objects[key].fillStyle != undefined){
					text.fillStyle = 'black';
				}
			}
			
			for(a in glworld.objects[key].timed_animations){
				var an = glworld.objects[key].timed_animations[a];
				
				// If the animation is completed, e.g. the value has been reached.
				if(Math.abs(an.end_value - glworld.objects[key][a]) <= Math.abs(an.step)){ 
					glworld.objects[key][a] = an.end_value;
					delete glworld.objects[key].timed_animations[a];
					continue;
				}
				//console.log("animating..." + key + " on " + a);
				
				glworld.objects[key][a] += an.step;
			}
			for(a in glworld.objects[key].speed_animations){
				var an = glworld.objects[key].speed_animations[a];
				
				// If the animation is completed, e.g. the value has been reached.
				if(Math.abs(an.end_value - glworld.objects[key][a]) <= Math.abs(an.speed)){ 
					glworld.objects[key][a] = an.end_value;
					delete glworld.objects[key].timed_animations[a];
					continue;
				}
				
				glworld.objects[key][a] += an.speed;
			}
			
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(glworld.objects[key].shape), gl.STATIC_DRAW);
			
			// set the color
			gl.uniform4fv(colorLocation, glworld.objects[key].color);

			// Compute the matrices
			var translationMatrix = m3.translation(glworld.objects[key].x, glworld.objects[key].y);
			var rotationMatrix = m3.rotation(glworld.objects[key].rotation);
			var scaleMatrix = m3.scaling(glworld.objects[key].scaleX, glworld.objects[key].scaleY);

			// Multiply the matrices.
			var matrix = m3.multiply(translationMatrix, rotationMatrix);
			matrix = m3.multiply(matrix, scaleMatrix);

			// Set the matrix.
			gl.uniformMatrix3fv(matrixLocation, false, matrix);

			// Draw the geometry.
			var primitiveType = gl.TRIANGLES;
			var offset = 0;
			
			// 6 triangles in the 'F', 3 points per triangle
			var count = glworld.objects[key].shape.length / 2;
			gl.drawArrays(primitiveType, offset, count);
			
		}
		
		for(key in glworld.texts){
			text.fillText(glworld.texts[key].text, glworld.texts[key].x, glworld.texts[key].y);
		}
		
		if(show_fps){
			time *= 0.001;
			fps_delta = time - fps_time;
			fps_time = time;
			fps = 1 / fps_delta;
			text.fillText("FPS: " + Math.round(fps), 10, 10);
		}
		
		if(glworld.afterRender !== null){
			glworld.afterRender();
		}
		
		window.requestAnimationFrame(render);
	}
	
	render(0);
	
	return glworld;
}


