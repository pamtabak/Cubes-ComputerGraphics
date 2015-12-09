var scene, camera, renderer;
var cube;
var raycaster;
var mouse = new THREE.Vector2(), INTERSECTED;
var mouseDown = false;
var cubes = [];
var selectedCube = null;

init();
render();

function init(){
 	scene = new THREE.Scene(); // set up the scene

 	//camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
 	camera = new THREE.PerspectiveCamera (45, window.innerWidth/window.innerHeight, 1, 1000);
 	// Set up the rendered
 	renderer = new THREE.WebGLRenderer();
 	renderer.setClearColor(0xeeeeee);
	renderer.setSize(window.innerWidth, window.innerHeight); // set the size at which we want it to render our app
	document.body.appendChild(renderer.domElement);
	
	raycaster = new THREE.Raycaster(); // initializing raycaster

 	// Ilumination
 	this.scene.add(new THREE.AmbientLight(0x44444));
 	var light = new THREE.DirectionalLight( 0xffffff, 1 );
	light.position.set( 200, 200, 1000 ).normalize();
	// scene.add( light );
	camera.add(light);
	camera.add(light.target);

	// Draw Initial Cube
	var geometry = new THREE.BoxGeometry( 100, 100, 100 ); // object that contains all the points (vertices) and fill (faces) of the cube. 
	var material = new THREE.MeshLambertMaterial( { color: 0xff56c0 } );
	cube = new THREE.Mesh( geometry, material );
	
	scene.add( cube ); 
	// By default, when we call scene.add(), the thing we add will be added to the coordinates (0,0,0). 
	// This would cause both the camera and the cube to be inside each other. 
	// To avoid this, we simply move the camera out a bit.
	camera.position.z = 1000;

	cubes.push(cube);

	document.addEventListener( 'mousedown' , onMouseLeftButtonDown, false );

	window.addEventListener( 'resize', onWindowResize, false );
}

// loop that causes the renderer to draw the scene 60 times per second
function render() {
	requestAnimationFrame( render );   // it pauses when the user navigates to another browser tab

	camera.lookAt( scene.position );
	renderer.render( scene, camera );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

function createNewCubes(){
	var event = window.event;
    var x = event.clientX;
    var y = event.clientY;

	// drawing a new cube
	console.log("drawing new cube");
	var geometry = new THREE.BoxGeometry( 100, 100, 100 ); // object that contains all the points (vertices) and fill (faces) of the cube. 
	var material = new THREE.MeshBasicMaterial( { color: Math.random() * 0xff56c0 } ); // selecting cube color
	cube         = new THREE.Mesh( geometry, material ); // initializing cube

	var position = new THREE.Vector3((x/window.innerWidth)*2 -1,-(y/window.innerHeight)*2 +1, 0); // creating vector with cube`s coordinates
	position.unproject( camera ); // projects camera on vector plan
	
	var dir            = position.sub(camera.position).normalize();
    var distance       = - camera.position.z/dir.z;
    var cameraPosition = camera.position.clone().add(dir.multiplyScalar(distance));

	cube.position.set(cameraPosition.x,cameraPosition.y,cameraPosition.z);
	scene.add( cube ); 

	cubes.push(cube);
}

function onMouseLeftButtonDown ( event ) {
	console.log("left mouse button clicked");
	event.preventDefault();

	mouse.x =   ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	// First: we need to check wether the new cube will intersect with any cube that is already drawn
	var intersects = raycaster.intersectObjects( scene.children ); // checks if user clicked on any cube
	if (intersects.length > 0){
		var clickedCube = intersects[0];

		console.log(selectedCube);
		if (selectedCube === null){
			//Draw lines around selected cube	
			selectedCube = new THREE.Mesh( new THREE.BoxGeometry(110,110,110,1,1), new THREE.MeshLambertMaterial({color : 0xffffff, transparent :true, opacity: 0.4}));
		}
		else{
			scene.remove(selectedCube);
		}
        
        scene.add(selectedCube);
        selectedCube.position.set(clickedCube.object.position.x, clickedCube.object.position.y, clickedCube.object.position.z);
		// mousedown = true; // we probably want to translate cube around
	}
	else {
		createNewCubes();
	}
}