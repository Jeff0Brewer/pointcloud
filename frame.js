var VSHADER_SOURCE =
	"attribute vec4 a_Position;\n" +
	"attribute vec4 a_Color;\n" +

	"uniform mat4 u_ModelMatrix;\n" +
	"uniform mat4 u_ViewMatrix;\n" +
	"uniform mat4 u_ProjMatrix;\n" +

	"varying vec3 v_Position;\n" +
	"varying vec4 v_Color;\n"+

	"void main() {\n" +
		"gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n" +
		"gl_PointSize = 75.0/gl_Position.w;\n" +
		"v_Color = a_Color;\n" +
	"}\n";

var FSHADER_SOURCE =
	"precision highp float;\n" +
	"varying vec4 v_Color;\n"+
	"varying float v_Visibility;\n" +

	"void main() { \n" +
		"float r = 0.0;\n" +
		"vec2 cxy = 2.0 * gl_PointCoord - 1.0;\n" +
		"r = dot(cxy,cxy);\n" +
		"if(r > 1.0){discard;}\n" + 
		"gl_FragColor = v_Color;\n" +
	"}";

var p_fpv = 3;
var c_fpv = 3;

var fovy = 40;

modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();

var g_last = Date.now();

function main() {
	cloud = new PointCloud(p_fpv, c_fpv, 15, 500000);
	view = new CameraController([70, 0, 0], [0, 0, 0], .5, .1);

	canvas = document.getElementById("canvas");
	canvas.width = innerWidth;
	canvas.height = innerHeight;

	setup_gl();

	projMatrix.setPerspective(fovy, canvas.width / canvas.height, 1, 500);
	gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	viewMatrix.setLookAt(view.camera.x, view.camera.y, view.camera.z, view.focus.x, view.focus.y, view.focus.z, 0, 0, 1);
	gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

	draw();
}
main();

function draw() {
	gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

	cloud.draw(u_ModelMatrix);
}

function setup_gl(){
	gl = getWebGLContext(canvas);
	gl.enableVertexAttribArray(0);
	gl.enable(gl.DEPTH_TEST);
	gl.clearColor(0,0,0,0);

	initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
	init_buffers();

	u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
	u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
	u_ProjMatrix = gl.getUniformLocation(gl.program, "u_ProjMatrix");
}

function init_buffers() {
	cloud.init_buffers();
}

document.body.onresize = function(){
	canvas.width = innerWidth;
	canvas.height = innerHeight;

	if(gl){
		projMatrix.setPerspective(fovy, canvas.width / canvas.height, 1, 500);
		gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		draw();
	}
}

canvas.onmousedown = function(e){
	if(view)
		view.mousedown(e);
}

canvas.onmousemove = function(e){
	if(view && view.mousemove(e)){
		viewMatrix.setLookAt(view.camera.x, view.camera.y, view.camera.z, view.focus.x, view.focus.y, view.focus.z, 0, 0, 1);
		viewMatrix.multiply(view.rotation);
		gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

		draw();
	}
}

canvas.onmouseup = function(e){
	if(view)
		view.mouseup(e);
}

canvas.onwheel = function(e){
	if(view){
		view.wheel(e);
		viewMatrix.setLookAt(view.camera.x, view.camera.y, view.camera.z, view.focus.x, view.focus.y, view.focus.z, 0, 0, 1);
		viewMatrix.multiply(view.rotation);
		gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

		draw();
	}
}



