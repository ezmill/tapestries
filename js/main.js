var scene, camera, renderer, controls;
var container;
var loader;
var w = window.innerWidth;
var h = window.innerHeight;
var mouseX, mouseY;
var mapMouseX, mapMouseY;
var FBObject1, FBObject2, mirror;
var globalUniforms;
var time = 0;
var rtt;
initScene();
function initScene(){


    camera = new THREE.PerspectiveCamera(50, w / h, 1, 100000);
    camera.position.set(0,0, 1000);//test
    camera.rotation.y = Math.PI/4
    cameraRTT = new THREE.OrthographicCamera( w / - 2, w / 2, h / 2, h / - 2, -10000, 10000 );
	cameraRTT.position.z = 100;
	controls = new THREE.OrbitControls(camera);
	// controls.maxPolarAngle = Math.PI/2; 
	renderer = new THREE.WebGLRenderer();
    renderer.setSize(w,h);
    renderer.setClearColor(0xffffff, 1);

    container = document.createElement('div');
    document.body.appendChild(container);
    container.appendChild(renderer.domElement);


    scene = new THREE.Scene();

    globalUniforms = {
		time: { type: "f", value: 0.0 } ,
		resolution: {type: "v2", value: new THREE.Vector2(w,h)},
		step_w: {type: "f", value: 1/w},
		step_h: {type: "f", value: 1/h},
		mouseX: {type: "f", value: 1.0},
		mouseY: {type: "f", value: 1.0},
		tv_resolution: {type: "f", value: 640.0},
		tv_resolution_y: {type: "f", value: 1600.0}
	}
	var path = "textures/cube/vince/";
	var format = '.png';
	var urls = [
			path + 'px' + format, path + 'nx' + format,
			path + 'py' + format, path + 'ny' + format,
			path + 'pz' + format, path + 'nz' + format
	];
	var reflectionCube = THREE.ImageUtils.loadTextureCube( urls );
	reflectionCube.format = THREE.RGBFormat;

	var refractionCube = new THREE.CubeTexture( reflectionCube.image, THREE.CubeRefractionMapping );
	refractionCube.format = THREE.RGBFormat;
	var mirrorMaterial = new THREE.MeshLambertMaterial( { side: THREE.DoubleSide, color: 0x000000, ambient: 0xaaaaaa, envMap: reflectionCube, combine: THREE.AddOperation } )

	cloth = new FBObject({
			w: w,
	    	h: h, 
	    	x: 0,
	    	y: 0,
	    	z: 0,
			texture: "textures/rug.jpg",
	    	vertexShader: "vs",
	    	fragmentShader1: "fs",
	    	fragmentShader2: "fs",
	    	mainScene: scene
		});
	cloth.uniforms = globalUniforms;
	cloth.init(w,h);
	clothMaterial = new THREE.MeshLambertMaterial({
	color: 0xffffff,
    ambient: 0xffffff,
    specular: 0xffffff,
    shininess: 20,
    map: cloth.renderTargets[1],
    combine: THREE.AddOperation,
    side: THREE.DoubleSide
    });
	cloth.loadModel("js/models/cloth3.js", 0,-300,0, 1.0, 0, 0, 0,clothMaterial);

	bust = new FBObject({
			w: w,
	    	h: h, 
	    	x: 0,
	    	y: 0,
	    	z: 0,
			// texture: "textures/green.jpg",
	    	vertexShader: "vs",
	    	fragmentShader1: "fs",
	    	fragmentShader2: "colorFs",
	    	mainScene: scene
		});
	bust.uniforms = globalUniforms;
	bust.init(w,h);
	bustMaterial = new THREE.MeshLambertMaterial({color: 0xffffff})
	bust.loadModel("js/models/bust2.js", 0, -300, 0, 1.0, 0, 0, 0, bustMaterial);


    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('keydown', onKeyDown, false);

    window.addEventListener('resize', onWindowResize, false);

	var geometry = new THREE.PlaneBufferGeometry(100000,100000);
	var material = new THREE.MeshBasicMaterial({color:0xffffff, side:THREE.DoubleSide});


	var mesh = new THREE.Mesh(geometry, material);
	mesh.receiveShadow = true;
	mesh.position.set(0,-7,0);
	mesh.rotation.set(Math.PI/2,0,0);
	// scene.add(mesh);

    addLights();
    // onWindowResize();
	animate();
	// initOutputScene();

	rtt = new THREE.WebGLRenderTarget(w, h);
	rtt.minFilter = THREE.LinearFilter;
    rtt.magFilter = THREE.NearestFilter;
    rtt.format = THREE.RGBFormat;

}
function addLights(){
	var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.75 );
	scene.add(hemiLight)
	light = new THREE.DirectionalLight(0xffffff, 0.22);
	light.position.x = 0;
	light.position.y = 1000;
	scene.add(light);

// light.castShadow = true;

