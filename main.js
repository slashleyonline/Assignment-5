import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//add lighting
var light = new THREE.DirectionalLight(0xffff00, 1);
light.position.set(0, 100, 200); 
scene.add(light);

const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 );
const greenMaterial = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
const redMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
const cube = new THREE.Mesh( cubeGeometry, greenMaterial );
cube.castShadow = true;
cube.receiveShadow = true;
scene.add( cube );

//add plane

const planeGeometry = new THREE.BoxGeometry(10, 1, 10);
const plane = new THREE.Mesh(planeGeometry, redMaterial);
plane.castShadow = true;
plane.receiveShadow = true;
plane.position.y = -2

scene.add(plane);



camera.position.z = 5;

//bullet stuff

//moving forward every second

//coliding with the zamble

//zombie

//if zamble collides with player

function animate( time ) {
    //use this for camera movement
    cube.rotation.x = time / 2000;
    cube.rotation.y = time / 1000;

    renderer.render( scene, camera );
}