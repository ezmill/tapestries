var scene, camera, renderer, controls;
var container;
var loader;
var w = window.innerWidth;
var h = window.innerHeight;
var mouseX, mouseY;
var mapMouseX, mapMouseY;
var time = 0;
var rtt;
var globalUniforms = {
	time: { type: "f", value: 0.0 } ,
	resolution: {type: "v2", value: new THREE.Vector2(w,h)},
	step_w: {type: "f", value: 1/w},
	step_h: {type: "f", value: 1/h},
	mouseX: {type: "f", value: 1.0},
	mouseY: {type: "f", value: 1.0},
}

initOutputScene();

function addLights(){
	var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.75 );
	outputScene.add(hemiLight)
	light = new THREE.DirectionalLight(0xffffff, 0.22);
	light.position.x = 0;
	light.position.y = 1000;
	outputScene.add(light);

// light.castShadow = true;

// light.shadowCameraVisible = true
// light.shadowMapWidth = 10000;
// light.shadowMapHeight = 10000;
// light.shadowCascadeWidth = 10000;
// light.shadowCascadeHeight = 10000;

}


function initOutputScene() {

    outputCamera = new THREE.PerspectiveCamera(50, w / h, 1, 100000);
    outputCamera.position.set(0, 0, 750);
    controls = new THREE.OrbitControls(outputCamera);

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

    //takes input scene and makes it into a texture for frame differencing
    initInputTexture();

    //feedback loop setup
    initFrameDifferencing();

    //if you press space bar it'll take a screenshot - useful for being crazy prolific
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);

    addLights();
    outputAnimate();
}

function initInputTexture() {
    // inputTexture = new THREE.Texture(renderer.domElement);;
    // inputTexture.needsUpdate = true;
    video = document.createElement("video");
    video.src = "satin.mp4";
    video.loop = true;
    video.playbackRate = 0.25;
    video.play();
    inputTexture = new THREE.Texture(video);
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

    outputMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    ambient: 0xffffff,
    specular: 0xffffff,
    shininess: 300,
    combine: THREE.AddOperation,
    side: THREE.DoubleSide,
    map: feedbackObject4.renderTarget
    });
    // outputMesh = new THREE.Mesh(planeGeometry, outputMaterial);
    // outputScene.add(outputMesh);

                    arrow = new THREE.ArrowHelper( new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( 0, 0, 0 ), 50, 0xff0000 );
                arrow.position.set( -200, 0, -200 );
// pins = [ 0, cloth.w/4, cloth.w/2, 3*cloth.w/4, cloth.w ];
pins = [ 0,1,2,3,4,5,6,7,8,9,10];
    clothGeometry = new THREE.ParametricGeometry( clothFunction, 10, 10 );
    clothGeometry.dynamic = true;
    clothGeometry.computeFaceNormals();

    object = new THREE.Mesh( clothGeometry, outputMaterial );
    object.position.set( 0, 0, 0 );
    object.castShadow = true;
    object.receiveShadow = true;
    outputScene.add( object );

    rtt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat});


}

function outputAnimate() {
    window.requestAnimationFrame(outputAnimate);
    outputDraw();
}

function outputDraw() {

    // time += 0.5;
    inputTexture.needsUpdate = true;
   time = Date.now();

    windStrength = Math.cos( time / 7000 ) * 20 + 40;
    windForce.set( Math.sin( time / 2000 ), Math.cos( time / 3000 ), Math.sin( time / 1000 ) ).normalize().multiplyScalar( windStrength );
    arrow.setLength( windStrength );
    arrow.setDirection( windForce );

    simulate(time);
    // var timer = Date.now() * 0.0002;

    var p = cloth.particles;

    for ( var i = 0, il = p.length; i < il; i ++ ) {

        clothGeometry.vertices[ i ].copy( p[ i ].position );

    }

    clothGeometry.computeFaceNormals();
    clothGeometry.computeVertexNormals();

    clothGeometry.normalsNeedUpdate = true;
    clothGeometry.verticesNeedUpdate = true;

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
    feedbackObject1.material.uniforms.texture.value = rtt;


}

//utility functions and event listeners
function expand(expand) {
    frameDifferencer.mesh.scale.set(1, expand, 1);
}

function createModel(geometry, x, y, z, scale, rotX, rotY, rotZ, customMaterial){
    var material = customMaterial;
    var modelMesh = new THREE.Mesh(geometry, material);
    var scale = scale;
    modelMesh.position.set(x,y,z);
    modelMesh.scale.set(scale,scale,scale);
    modelMesh.rotation.set(rotX, rotY, rotZ);
    outputScene.add(modelMesh);
}

function loadModel(model, x, y, z, scale, rotX, rotY, rotZ, customMaterial){
    var loader = new THREE.BinaryLoader(true);
    loader.load(model, function(geometry){
        createModel(geometry, x, y, z, scale, rotX, rotY, rotZ, customMaterial);
    })
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
    outputRenderer.setSize( window.innerWidth, window.innerHeight );
}
function onDocumentMouseDown(event){

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
