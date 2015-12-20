var scene, camera, renderer;
var cube;
var raycaster;
var mouse = new THREE.Vector2(), INTERSECTED;
var mouseDown = false;
var cubes = []; // cubes currently on screen
var selectedCube = null; // selection cube (shows which cube is selected)
var clickedCube = null; 
var mousePressed = false; // boolean to see if mouse is pressed
var shiftPressed = false; // boolean to see if shift key is being pressed
var sphere;

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

	document.addEventListener('mouseup', function () {
        //change global variables for object selection
        mousePressed = false;
    });

	document.addEventListener("keydown", function onKeyDown (event) {
		
		// delete cube
		if (event.which == 68 && selectedCube != null && clickedCube != null) {
			scene.remove(clickedCube);
			scene.remove(selectedCube);
			cubes.splice(cubes.indexOf(clickedCube), 1);
			clickedCube = null;
			selectedCube = null;
		}
		
		if (event.which == 16){
			shiftPressed = true;
			drawSphere();
		}
	}, false);

	document.addEventListener("keyup", function onKeyUp (event) {
		if (event.which == 16){
			shiftPressed = false;
			scene.remove(sphere);
		}
	});

	document.addEventListener( 'mousemove' ,  onMouseLeftButtonPressed, false );

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
	
	if (selectedCube == null){
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
	else {
		scene.remove(selectedCube);
		selectedCube = null;
		clickedCube = null;
	}
}

function onMouseLeftButtonDown ( event ) {
	
	mousePressed = true; // in order to translate cube around
	
	event.preventDefault();

	mouse.x =   ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	if (!shiftPressed) {
		// First: we need to check wether the new cube will intersect with any cube that is already drawn
		var intersects = raycaster.intersectObjects( scene.children ); // checks if user clicked on any cube

		if (intersects.length > 0){
			for (var i = 0; i < cubes.length; i++){
				for (var j = 0; j < intersects.length; j++){
					if (cubes[i] === intersects[j].object)
						clickedCube = cubes[i];
				}
			}
		 	
		 	if (clickedCube !== null)
			{
				if (selectedCube === null){
					//Draw lines around selected cube	
					selectedCube = new THREE.Mesh( new THREE.BoxGeometry(110,110,110,1,1), new THREE.MeshLambertMaterial({color : 0xffffff, transparent :true, opacity: 0.4}));
				}
				else
					scene.remove(selectedCube);
		       
		        selectedCube.position.set(clickedCube.position.x, clickedCube.position.y, clickedCube.position.z);
		        scene.add(selectedCube);
			}

			// Setting current clicked cube as last one to be clicked
			//lastClickedCube = clickedCube;
		}
		else
			createNewCubes();
	}
	else {
		// rotate

		// rotate scene
		if (selectedCube == null)
			rotateScene();

		// rotate selected cube
	}
}

function onMouseLeftButtonPressed (event){
	if (mousePressed == true && clickedCube != null && selectedCube != null){
		
		event.preventDefault();

		scene.remove(selectedCube);
		scene.remove(clickedCube);

		// translate cube
		mouse.x = (event.clientX / renderer.domElement.width) * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.height) * 2 + 1;

        // raycaster.setFromCamera( mouse, camera );

        var position = new THREE.Vector3((event.clientX/window.innerWidth)*2 -1,-(event.clientY/window.innerHeight)*2 +1, 0); // creating vector with cube`s coordinates
		position.unproject( camera ); // projects camera on vector plan
		
		var dir            = position.sub(camera.position).normalize();
	    var distance       = - camera.position.z/dir.z;
	    var cameraPosition = camera.position.clone().add(dir.multiplyScalar(distance));

        clickedCube.position.set(cameraPosition.x,cameraPosition.y, cameraPosition.z);
		selectedCube.position.set(cameraPosition.x,cameraPosition.y, cameraPosition.z);
		scene.add(selectedCube);
		scene.add(clickedCube);
	}
}

function rotateScene(){
	console.log("rotate scene function");

	// rotate scene
}

function drawSphere (){
// add transparent sphere

		// set up the sphere vars
		var radius = 300,
    		segments = 80,
    		rings = 80;

		// create the sphere's material
		var sphereMaterial = new THREE.MeshLambertMaterial({color : 0xffffff, transparent :true, opacity: 0.1});

		// create a new mesh with
		// sphere geometry - we will cover
		// the sphereMaterial next!
		sphere = new THREE.Mesh( new THREE.SphereGeometry(radius, segments, rings),sphereMaterial);

		// add the sphere to the scene
		scene.add(sphere);
}