// light.shadowCameraVisible = true
// light.shadowMapWidth = 10000;
// light.shadowMapHeight = 10000;
// light.shadowCascadeWidth = 10000;
// light.shadowCascadeHeight = 10000;

}
function map(value,max,minrange,maxrange) {
    return ((max-value)/(max))*(maxrange-minrange)+minrange;
}

function onDocumentMouseMove(event){
	mouseX = (event.clientX );
    mouseY = (event.clientY );
    mapMouseX = map(mouseX, window.innerWidth, -1.0,1.0);
    mapMouseY = map(mouseY, window.innerHeight, -1.0,1.0);
	globalUniforms.mouseX.value = mapMouseX;
	globalUniforms.mouseY.value = mapMouseY;
}
function onWindowResize( event ) {
	globalUniforms.resolution.value.x = window.innerWidth;
	globalUniforms.resolution.value.y = window.innerHeight;
	w = window.innerWidth;
	h = window.innerHeight;
	renderer.setSize( window.innerWidth, window.innerHeight );
}
function onDocumentMouseDown(event){
		cloth.getFrame(cameraRTT);
		bust.getFrame(cameraRTT);

}
var inc = 0;
var addFrames = true;
var translate = false;
function render(){

	// FBObject1.material1.uniforms.texture.value.needsUpdate = true;
	// display_inner.material1.uniforms.texture.value.needsUpdate = true;
    // bustMaterial.color.setHSL((Math.sin(Date.now() * 0.00075) * 0.5 + 0.5), 1.0, 0.5);
    // bust.modelMesh.visible = false;
    cloth.material1.uniforms.texture.needsUpdate = true;

	// display_inner.modelMesh.castShadow = display_inner.modelMesh.receiveShadow = true;
	// display_outer.modelMesh.castShadow = display_outer.modelMesh.receiveShadow = true;
	// body.modelMesh.castShadow = body.modelMesh.receiveShadow = true;
	// bust.modelMesh.rotation.y = Date.now()*0.0006;
	// cloth.modelMesh.rotation.y = Date.now()*0.0006;
	cloth.passTex();
	bust.passTex();

	controls.update();

	time +=0.05;
	globalUniforms.time.value = time;

    inc++
	if(inc >= 10){
		addFrames = false;
	}
	if(addFrames){
		bust.getFrame(cameraRTT);
		translate = true;
	}
	if(translate = true){
		// FBObject1.scale(1.01);
		// FBObject2.scale(0.999);

	}
	cloth.getFrame(cameraRTT);
	// bust.getFrame(cameraRTT);
	cloth.render(cameraRTT);
	bust.render(cameraRTT);
	renderer.render(scene, camera);
	cloth.cycle(cameraRTT);
	bust.cycle(cameraRTT);

	renderer.render(scene, camera, rtt, true);
	cloth.material1.uniforms.texture.value = rtt;

}
function animate(){
	window.requestAnimationFrame(animate);
	render();

}

function initOutputScene() {

    outputCamera = new THREE.PerspectiveCamera(50, w / h, 1, 100000);
    outputCamera.position.set(0, 0, 750);
    //different camera for render targets - interesting results when outputCameraRTT is substituted with outputCamera in the outputDraw function
    outputCameraRTT = new THREE.OrthographicCamera( w / - 2, w / 2, h / 2, h / - 2, -10000, 10000 );
    outputCameraRTT.position.z = 100;

    outputRenderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
    outputRenderer.setSize(w, h);
    outputRenderer.setClearColor(0xffffff, 1);
    outputRenderer.setBlending(THREE.CustomBlending, THREE.SubtractEquation, THREE.DstColorFactor, THREE.SrcColorFactor);

    container = document.createElement('div');
    document.body.appendChild(container);
    container.appendChild(outputRenderer.domElement);

    outputScene = new THREE.Scene();

    //global object for common uniforms b/c lots of fragment shaders 
    // globalUniforms = {
    //     time: { type: 'f', value: time },
    //     resolution: { type: 'v2', value: new THREE.Vector2(w, h) },
    //     mouseX: { type: 'f', value: 0.0 },
    //     mouseY: { type: 'f', value: 0.0 }
    // }

    //takes input scene and makes it into a texture for frame differencing
    initInputTexture();

    //feedback loop setup
    initFrameDifferencing();

    //if you press space bar it'll take a screenshot - useful for being crazy prolific
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);

    outputAnimate();
}

function initInputTexture() {
    inputTexture = new THREE.Texture(renderer.domElement);;
    inputTexture.needsUpdate = true;
}

function feedbackObject(uniforms, vertexShader, fragmentShader) {
    this.scene = new THREE.Scene();
    this.renderTarget = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat});
    this.material = new THREE.ShaderMaterial({
        uniforms: uniforms, //uniforms object from constructor
        vertexShader: document.getElementById(vertexShader).textContent,
        fragmentShader: document.getElementById(fragmentShader).textContent
    });
    this.mesh = new THREE.Mesh(planeGeometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.scene.add(this.mesh);
}

