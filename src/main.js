import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const QUALITY = IS_MOBILE ? 0.52 : 1.0;


const CONFIG = {
  speed: 9.0,
  acceleration: 16,
  friction: 12,
  interactDistance: 3.8,

  // Distância maior entre o início e o QR Code
  startPosition: new THREE.Vector3(0, 0.02, 16),
  qrPosition: new THREE.Vector3(0, 0, -66),

  cameraOffset: new THREE.Vector3(0, 6.1, 10.5),
  cameraLookHeight: 2.35,
  desiredCharacterHeight: 3.65,

  modelYawOffset: -Math.PI / 2,
  worldForward: new THREE.Vector3(0, 0, -1),
  worldRight: new THREE.Vector3(1, 0, 0),

  pathTileSpacing: 2.75,
  pathTileCount: IS_MOBILE ? 24 : 31
};

const state = {
  started: false,
  loaded: false,
  keys: { forward: false, back: false, left: false, right: false },
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(0, 0, -1),
  targetAngle: Math.PI,
  walkCycle: 0,
  isNearQr: false
};

const ui = {
  loadingScreen: document.getElementById("loadingScreen"),
  startButton: document.getElementById("startButton"),
  loadStatus: document.getElementById("loadStatus"),
  objectiveText: document.getElementById("objectiveText"),
  interactionHint: document.getElementById("interactionHint"),
  qrModal: document.getElementById("qrModal"),
  closeQr: document.getElementById("closeQr")
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060816);
scene.fog = new THREE.Fog(0x060816, 42, 132);

const camera = new THREE.PerspectiveCamera(57, window.innerWidth / window.innerHeight, 0.1, 250);
camera.position.set(0, 6, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(IS_MOBILE ? 1 : Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = !IS_MOBILE;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();

setupLights();
setupWorld();

const player = createPlayerRoot();
player.root.position.copy(CONFIG.startPosition);
scene.add(player.root);

loadCharacter();

const board = createQrBoard();
scene.add(board.root);

const guide = createGuidePath();
scene.add(guide.root);

const dust = createSpaceTrailParticles();
scene.add(dust.root);

ui.startButton.addEventListener("click", () => {
  if (!state.loaded) return;
  state.started = true;
  ui.loadingScreen.classList.add("hidden");
});

ui.closeQr.addEventListener("click", () => ui.qrModal.classList.remove("visible"));

window.addEventListener("keydown", (event) => {
  setKey(event.code, true);
  if (event.code === "KeyE") tryOpenQr();
});

window.addEventListener("keyup", (event) => setKey(event.code, false));

bindMobile("up", "forward");
bindMobile("down", "back");
bindMobile("left", "left");
bindMobile("right", "right");
document.getElementById("interact").addEventListener("click", tryOpenQr);
window.addEventListener("resize", onResize);

animate();

function setupLights() {
  scene.add(new THREE.HemisphereLight(0xbcc8ff, 0x0b1024, 1.25));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(8, 18, 12);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(IS_MOBILE ? 512 : 1024, IS_MOBILE ? 512 : 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 120;
  keyLight.shadow.camera.left = -30;
  keyLight.shadow.camera.right = 30;
  keyLight.shadow.camera.top = 30;
  keyLight.shadow.camera.bottom = -30;
  scene.add(keyLight);

  const fill = new THREE.DirectionalLight(0x7ca8ff, 0.95);
  fill.position.set(-12, 7, 9);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x86ffd9, 0.6);
  rim.position.set(0, 4, -18);
  scene.add(rim);

  const qrGlow = new THREE.PointLight(0x85ffb1, 2.2, 20);
  qrGlow.position.set(CONFIG.qrPosition.x, 3.8, CONFIG.qrPosition.z + 1.5);
  scene.add(qrGlow);
}

function setupWorld() {
  createVoidFloor();
  createFloatingPath();
  createStarField();
  createNebulaPanels();
  createPlanets();
  createFloatingRocks();
  createLightBeacons();
}

function createVoidFloor() {
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(60, IS_MOBILE ? 36 : 80),
    new THREE.MeshStandardMaterial({
      color: 0x070b16,
      roughness: 0.92,
      metalness: 0.08,
      transparent: true,
      opacity: 0.96
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.08;
  floor.receiveShadow = true;
  scene.add(floor);

  const glow = new THREE.Mesh(
    new THREE.RingGeometry(12, 58, IS_MOBILE ? 48 : 128),
    new THREE.MeshBasicMaterial({
      color: 0x20305f,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.02;
  scene.add(glow);
}

function createFloatingPath() {
  const group = new THREE.Group();

  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x21283a,
    roughness: 0.45,
    metalness: 0.28
  });

  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0x8dfff0,
    emissive: 0x1b7066,
    roughness: 0.28,
    metalness: 0.15
  });

  for (let i = 0; i < CONFIG.pathTileCount; i++) {
    const z = CONFIG.startPosition.z - 3 - i * CONFIG.pathTileSpacing;
    const y = Math.sin(i * 0.45) * 0.05;

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.25, 1.85),
      platformMat
    );
    platform.position.set(0, y, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    const edgeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 1.92), edgeMat);
    edgeL.position.set(-1.82, y + 0.02, z);
    group.add(edgeL);

    const edgeR = edgeL.clone();
    edgeR.position.x = 1.82;
    group.add(edgeR);

    if (i < CONFIG.pathTileCount - 1) {
      const connector = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.0, 10),
        edgeMat
      );
      connector.rotation.x = Math.PI / 2;
      connector.position.set(0, y - 0.02, z - CONFIG.pathTileSpacing / 2);
      group.add(connector);
    }
  }

  scene.add(group);
}

