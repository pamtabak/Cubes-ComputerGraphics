var scene, camera, renderer;
var cube;
var raycaster;
var controls = null;
var mouse = new THREE.Vector2(), INTERSECTED;
var mouseDown = false;
var cubes = []; // cubes currently on screen
var selectedCube = null; // selection cube (shows which cube is selected) - the transparent cube
var clickedCube = null; // cube, from the screen, that is selected
var mousePressed = false; // boolean to see if mouse is pressed
var shiftPressed = false; // boolean to see if shift key is being pressed
var sphere; // transparente sphere that appears when Shift is being pressed
var plane = null; // to find an offset of dragging, we will use an invisible ‘helper’ – plane
var clock = null;
var offset = new THREE.Vector3();

init();
animate();

function init(){
 	scene = new THREE.Scene(); // set up the scene

 	camera = new THREE.PerspectiveCamera (45, window.innerWidth/window.innerHeight, 1, 10000);
 	
 	// Set up the rendered
 	renderer = new THREE.WebGLRenderer();
 	renderer.setClearColor(0xeeeeee);
	renderer.setSize(window.innerWidth, window.innerHeight); // set the size at which we want it to render our app
	document.body.appendChild(renderer.domElement);
	
	raycaster = new THREE.Raycaster(); // initializing raycaster

	 // Prepare Orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(0, 0, 0);

    // prepare clock
    clock = new THREE.Clock();

 	// Ilumination
 	scene.add(new THREE.AmbientLight(0x44444));
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

	// Plane, that helps to determinate an intersection position
	plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(5000, 5000, 8), new THREE.MeshLambertMaterial({color : 0xffffff, transparent: true, opacity: 0}));
	scene.add(plane);
	plane.visible = true;

	// By default, when we call scene.add(), the thing we add will be added to the coordinates (0,0,0). 
	// This would cause both the camera and the cube to be inside each other. 
	// To avoid this, we simply move the camera out a bit.
	camera.position.z = 1000;

	cubes.push(cube);

	document.addEventListener( 'mousedown' , onMouseLeftButtonDown, false );

	document.addEventListener('mouseup', function onMouseUp () {

		if (selectedCube == null) {
			controls.enabled = true;
		}

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
			controls.shiftPressed = true;
			drawSphere();
		}
	}, false);

	document.addEventListener("keyup", function onKeyUp (event) {
		if (event.which == 16){
			shiftPressed = false;
			controls.shiftPressed = false;
			scene.remove(sphere);
		}
	});

	document.addEventListener( 'mousemove' ,  onMouseLeftButtonPressed, false );

	window.addEventListener( 'resize', onWindowResize, false );
}

function render() {
	camera.lookAt( scene.position );
	renderer.render( scene, camera );
}

function update() {
	controls.update(clock.getDelta());
}

function animate(){
	requestAnimationFrame( animate );   // it pauses when the user navigates to another browser tab
	render();
	update();
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

		var intersects = raycaster.intersectObjects(plane);

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

	mouse.x = (event.clientX / window.innerWidth) * 2 -1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	// Get 3D vector from 3D mouse position using 'unproject' function
	var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
	vector.unproject(camera);

	// raycaster.setFromCamera( mouse, camera );
	raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

	if (!shiftPressed) {
		// First: we need to check wether the new cube will intersect with any cube that is already drawn
		var intersects = raycaster.intersectObjects( cubes ); // checks if user clicked on any cube

		if (intersects.length > 0){
			
			// disable orbit controls
			controls.enabled = false;

			// set the clicked cube
			clickedCube = intersects[0].object;

			// calculate offset
			var intersects2 = raycaster.intersectObject(plane);
    		offset.copy(intersects[0].point).sub(plane.position);
    		console.log(offset);
		 	
		 	if (clickedCube !== null)
			{
				if (selectedCube === null){
					//Draw lines around clicked cube	
					selectedCube = new THREE.Mesh( new THREE.BoxGeometry(110,110,110,1,1), new THREE.MeshLambertMaterial({color : 0xffffff, transparent :true, opacity: 0.4}));
				}
				else
					scene.remove(selectedCube);
		       
		        selectedCube.position.set(clickedCube.position.x, clickedCube.position.y, clickedCube.position.z);
		        scene.add(selectedCube);
			}
		}
		else
			createNewCubes();
	}
}

function onMouseLeftButtonPressed (event){
	if (mousePressed == true){
		
		event.preventDefault();

		// translate cube
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // raycaster.setFromCamera( mouse, camera );

        var position = new THREE.Vector3(mouse.x, mouse.y, 1);
		position.unproject( camera ); // projects camera on vector plan
		
		// var dir            = position.sub(camera.position).normalize();
		// var distance       = - camera.position.z/dir.z;
		// var cameraPosition = camera.position.clone().add(dir.multiplyScalar(distance));
		raycaster.set( camera.position, position.sub(camera.position).normalize() );

		if (clickedCube != null && selectedCube != null && shiftPressed == false){
			// Check the position where the plane is intersected
		    var intersects = raycaster.intersectObject(plane);
		    
	    	// Reposition the object based on the intersection point with the plane
    		clickedCube.position.copy(intersects[0].point.sub(offset));
    		selectedCube.position.copy(clickedCube.position);
		}
		else {
			// Update position of the plane if need
    		var intersects = raycaster.intersectObjects(scene.children);
    		if (intersects.length > 0) {
    			console.log("AQUI");
      			plane.position.copy(intersects[0].object.position);
      			plane.lookAt(camera.position);
			}
		}

  //       clickedCube.position.set(cameraPosition.x,cameraPosition.y, cameraPosition.z);
		// selectedCube.position.set(cameraPosition.x,cameraPosition.y, cameraPosition.z);
	}
}

function drawSphere (){
	// add transparent sphere

	// create the sphere's material
	var sphereMaterial = new THREE.MeshLambertMaterial({color : 0xffffff, transparent :true, opacity: 0.1});

	if (selectedCube == null) {
		
		// set up the sphere vars
		var radius = 300,
			segments = 80,
			rings = 80;

		// create a new mesh with sphere geometry
		sphere = new THREE.Mesh( new THREE.SphereGeometry(radius, segments, rings),sphereMaterial);
	} 
	else {
		// set up the sphere vars
		var radius = 100,
			segments = 80,
			rings = 80;

	    // create a new mesh with sphere geometry
		sphere = new THREE.Mesh( new THREE.SphereGeometry(radius, segments, rings),sphereMaterial);
	    sphere.position.set(clickedCube.position.x,clickedCube.position.y, clickedCube.position.z);
	}

	// add the sphere to the scene
	scene.add(sphere);
}