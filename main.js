import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/OrbitControls';


async function loadScene(path) {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(path, resolve, undefined, reject);
  });
}

// Load the LR model, tweak it a little, and setup a plane mesh (to texture the tv)
// resolve to the plane mesh and a Vector3 of the tv's size
async function loadLRScene(ath) {
  const gltf = await loadScene('./living_room_orange/scene.gltf');
  gltf.scene.name = "room_scene";
  scene.add( gltf.scene );

  let tvMesh;
  gltf.scene.traverse(child => {
    if (child.isMesh) {
      // for debug: console.log(child.name)

      // grab the tvMesh
      if (child.name.includes("TV1_Black001_0")) {
        // for debug:
        //console.log(child.name, 'Geometry:', child.geometry);
        //child.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });  // test: apply a bright red material
        tvMesh = child;        
      }

      // restyle the table and credenza with outlines so they pop a little
      if (child.name.includes("Mesa_Wood_0") || child.name.includes("Mesa_2_Wood_0")) {
        const edgeGeometry = new THREE.EdgesGeometry(child.geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x5C4033 });
        const edgeWireframe = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        child.add(edgeWireframe);
      }
    }
  });

  const boundingBox = new THREE.Box3().setFromObject(tvMesh);
  const tvSize = new THREE.Vector3();
  boundingBox.getSize(tvSize);

  const tvFace = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.Material());
  tvFace.name = "tv_face";

  // position just in front of the tv
  const worldPosition = new THREE.Vector3();
  const deltaZ = 2;
  tvMesh.getWorldPosition(worldPosition);
  tvFace.position.set(worldPosition.x, worldPosition.y, worldPosition.z + deltaZ);

  scene.add(tvFace);
  return { tvFace, tvSize };
}


async function loadTexture(path) {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(path, resolve, undefined, reject);
  });
}

const renderer = new THREE.WebGLRenderer({antialias: true });
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


function aspectFit(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;

  let width, height;
  if (sourceAspect > targetAspect) {
      width = targetWidth;
      height = targetWidth / sourceAspect;
  } else {
      height = targetHeight;
      width = targetHeight * sourceAspect;
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


async function textureTVFace(tvFaceInfo, path) {
  let texture;

  if (path) {
    texture = await loadTexture(path);
  } else {
    texture = await liveTexture()
  }

  const material = new THREE.MeshBasicMaterial({ map: texture });
  const planeGeometry = aspectFit(texture.image.width, texture.image.height, tvFaceInfo.tvSize.x, tvFaceInfo.tvSize.y);
  tvFaceInfo.tvFace.geometry = planeGeometry;
  tvFaceInfo.tvFace.material = material;
  scene.needsUpdate = true;
}


async function startup() {
  const tvFaceInfo = await loadLRScene()
  await textureTVFace(tvFaceInfo, 'jerry.jpg');

  setTimeout(() => textureTVFace(tvFaceInfo), 5000);
  setInterval(() => {
    console.log('re-texturing')
    textureTVFace(tvFaceInfo);
  }, 10000)

  return "started"
}


startup().then(console.log)

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
