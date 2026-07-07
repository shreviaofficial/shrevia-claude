/* ============================================================
   SHREVIA — generative 3D scenes (three.js, ESM via import map)

   #substrate-scene  · home hero — an organic "agent substrate":
                       ~2200 ink/copper particles on a noise-blown
                       sphere, hairline neighbour connections,
                       orbital rings. Plotter-art on paper.
   #stack-scene      · technology — six wireframe runtime planes.

   Honors prefers-reduced-motion, clamps DPR, pauses offscreen.
   ============================================================ */
import * as THREE from "three";

const INK = new THREE.Color("#241f17");
const COPPER = new THREE.Color("#b35420");
const COPPER_LIGHT = new THREE.Color("#c97a45");

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- shared helpers ---------- */
function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  return renderer;
}

function fitToParent(renderer, camera, canvas) {
  const parent = canvas.parentElement;
  const w = parent.clientWidth;
  const h = parent.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/* Drives a render loop that pauses when the canvas leaves the
   viewport or the tab is hidden. With reduced motion, renders
   a handful of frames and stops. */
function runLoop(canvas, tick) {
  let visible = true;
  let rafId = null;
  let last = performance.now();

  function frame(now) {
    rafId = null;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    tick(dt, now / 1000);
    if (visible && !document.hidden) rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (rafId === null) {
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  }

  if (reduced) {
    // settle into a composed static pose
    for (let i = 0; i < 3; i++) tick(0.016, i * 0.016);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    },
    { threshold: 0.02 }
  );
  io.observe(canvas);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && visible) start();
  });
  start();
}

/* soft round-sprite point material with per-vertex color/size */
function pointsMaterial(dpr) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uDpr: { value: dpr || 1 } },
    vertexShader: `
      uniform float uDpr;
      attribute float aSize;
      attribute vec3 aColor;
      varying vec3 vColor;
      void main() {
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uDpr * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = smoothstep(0.5, 0.32, d);
        gl_FragColor = vec4(vColor, alpha * 0.92);
      }
    `,
  });
}

/* organic radial field — layered sinusoids read like fbm noise */
function blobRadius(v) {
  const { x, y, z } = v;
  return (
    1 +
    0.14 * Math.sin(2.4 * x + 1.3 * y) * Math.sin(1.9 * z + 0.6) +
    0.1 * Math.sin(3.1 * y + 2.2 * z + 1.7) +
    0.06 * Math.sin(4.3 * x * z + 2.9 * y + 0.4)
  );
}

/* ============================================================
   SCENE 01 — agent substrate (home hero)
   ============================================================ */
function initSubstrate(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);

  /* Fit the whole substrate (blob ≈1.32 max + rings) inside the
     canvas at any aspect ratio, so nothing gets clipped at the edges. */
  const FIT_RADIUS = 1.56;
  const frameSubstrate = () => {
    const vFit = FIT_RADIUS / Math.tan((camera.fov * Math.PI) / 360);
    camera.position.z = Math.max(vFit, vFit / camera.aspect) * 1.04;
  };

  const group = new THREE.Group();
  scene.add(group);

  // --- particles on a fibonacci sphere, organically displaced ---
  const N = 2200;
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const sizes = new Float32Array(N);
  const pts = [];

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const inc = Math.acos(1 - 2 * t);
    const az = GOLDEN * i;
    const v = new THREE.Vector3(
      Math.sin(inc) * Math.cos(az),
      Math.sin(inc) * Math.sin(az),
      Math.cos(inc)
    );
    v.multiplyScalar(blobRadius(v));
    pts.push(v);
    positions.set([v.x, v.y, v.z], i * 3);

    const copper = Math.random() < 0.07;
    const c = copper ? COPPER : INK;
    colors.set([c.r, c.g, c.b], i * 3);
    sizes[i] = copper ? 2.6 + Math.random() * 1.6 : 1.1 + Math.random() * 1.5;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  group.add(new THREE.Points(pGeo, pointsMaterial(renderer.getPixelRatio())));

  // --- hairline connections between near neighbours ---
  const linePos = [];
  const MAX_SEGMENTS = 2600;
  const cell = new Map();
  const CS = 0.22; // spatial-hash cell size ≈ link distance
  const key = (v) =>
    `${Math.floor(v.x / CS)},${Math.floor(v.y / CS)},${Math.floor(v.z / CS)}`;
  pts.forEach((v, i) => {
    const k = key(v);
    if (!cell.has(k)) cell.set(k, []);
    cell.get(k).push(i);
  });
  const LINK = 0.155;
  outer: for (let i = 0; i < N; i++) {
    const v = pts[i];
    const cx = Math.floor(v.x / CS), cy = Math.floor(v.y / CS), cz = Math.floor(v.z / CS);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = cell.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!bucket) continue;
          for (const j of bucket) {
            if (j <= i) continue;
            if (v.distanceTo(pts[j]) < LINK) {
              linePos.push(v.x, v.y, v.z, pts[j].x, pts[j].y, pts[j].z);
              if (linePos.length / 6 >= MAX_SEGMENTS) break outer;
            }
          }
        }
  }
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
  group.add(
    new THREE.LineSegments(
      lGeo,
      new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.16 })
    )
  );

  // --- orbital rings ---
  function ring(radius, color, opacity, tiltX, tiltZ) {
    const pts2 = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2).getPoints(140);
    const g = new THREE.BufferGeometry().setFromPoints(pts2);
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const loop = new THREE.LineLoop(g, m);
    loop.rotation.set(tiltX, 0, tiltZ);
    return loop;
  }
  const ringA = ring(1.46, COPPER, 0.42, Math.PI / 2.25, -0.42);
  const ringB = ring(1.6, INK, 0.14, Math.PI / 1.9, 0.6);
  group.add(ringA, ringB);

  // satellite node riding ring A
  const satGeo = new THREE.BufferGeometry();
  satGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
  satGeo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array([COPPER_LIGHT.r, COPPER_LIGHT.g, COPPER_LIGHT.b]), 3));
  satGeo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array([7]), 1));
  const satellite = new THREE.Points(satGeo, pointsMaterial(renderer.getPixelRatio()));
  ringA.add(satellite);

  // --- pointer parallax ---
  let targetRX = 0, targetRY = 0;
  if (!reduced) {
    window.addEventListener(
      "pointermove",
      (e) => {
        targetRY = (e.clientX / window.innerWidth - 0.5) * 0.34;
        targetRX = (e.clientY / window.innerHeight - 0.5) * 0.22;
      },
      { passive: true }
    );
  }

  const resize = () => {
    fitToParent(renderer, camera, canvas);
    frameSubstrate();
  };
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();

  let spin = 0.35; // settle at a pleasing initial angle
  runLoop(canvas, (dt, t) => {
    spin += dt * 0.09;
    group.rotation.y += (spin + targetRY * 0.9 - group.rotation.y) * 0.06;
    group.rotation.x += (targetRX * 0.9 + Math.sin(t * 0.18) * 0.05 - group.rotation.x) * 0.05;

    const breathe = 1 + Math.sin(t * 0.5) * 0.013;
    group.scale.setScalar(breathe);

    const a = t * 0.42;
    satellite.position.set(Math.cos(a) * 1.46, Math.sin(a) * 1.46, 0);

    renderer.render(scene, camera);
  });
}

