// ============================================================================
// MISSION MARS — 3D Expedition Website with Interactive Models
// ============================================================================

// State Management
const STATE = {
  currentPage: 'page-mission',
  reducedMotion: false,
  marsData: [],
  roverData: { battery: 84, temp: -25, distance: 1.2, signal: 'GOOD' },
  colonyState: {
    population: 200,
    energy: 90,
    food: 75,
    water: 80,
    habitat: 70,
    resilience: 84,
  },
};

// 3D Scene Setup (Three.js)
let scene, camera, renderer, mars3D, rover3D, colony3D;
let marsControls, roverControls, colonyControls;
const SCENES = {};

function init3DScenes() {
  // Initialize Three.js only when needed
  if (!window.THREE) {
    console.warn('Three.js not loaded. Skipping 3D initialization.');
    return;
  }

  initMarsPlanetScene();
  initRoverScene();
  initColonyScene();
}

function initMarsPlanetScene() {
  const container = document.getElementById('mars-canvas');
  if (!container) return;

  const width = container.parentElement.clientWidth;
  const height = container.parentElement.clientHeight;

  // Scene setup
  const scene = new THREE.Scene();
  SCENES.mars = scene;
  
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  camera.position.z = 2.5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x05060a, 1);
  renderer.shadowMap.enabled = true;
  container.parentElement.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
  sunLight.position.set(5, 3, 5);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // Mars Planet (Sphere with texture simulation)
  const geometry = new THREE.IcosahedronGeometry(1, 64);
  const material = new THREE.MeshPhongMaterial({
    color: 0x8a2f2f,
    emissive: 0x4a1515,
    shininess: 5,
    wireframe: false,
  });
  const marsPlanet = new THREE.Mesh(geometry, material);
  marsPlanet.castShadow = true;
  marsPlanet.receiveShadow = true;
  
  // Add procedural Mars surface detail
  addMarsTexture(marsPlanet);
  scene.add(marsPlanet);

  // Atmosphere glow
  const atmosphereGeometry = new THREE.IcosahedronGeometry(1.05, 32);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xb95530,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide,
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  // Orbital rings (trajectory visualization)
  addOrbitRings(scene);

  // Interactive controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1;

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Rotate Mars slightly
    marsPlanet.rotation.y += 0.0001;
    atmosphere.rotation.y += 0.00005;
    
    renderer.render(scene, camera);
  }
  animate();

  // Handle window resize
  window.addEventListener('resize', () => {
    const newWidth = container.parentElement.clientWidth;
    const newHeight = container.parentElement.clientHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  });
}

function addMarsTexture(planet) {
  // Add vertex displacement for surface features
  const geometry = planet.geometry;
  const positionAttribute = geometry.getAttribute('position');
  const originalPositions = positionAttribute.array.slice();

  for (let i = 0; i < originalPositions.length; i += 3) {
    const x = originalPositions[i];
    const y = originalPositions[i + 1];
    const z = originalPositions[i + 2];

    // Perlin-like noise simulation (using sine waves)
    const noise = 
      Math.sin(x * 5) * Math.cos(y * 5) * 0.02 +
      Math.sin(z * 3) * 0.01 +
      Math.cos((x + y + z) * 7) * 0.015;

    const scale = 1 + noise;
    positionAttribute.array[i] = x * scale;
    positionAttribute.array[i + 1] = y * scale;
    positionAttribute.array[i + 2] = z * scale;
  }
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();
}

function addOrbitRings(scene) {
  const ringGeometry = new THREE.BufferGeometry();
  const ringPoints = [];

  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    const radius = 1.3;
    ringPoints.push(
      Math.cos(angle) * radius,
      Math.sin(angle) * 0.2,
      Math.sin(angle) * radius
    );
  }

  ringGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ringPoints), 3));
  const ringMaterial = new THREE.LineBasicMaterial({ color: 0x00ffd1, transparent: true, opacity: 0.3 });
  const rings = new THREE.Line(ringGeometry, ringMaterial);
  scene.add(rings);
}

