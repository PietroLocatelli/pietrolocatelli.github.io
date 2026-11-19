import * as THREE from 'three';
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";
import {FXAAPass} from "three/addons/postprocessing/FXAAPass.js";
import {BokehPass} from "three/addons/postprocessing/BokehPass.js";
import * as TWEEN from '@tweenjs/tween.js';

export class ThreeBackground {

    constructor(canvas) {
        this.initScene(canvas);
        this.initLighting();
        this.initPlane();
        this.initListeners();
        this.startRenderLoop();

        this.clickSound1 = new Audio("/assets/sounds/drop.wav");
        this.clickSound1.preload = "auto";
        this.clickSound1.volume = 0.03;
        this.clickSound2 = new Audio("/assets/sounds/sparkle.wav");
        this.clickSound2.preload = "auto";
        this.clickSound2.volume = 0.06;
        this.clickSound3 = new Audio("/assets/sounds/whoosh.wav");
        this.clickSound3.preload = "auto";
        this.clickSound3.volume = 0.02;
    }

    initScene(canvas) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.z = 50;

        this.renderer = new THREE.WebGLRenderer({canvas, antialias: true});
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // POST PROCESSING
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(new FXAAPass());
        this.composer.addPass(new BokehPass(this.scene, this.camera, {focus: 50, aperture: 0.0015, maxblur: 0.02}));
        this.composer.addPass(new OutputPass());
    }

    initLighting() {
        // LIGHTS
        const ambientLight = new THREE.AmbientLight(0xffffff, 1); // soft white light
        this.scene.add(ambientLight);

        const mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 3);
        mainDirectionalLight.position.set(-3, 2, 1);
        this.scene.add(mainDirectionalLight);
        const mainDirectionalLightHelper = new THREE.DirectionalLightHelper(mainDirectionalLight);
        //this.scene.add(mainDirectionalLightHelper);

        const blueSpotLight = new THREE.SpotLight(0x0296f9, 1); //0x004f54
        blueSpotLight.position.set(6, -3, 20);
        blueSpotLight.angle = Math.PI / 5;
        blueSpotLight.penumbra = 0.2;
        blueSpotLight.decay = 0.3;
        blueSpotLight.castShadow = true;
        blueSpotLight.shadow.mapSize.width = 1024;
        blueSpotLight.shadow.mapSize.height = 1024;
        blueSpotLight.shadow.camera.near = 500;
        blueSpotLight.shadow.camera.far = 4000;
        blueSpotLight.shadow.camera.fov = 30;
        this.scene.add(blueSpotLight);
        const blueSpotLightHelper = new THREE.SpotLightHelper(blueSpotLight);
        //this.scene.add(blueSpotLightHelper);
    }

    initPlane() {
        this.planeGeometry = new THREE.PlaneGeometry(40, 30, 60, 45);
        this.planeGeometry.rotateX(Math.PI / 180 * -30);
        this.planeGeometry.rotateY(Math.PI / 180 * -30);
        this.planeMaterial = new THREE.MeshPhongMaterial(
            {
                color: 0x15383b, // 0x15383b
                side: THREE.FrontSide,
                flatShading: true,
                shininess: 100,
            });
        this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
        this.scene.add(this.planeMesh);

        // Randomize vertices and start animation
        const positions = this.planeGeometry.attributes.position;
        this.tweenList = new TWEEN.Group();
        this.vertexStates = []

        for(let i = 0; i < positions.count; i++) {
            const vertexState = {
                pos: positions.getZ(i),
                off: (Math.random() - 0.5) * 0.8,
                waving: false
            };
            positions.setZ(i, vertexState.pos + vertexState.off);
            this.vertexStates[i] = vertexState;
            this.animateVertex(i);
        }
    }

    initListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('click', (e) => {
            this.initWaveAnimation(e);

            this.clickSound1.currentTime = 0;
            this.clickSound1.play().catch((error) => { console.warn("Could not play click sound:", error); });
            this.clickSound2.currentTime = 0.2;
            this.clickSound2.play().catch((error) => { console.warn("Could not play click sound:", error); });
            this.clickSound3.currentTime = 0;
            this.clickSound3.play().catch((error) => { console.warn("Could not play click sound:", error); });
        });
    }

    // TWEEN ANIMATIONS

    animateVertex(index) {
        const positions = this.planeGeometry.attributes.position;
        const newOffset = (currentOffset) => { return Math.random() * 0.25 + 0.25 * -Math.sign(currentOffset); };
        const vertexState = this.vertexStates[index];

        const tween = new TWEEN.Tween(vertexState)
            .to({ off: newOffset(vertexState.off) }, 2700 + Math.random() * 6300)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(() => {
                if(!vertexState.waving){
                    positions.setZ(index, vertexState.pos + vertexState.off);
                }
            })
            .onComplete(() => {
                tween.remove();
                this.animateVertex(index);
            })
            .start();
        this.tweenList.add(tween);
    }

    initWaveAnimation(event) {
        const raycaster = new THREE.Raycaster(undefined, undefined);
        const pointer = new THREE.Vector2();
        const localHit = new THREE.Vector3();
        const vertex = new THREE.Vector3();
        const positions = this.planeGeometry.attributes.position;

        const rect = this.renderer.domElement.getBoundingClientRect();

        // Pointer coordinates in normalized device coordinates (-1 to +1)
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, this.camera);

        const hits = raycaster.intersectObject(this.planeMesh);
        if (hits.length === 0) return;

        // The intersection point is in world space; vertex positions are local
        localHit.copy(hits[0].point);
        this.planeMesh.worldToLocal(localHit);

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            const distanceSq = vertex.distanceToSquared(localHit);
            this.startWaveAnimation(i, distanceSq);
        }
    }

    startWaveAnimation(index, distance) {
        if(distance > 140) return;
        const positions = this.planeGeometry.attributes.position;
        const scale = Math.min(10 / distance, 1);
        const upOffset = () => { return (Math.random() * 0.5 + 5) * scale; };
        const downOffset = () => { return (-Math.random() * 0.5 - 3) * scale; };
        const vertexState = this.vertexStates[index];
        const startingOffset = vertexState.off;
        vertexState.waving = true;

        const upTween = new TWEEN.Tween(vertexState)
            .to({ off: upOffset() }, 80)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                positions.setZ(index, vertexState.pos + vertexState.off);
            })
            .onComplete(() => {
                this.tweenList.add(downTween);
            });
        const downTween = new TWEEN.Tween(vertexState)
            .to({ off: downOffset() }, 170)
            .easing(TWEEN.Easing.Quadratic.In)
            .onUpdate(() => {
                positions.setZ(index, vertexState.pos + vertexState.off);
            })
            .onComplete(() => {
                this.tweenList.add(resetTween);
            });
        const resetTween = new TWEEN.Tween(vertexState)
            .to({ off: startingOffset }, 300)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate(() => {
                positions.setZ(index, vertexState.pos + vertexState.off);
            })
            .onComplete(() => {
                upTween.remove();
                downTween.remove();
                resetTween.remove();
                vertexState.waving = false;
            });

        upTween.chain(downTween);
        downTween.chain(resetTween);
        upTween.delay(distance / 100 * 1000).start();
        this.tweenList.add(upTween);
    }

    startRenderLoop() {
        let fps = 30;
        let last = -fps;
        const animate = (time) => {
            if(time - last > 1000/fps) {
                this.composer.render(time);
                this.tweenList.update(time);
                this.planeGeometry.attributes.position.needsUpdate = true;
                last = time;
            }
        }
        this.renderer.setAnimationLoop(animate);
    }
}