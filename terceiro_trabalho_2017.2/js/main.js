// Global variables
var knife;
var camera, scene, renderer;
var mouseIsPressed, mouseX, mouseY, pMouseX, pmouseY;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var slider, sliderOutput, circles;
var keyFrame = [];
var quaternion = new THREE.Quaternion();


// Function call
init();
animate();


// Functions
function init()
{

	// Scene
	scene = new THREE.Scene();
	var ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
	scene.add(ambientLight);


	// Perspective camera for 3D drawing
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	var pointLight = new THREE.PointLight(0xffffff, 0.8);
	camera.add(pointLight);


	// Renderer will use a canvas taking the whole window
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.sortObjects = false;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);


	// Append camera to the page
	document.body.appendChild(renderer.domElement);
	scene.add(camera);


	// Set resize (reshape) callback
	window.addEventListener('resize', onWindowResize, false);


	// Texture
	var manager = new THREE.LoadingManager();
	var textureLoader = new THREE.TextureLoader(manager);
	var texture = textureLoader.load('textures/UV_Grid_Sm.jpg');


	// Model
	var loader = new THREE.OBJLoader(manager);
	loader.load('obj/knife/knife.obj', function (object)
	{
		object.traverse(function (child)
		{
			if (child instanceof THREE.Mesh)
			{
				child.material.map = texture;
			}
		});
		object.rotateX(1.5708);
		object.position.z = -30;
		knife = object;
		scene.add(object);
	 });


	// Mouse Event Listener
	mouseIsPressed = false;
	mouseX = 0;
	mouseY = 0;
	pmouseX = 0;
	pmouseY = 0;

	var setMouse = function ()
	{
		mouseX = event.clientX;
		mouseY = event.clientY;
	}

	renderer.domElement.addEventListener('wheel', mouseWheel, false); // Don't work on Firefox

	renderer.domElement.addEventListener ('mousedown', function ()
	{
		setMouse();
		mouseIsPressed = true;
		if (typeof mousePressed !== 'undefined') mousePressed();
	});

	renderer.domElement.addEventListener ('mousemove', function ()
	{ 
		pmouseX = mouseX;
		pmouseY = mouseY;
		setMouse();
		if (mouseIsPressed)
		{
			if (typeof mouseDragged !== 'undefined') mouseDragged(); 
		}
		if (typeof mouseMoved !== 'undefined') mouseMoved();
	});

	renderer.domElement.addEventListener ('mouseup', function ()
	{ 
		mouseIsPressed = false; 
		if (typeof mouseReleased !== 'undefined') mouseReleased(); 
	});


	//Rage Slider
	slider = document.getElementById("myRange");


	//Frame Circles
	circles = document.getElementById("circlescontainer");
	for (i=0; i<100; i++)
	{
		var span = document.createElement('span');
		span.className = "dot";
		span.addEventListener('click', onKeyFrame, false);
		span.id = i;
		circles.appendChild(span);
	}

	//Key Frames
	for (i=0; i<100; i++)
	{
		keyFrame.push(0);
	}
}

// 
// Reshape callback
//
function onWindowResize()
{
	camera.right = window.innerWidth;
	camera.bottom = window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth,window.innerHeight);
	render();
}

function distance(a, b)
{
	return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
}

function animate()
{
	requestAnimationFrame(animate);
	render();
}

function render()
{
	renderer.render(scene, camera);
}

function toScreenPosition(obj, camera)
{
    var vector = new THREE.Vector3();

    var widthHalf = 0.5*renderer.context.canvas.width;
    var heightHalf = 0.5*renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf );
    vector.y = - ( vector.y * heightHalf );
    vector.z = 0;

    return vector;
}

function translate() 
{
	var delta = new THREE.Vector3();
	var mouse = new THREE.Vector3(mouseX, mouseY, 0);
	var pmouse = new THREE.Vector3(pmouseX, pmouseY, 0);

	delta.subVectors(mouse, pmouse);

	knife.position.x += delta.x;
	knife.position.y += -delta.y;
}

function getArcBallVec(x, y, object)
{
	var mouse = new THREE.Vector3(x - windowHalfX, y - windowHalfY, 0);
	var obj = toScreenPosition(object, camera);
	var p = new THREE.Vector3();

	p.subVectors(mouse, obj);
	p.y = -p.y;

	var OPSquared = p.x * p.x + p.y * p.y;

	if (OPSquared <= 200*200)
	{
		p.z = Math.sqrt(200*200 - OPSquared);  // Pythagore
	}

	else
	{
		p.normalize();  // nearest point
	} 

	return p;
}

function rotate(object)
{
	var vec1 = getArcBallVec(pmouseX, pmouseY, knife);
	var vec2 = getArcBallVec(mouseX, mouseY, knife);
	var angle = vec1.angleTo(vec2);
	var vec3 = new THREE.Vector3();

	vec3.crossVectors(vec1, vec2);
	vec3.normalize();

	quaternion.setFromAxisAngle(vec3, angle);
	object.applyQuaternion(quaternion);
}


// Mouse functions
function mouseDragged()
{
	if (document.getElementById("translate").checked)
	{
		translate();
	}

	else
	{
		rotate(knife);
	}
}

function mouseWheel()
{
	var e = window.event || e;
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

	knife.position.z += delta*1 ; // Adjust zoom sensibility here
	
	return false;
}

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function()
{
	var kf = 0;
	var index = -1;
	var taxa = 0;

	for (i=slider.value; i<100; i++)
	{
		if (keyFrame[i] != 0)
		{
			kf = keyFrame[i];
			index = i;
			break;
		}
	}

	if (kf != 0)
	{
		taxa = 1.0/ ((index - slider.value)+1);
		console.log(taxa);
		knife.position.lerp(kf[1], 1);
		knife.quaternion.slerp(kf[0], 1);
	}
}

function onKeyFrame(event)
{
	var circle = event.srcElement.id;
	var color = document.getElementById(circle).style.backgroundColor;
	if (color != 'green')
	{
		document.getElementById(circle).style.backgroundColor = 'green';
		keyFrame[circle] = [quaternion, knife.position];
	}
	else
	{
		document.getElementById(circle).style.backgroundColor = '#bbb';
		keyFrame[circle] = 0;
	}
}