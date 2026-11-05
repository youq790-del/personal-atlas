import { useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { clampSurface, SURFACE_DRAG_LIMIT, SURFACE_MAX_CURVATURE } from './surface';

const vertexShader = /* glsl */ `
uniform float uCurvature;
uniform float uFlatten;
uniform vec2 uDragCenter;
uniform float uDragAmplitude;
uniform float uDragSigma;
varying vec2 vUv;
varying float vHeight;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vec2 chart = vec2(position.x / 2.35, position.y / 1.66);
  vec2 offset = chart - uDragCenter;
  float radius = max(0.08, uDragSigma);
  float exponent = exp(-dot(offset, offset) / (radius * radius));
  float saddle = uCurvature * (chart.x * chart.x - chart.y * chart.y) * (1.0 - uFlatten);
  float pull = uDragAmplitude * exponent;
  float height = saddle + pull;
  float dzdx = uCurvature * 2.0 * chart.x / 2.35 * (1.0 - uFlatten) - pull * 2.0 * offset.x / (radius * radius * 2.35);
  float dzdy = -uCurvature * 2.0 * chart.y / 1.66 * (1.0 - uFlatten) - pull * 2.0 * offset.y / (radius * radius * 1.66);
  vHeight = height;
  vNormal = normalize(vec3(-dzdx, -dzdy, 1.0));
  vec3 lifted = vec3(position.xy, height);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(lifted, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform float uShowLines;
varying vec2 vUv;
varying float vHeight;
varying vec3 vNormal;

void main() {
  vec3 warm = gl_FrontFacing ? vec3(0.985, 0.365, 0.305) : vec3(0.165, 0.255, 0.760);
  vec3 lightDirection = normalize(vec3(-0.38, 0.62, 0.92));
  vec3 normal = normalize(vNormal);
  float diffuse = 0.72 + 0.28 * max(dot(normal, lightDirection), 0.0);
  float satin = pow(max(dot(reflect(-lightDirection, normal), vec3(0.0, 0.0, 1.0)), 0.0), 22.0) * 0.11;
  float band = 0.045 * sin(vUv.y * 9.0 + vUv.x * 5.5) * sin(vUv.x * 12.0);
  vec3 color = warm * (diffuse + band + satin);

  float gridX = abs(fract(vUv.x * 17.0) - 0.5);
  float gridY = abs(fract(vUv.y * 13.0) - 0.5);
  float gridWidth = max(fwidth(vUv.x * 17.0), fwidth(vUv.y * 13.0)) * 0.7;
  float parameterLine = 1.0 - smoothstep(gridWidth, gridWidth * 2.1, min(gridX, gridY));
  float contourDistance = abs(fract(vHeight * 8.0 + 0.5) - 0.5);
  float contourWidth = max(fwidth(vHeight * 8.0) * 1.6, 0.014);
  float contourLine = 1.0 - smoothstep(contourWidth, contourWidth * 2.2, contourDistance);
  float line = max(parameterLine * 0.31, contourLine * 0.43) * uShowLines;
  vec3 lineColor = gl_FrontFacing ? vec3(0.34, 0.085, 0.115) : vec3(0.66, 0.77, 1.0);
  color = mix(color, lineColor, line);

  float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float rim = 1.0 - smoothstep(0.0015, 0.0045, edge);
  color = mix(color, vec3(0.17, 0.27, 0.75), rim * 0.82);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

type Props = {
  curvature: number;
  flattened: boolean;
  wireframe: boolean;
  reduced: boolean;
  onReady: (ready: boolean) => void;
  onInteract: () => void;
};

type DragState = { x: number; y: number; amplitude: number; sigma: number };

export function SurfaceCanvas({ curvature, flattened, wireframe, reduced, onReady, onInteract }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const material = useRef<THREE.ShaderMaterial | null>(null);
  const invalidate = useRef<() => void>(() => {});
  const controlTweens = useRef<gsap.core.Tween[]>([]);
  const activeRef = useRef(false);

  useGSAP((_, contextSafe) => {
    const safe = contextSafe!;
    const host = root.current;
    if (!host || reduced) {
      onReady(false);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      onReady(false);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 60);
    camera.position.set(0, 0, 12);
    camera.lookAt(0, 0, 0);
    const sculpture = new THREE.Group();
    sculpture.rotation.set(-1.02, 0.28, -0.29);
    scene.add(sculpture);

    const uniforms = {
      uCurvature: { value: clampSurface(curvature, 0, SURFACE_MAX_CURVATURE) },
      uFlatten: { value: flattened ? 1 : 0 },
      uDragCenter: { value: new THREE.Vector2(0, 0) },
      uDragAmplitude: { value: 0 },
      uDragSigma: { value: 0.36 },
      uShowLines: { value: wireframe ? 1 : 0 },
    };
    const surfaceMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });
    const geometry = new THREE.PlaneGeometry(4.7, 3.32, 112, 84);
    const mesh = new THREE.Mesh(geometry, surfaceMaterial);
    mesh.position.z = -0.12;
    sculpture.add(mesh);

    const handleGeometry = new THREE.PlaneGeometry(4.7, 3.32, 1, 1);
    const handle = new THREE.Mesh(handleGeometry, new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    handle.position.z = 0.04;
    sculpture.add(handle);

    const canvas = renderer.domElement;
    canvas.className = 'surface-webgl';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));

    let intersection: IntersectionObserver | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let visible = true;
    let pageVisible = !document.hidden;
    let contextLost = false;
    let dragging = false;
    let dragPointer: number | null = null;
    let captureTarget: Element | null = null;
    let startY = 0;
    let spring: gsap.core.Tween | undefined;
    let entrance: gsap.core.Tween | undefined;
    let frameActive = false;
    let dirty = true;
    const drag: DragState = { x: 0, y: 0, amplitude: 0, sigma: 0.34 };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const chart = new THREE.Vector3();

    const releaseCapture = () => {
      const pointerId = dragPointer;
      dragPointer = null;
      if (pointerId !== null && captureTarget?.hasPointerCapture(pointerId)) {
        captureTarget.releasePointerCapture(pointerId);
      }
      captureTarget = null;
    };
    const cancelDrag = () => {
      dragging = false;
      releaseCapture();
      host.classList.remove('is-dragging');
      spring?.kill();
      spring = undefined;
      drag.amplitude = 0;
      uniforms.uDragAmplitude.value = 0;
      dirty = true;
    };

    const renderFrame = () => {
      if (!frameActive || (!dirty && !spring?.isActive() && !entrance?.isActive())) return;
      uniforms.uDragAmplitude.value = drag.amplitude;
      uniforms.uDragCenter.value.set(drag.x, drag.y);
      dirty = false;
      try { renderer.render(scene, camera); }
      catch { contextLost = true; onReady(false); refreshTicker(); }
    };
    const refreshTicker = () => {
      const shouldRun = visible && pageVisible && !contextLost && !reduced;
      activeRef.current = shouldRun;
      if (!shouldRun) cancelDrag();
      if (shouldRun && !frameActive) {
        frameActive = true;
        gsap.ticker.add(renderFrame);
        dirty = true;
        if (spring?.paused()) spring.play();
        if (entrance?.paused()) entrance.play();
        controlTweens.current.forEach(tween => { if (tween.paused()) tween.play(); });
      } else if (!shouldRun && frameActive) {
        frameActive = false;
        gsap.ticker.remove(renderFrame);
        spring?.pause();
        entrance?.pause();
        controlTweens.current.forEach(tween => tween.pause());
      }
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      renderer.setSize(bounds.width, bounds.height, false);
      const aspect = bounds.width / bounds.height;
      const viewHeight = aspect < 0.72 ? 5.15 : aspect < 1.12 ? 4.8 : 4.5;
      const viewWidth = viewHeight * aspect;
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      sculpture.scale.setScalar(aspect < 0.72 ? 0.7 : aspect < 1.12 ? 0.83 : 1);
      sculpture.position.y = aspect < 0.72 ? 0.38 : 0;
      sculpture.position.x = window.innerWidth < 760 ? 0 : 0.28;
      dirty = true;
      refreshTicker();
    };

    const updateChartPosition = (clientX: number, clientY: number) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.set(((clientX - bounds.left) / bounds.width) * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(handle, false)[0];
      if (hit) {
        chart.copy(hit.point);
        sculpture.worldToLocal(chart);
        drag.x = clampSurface(chart.x / 2.35, -0.95, 0.95);
        drag.y = clampSurface(chart.y / 1.66, -0.95, 0.95);
      }
      return Boolean(hit);
    };

    const beginDrag = (event: PointerEvent) => {
      const target = event.target;
      const handleGesture = target instanceof Element && Boolean(target.closest('.surface-drag-handle'));
      if (event.pointerType !== 'mouse' && !handleGesture) return;
      if (event.button !== 0) return;
      if (!updateChartPosition(event.clientX, event.clientY) && !handleGesture) return;
      event.preventDefault();
      if (spring) { spring.kill(); spring = undefined; }
      dragging = true;
      dragPointer = event.pointerId;
      startY = event.clientY;
      uniforms.uDragAmplitude.value = 0;
      dirty = true;
      host.classList.add('is-dragging');
      onInteract();
      captureTarget = handleGesture ? target as Element : canvas;
      captureTarget.setPointerCapture(event.pointerId);
    };

    const moveDrag = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== dragPointer) return;
      event.preventDefault();
      updateChartPosition(event.clientX, event.clientY);
      drag.amplitude = clampSurface((startY - event.clientY) / Math.max(360, host.clientHeight) * 1.35, -SURFACE_DRAG_LIMIT, SURFACE_DRAG_LIMIT);
      dirty = true;
    };

    const endDrag = (event: PointerEvent) => {
      if (!dragging || (dragPointer !== null && event.pointerId !== dragPointer)) return;
      dragging = false;
      releaseCapture();
      host.classList.remove('is-dragging');
      spring = safe(() => gsap.to(drag, {
        amplitude: 0,
        duration: 1.15,
        ease: 'elastic.out(1, 0.38)',
        overwrite: true,
      }))();
    };

    const handleLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      refreshTicker();
      onReady(false);
    };
    const handleRestored = () => {
      contextLost = false;
      renderer.resetState();
      dirty = true;
      onReady(true);
      refreshTicker();
    };
    const onVisibility = () => {
      pageVisible = !document.hidden;
      refreshTicker();
    };
    const onBlur = cancelDrag;

    canvas.addEventListener('webglcontextlost', handleLost, false);
    canvas.addEventListener('webglcontextrestored', handleRestored, false);
    host.addEventListener('pointerdown', beginDrag);
    host.addEventListener('pointermove', moveDrag);
    host.addEventListener('pointerup', endDrag);
    host.addEventListener('pointercancel', endDrag);
    host.addEventListener('lostpointercapture', endDrag);
    host.addEventListener('pointerleave', cancelDrag);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    if (typeof IntersectionObserver !== 'undefined') {
      intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        refreshTicker();
      }, { threshold: 0.01 });
      intersection.observe(host);
    }
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
    } else window.addEventListener('resize', resize);

    material.current = surfaceMaterial;
    invalidate.current = () => { dirty = true; };
    renderer.debug.onShaderError = () => {
      contextLost = true;
      refreshTicker();
      onReady(false);
    };
    resize();
    renderFrame();
    if (!contextLost) onReady(true);
    if (!reduced) {
      entrance = safe(() => gsap.fromTo(mesh.position, { z: -0.25 }, { z: -0.12, duration: 1.2, ease: 'power3.out', onUpdate: () => { dirty = true; } }))();
    }

    return () => {
      frameActive = false;
      activeRef.current = false;
      cancelDrag();
      gsap.ticker.remove(renderFrame);
      spring?.kill();
      entrance?.kill();
      controlTweens.current.forEach(tween => tween.kill());
      controlTweens.current = [];
      intersection?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
      host.removeEventListener('pointerdown', beginDrag);
      host.removeEventListener('pointermove', moveDrag);
      host.removeEventListener('pointerup', endDrag);
      host.removeEventListener('pointercancel', endDrag);
      host.removeEventListener('lostpointercapture', endDrag);
      host.removeEventListener('pointerleave', cancelDrag);
      if (canvas.parentElement === host) host.removeChild(canvas);
      geometry.dispose();
      handleGeometry.dispose();
      surfaceMaterial.dispose();
      (handle.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      material.current = null;
      invalidate.current = () => {};
      onReady(false);
    };
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  useGSAP(() => {
    if (!material.current) return;
    controlTweens.current.forEach(tween => tween.kill());
    const uniforms = material.current.uniforms;
    controlTweens.current = [
      gsap.to(uniforms.uCurvature, { value: clampSurface(curvature, 0, SURFACE_MAX_CURVATURE), duration: .32, ease: 'power2.out', overwrite: true, onUpdate: () => invalidate.current(), paused: !activeRef.current }),
      gsap.to(uniforms.uFlatten, { value: flattened ? 1 : 0, duration: .7, ease: 'power2.inOut', overwrite: true, onUpdate: () => invalidate.current(), paused: !activeRef.current }),
      gsap.to(uniforms.uShowLines, { value: wireframe ? 1 : 0, duration: .45, ease: 'power2.out', overwrite: true, onUpdate: () => invalidate.current(), paused: !activeRef.current }),
    ];
    return () => {
      controlTweens.current.forEach(tween => tween.kill());
      controlTweens.current = [];
    };
  }, { scope: root, dependencies: [curvature, flattened, wireframe, reduced] });

  return <div ref={root} className="surface-canvas-root" aria-hidden="true">
    {!reduced && <button className="surface-drag-handle" type="button" tabIndex={-1} aria-hidden="true">
      <span className="surface-drag-handle-glyph" />
    </button>}
  </div>;
}