function createStarField() {
  const count = IS_MOBILE ? 650 : 1800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const colorA = new THREE.Color(0xffffff);
  const colorB = new THREE.Color(0x8cc8ff);
  const colorC = new THREE.Color(0xb8a7ff);

  for (let i = 0; i < count; i++) {
    const radius = 40 + Math.random() * 95;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 60;
    const x = Math.cos(theta) * radius + (Math.random() - 0.5) * 14;
    const z = Math.sin(theta) * radius - 25 + (Math.random() - 0.5) * 20;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const pick = Math.random();
    const c = pick < 0.5 ? colorA : pick < 0.78 ? colorB : colorC;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: IS_MOBILE ? 0.16 : 0.22,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const stars = new THREE.Points(geometry, material);
  stars.name = "StarField";
  scene.add(stars);
}

function createNebulaPanels() {
  const nebulaTexture = createNebulaTexture();

  const positions = IS_MOBILE ? [
    { x: -22, y: 13, z: -35, ry: 0.6, s: 15 }
  ] : [
    { x: -22, y: 13, z: -28, ry: 0.6, s: 16 },
    { x: 23, y: 10, z: -48, ry: -0.4, s: 19 },
    { x: -18, y: 7, z: -68, ry: 0.3, s: 13 }
  ];

  positions.forEach((p) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(p.s, p.s * 0.62),
      new THREE.MeshBasicMaterial({
        map: nebulaTexture,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    mesh.position.set(p.x, p.y, p.z);
    mesh.rotation.y = p.ry;
    scene.add(mesh);
  });
}

function createNebulaTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 512, 512);

  const paintBlob = (x, y, r, color, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace("ALPHA", alpha.toString()));
    g.addColorStop(1, color.replace("ALPHA", "0"));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  for (let i = 0; i < 9; i++) {
    paintBlob(
      Math.random() * 512,
      Math.random() * 512,
      70 + Math.random() * 120,
      `rgba(${120 + Math.random() * 100}, ${90 + Math.random() * 60}, ${220 + Math.random() * 35}, ALPHA)`,
      0.15 + Math.random() * 0.18
    );
  }

  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.35})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPlanets() {
  const createPlanet = (size, color, emissive, x, y, z, ring = false) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(size, IS_MOBILE ? 20 : 36, IS_MOBILE ? 20 : 36),
      new THREE.MeshStandardMaterial({
        color,
        emissive,
        roughness: 0.9,
        metalness: 0.04
      })
    );
    group.add(planet);

    if (ring) {
      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(size * 1.3, size * 1.9, IS_MOBILE ? 32 : 64),
        new THREE.MeshBasicMaterial({
          color: 0xb9dfff,
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide
        })
      );
      ringMesh.rotation.x = Math.PI / 2.6;
      group.add(ringMesh);
    }

    scene.add(group);
    return group;
  };

  createPlanet(2.8, 0x5a8cff, 0x10184d, -29, 16, -42, true);
  createPlanet(1.8, 0x9e73ff, 0x1a1035, 26, 9, -30, false);
  createPlanet(1.35, 0xff8bd4, 0x341626, 18, 15, -76, false);
}