/* ============================================================
   SCENE 02 — runtime stack (technology)
   ============================================================ */
function initStack(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0.55, 4.6);
  camera.lookAt(0, -0.05, 0);

  const group = new THREE.Group();
  group.rotation.x = 0.42;
  scene.add(group);

  const PLANES = 6;
  const SIZE = 1.85;
  const DIV = 7;
  const GAP = 0.34;
  const planes = [];
  const mats = [];

  for (let p = 0; p < PLANES; p++) {
    const verts = [];
    const half = SIZE / 2;
    for (let i = 0; i <= DIV; i++) {
      const o = -half + (SIZE * i) / DIV;
      verts.push(-half, 0, o, half, 0, o); // rows
      verts.push(o, 0, -half, o, 0, half); // cols
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const m = new THREE.LineBasicMaterial({
      color: INK,
      transparent: true,
      opacity: 0.2,
    });
    const grid = new THREE.LineSegments(g, m);
    grid.position.y = (PLANES - 1) * GAP * 0.5 - p * GAP;
    grid.userData.baseY = grid.position.y;
    group.add(grid);
    planes.push(grid);
    mats.push(m);

    // corner nodes
    const cGeo = new THREE.BufferGeometry();
    cGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [-half, 0, -half, half, 0, -half, -half, 0, half, half, 0, half],
        3
      )
    );
    const cc = new Float32Array(12);
    const cs = new Float32Array(4).fill(2.4);
    for (let k = 0; k < 4; k++) cc.set([INK.r, INK.g, INK.b], k * 3);
    cGeo.setAttribute("aColor", new THREE.BufferAttribute(cc, 3));
    cGeo.setAttribute("aSize", new THREE.BufferAttribute(cs, 1));
    grid.add(new THREE.Points(cGeo, pointsMaterial(renderer.getPixelRatio())));
  }

  // vertical spine connecting plane centres
  const spineGeo = new THREE.BufferGeometry();
  const top = (PLANES - 1) * GAP * 0.5;
  spineGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, top + 0.18, 0, 0, -top - 0.18, 0], 3)
  );
  group.add(
    new THREE.Line(
      spineGeo,
      new THREE.LineBasicMaterial({ color: COPPER, transparent: true, opacity: 0.5 })
    )
  );

  const resize = () => fitToParent(renderer, camera, canvas);
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();

  runLoop(canvas, (dt, t) => {
    group.rotation.y += dt * 0.16;

    // a copper "activation" sweeps through the stack, one plane at a time
    const active = Math.floor(t * 0.55) % PLANES;
    planes.forEach((grid, i) => {
      grid.position.y = grid.userData.baseY + Math.sin(t * 0.9 + i * 0.8) * 0.016;
      const m = mats[i];
      const isActive = i === active;
      m.color.lerp(isActive ? COPPER : INK, 0.08);
      m.opacity += ((isActive ? 0.65 : 0.2) - m.opacity) * 0.08;
    });

    renderer.render(scene, camera);
  });
}

/* ============================================================
   boot — init what exists on this page, fall back gracefully
   ============================================================ */
function boot(id, fallbackId, init) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  try {
    init(canvas);
    canvas.dataset.ok = "1";
  } catch (err) {
    console.warn("Shrevia scene failed — showing static fallback.", err);
    canvas.style.display = "none";
    const fb = document.getElementById(fallbackId);
    if (fb) fb.hidden = false;
  }
}

boot("substrate-scene", "substrate-fallback", initSubstrate);
boot("stack-scene", "stack-fallback", initStack);
window.__shreviaScenes = true;