function initFrameDifferencing() {
    planeGeometry = new THREE.PlaneBufferGeometry(w, h);

    feedbackObject1 = new feedbackObject({
        time: globalUniforms.time,
        resolution: globalUniforms.resolution,
        texture: { type: 't', value: inputTexture },
        mouseX: globalUniforms.mouseX,
        mouseY: globalUniforms.mouseY
    }, "vs", 
    "flow2"); //string for fragment shader id - the only lines that really matter in this function, or the only lines you'll wanna change

    feedbackObject2 = new feedbackObject({
        time: globalUniforms.time,
        resolution: globalUniforms.resolution,
        texture: { type: 't', value: feedbackObject1.renderTarget }, //use previous feedback object's texture
        texture2: { type: 't', value: inputTexture }, // p sure this line doesnt do anything lol
        mouseX: globalUniforms.mouseX,
        mouseY: globalUniforms.mouseY
    }, "vs", 
    "colorFs"); //these first three/four fragment shader object things are where most of the feedback loop is happening

    frameDifferencer = new feedbackObject({
        time: globalUniforms.time,
        resolution: globalUniforms.resolution,
        texture: { type: 't', value: feedbackObject1.renderTarget },
        texture2: { type: 't', value: feedbackObject2.renderTarget },
        texture3: { type: 't', value: inputTexture },
        mouseX: globalUniforms.mouseX,
        mouseY: globalUniforms.mouseY
    }, "vs", 
    "diffFs"); //differencing fs - leave this one alone

    feedbackObject3 = new feedbackObject({
        time: globalUniforms.time,
        resolution: globalUniforms.resolution,
        texture: { type: 't', value: frameDifferencer.renderTarget },
        mouseX: globalUniforms.mouseX,
        mouseY: globalUniforms.mouseY
    }, "vs", 
    "blurFrag"); //this fs also contributes to feedback loop

    feedbackObject4 = new feedbackObject({
        time: globalUniforms.time,
        resolution: globalUniforms.resolution,
        texture: { type: 't', value: feedbackObject3.renderTarget },
        mouseX: globalUniforms.mouseX,
        mouseY: globalUniforms.mouseY
    }, "vs", 
    "sharpenFrag"); //this fs is basically post-processing


    feedbackObject1.material.uniforms.texture.value = frameDifferencer.renderTarget; //previous frame as input

    outputMaterial = new THREE.MeshBasicMaterial({
        map: feedbackObject4.renderTarget
    });
    outputMesh = new THREE.Mesh(planeGeometry, outputMaterial);
    outputScene.add(outputMesh);

    rtt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat});


}

function outputAnimate() {
    window.requestAnimationFrame(outputAnimate);
    outputDraw();
}

function outputDraw() {

    // time += 0.05;
    // inputDraw();
    render();
    inputTexture.needsUpdate = true;

    // expand(1.001);// - similar to translateVs


    //render all the render targets to their respective scenes
    outputRenderer.render(feedbackObject2.scene, outputCameraRTT, feedbackObject2.renderTarget, true);
    outputRenderer.render(frameDifferencer.scene, outputCameraRTT, frameDifferencer.renderTarget, true);
    outputRenderer.render(feedbackObject3.scene, outputCameraRTT, feedbackObject3.renderTarget, true);
    outputRenderer.render(feedbackObject4.scene, outputCameraRTT, feedbackObject4.renderTarget, true);

    outputRenderer.render(outputScene, outputCamera);

    //get new frame
    outputRenderer.render(feedbackObject1.scene, outputCameraRTT, feedbackObject1.renderTarget, true);

    // swap buffers - this is why feedbackObject3's fragment shader contributes to feedback loop but feedbackObject3 is just post-processing i think
    var a = feedbackObject3.renderTarget;
    feedbackObject3.renderTarget = feedbackObject1.renderTarget;
    feedbackObject1.renderTarget = a;


    outputRenderer.render(outputScene, outputCamera, rtt, true);
    



}

//utility functions and event listeners
function expand(expand) {
    frameDifferencer.mesh.scale.set(1, expand, 1);
}

function onKeyDown(event) {
    if (event.keyCode == "32") {
        screenshot();

        function screenshot() {
            var blob = dataURItoBlob(outputRenderer.domElement.toDataURL('image/png'));
            var file = window.URL.createObjectURL(blob);
            var img = new Image();
            img.src = file;
            img.onload = function(e) {
                window.open(this.src);
            }
        }

        function dataURItoBlob(dataURI) {
            // convert base64/URLEncoded data component to raw binary data held in a string
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to a typed array
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            return new Blob([ia], {
                type: mimeString
            });
        }

        function insertAfter(newNode, referenceNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        }
    }
}