function initRoverScene() {
  const container = document.getElementById('mars-planet');
  if (!container) return;

  const width = container.parentElement.clientWidth;
  const height = container.parentElement.clientHeight;

  const scene = new THREE.Scene();
  SCENES.rover = scene;

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  camera.position.set(0, 2, 3);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x0a0d14, 1);
  renderer.shadowMap.enabled = true;
  container.parentElement.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xff6f3d, 0.7);
  sunLight.position.set(10, 8, 5);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // Create Rover Model
  const rover = createRoverModel();
  scene.add(rover);

  // Terrain (Martian surface)
  const terrain = createMartianTerrain();
  scene.add(terrain);

  // Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;

  // Animation loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    time += 0.01;

    // Subtle rover movement
    rover.position.x = Math.sin(time * 0.5) * 0.1;
    rover.position.z = Math.cos(time * 0.3) * 0.05;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const newWidth = container.parentElement.clientWidth;
    const newHeight = container.parentElement.clientHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  });
}

function createRoverModel() {
  const group = new THREE.Group();

  // Chassis
  const chassisGeometry = new THREE.BoxGeometry(0.6, 0.3, 1.0);
  const chassisMaterial = new THREE.MeshStandardMaterial({ color: 0xff8b6b, metalness: 0.6, roughness: 0.4 });
  const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
  chassis.castShadow = true;
  group.add(chassis);

  // Wheels (6-wheel design)
  const wheelPositions = [
    [-0.35, 0, 0.2],
    [-0.35, 0, -0.2],
    [0, -0.15, 0.35],
    [0, -0.15, -0.35],
    [0.35, 0, 0.2],
    [0.35, 0, -0.2],
  ];

  wheelPositions.forEach((pos) => {
    const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.castShadow = true;
    group.add(wheel);
  });

  // Solar panels
  const panelGeometry = new THREE.PlaneGeometry(0.4, 0.3);
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffd1,
    emissive: 0x00aa99,
    metalness: 0.9,
  });
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  panel.position.y = 0.25;
  panel.rotation.x = Math.PI / 6;
  panel.castShadow = true;
  group.add(panel);

  // Antenna
  const antennaGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
  const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
  antenna.position.set(0.2, 0.35, 0);
  antenna.castShadow = true;
  group.add(antenna);

  return group;
}

function createMartianTerrain() {
  const geometry = new THREE.PlaneGeometry(4, 4, 32, 32);
  geometry.rotateX(-Math.PI / 2);

  const positionAttribute = geometry.getAttribute('position');
  const positions = positionAttribute.array;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    positions[i + 1] = 
      Math.sin(x * 2) * Math.cos(z * 1.5) * 0.2 +
      Math.sin((x + z) * 3) * 0.1 +
      Math.random() * 0.05;
  }

  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0xb95530,
    wireframe: false,
    metalness: 0.1,
    roughness: 0.9,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  return terrain;
}

function initColonyScene() {
  const container = document.getElementById('colony-map');
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  SCENES.colony = scene;

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  camera.position.set(0, 3, 4);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x081018, 1);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xff9933, 0.7);
  sunLight.position.set(8, 6, 4);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // Create Colony
  const colony = createColonyModel(STATE.colonyState.population);
  scene.add(colony);

  // Terrain
  const terrain = createColonyTerrain();
  scene.add(terrain);

  // Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  });
}

function createColonyModel(population) {
  const group = new THREE.Group();

  // Habitat dome (central hub)
  const domeGeometry = new THREE.IcosahedronGeometry(0.6, 4);
  const domeMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a9eff,
    transparent: true,
    opacity: 0.7,
    metalness: 0.8,
    roughness: 0.2,
  });
  const dome = new THREE.Mesh(domeGeometry, domeMaterial);
  dome.castShadow = true;
  group.add(dome);

  // Connecting tubes/habitats based on population
  const habitatCount = Math.ceil(population / 100);
  for (let i = 0; i < habitatCount; i++) {
    const angle = (i / habitatCount) * Math.PI * 2;
    const radius = 0.8;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Connection tube
    const tubeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
    const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7 });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.position.set(x * 0.5, 0, z * 0.5);
    tube.rotation.z = Math.atan2(z, x);
    tube.castShadow = true;
    group.add(tube);

    // Habitat module
    const habGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.3);
    const habMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffd1,
      emissive: 0x00aa99,
    });
    const hab = new THREE.Mesh(habGeometry, habMaterial);
    hab.position.set(x, -0.15, z);
    hab.castShadow = true;
    group.add(hab);
  }

  // Solar arrays
  for (let i = 0; i < 2; i++) {
    const panelGeometry = new THREE.PlaneGeometry(0.8, 0.4);
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a52,
      emissive: 0x003366,
      metalness: 0.9,
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(i === 0 ? -1.0 : 1.0, 0.2, 0);
    panel.rotation.y = Math.PI / 4;
    panel.castShadow = true;
    group.add(panel);
  }

  return group;
}

