var FBObject = function(params){
	//user-determined properties
	this.w = params.w;
	this.h = params.h;
	this.x = params.x;
	this.y = params.y;
	this.z = params.z;
	this.scale = params.scale;
	this.rotX = params.rotX;
	this.rotY = params.rotY;
	this.rotZ = params.rotZ;
	this.texture = params.texture;
	this.vertexShader = params.vertexShader;
	this.fragmentShader1 = params.fragmentShader1;
	this.fragmentShader2 = params.fragmentShader2;
	this.mainScene = params.mainScene;
	this.model;
	this.extraTex = params.extraTex;
	this.useVideo = params.useVideo;
	//built in properties
	this.scene1;
	this.videoTexture, this.video, this.videoLoaded;
	this.scene2;
	this.renderTargets = [];
	this.planeGeometry;
	this.mesh1, this.mesh2;
	this.mesh;
	this.material1, this.material2;
	this.uniforms, this.uniforms1, this.uniforms2;
	this.init = function(){
		this.initScenes();
		this.initRTTs(this.w, this.h);
		this.planeGeometry = new THREE.PlaneBufferGeometry(this.w, this.h);
		this.initShaders(this.vertexShader, this.fragmentShader1, this.fragmentShader2);
		// this.initUniforms(this.uniforms);
		// this.initTexture(this.texture);
		this.createBackgroundScene();
		this.createFeedbackScene();
		// this.loadModel(this.model);
		// this.addObject(this.x);
	}
	this.initScenes = function(){
		this.scene1 = new THREE.Scene();
		this.scene2 = new THREE.Scene();
	}

	this.initRTTs = function(w, h){
		for(var i = 0; i < 2; i++){
			var rtt = new THREE.WebGLRenderTarget(this.w, this.h);
			rtt.minFilter = THREE.LinearFilter;
		    rtt.magFilter = THREE.NearestFilter;
		    rtt.format = THREE.RGBFormat;
		    this.renderTargets.push(rtt);
		}
	}
	this.initShaders = function(vs, fs1, fs2){
		this.vertexShader = document.getElementById(vs).textContent;
		this.fragmentShader1 = document.getElementById(fs1).textContent;
		this.fragmentShader2 = document.getElementById(fs2).textContent;
	}

	// this.initUniforms = function(uniforms){
	// 	this.uniforms1 = uniforms;
	// 	this.uniforms2 = uniforms;
	// }

	// this.initTexture = function(textureString){
	// 	var tex = THREE.ImageUtils.loadTexture(textureString);
	// 	this.uniforms1.texture = {type: "t", value: tex }
	// 	this.uniforms2.texture = {type: "t", value: this.renderTargets[0] }
		
	// }
	this.handleVideo = function(stream){
		var url = window.URL || window.webkitURL;
		this.video = document.createElement("video");
        this.video.src = url ? url.createObjectURL(stream) : stream;
        this.video.play();
        this.videoLoaded = true;
        var tex = new THREE.Texture(this.video);
        tex.needsUpdate = true;
        this.videoTexture = tex;
		this.material1.uniforms.texture.value = this.videoTexture;
	}
	this.createBackgroundScene = function(){
		var that = this;
		if(!this.extraTex && !this.useVideo){
			var tex = THREE.ImageUtils.loadTexture(this.texture);
		}  else if(this.useVideo){
	        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
            if (navigator.getUserMedia) {       
		        navigator.getUserMedia({video: true, audio: false}, function(stream){
		        	that.handleVideo.call(that, stream);
		        }, function(error){
				   console.log("Failed to get a stream due to", error);
		        });
		    }
		} else{
			var tex = this.extraTex;
		}
		this.uniforms1 = {
			texture: {type: "t", value: tex},
			time: this.uniforms.time,
			resolution: this.uniforms.resolution,
			mouseX: this.uniforms.mouseX,
			mouseY: this.uniforms.mouseY,
			tv_resolution: this.uniforms.tv_resolution,
			tv_resolution_y: this.uniforms.tv_resolution_y
		}
		this.material1 = new THREE.ShaderMaterial( {
			uniforms: this.uniforms1,
			vertexShader: this.vertexShader,
			fragmentShader: this.fragmentShader1
		} );
		this.mesh1 = new THREE.Mesh( this.planeGeometry, this.material1 );
		this.scene1.add( this.mesh1 );
	}

	this.createFeedbackScene = function(){
		this.uniforms2 = {
			texture: {type: "t", value: this.renderTargets[0]},
			time: this.uniforms.time,
			resolution: this.uniforms.resolution,
			mouseX: this.uniforms.mouseX,
			mouseY: this.uniforms.mouseY,
			tv_resolution: this.uniforms.tv_resolution,
			tv_resolution_y: this.uniforms.tv_resolution_y
		}
		this.material2 = new THREE.ShaderMaterial( {
			uniforms: this.uniforms2,
			vertexShader: this.vertexShader,
			fragmentShader: this.fragmentShader2
		} );
		this.mesh2 = new THREE.Mesh( this.planeGeometry, this.material2 );
		this.scene2.add( this.mesh2 );
	}
	this.createModel = function(geometry, x, y, z, scale, rotX, rotY, rotZ, customMaterial){
		if(customMaterial){
			var material = customMaterial;
			console.log(customMaterial);
		} else{
			var material = new THREE.MeshBasicMaterial({map: this.renderTargets[1], side: THREE.DoubleSide});
		}
		this.modelMesh = new THREE.Mesh(geometry, material);
		var scale = scale;
		this.modelMesh.position.set(x,y,z);
		this.modelMesh.scale.set(scale,scale,scale);
		this.modelMesh.rotation.set(rotX, rotY, rotZ);
		this.mainScene.add(this.modelMesh);
	}

	this.loadModel = function(model, x, y, z, scale, rotX, rotY, rotZ, customMaterial){
		var loader = new THREE.BinaryLoader(true);
		var that = this;
		loader.load(model, function(geometry){
			that.createModel.call(that, geometry, x, y, z, scale, rotX, rotY, rotZ, customMaterial);
		})
	}
	this.addObject = function(x, y, z, rotX, rotY, rotZ){
		// var geometry = new THREE.BoxGeometry(1000,1000,1000);
		// var geometry = new THREE.BoxGeometry(1000,1000,1000);
		var material = new THREE.MeshPhongMaterial({map: this.renderTargets[1], shininess:50, metal:true, specular: 0xffffff});
		material.side = THREE.DoubleSide;
		// var mesh = new THREE.Mesh(this.planeGeometry, material);
		this.mesh = new THREE.Mesh(new THREE.CircleGeometry(1000, 100), material);
		this.mesh.position.set(this.x,this.y,this.z);
		this.mesh.rotation.set(this.rotX, this.rotY, this.rotZ);
		this.mesh.scale.set(this.scale, this.scale, this.scale);
		this.mainScene.add(this.mesh);
	}
	this.loadModelMaterial = function(rtt){
		this.modelMaterial = new THREE.MeshBasicMaterial({map: rtt});
	}

	this.passTex = function(){
	    this.material1.uniforms.texture.value = this.material1.uniforms.texture.value;
	    this.material2.uniforms.texture.value = this.renderTargets[0];
	}

	this.getFrame = function(camera){
		renderer.render(this.scene1, camera, this.renderTargets[0], true);
	}
	this.expand = function(expand){
		this.mesh1.scale.set(expand,expand,expand);
		this.mesh2.scale.set(expand,expand,expand);
	}
	this.render = function(camera){
		renderer.render(this.scene2, camera, this.renderTargets[1], true);
		// renderer.render(this.scene2, camera, this.renderTargets[2], true);
	}
	this.cycle = function(){
		var a = this.renderTargets[1];
		this.renderTargets[1] = this.renderTargets[0];
		this.renderTargets[0] = a;
	}
}