function createFloatingRocks() {
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x4b566d,
    roughness: 0.88,
    metalness: 0.06
  });

  for (let i = 0; i < (IS_MOBILE ? 10 : 22); i++) {
    let x = (Math.random() - 0.5) * 34;
    let z = CONFIG.qrPosition.z + Math.random() * 95;
    let y = 0.1 + Math.random() * 1.2;
    if (Math.abs(x) < 4.5) x += x < 0 ? -4.5 : 4.5;

    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.9, 0),
      rockMat
    );
    rock.position.set(x, y, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
}

function createLightBeacons() {
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x111727,
    roughness: 0.42,
    metalness: 0.34
  });

  const lampMat = new THREE.MeshBasicMaterial({ color: 0xcffffd });

  for (let i = 0; i < (IS_MOBILE ? 5 : 8); i++) {
    const z = CONFIG.startPosition.z - 7 - i * 10.5;

    [-3.2, 3.2].forEach((x) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.9, 10), postMat);
      post.position.y = 1.45;
      post.castShadow = true;
      group.add(post);

      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 18), lampMat);
      lamp.position.y = 2.95;
      group.add(lamp);

      const light = new THREE.PointLight(0x92fff1, 0.85, 8);
      light.position.y = 2.95;
      group.add(light);

      scene.add(group);
    });
  }
}

function createPlayerRoot() {
  const root = new THREE.Group();

  const contactShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 44),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.015;
  contactShadow.scale.z = 0.62;
  root.add(contactShadow);

  const aura = new THREE.Mesh(
    new THREE.RingGeometry(1.12, 1.26, 64),
    new THREE.MeshBasicMaterial({
      color: 0x7efff1,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide
    })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.025;
  root.add(aura);

  return {
    root,
    model: null,
    mixer: null,
    animationActions: {},
    allActions: [],
    currentAction: null,
    contactShadow,
    aura
  };
}

function melhorarMateriaisDoModelo(model) {
  model.traverse((object) => {
    if (!object.isMesh) return;

    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = false;

    const materiais = Array.isArray(object.material) ? object.material : [object.material];

    materiais.forEach((material) => {
      if (!material) return;

      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.needsUpdate = true;
      }

      if (material.emissiveMap) {
        material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        material.emissiveMap.needsUpdate = true;
      }

      if (material.normalMap && material.normalScale) {
        material.normalScale.set(0.65, 0.65);
      }

      material.color = new THREE.Color(0xffffff);
      material.metalness = 0.0;
      material.roughness = 0.62;
      material.envMapIntensity = 1.35;
      material.side = THREE.DoubleSide;
      material.needsUpdate = true;
    });
  });
}

function findBestClip(clips, keywords) {
  const lowered = keywords.map(k => k.toLowerCase());
  for (const clip of clips) {
    const name = (clip.name || "").toLowerCase();
    if (lowered.some(keyword => name.includes(keyword))) {
      return clip;
    }
  }
  return null;
}

function fadeToAction(actionName, duration = 0.22) {
  if (!player.animationActions[actionName]) return;
  const nextAction = player.animationActions[actionName];
  if (player.currentAction === nextAction) return;

  if (player.currentAction) {
    player.currentAction.fadeOut(duration);
  }

  nextAction
    .reset()
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .fadeIn(duration)
    .play();

  player.currentAction = nextAction;
}

function configureAnimations(clips) {
  player.mixer = new THREE.AnimationMixer(player.model);

  clips.forEach((clip) => {
    const action = player.mixer.clipAction(clip);
    action.enabled = true;
    action.clampWhenFinished = false;
    player.allActions.push(action);
  });

  const idleClip = findBestClip(clips, ["idle", "rest", "breath", "stand"]) || clips[0] || null;
  const walkClip = findBestClip(clips, ["walk", "locomotion", "move"]) || clips[1] || idleClip;
  const runClip = findBestClip(clips, ["run", "jog", "sprint"]) || walkClip;

  if (idleClip) player.animationActions.idle = player.mixer.clipAction(idleClip);
  if (walkClip) player.animationActions.walk = player.mixer.clipAction(walkClip);
  if (runClip) player.animationActions.run = player.mixer.clipAction(runClip);

  if (player.animationActions.idle) {
    player.currentAction = player.animationActions.idle;
    player.currentAction.play();
  } else if (player.allActions[0]) {
    player.currentAction = player.allActions[0];
    player.currentAction.play();
  }
}

