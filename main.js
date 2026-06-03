import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {GUI} from 'three/addons/libs/lil-gui.module.min.js'
import { Water } from 'three/addons/objects/Water.js'

//SKYBOX ASSET MADE BY SIRSNOWY7 on OpenGameArt.org
//titled: Ocean HDRI/SkyBox

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )
const renderer = new THREE.WebGLRenderer({ alpha: true, })

renderer.setSize( window.innerWidth, window.innerHeight )
document.body.appendChild( renderer.domElement )

renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

//gltf loader
const loader = new GLTFLoader()

//add lighting
var light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(0, 100, 200) 
scene.add(light)

const pointLight = new THREE.PointLight( 0xE7E5B0FF, 1, 100 )
pointLight.position.set( 0, 0, 0 )
scene.add( pointLight )

const amLight = new THREE.AmbientLight( 0x000099 )
scene.add( amLight )

const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 )
const greenMaterial = new THREE.MeshStandardMaterial( { color: 0x00ff00 } )
const brownMaterial = new THREE.MeshStandardMaterial( { color: 0x994000 } )
const cube = new THREE.Mesh( cubeGeometry, greenMaterial )

const planeGeometry = new THREE.BoxGeometry(10, 1, 10)
const plane = new THREE.Mesh(planeGeometry, brownMaterial)
plane.castShadow = true
plane.receiveShadow = true
plane.position.y = -2.6

scene.add(plane)

const tank = await loader.loadAsync( 'FishTank.glb' )
const fish = await loader.loadAsync( 'goldfish.glb' )

tank.scene.children[0].material = new THREE.MeshStandardMaterial({

    depthTest: true,

    depthWrite: false

})
scene.add( tank.scene )
tank.scene.rotation.y = Math.PI / 2
tank.scene.position.z = 0.5
tank.scene.position.y = -1 

camera.position.z = 5

fish.scene.scale.set(0.15,0.15,0.15)
fish.scene.rotation.y = Math.PI / 2
fish.scene.position.y = -1
scene.add( fish.scene )



const texLoader = new THREE.TextureLoader()

const bubbles = []
const MAX_BUBBLES = 25
let bubbleMaterial
let bubbleGeometry = new THREE.SphereGeometry(0.15, 16, 16) 
const mixer = new THREE.AnimationMixer(tank.scene)


let waterRipple = mixer.clipAction(tank.animations[0])
waterRipple.play()

// fishes (needs 2 fish models) 

const fishMixer = new THREE.AnimationMixer(fish.scene)

console.log(fish.animations)
let fishSwim = fishMixer.clipAction(fish.animations[0])
fishSwim.play()

const bubblePosition1 = {
    x: -1.35, y: -2, z: -0.2
}

fish.scene.position.x = 5

texLoader.load('bubble.png', (texture) => {
    bubbleMaterial = new THREE.MeshPhysicalMaterial({
        roughness: 0,
        metalness: 0.1,
        map: texture,
        color: 0xffffff,
        depthWrite: false  
    })

    for (let i = 0; i < MAX_BUBBLES; i++) {
        spawnBubble(bubblePosition1.x, bubblePosition1.y, bubblePosition1.z); 
    }
});

const bgTexture = texLoader.load(
    'skyrender.png',
    () => {
      bgTexture.mapping = THREE.EquirectangularReflectionMapping;
      bgTexture.colorSpace = THREE.SRGBColorSpace;
      scene.background = bgTexture;
    });

const clock = new THREE.Clock()
renderer.setAnimationLoop(animate);

const controls = new OrbitControls(camera, renderer.domElement);

texLoader.load('brick.png', (texture) => {
    const coneGeometry = new THREE.ConeGeometry(5,20,32)
    const torusGeometry = new THREE.TorusGeometry(3,2,5,20)
    const stoneMaterial = new THREE.MeshStandardMaterial( {
        map: texture 
    })
    const cone = new THREE.Mesh(coneGeometry, stoneMaterial)
    const torus = new THREE.Mesh(torusGeometry, stoneMaterial)

    cone.scale.set(0.1,0.1,0.1)
    torus.scale.set(0.1,0.1,0.05)

    scene.add(cone)
    scene.add(torus)

    cone.position.y = -1
    cone.position.x = 1.3
    cone.rotation.x = (Math.PI / 180) * -10

    torus.rotation.x = (Math.PI / 2)
    torus.position.x = 1.3
    torus.position.y = -0.5
    torus.rotation.x = (Math.PI / 180) * -100
    torus.position.z = -0.1
})


function animate(time) {
    const delta = clock.getDelta()
    const elapsedTime = clock.getElapsedTime()
    
    mixer.update(delta)
    fishMixer.update(delta)

    const OFFSET_X = 0
    const OFFSET_Z = 0.7

    const area = 1
    const currentX = area * Math.sin(elapsedTime) + OFFSET_X
    const currentZ = area * (Math.sin(elapsedTime) * Math.cos(elapsedTime)) + OFFSET_Z

    fish.scene.position.x = currentX
    fish.scene.position.z = currentZ


    const futureTime = elapsedTime + 0.01
    const targetX = area * Math.sin(futureTime) + OFFSET_X
    const targetZ = area * (Math.sin(futureTime) * Math.cos(futureTime)) + OFFSET_Z

    const targetPosition = new THREE.Vector3(targetX, fish.scene.position.y, targetZ)
    fish.scene.lookAt(targetPosition)

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i]
        const data = bubble.userData

        bubble.position.y += data.speedY * delta

        bubble.position.x += Math.sin(elapsedTime * data.wobbleSpeed + data.wobbleXOffset) * data.wobbleScale
        bubble.position.z += Math.cos(elapsedTime * data.wobbleSpeed + data.wobbleZOffset) * data.wobbleScale

        if (bubble.scale.x < data.targetScale) {
            const growth = data.growthSpeed * delta
            bubble.scale.addScalar(growth)
        }

        if (bubble.position.y >= data.popHeight) {
            popBubble(bubble, i)
        }
    }

    renderer.render(scene, camera)
}


function spawnBubble(positionX, positionY, positionZ) {
    if (!bubbleMaterial) return

    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial)

    bubble.position.x = positionX + (Math.random() * 0.1) 
    bubble.position.z = positionZ + (Math.random() * 0.1) 
    bubble.position.y = positionY 
    bubble.scale.set(0.3,0.3,0.3)

    bubble.scale.set(0, 0, 0)

    bubble.userData = {
        speedY: Math.random() * 1.5 + 1.0,   
        wobbleSpeed: Math.random() + 2,     
        wobbleScale: Math.random() * 0.002,
        wobbleXOffset: Math.random() * 10,     
        wobbleZOffset: Math.random() * 10,
        targetScale: Math.random() * 0.005 + 0.4, 
        growthSpeed: Math.random() * 2 + 1,     
        popHeight: 0.001
    }

    scene.add(bubble)
    bubbles.push(bubble)
}

function popBubble(bubble, index) {
    scene.remove(bubble)
    bubble.geometry.dispose()
    bubbles.splice(index, 1)
    
    spawnBubble(bubblePosition1.x, bubblePosition1.y, bubblePosition1.z)
}