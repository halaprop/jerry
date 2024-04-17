import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/OrbitControls';


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 800 );
camera.position.set( 0, 300, 300 );
camera.lookAt( 0, 0, 0 );

const controls = new OrbitControls(camera, renderer.domElement);

const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xffffff, .60);  // white light with 60% intensity
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);  // white light with full intensity
directionalLight.position.set(50, 30, 50);  // Position the light
directionalLight.castShadow = true;  // Enable shadows
scene.add(directionalLight);

const axesHelper = new THREE.AxesHelper(500);
scene.add(axesHelper);
scene.scale.set(1, 1, 1); // Scale up by a factor of 10


async function loadScene(path) {
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {

    loader.load(
      path,  // This is the path to your .gltf file.
      function ( gltf ) {
        // This function is called when the load is successful
        // `gltf` is the loaded object that contains the scene.
    
        // Adding the loaded scene to your existing scene
        scene.add( gltf.scene );
    
        let tvMesh; // This will hold our TV mesh
    
        gltf.scene.traverse((child) => {
          if (child.isMesh && child.name.includes("TV1_Black001_0")) {  // Adjust the condition to match TV-like names
            //console.log(child.name, 'Geometry:', child.geometry);
            //child.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });  // Apply a bright red material
            tvMesh = child;
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load('jerry.jpg',
              function(texture) {
                console.log(texture)
                const material = new THREE.MeshBasicMaterial({
                  map: texture
                });
                // tvMesh.material = material;
                // tvMesh.material.needsUpdate = true;
    
                const planeGeometry = new THREE.PlaneGeometry(100, 50); // You can adjust the size
                const planeMesh = new THREE.Mesh(planeGeometry, material);
                //planeMesh.position.set(0, 50, 0); // Position it so it's clearly visible
    
                // reposition to match tv
                const worldPosition = new THREE.Vector3();
                tvMesh.getWorldPosition(worldPosition);
                planeMesh.position.set(worldPosition.x, worldPosition.y, worldPosition.z+2);
    
                
                // Move the plane forward along the local Z-axis of the TV mesh
                // const offsetDistance = -2; // Distance to offset in front of the TV, adjust as needed
                // planeMesh.translateZ(-offsetDistance); // Use negative if you need to push it in front depending on the TV's facing direction
            
            
                scene.add(planeMesh); // Add the plane to the scene
            
              },
              undefined,
              function(error) {
                console.error('Error loading texture:', error); // This will log if there's an error
              }
            );
    
          }
        });
        resolve(gltf);
    
        // Optional: Do any additional operations such as setting the position, starting animations, etc.
      },
      undefined,
      function ( error ) {
        // This function is called if an error occurs
        console.log( 'An error happened:', error );
      }
    );
  });
}

// path is 'jerry.jpg'
async function loadTexture(path) {
  const textureLoader = new THREE.TextureLoader();

  return new Promise((resolve, reject) => {
    textureLoader.load(path,
      function(texture) {
        const material = new THREE.MeshBasicMaterial({
          map: texture
        });

        const planeGeometry = new THREE.PlaneGeometry(100, 50); // You can adjust the size
        const planeMesh = new THREE.Mesh(planeGeometry, material);
        resolve(planeMesh);
      },
      undefined,
      function(error) {
        console.error('Error loading texture:', error); // This will log if there's an error
      }
    );

  });
}

loadScene('./living_room_orange/scene.gltf').then(gltf => {})


function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