function createColonyTerrain() {
  const geometry = new THREE.PlaneGeometry(4, 4, 16, 16);
  geometry.rotateX(-Math.PI / 2);

  const positionAttribute = geometry.getAttribute('position');
  const positions = positionAttribute.array;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    positions[i + 1] = Math.sin(x) * Math.cos(z) * 0.1 + Math.random() * 0.03;
  }

  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x6b4423,
    roughness: 0.95,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  return terrain;
}

// ============================================================================
// UI and Interaction
// ============================================================================

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      navigateToPage(target);
    });
  });

  // Logo click to home
  document.getElementById('logo')?.addEventListener('click', () => {
    navigateToPage('page-mission');
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const navList = document.getElementById('nav-list');
  menuToggle?.addEventListener('click', () => {
    navList.style.display = navList.style.display === 'flex' ? 'none' : 'flex';
  });
}

function navigateToPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach((page) => {
    page.classList.remove('page--active');
  });

  // Show target page
  const targetPage = document.getElementById(pageName);
  if (targetPage) {
    targetPage.classList.add('page--active');
    STATE.currentPage = pageName;
  }

  // Update nav active state
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('data-target') === pageName) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // Reinitialize 3D scenes if needed
  if (pageName === 'page-explorer' && !SCENES.rover) {
    setTimeout(() => initRoverScene(), 100);
  }
  if (pageName === 'page-colony' && !SCENES.colony) {
    setTimeout(() => initColonyScene(), 100);
  }
}

function initMissionControl() {
  // Countdown
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // CTA buttons
  document.getElementById('begin-explore')?.addEventListener('click', () => {
    navigateToPage('page-explorer');
  });

  document.getElementById('to-explorer-cta')?.addEventListener('click', () => {
    navigateToPage('page-explorer');
  });

  // AI Console
  const openAiButtons = document.querySelectorAll('[id*="open-ai"]');
  openAiButtons.forEach((btn) => {
    btn.addEventListener('click', () => openAIConsole());
  });

  document.getElementById('close-ai')?.addEventListener('click', () => {
    closeAIConsole();
  });
}

