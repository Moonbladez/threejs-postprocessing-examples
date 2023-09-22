import { GUI } from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { DotScreenPass } from "three/examples/jsm/postprocessing/DotScreenPass.js";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";

/**
 * Base
 */
// Debug
const gui = new GUI();
const dotScreenFolder = gui.addFolder("Dot Screen").close();
const glitchFolder = gui.addFolder("Glitch").close();
const rgbShiftFolder = gui.addFolder("RGB Shift").close();
const unrealBloomPassFolder = gui.addFolder("Unreal Bloom").close();
const tintFolder = gui.addFolder("Tint").close();
const displacementFolder = gui.addFolder("Displacement").close();

const gammaCorrectionFolder = gui.addFolder("Gamma Correction").close();

// Canvas
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
const textureLoader = new THREE.TextureLoader();

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      child.material.envMapIntensity = 2.5;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.jpg",
  "/textures/environmentMaps/0/nx.jpg",
  "/textures/environmentMaps/0/py.jpg",
  "/textures/environmentMaps/0/ny.jpg",
  "/textures/environmentMaps/0/pz.jpg",
  "/textures/environmentMaps/0/nz.jpg",
]);

scene.background = environmentMap;
scene.environment = environmentMap;

/**
 * Models
 */
gltfLoader.load("/models/DamagedHelmet/glTF/DamagedHelmet.gltf", (gltf) => {
  gltf.scene.scale.set(2, 2, 2);
  gltf.scene.rotation.y = Math.PI * 0.5;
  scene.add(gltf.scene);

  updateAllMaterials();
});

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 3, -2.25);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  //update postprocessing
  postprocessing.setSize(sizes.width, sizes.height);
  postprocessing.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(4, 1, -4);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.useLegacyLights = false;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//render target
const renderTarget = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
  samples: renderer.getPixelRatio() === 1 ? 2 : 0,
});

/**
 * Post processing
 */

const postprocessing = new EffectComposer(renderer, renderTarget);
postprocessing.setSize(sizes.width, sizes.height);
postprocessing.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const renderPass = new RenderPass(scene, camera);
postprocessing.addPass(renderPass);

//Dot screen
const dotScreenPass = new DotScreenPass();
postprocessing.addPass(dotScreenPass);
dotScreenPass.enabled = false;
dotScreenFolder.add(dotScreenPass, "enabled").name("Dot Screen");

//Glitch
const glitchPass = new GlitchPass();
postprocessing.addPass(glitchPass);
glitchPass.enabled = false;
glitchPass.goWild = false;
glitchFolder.add(glitchPass, "enabled").name("Glitch");
glitchFolder.add(glitchPass, "goWild").name("Go Wild");

//rgb shift
const rgbShiftPass = new ShaderPass(RGBShiftShader);
postprocessing.addPass(rgbShiftPass);
rgbShiftPass.enabled = false;
rgbShiftFolder.add(rgbShiftPass, "enabled").name("RGB Shift");

//unreal bloom
const unrealBloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 1.5, 0.4, 0.85);
postprocessing.addPass(unrealBloomPass);
unrealBloomPass.enabled = false;
unrealBloomPassFolder.add(unrealBloomPass, "enabled").name("Unreal Bloom");
unrealBloomPassFolder.add(unrealBloomPass, "strength").min(0).max(2).step(0.001).name("Strength");
unrealBloomPassFolder.add(unrealBloomPass, "radius").min(0).max(3).step(0.001).name("Radius");
unrealBloomPassFolder.add(unrealBloomPass, "threshold").min(0).max(1).step(0.001).name("Threshold");

//Tone pass
const TintShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTint: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

      vUv = uv;
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 uTint;

    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb += uTint;
      gl_FragColor = color;
    }
  `,
};
const tintPass = new ShaderPass(TintShader);
tintPass.material.uniforms.uTint.value = new THREE.Vector3();
postprocessing.addPass(tintPass);
tintFolder.add(tintPass.material.uniforms.uTint.value, "x").min(-1).max(1).step(0.001).name("Red");
tintFolder.add(tintPass.material.uniforms.uTint.value, "y").min(-1).max(1).step(0.001).name("Green");
tintFolder.add(tintPass.material.uniforms.uTint.value, "z").min(-1).max(1).step(0.001).name("Blue");

//Displacement pass
const DisplacementPass = {
  uniforms: {
    tDiffuse: { value: null },
    uNormalMap: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

      vUv = uv;
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D uNormalMap;

    varying vec2 vUv;

    void main() {
      vec3 normalColor = texture2D(uNormalMap, vUv).xyz * 2.0 -1.0;
      vec2 newUv = vUv + normalColor.xy * 0.2;
      vec4 color = texture2D(tDiffuse, newUv);

      vec3 lightDirection = normalize(vec3(-1.0, 1.0, 0.0));
      float lightness = clamp(dot(normalColor, lightDirection), 0.0, 1.0);
      color.rgb += lightness * 2.0;

      gl_FragColor = color;
    }
  `,
};
const displacementPass = new ShaderPass(DisplacementPass);
displacementPass.material.uniforms.uNormalMap.value = textureLoader.load("/textures/interfaceNormalMap.png");
postprocessing.addPass(displacementPass);
displacementPass.enabled = false;
displacementFolder.add(displacementPass, "enabled").name("Displacement");

//COLOR FIX Goes at the end of passes
const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
postprocessing.addPass(gammaCorrectionPass);
//gui
gammaCorrectionFolder.add(gammaCorrectionPass, "enabled").name("Gamma Correction");

//smaa
if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) {
  const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
  );
  postprocessing.addPass(smaaPass);
}

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  // renderer.render(scene, camera);
  postprocessing.render();
  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