function loadCharacter() {
  const loader = new GLTFLoader();
  loader.load(
    "./assets/personagem_novo.glb",
    (gltf) => {
      const model = gltf.scene;

      melhorarMateriaisDoModelo(model);

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const scale = CONFIG.desiredCharacterHeight / Math.max(size.y, 0.001);
      model.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      const scaledMinY = scaledBox.min.y;
      model.position.x -= scaledCenter.x;
      model.position.z -= scaledCenter.z;
      model.position.y -= scaledMinY;

      player.model = model;
      model.rotation.y = CONFIG.modelYawOffset;
      player.root.add(model);

      if (gltf.animations && gltf.animations.length > 0) {
        configureAnimations(gltf.animations);
        ui.loadStatus.textContent = `Modelo carregado com ${gltf.animations.length} animação(ões).`;
      } else {
        ui.loadStatus.textContent = "";
      }

      state.loaded = true;
      ui.startButton.disabled = false;
      ui.startButton.textContent = "Começar";

    },
    (progress) => {
      if (progress.total) {
        const pct = Math.round((progress.loaded / progress.total) * 100);
        ui.loadStatus.textContent = `Carregando modelo: ${pct}%`;
      } else {
        ui.loadStatus.textContent = IS_MOBILE ? "Modo celular otimizado ativado..." : "Carregando modelo...";
      }
    },
    (error) => {
      console.error("Erro ao carregar GLB:", error);
      ui.startButton.disabled = true;
      ui.startButton.textContent = "Erro ao carregar";
      ui.loadStatus.textContent = "Use Live Server e mantenha a pasta assets junto do index.html.";
      ui.objectiveText.textContent = "Erro ao carregar o modelo GLB.";
    }
  );
}

function createQrBoard() {
  const root = new THREE.Group();
  root.position.copy(CONFIG.qrPosition);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x131a29, roughness: 0.45, metalness: 0.35 });
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0xf2f6ff,
    emissive: 0x09121f,
    roughness: 0.58
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x82ffe6,
    transparent: true,
    opacity: 0.46,
    side: THREE.DoubleSide
  });

  const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.8, 14), postMat);
  post1.position.set(-1.8, 1.4, 0);
  post1.castShadow = true;
  post1.receiveShadow = true;
  root.add(post1);

  const post2 = post1.clone();
  post2.position.x = 1.8;
  root.add(post2);

  const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(4.7, 3.0, 0.18), boardMat);
  boardMesh.position.y = 3.2;
  boardMesh.castShadow = true;
  boardMesh.receiveShadow = true;
  root.add(boardMesh);

  const qrTexture = textureLoader.load("./assets/qr-code.png");
  qrTexture.colorSpace = THREE.SRGBColorSpace;

  const qr = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.0),
    new THREE.MeshBasicMaterial({ map: qrTexture, side: THREE.DoubleSide })
  );
  qr.position.set(0, 3.1, 0.105);
  root.add(qr);

  const titleTexture = createTextTexture("QR CODE", { width: 512, height: 128, fontSize: 54, fill: "#111318" });
  const title = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 0.52),
    new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true, side: THREE.DoubleSide })
  );
  title.position.set(0, 4.45, 0.11);
  root.add(title);

  const glow = new THREE.Mesh(new THREE.RingGeometry(1.65, 1.96, 64), glowMat);
  glow.position.set(0, 3.08, 0.13);
  root.add(glow);

  return { root, glow, qr };
}

