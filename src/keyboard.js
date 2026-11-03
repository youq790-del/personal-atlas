import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';

const colors = {
  skill: '#a8ce5d',
  project: '#e18a4a',
  achievement: '#d96d61',
  experience: '#54a8a0',
  note: '#7896cf',
  facet: '#8b83b8',
  action: '#d7d2c4',
  contact: '#d5d34f'
};

function makeKeyTexture(key, theme) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const ink = theme === 'light' ? '#18201c' : '#f3f0e5';
  context.clearRect(0, 0, 256, 256);
  context.fillStyle = ink;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const label = String(key.shortLabel || key.label || '·').slice(0, 8);
  const chunks = label.length > 4 ? [label.slice(0, 4), label.slice(4)] : [label];
  const size = chunks.length === 1 ? (label.length > 3 ? 38 : 54) : 37;
  context.font = `700 ${size}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
  chunks.forEach((chunk, index) => context.fillText(chunk, 128, chunks.length === 1 ? 127 : 100 + index * 53, 218));
  if (key.hotkey) {
    context.globalAlpha = 0.68;
    context.font = '600 17px Manrope, sans-serif';
    context.fillText(key.hotkey.toUpperCase(), 224, 222);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createKeyboardScene(canvas, keys, { onSelect, onStatus } = {}) {
  let renderer;
  let fallbackKeys = keys || [];
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    onStatus?.('3D 预览不可用');
    return {
      setKeys(nextKeys) { fallbackKeys = nextKeys || []; onStatus?.('3D 预览不可用'); },
      setTheme() {},
      select(index, activate = false) {
        if (!fallbackKeys.length) return;
        const selected = (index + fallbackKeys.length) % fallbackKeys.length;
        onSelect?.(fallbackKeys[selected], selected, activate);
      },
      destroy() {}
    };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 90);
  camera.position.set(0, 9.2, 14.8);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xd8e3e1, 0x151918, 2.2));
  const keyLight = new THREE.DirectionalLight(0xfff4d6, 3.2);
  keyLight.position.set(-5, 11, 6);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x75dac9, 18, 18);
  rimLight.position.set(6, 5, -3);
  scene.add(rimLight);
  const board = new THREE.Group();
  scene.add(board);

  const starsGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(270 * 3);
  for (let i = 0; i < 270; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 24;
    starPositions[i * 3 + 1] = Math.random() * 8 + 1;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 22 - 5;
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xb8c5b8, size: 0.022, transparent: true, opacity: 0.62, sizeAttenuation: true }));
  scene.add(stars);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const keyMeshes = [];
  const keyRecords = [];
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selected = 0;
  let hovered = -1;
  let activeKeys = [];
  let visible = true;
  let dirty = true;
  let disposed = false;
  let layout = { width: 1, height: 1 };
  let theme = document.documentElement.dataset.theme || 'dark';

  const rounded = (width, height, depth, radius = 0.1) => {
    const geometry = new RoundedBoxGeometry(width, height, depth, 3, radius);
    geometries.add(geometry);
    return geometry;
  };
  const material = (options) => {
    const value = new THREE.MeshStandardMaterial(options);
    materials.add(value);
    if (options.map) textures.add(options.map);
    return value;
  };

  function clearBoard() {
    while (board.children.length) {
      board.remove(board.children[0]);
    }
    keyMeshes.length = 0;
    keyRecords.length = 0;
    for (const texture of textures) texture.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const item of materials) item.dispose();
    textures.clear(); geometries.clear(); materials.clear();
  }

  function setKeys(nextKeys) {
    clearBoard();
    activeKeys = nextKeys || [];
    const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(activeKeys.length * 1.4))));
    const rows = Math.ceil(activeKeys.length / cols);
    const keyWidth = 1.12;
    const keyDepth = 1.02;
    const gap = 0.14;
    const boardWidth = cols * keyWidth + (cols - 1) * gap + 0.62;
    const boardDepth = rows * keyDepth + (rows - 1) * gap + 0.68;
    const shell = new THREE.Mesh(
      rounded(boardWidth, 0.66, boardDepth, 0.26),
      material({ color: theme === 'light' ? '#48504a' : '#202724', metalness: 0.8, roughness: 0.29 })
    );
    shell.position.y = -0.13;
    board.add(shell);
    const plate = new THREE.Mesh(
      rounded(boardWidth - 0.22, 0.12, boardDepth - 0.24, 0.18),
      material({ color: theme === 'light' ? '#7a827b' : '#39423e', metalness: 0.72, roughness: 0.36 })
    );
    plate.position.y = 0.19;
    board.add(plate);
    const feetMaterial = material({ color: '#111512', metalness: 0.52, roughness: 0.48 });
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const foot = new THREE.Mesh(rounded(0.75, 0.18, 0.56, 0.09), feetMaterial);
      foot.position.set(x * (boardWidth / 2 - 0.58), -0.53, z * (boardDepth / 2 - 0.54));
      board.add(foot);
    }
    const xStart = -((cols - 1) * (keyWidth + gap)) / 2;
    const zStart = -((rows - 1) * (keyDepth + gap)) / 2;

    activeKeys.forEach((key, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const group = new THREE.Group();
      const x = xStart + col * (keyWidth + gap);
      const z = zStart + row * (keyDepth + gap);
      group.position.set(x, 0.28, z);
      group.userData.index = index;
      const familyColor = key.color || colors[key.type] || colors.action;
      const lower = new THREE.Mesh(
        rounded(keyWidth * 0.92, 0.22, keyDepth * 0.92, 0.12),
        material({ color: new THREE.Color(familyColor).multiplyScalar(0.5), metalness: 0.12, roughness: 0.4 })
      );
      lower.position.y = 0.13;
      const cap = new THREE.Mesh(
        rounded(keyWidth * 0.88, 0.48, keyDepth * 0.88, 0.13),
        material({ color: familyColor, metalness: 0.23, roughness: 0.3, emissive: new THREE.Color(familyColor).multiplyScalar(0.05) })
      );
      cap.position.y = 0.43;
      cap.userData.index = index;
      const texture = makeKeyTexture(key, theme);
      const labelMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      materials.add(labelMaterial);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(keyWidth * 0.72, keyDepth * 0.72), labelMaterial);
      geometries.add(label.geometry);
      label.rotation.x = -Math.PI / 2;
      label.position.y = 0.679;
      group.add(lower, cap, label);
      board.add(group);
      keyMeshes.push(cap);
      keyRecords.push({ group, baseY: group.position.y, cap, key });
    });
    selected = activeKeys.length ? Math.min(selected, activeKeys.length - 1) : -1;
    board.rotation.x = -0.16;
    board.rotation.z = -0.035;
    board.rotation.y = -0.11;
    const maxExtent = Math.max(boardWidth, boardDepth * 1.18);
    const distance = Math.max(11.8, maxExtent * 1.7);
    camera.position.set(0, distance * 0.53, distance);
    camera.lookAt(0, 0, 0);
    applyTheme();
    updateHighlights();
    dirty = true;
    onStatus?.(`${activeKeys.length} 个键位已就绪`);
  }

  function applyTheme() {
    scene.background = null;
    rimLight.color.set(theme === 'light' ? '#5f988e' : '#75dac9');
    if (board.children[0]?.material) board.children[0].material.color.set(theme === 'light' ? '#48504a' : '#202724');
    if (board.children[1]?.material) board.children[1].material.color.set(theme === 'light' ? '#7a827b' : '#39423e');
    if (activeKeys.length) {
      keyRecords.forEach(({ key }, index) => {
        const label = keyRecords[index]?.group.children[2];
        if (!label) return;
        const nextTexture = makeKeyTexture(key, theme);
        textures.add(nextTexture);
        if (label.material.map) {
          textures.delete(label.material.map);
          label.material.map.dispose();
        }
        label.material.map = nextTexture;
        label.material.needsUpdate = true;
      });
    }
    dirty = true;
  }

  function updateHighlights() {
    keyRecords.forEach(({ cap }, index) => {
      cap.material.emissiveIntensity = index === selected ? 1.1 : index === hovered ? 0.55 : 0.05;
      cap.material.emissive.set(index === selected ? '#fbffad' : '#ffffff');
      cap.material.color.set(activeKeys[index]?.color || colors[activeKeys[index]?.type] || colors.action);
    });
    dirty = true;
  }

  function select(index, activate = false) {
    if (!activeKeys.length) return;
    selected = (index + activeKeys.length) % activeKeys.length;
    updateHighlights();
    const record = keyRecords[selected];
    if (record) {
      if (reducedMotion) record.group.position.y = record.baseY - (activate ? 0.11 : 0);
      else gsap.timeline({ onUpdate: () => { dirty = true; } })
        .to(record.group.position, { y: record.baseY - (activate ? 0.15 : 0.07), duration: 0.09, ease: 'power2.out' })
        .to(record.group.position, { y: record.baseY, duration: 0.34, ease: 'elastic.out(1,.4)' });
    }
    onSelect?.(activeKeys[selected], selected, activate);
    dirty = true;
  }

  function pointerToKey(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(keyMeshes, false)[0]?.object.userData.index ?? -1;
  }

  function onPointerMove(event) {
    const hit = pointerToKey(event);
    if (hit !== hovered) { hovered = hit; updateHighlights(); }
    const rect = canvas.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    board.rotation.y = -0.11 + px * 0.11;
    board.rotation.x = -0.16 + py * 0.08;
    rimLight.position.set(px * 9, 5.5 - py * 4, -2.5);
    dirty = true;
  }

  function onPointerLeave() {
    hovered = -1;
    board.rotation.x = -0.16;
    board.rotation.y = -0.11;
    updateHighlights();
  }

  function onClick(event) {
    const hit = pointerToKey(event);
    if (hit >= 0) select(hit, true);
  }

  function onKeyDown(event) {
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) { event.preventDefault(); select(selected + 1); }
    else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); select(selected - 1); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(selected, true); }
    else if (/^[1-9]$/.test(event.key)) select(Number(event.key) - 1, true);
  }

  function onContextMenu(event) {
    event.preventDefault();
    select(selected, true);
    onStatus?.('隐藏层已触发');
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    layout = { width: rect.width, height: rect.height };
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
    dirty = true;
  }

  function render() {
    if (disposed || !visible || document.hidden || !dirty) return;
    renderer.render(scene, camera);
    dirty = false;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true; render(); }, { threshold: 0.01 });
  intersectionObserver.observe(canvas);
  const onVisibility = () => { dirty = true; render(); };
  document.addEventListener('visibilitychange', onVisibility);
  gsap.ticker.add(render);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('contextmenu', onContextMenu);

  function setTheme(nextTheme) {
    theme = nextTheme;
    applyTheme();
    updateHighlights();
  }

  function destroy() {
    disposed = true;
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    gsap.ticker.remove(render);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('contextmenu', onContextMenu);
    clearBoard();
    starsGeometry.dispose();
    stars.material.dispose();
    renderer.dispose();
  }

  setKeys(keys);
  requestAnimationFrame(resize);
  return { setKeys, setTheme, select, destroy };
}
