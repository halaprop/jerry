import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/OrbitControls';


async function loadScene(path) {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(path, resolve, undefined, reject);
  });
}

async function loadTexture(path) {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(path, resolve, undefined, reject);
  });
}

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2800 );
camera.position.set( 30, 200, 300 );
//camera.lookAt( 0, 0, 0 );

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(30, 100, -100);
controls.update();

const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xffffff, .60);  // white light with 60% intensity
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);  // white light with full intensity
directionalLight.position.set(50, 30, 50);  // Position the light
directionalLight.castShadow = true;  // Enable shadows
scene.add(directionalLight);

// const axesHelper = new THREE.AxesHelper(500);
// scene.add(axesHelper);
// scene.scale.set(1, 1, 1); // Scale up by a factor of 10



function fitTextureToMesh(texture, mesh) {
  // Calculate the aspect ratios
  const textureWidth = texture.image.width;
  const textureHeight = texture.image.height;

  const boundingBox = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);

  const meshWidth = size.x;
  const meshHeight = size.y;

  const textureRatio = textureWidth / textureHeight;
  const meshRatio = meshWidth / meshHeight;

  let width, height;

  if (textureRatio > meshRatio) {
      // Texture is wider
      width = meshWidth;
      height = meshWidth / textureRatio;
  } else {
      // Texture is taller
      height = meshHeight;
      width = meshHeight * textureRatio;
  }
  return new THREE.PlaneGeometry(Math.round(width), Math.round(height));
}

async function liveTexture() {
  const url = 'https://demo.streamplanet.tv/screens/seinfeld.png';
  const nocacheURL = `${url}?${new Date().getTime()}`;
  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(nocacheURL, resolve, undefined, reject);
  });
}


async function textureTheTV(path) {
  let texture;

  if (path) {
    texture = await loadTexture(path);
  } else {
    texture = await liveTexture()
  }

  const material = new THREE.MeshBasicMaterial({ map: texture });

  // find the tv mesh in the gltf scene
  let tvMesh;
  const gltfScene = scene.getObjectByName("room_scene");
  gltfScene.traverse(child => {
    if (child.isMesh && child.name.includes("TV1_Black001_0")) {
      //console.log(child.name, 'Geometry:', child.geometry);
      //child.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });  // test: apply a bright red material
      tvMesh = child;        
    }
  });


  // create a mesh to hold the texture 
  let planeMesh = scene.getObjectByName("plane_mesh");
  if (!planeMesh) {
    // fit the tv aspect ratio
    planeMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.Material());
    planeMesh.name = "plane_mesh";

    // position just in front of the tv
    const worldPosition = new THREE.Vector3();
    const deltaZ = 2;
    tvMesh.getWorldPosition(worldPosition);
    planeMesh.position.set(worldPosition.x, worldPosition.y, worldPosition.z + deltaZ);  
  
    scene.add(planeMesh);
  }

  const planeGeometry = fitTextureToMesh(texture, tvMesh);
  planeMesh.geometry = planeGeometry;

  planeMesh.material = material;
  scene.needsUpdate = true;

}


async function startup() {
  const gltf = await loadScene('./living_room_orange/scene.gltf')
  gltf.scene.name = "room_scene";
  scene.add( gltf.scene );

  await textureTheTV('jerry.jpg');

  setTimeout(textureTheTV, 5000);
  setInterval(() => {
    console.log('re-texturing')
    textureTheTV();
  }, 10000)

  return "started"
}


startup().then(console.log)

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
