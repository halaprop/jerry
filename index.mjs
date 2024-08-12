import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/OrbitControls';

let scene, camera, renderer, tvFace, tvSize, video;

function setupTHREE() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2800);
  camera.position.set(30, 200, 300);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(30, 100, -100);
  controls.update();

  scene = new THREE.Scene();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 30, 50);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
}

async function loadScene(path) {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(path, resolve, undefined, reject);
  });
}

async function loadLRScene() {
  const gltf = await loadScene('./living_room_orange/scene.gltf');
  scene.add(gltf.scene);

  let tvMesh;
  gltf.scene.traverse(child => {
    if (child.isMesh) {
      if (child.name.includes("TV1_Black001_0")) {
        tvMesh = child;
      }
      if (child.name.includes("Mesa_Wood_0") || child.name.includes("Mesa_2_Wood_0")) {
        const edgeGeometry = new THREE.EdgesGeometry(child.geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x5C4033 });
        const edgeWireframe = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        child.add(edgeWireframe);
      }
    }
  });

  if (tvMesh) {
    const boundingBox = new THREE.Box3().setFromObject(tvMesh);
    tvSize = boundingBox.getSize(new THREE.Vector3());

    tvFace = new THREE.Mesh(new THREE.PlaneGeometry(tvSize.x, tvSize.y), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    
    const worldPosition = new THREE.Vector3();
    const deltaZ = 2;
    tvMesh.getWorldPosition(worldPosition);
    tvFace.position.set(worldPosition.x, worldPosition.y, worldPosition.z + deltaZ);
  
    scene.add(tvFace);

    const texture = new THREE.VideoTexture(video);
    tvFace.material.map = texture;
    tvFace.material.needsUpdate = true;
  
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

async function start() {
  setupTHREE()
  await loadLRScene();
  animate();
}



// resolves to the video element if successful
async function setupVideo() {
  const videoSrc = 'https://cdn.seinfeld626.com/hls/seinfeld/src/index.m3u8';

  //var video = document.getElementById('video');
  video = document.createElement('video');

  video.addEventListener('click', function (event) {
    event.preventDefault();
  });

  if (!Hls.isSupported()) {
    return Promise.reject('HLS not supported');
  }
  return new Promise((resolve, reject) => {
    var hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);

    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      resolve(video);
    });
    hls.on(Hls.Events.ERROR, function (event, data) {
      reject(data);
    });
  });
}

setupVideo().then(start)

const maxImages = 20;
const imageStrip = document.getElementById('image-strip');

function addImageToStrip(src) {
    const img = document.createElement('img');
    img.src = src;
    imageStrip.appendChild(img);
    
    if (imageStrip.children.length > maxImages) {
        imageStrip.removeChild(imageStrip.firstChild);
    }
}

const snapButton = document.getElementById('snap-button');
const target = document.getElementById('target');
const frames = [];
const pollInterval = 1000; // Poll every second

function pollVideoFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/png');
    frames.push(image);
    addImageToStrip(image)
    if (frames.length > 10) frames.shift();
}

function displayFrame() {
  if (frames.length < 10) return;
  const img = document.createElement('img');
  img.src = frames[0]; // Frame from 10 seconds ago
  img.style.width = '100%';
  img.style.height = '100%';
  target.innerHTML = '';
  target.appendChild(img);
}

snapButton.addEventListener('click', event => {
  video.play();
});

setInterval(pollVideoFrame, pollInterval);