function createTextTexture(text, options) {
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = options.fill;
  ctx.font = `900 ${options.fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGuidePath() {
  const root = new THREE.Group();
  const crystals = [];
  const beams = [];

  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x78fff2,
    emissive: 0x22756f,
    roughness: 0.32,
    metalness: 0.1
  });

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x8fffee,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const count = 14;
  for (let i = 0; i < count; i++) {
    const z = CONFIG.startPosition.z - 6 - i * 5;

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), crystalMat);
    crystal.position.set(0, 0.58, z);
    crystal.castShadow = true;
    root.add(crystal);
    crystals.push(crystal);

    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.55, 2.7, 20, 1, true), beamMat);
    beam.position.set(0, 1.25, z);
    root.add(beam);
    beams.push(beam);
  }

  return { root, crystals, beams };
}

function createSpaceTrailParticles() {
  const root = new THREE.Group();
  const particles = [];

  for (let i = 0; i < 22; i++) {
    const particle = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 10),
      new THREE.MeshBasicMaterial({ color: 0xa7fff5, transparent: true, opacity: 0, depthWrite: false })
    );
    particle.rotation.x = -Math.PI / 2;
    particle.visible = false;
    root.add(particle);

    particles.push({
      mesh: particle,
      life: 0,
      maxLife: 1,
      velocity: new THREE.Vector3()
    });
  }

  return { root, particles, timer: 0 };
}

function spawnDust() {
  const particle = dust.particles.find((p) => p.life <= 0);
  if (!particle) return;

  particle.life = 0.45 + Math.random() * 0.35;
  particle.maxLife = particle.life;
  particle.mesh.visible = true;
  particle.mesh.position.set(
    player.root.position.x + (Math.random() - 0.5) * 0.7,
    0.05,
    player.root.position.z + 0.4 + Math.random() * 0.35
  );
  particle.mesh.scale.setScalar(0.65 + Math.random() * 0.7);
  particle.velocity.set((Math.random() - 0.5) * 0.45, 0, 0.7 + Math.random() * 0.45);
  particle.mesh.material.opacity = 0.30;
}

function updateDust(delta) {
  dust.particles.forEach((particle) => {
    if (particle.life <= 0) return;
    particle.life -= delta;
    particle.mesh.position.addScaledVector(particle.velocity, delta);
    particle.mesh.scale.multiplyScalar(1 + delta * 0.75);
    particle.mesh.material.opacity = Math.max(0, 0.30 * (particle.life / particle.maxLife));
    if (particle.life <= 0) particle.mesh.visible = false;
  });
}

function updateMovement(delta) {
  const input = new THREE.Vector3();

  if (state.keys.forward) input.add(CONFIG.worldForward);
  if (state.keys.back) input.sub(CONFIG.worldForward);
  if (state.keys.left) input.sub(CONFIG.worldRight);
  if (state.keys.right) input.add(CONFIG.worldRight);

  if (input.lengthSq() > 0) {
    input.normalize();
    state.direction.copy(input);

    const targetVelocity = input.clone().multiplyScalar(CONFIG.speed);
    state.velocity.lerp(targetVelocity, 1 - Math.exp(-CONFIG.acceleration * delta));

    state.targetAngle = Math.atan2(state.direction.x, state.direction.z);
    state.walkCycle += delta * (6 + state.velocity.length() * 0.85);

    dust.timer += delta;
    if (dust.timer > 0.11) {
      dust.timer = 0;
      spawnDust();
    }
  } else {
    state.velocity.lerp(new THREE.Vector3(0, 0, 0), 1 - Math.exp(-CONFIG.friction * delta));
  }

  player.root.position.addScaledVector(state.velocity, delta);
  player.root.position.x = THREE.MathUtils.clamp(player.root.position.x, -18, 18);
  player.root.position.z = THREE.MathUtils.clamp(player.root.position.z, CONFIG.qrPosition.z - 4, CONFIG.startPosition.z + 3);

  player.root.rotation.y = dampAngle(player.root.rotation.y, state.targetAngle, 9, delta);

  const speedFactor = Math.min(1, state.velocity.length() / CONFIG.speed);

  if (player.animationActions.walk || player.animationActions.idle) {
    if (speedFactor > 0.06) {
      fadeToAction("walk", 0.22);
      if (player.currentAction) {
        player.currentAction.setEffectiveTimeScale(0.85 + speedFactor * 0.65);
      }
    } else {
      fadeToAction("idle", 0.25);
      if (player.currentAction) {
        player.currentAction.setEffectiveTimeScale(1);
      }
    }
  }

  animateCharacter(speedFactor, delta);

  player.contactShadow.scale.set(1 + speedFactor * 0.16, 0.62 + speedFactor * 0.12, 1);
  player.aura.rotation.z += delta * 0.7;
  updateDust(delta);
}

function animateCharacter(speedFactor, delta) {
  if (!player.model) return;

  if (player.mixer) {
    player.mixer.update(delta);
  }

  if (speedFactor > 0.03) {
    const cycle = state.walkCycle;
    player.model.position.y = Math.abs(Math.sin(cycle)) * 0.05 * speedFactor;
    player.model.rotation.z = Math.sin(cycle) * 0.02 * speedFactor;
  } else {
    const idle = clock.elapsedTime;
    player.model.position.y = Math.sin(idle * 2) * 0.015;
    player.model.rotation.z = Math.sin(idle * 1.3) * 0.008;
  }
}

function dampAngle(current, target, lambda, delta) {
  const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + diff * (1 - Math.exp(-lambda * delta));
}

function updateCamera(delta) {
  const desired = new THREE.Vector3(
    player.root.position.x + CONFIG.cameraOffset.x,
    player.root.position.y + CONFIG.cameraOffset.y,
    player.root.position.z + CONFIG.cameraOffset.z
  );

  camera.position.lerp(desired, 1 - Math.exp(-4.6 * delta));

  const lookTarget = new THREE.Vector3(
    player.root.position.x,
    player.root.position.y + CONFIG.cameraLookHeight,
    player.root.position.z - 0.6
  );

  camera.lookAt(lookTarget);
}

function updateQrInteraction() {
  const dist = player.root.position.distanceTo(CONFIG.qrPosition);
  state.isNearQr = dist <= CONFIG.interactDistance;
  ui.interactionHint.classList.toggle("visible", state.isNearQr);

  if (state.isNearQr) {
    ui.objectiveText.textContent = "Você encontrou a estação do QR! Aperte E para abrir.";
  } else if (dist < 16) {
    ui.objectiveText.textContent = "Você está perto. Continue pela passarela espacial.";
  } else if (state.loaded) {
    ui.objectiveText.textContent = "Siga pela caminhada espacial até alcançar o QR Code.";
  }
}

function updateVisuals(delta, elapsed) {
  const starField = scene.getObjectByName("StarField");
  if (starField) {
    starField.rotation.y += delta * 0.01;
  }

  guide.crystals.forEach((crystal, index) => {
    crystal.rotation.y += delta * (1.4 + index * 0.03);
    crystal.position.y = 0.58 + Math.sin(elapsed * 2 + index * 0.65) * 0.14;
  });

  guide.beams.forEach((beam, index) => {
    beam.material.opacity = 0.12 + Math.sin(elapsed * 1.7 + index) * 0.05;
    beam.rotation.y += delta * 0.25;
  });

  board.glow.rotation.z += delta * 0.45;
  board.glow.material.opacity = 0.28 + Math.sin(elapsed * 2.1) * 0.08;
  board.root.rotation.y = Math.sin(elapsed * 0.38) * 0.035;
}

function tryOpenQr() {
  if (state.isNearQr) {
    ui.qrModal.classList.add("visible");
  } else {

    setTimeout(() => {

    }, 1500);
  }
}

function setKey(code, value) {
  if (code === "KeyW" || code === "ArrowUp") state.keys.forward = value;
  if (code === "KeyS" || code === "ArrowDown") state.keys.back = value;
  if (code === "KeyA" || code === "ArrowLeft") state.keys.left = value;
  if (code === "KeyD" || code === "ArrowRight") state.keys.right = value;
}

function bindMobile(id, key) {
  const element = document.getElementById(id);
  const on = (event) => { event.preventDefault(); state.keys[key] = true; };
  const off = (event) => { event.preventDefault(); state.keys[key] = false; };
  element.addEventListener("pointerdown", on);
  element.addEventListener("pointerup", off);
  element.addEventListener("pointercancel", off);
  element.addEventListener("pointerleave", off);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.elapsedTime;

  if (state.started) {
    updateMovement(delta);
    updateQrInteraction();
  } else if (player.mixer) {
    player.mixer.update(delta);
  }

  updateCamera(delta);
  updateVisuals(delta, elapsed);
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