function updateCountdown() {
  const launchDate = new Date('2026-02-15T09:00:00Z');
  const now = new Date();
  const diff = launchDate - now;

  if (diff <= 0) {
    document.getElementById('countdown').textContent = '00 : 00 : 00 : 00';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('countdown').textContent =
    `${String(days).padStart(2, '0')} : ${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
}

// Mars location markers
const MARS_LOCATIONS = [
  { id: 1, name: 'Olympus Mons', type: 'Volcano', height: '21.9 km', status: 'Mapped', coords: '18.65°N, 226.2°E', priority: 'MEDIUM', desc: 'Largest volcano in the solar system, inactive.' },
  { id: 2, name: 'Valles Marineris', type: 'Canyon', height: '-7.1 km', status: 'Explored', coords: '-13.8°N, 48.7°W', priority: 'HIGH', desc: 'Vast canyon system, potential water ice deposits.' },
  { id: 3, name: 'Gale Crater', type: 'Impact Basin', height: '-4.6 km', status: 'Active Mission', coords: '-4.59°S, 137.42°E', priority: 'CRITICAL', desc: 'Current rover mission site. High science value.' },
  { id: 4, name: 'Jezero Crater', type: 'Crater', height: '-1.9 km', status: 'Planned', coords: '18.38°N, 77.58°E', priority: 'CRITICAL', desc: 'Ancient delta. Perseverance rover destination.' },
  { id: 5, name: 'Ares Vallis', type: 'Valley', height: '-2.3 km', status: 'Mapped', coords: '-19.73°N, 25.98°W', priority: 'HIGH', desc: 'Ancient riverbed network, water flow evidence.' },
];

function initExplorer() {
  // Populate Mars locations
  STATE.marsData = MARS_LOCATIONS;

  // Create interactive markers
  createLocationMarkers();

  // Reset view button
  document.getElementById('reset-view')?.addEventListener('click', () => {
    if (SCENES.rover) {
      // Reset camera position
      console.log('View reset');
    }
  });

  // Toggle markers
  document.getElementById('toggle-markers')?.addEventListener('click', () => {
    const markersLayer = document.getElementById('markers-layer');
    const isHidden = markersLayer.style.display === 'none';
    markersLayer.style.display = isHidden ? 'block' : 'none';
  });

  // Gravity simulator
  document.getElementById('earth-weight')?.addEventListener('input', (e) => {
    const earthWeight = parseFloat(e.target.value);
    const marsWeight = (earthWeight * 3.71 / 9.81).toFixed(1);
    document.getElementById('mars-weight').textContent = `${marsWeight} kg`;
  });

  // Rover commands
  document.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const cmd = e.currentTarget.getAttribute('data-cmd');
      executeRoverCommand(cmd);
    });
  });
}

function createLocationMarkers() {
  const container = document.getElementById('markers-layer');
  if (!container) return;

  container.innerHTML = '';

  MARS_LOCATIONS.forEach((loc) => {
    const marker = document.createElement('button');
    marker.className = 'marker';
    marker.tabindex = 0;
    marker.aria-label = `${loc.name} - ${loc.type}`;
    marker.innerHTML = '<div class="pulse"></div>';
    marker.style.left = `${10 + loc.id * 15}%`;
    marker.style.top = `${20 + loc.id * 8}%`;

    marker.addEventListener('click', () => {
      selectLocation(loc);
    });

    container.appendChild(marker);
  });
}

function selectLocation(location) {
  document.getElementById('loc-index').textContent = location.id;
  document.getElementById('loc-name').textContent = location.name;
  document.getElementById('loc-type').textContent = location.type;
  document.getElementById('loc-height').textContent = location.height;
  document.getElementById('loc-status').textContent = location.status;
  document.getElementById('loc-coords').textContent = location.coords;
  document.getElementById('loc-priority').textContent = location.priority;
  document.getElementById('loc-desc').textContent = location.desc;
}

function executeRoverCommand(command) {
  const logElement = document.getElementById('log-lines');
  const timestamp = new Date().toLocaleTimeString();
  const messages = {
    MOVE: 'MOVING TO NEXT WAYPOINT',
    SCAN: 'CONDUCTING TERRAIN SCAN',
    SAMPLE: 'COLLECTING GEOLOGICAL SAMPLE',
    PHOTO: 'CAPTURING HIGH-RES IMAGE',
    RETURN: 'INITIATING RETURN SEQUENCE',
  };

  if (logElement) {
    logElement.textContent += `\n${timestamp}  ${messages[command] || 'COMMAND EXECUTING'}`;
    logElement.parentElement.scrollTop = logElement.parentElement.scrollHeight;
  }

  // Update rover telemetry
  STATE.roverData.distance += Math.random() * 0.3;
  document.getElementById('rover-dist').textContent = `${STATE.roverData.distance.toFixed(1)} km`;
}

function initColony() {
  // Population slider
  document.getElementById('pop-slider')?.addEventListener('input', (e) => {
    const pop = e.target.value;
    STATE.colonyState.population = pop;
    document.getElementById('pop-val').textContent = pop;
    updateColonyReadiness();
  });

  // Event buttons
  document.getElementById('simulate-event')?.addEventListener('click', () => {
    simulateColonyEvent('dust_storm');
  });

  document.getElementById('reset-colony')?.addEventListener('click', () => {
    STATE.colonyState = {
      population: 200,
      energy: 90,
      food: 75,
      water: 80,
      habitat: 70,
      resilience: 84,
    };
    document.getElementById('pop-slider').value = 200;
    document.getElementById('pop-val').textContent = '200';
    updateColonyReadiness();
  });

  // Energy, food, water, habitat selects
  ['energy-select', 'food-select', 'water-select', 'hab-select'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      updateColonyReadiness();
    });
  });

  updateColonyReadiness();
}

function updateColonyReadiness() {
  const energy = parseInt(document.getElementById('comp-energy').value) || 90;
  const food = parseInt(document.getElementById('comp-food').value) || 75;
  const water = parseInt(document.getElementById('comp-water').value) || 80;
  const habitat = parseInt(document.getElementById('comp-hab').value) || 70;
  const resilience = parseInt(document.getElementById('comp-res').value) || 84;

  const readiness = Math.round((energy + food + water + habitat + resilience) / 5);
  document.getElementById('readiness-value').textContent = `${readiness}%`;

  const arcElement = document.getElementById('gauge-arc');
  if (arcElement) {
    const dashOffset = 320 - (readiness / 100) * 320;
    arcElement.style.strokeDashoffset = dashOffset;
  }

  const status = readiness >= 80 ? 'COLONY READY' : readiness >= 60 ? 'COLONY OPERATIONAL' : 'COLONY CAUTION';
  document.getElementById('colony-status').textContent = status;
}

function simulateColonyEvent(eventType) {
  const events = {
    dust_storm: {
      name: 'DUST STORM',
      impact: -15,
      resilience: -10,
    },
    solar_failure: {
      name: 'SOLAR FAILURE',
      impact: -20,
      resilience: -15,
    },
    water_discovery: {
      name: 'WATER DISCOVERY',
      impact: 25,
      resilience: 10,
    },
  };

  const event = events[eventType] || events.dust_storm;
  const logElement = document.getElementById('colony-log');

  if (logElement) {
    const timestamp = new Date().toLocaleTimeString();
    logElement.textContent += `\n${timestamp}  [${event.name}] Impact: ${event.impact}%`;
  }
}

function initAI() {
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const log = document.getElementById('ai-log');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();

    if (!query) return;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.style.color = '#00ffd1';
    userMsg.textContent = `USER: ${query}`;
    log.appendChild(userMsg);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'Affirmative. Mars atmospheric pressure is 600 Pa, roughly 0.6% of Earth\'s.',
        'Negative. Humans require pressurized habitats and suits on Mars.',
        'Confirmed. Curiosity Rover detected methane fluctuations in Gale Crater.',
        'Analyzing... Jezero Crater shows strong evidence of ancient deltaic systems.',
        'Data confirms Mars lacks a magnetic field, increasing radiation exposure.',
        'Estimated survival without protection: 3 minutes due to pressure and temperature.',
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];
      const aiMsg = document.createElement('div');
      aiMsg.style.color = '#9aa1a8';
      aiMsg.textContent = `AI: ${response}`;
      log.appendChild(aiMsg);

      log.scrollTop = log.scrollHeight;
    }, 500);

    input.value = '';
  });
}

function openAIConsole() {
  const console = document.getElementById('ai-console');
  if (console) {
    console.setAttribute('aria-hidden', 'false');
    console.style.display = 'block';
    document.getElementById('ai-input')?.focus();
  }
}

function closeAIConsole() {
  const console = document.getElementById('ai-console');
  if (console) {
    console.setAttribute('aria-hidden', 'true');
    console.style.display = 'none';
  }
}

function initAccessibility() {
  // Detect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    STATE.reducedMotion = true;
    document.body.classList.add('reduced-motion-on');
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAIConsole();
    }
  });
}

// Loading screen
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      loadingScreen.setAttribute('aria-hidden', 'true');
    }, 2000);
  }
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  hideLoadingScreen();
  initAccessibility();
  initNavigation();
  initMissionControl();
  initExplorer();
  initColony();
  initAI();
  
  // Load Three.js from CDN if not already loaded
  if (!window.THREE) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => {
      // Load OrbitControls
      const orbitScript = document.createElement('script');
      orbitScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/controls/OrbitControls.js';
      orbitScript.onload = () => {
        window.THREE.OrbitControls = THREE.OrbitControls;
        init3DScenes();
      };
      document.head.appendChild(orbitScript);
    };
    document.head.appendChild(script);
  } else {
    init3DScenes();
  }
});

// Graceful error handling
window.addEventListener('error', (e) => {
  console.error('Application error:', e.error);
});
