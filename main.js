import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import { Water } from 'three/addons/objects/Water.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({ alpha: true, });

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//gltf loader
const loader = new GLTFLoader()

//add lighting
var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 100, 200); 
scene.add(light);

const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 );
const greenMaterial = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
const redMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
const cube = new THREE.Mesh( cubeGeometry, greenMaterial );

const planeGeometry = new THREE.BoxGeometry(10, 1, 10);
const plane = new THREE.Mesh(planeGeometry, redMaterial);
plane.castShadow = true;
plane.receiveShadow = true;
plane.position.y = -4

scene.add(plane);

 const tank = await loader.loadAsync( 'FishTank.glb' )

tank.scene.children[0].material = new THREE.MeshStandardMaterial({

    depthTest: true,

    depthWrite: false

})
scene.add( tank.scene )
tank.scene.rotation.y = Math.PI / 2
tank.scene.position.z = 0.5
tank.scene.position.y = -1 

camera.position.z = 5;

const pointLight = new THREE.PointLight( 0xE7E5B0FF, 1, 100 );
pointLight.position.set( 0, 0, 0 );
scene.add( pointLight );

const amLight = new THREE.AmbientLight( 0x000099 );
scene.add( amLight );

const texLoader = new THREE.TextureLoader()

const bubbles = [];
const MAX_BUBBLES = 25;
let bubbleMaterial;
let bubbleGeometry = new THREE.SphereGeometry(0.15, 16, 16); 

const mixer = new THREE.AnimationMixer(tank.scene)

const bubblePosition1 = {
    x: 0, y: -2, z: 0
}

texLoader.load('bubble.png', (texture) => {
    bubbleMaterial = new THREE.MeshPhysicalMaterial({
        roughness: 0,
        metalness: 0.1,
        map: texture,
        color: 0xffffff,
        depthWrite: false  
    });

    for (let i = 0; i < MAX_BUBBLES; i++) {
        spawnBubble(bubblePosition1.x, bubblePosition1.y, bubblePosition1.z); 
    }
});

function spawnBubble(positionX, positionY, positionZ) {
    if (!bubbleMaterial) return;

    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);

    bubble.position.x = positionX + (Math.random() * 0.1); 
    bubble.position.z = positionZ + (Math.random() * 0.1); 
    bubble.position.y = positionY; 
    bubble.scale.set(0.3,0.3,0.3)

    bubble.scale.set(0, 0, 0);

    bubble.userData = {
        speedY: Math.random() * 1.5 + 1.0,   
        wobbleSpeed: Math.random() + 2,     
        wobbleScale: Math.random() * 0.002,
        wobbleXOffset: Math.random() * 10,     
        wobbleZOffset: Math.random() * 10,
        targetScale: Math.random() * 0.005 + 0.4, 
        growthSpeed: Math.random() * 2 + 1,     
        popHeight: 0.001
    };

    scene.add(bubble);
    bubbles.push(bubble);
}

function popBubble(bubble, index) {
    scene.remove(bubble);
    bubble.geometry.dispose();
    bubbles.splice(index, 1);
    
    spawnBubble(bubblePosition1.x, bubblePosition1.y, bubblePosition1.z);
}

const clock = new THREE.Clock()
renderer.setAnimationLoop(animate);

const controls = new OrbitControls(camera, renderer.domElement);

function animate(time) {
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    
    if (mixer) mixer.update(delta);

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];
        const data = bubble.userData;

        bubble.position.y += data.speedY * delta;

        bubble.position.x += Math.sin(elapsedTime * data.wobbleSpeed + data.wobbleXOffset) * data.wobbleScale;
        bubble.position.z += Math.cos(elapsedTime * data.wobbleSpeed + data.wobbleZOffset) * data.wobbleScale;

        if (bubble.scale.x < data.targetScale) {
            const growth = data.growthSpeed * delta;
            bubble.scale.addScalar(growth);
        }

        if (bubble.position.y >= data.popHeight) {
            popBubble(bubble, i);
        }
    }

    renderer.render(scene, camera);
}