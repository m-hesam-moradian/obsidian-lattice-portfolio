import * as THREE from 'three';
import { ParticleShapeId } from '../data/portfolioData';
import { ProceduralTextureSet } from './proceduralTextures';

const PARTICLE_COUNT = 20000;

export interface ParticlePedestalController {
  group: THREE.Group;
  setTargetShape: (shapeId: ParticleShapeId) => void;
  update: (elapsed: number, delta: number, pointerX: number) => void;
  dispose: () => void;
}

const _dummy = new THREE.Object3D();

function createRng(seedInit: number): () => number {
  let seed = seedInit;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function sampleSegmentPoints(
  segments: Array<[number, number, number, number]>,
  thickness: number,
  depth: number,
  scale: number,
  rand: () => number,
): Float32Array {
  const out = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const seg = segments[i % segments.length];
    const t = rand();
    const px = THREE.MathUtils.lerp(seg[0], seg[2], t);
    const py = THREE.MathUtils.lerp(seg[1], seg[3], t);
    const jitterAngle = rand() * Math.PI * 2;
    const jitterR = Math.pow(rand(), 0.65) * thickness;
    out[i * 3] = (px + Math.cos(jitterAngle) * jitterR) * scale;
    out[i * 3 + 1] = (py + Math.sin(jitterAngle) * jitterR) * scale;
    out[i * 3 + 2] = (rand() - 0.5) * depth * scale;
  }
  return out;
}

function generateShapeBuffer(shape: ParticleShapeId): Float32Array {
  const rand = createRng(shape.length * 919 + shape.charCodeAt(0) * 37);
  const out = new Float32Array(PARTICLE_COUNT * 3);

  if (shape === 'neural') {
    // Geodesic neural polyhedron edges + swirling synaptic ribbon shell
    const ico = new THREE.IcosahedronGeometry(1.42, 1);
    const edges = new THREE.EdgesGeometry(ico);
    const pos = edges.attributes.position as THREE.BufferAttribute;
    const edgeCount = pos.count / 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (i < PARTICLE_COUNT * 0.68) {
        const eIdx = i % edgeCount;
        const t = rand();
        const ax = pos.getX(eIdx * 2);
        const ay = pos.getY(eIdx * 2);
        const az = pos.getZ(eIdx * 2);
        const bx = pos.getX(eIdx * 2 + 1);
        const by = pos.getY(eIdx * 2 + 1);
        const bz = pos.getZ(eIdx * 2 + 1);
        const j = (rand() - 0.5) * 0.05;
        out[i * 3] = THREE.MathUtils.lerp(ax, bx, t) + j;
        out[i * 3 + 1] = THREE.MathUtils.lerp(ay, by, t) + j;
        out[i * 3 + 2] = THREE.MathUtils.lerp(az, bz, t) + j;
      } else {
        // Outer orbital neural wave ribbon
        const u = rand() * Math.PI * 2;
        const v = (rand() - 0.5) * 0.6;
        const r = 1.65 + Math.sin(u * 3) * 0.22 + (rand() - 0.5) * 0.14;
        out[i * 3] = Math.cos(u) * r;
        out[i * 3 + 1] = Math.sin(u * 2) * 0.55 + v;
        out[i * 3 + 2] = Math.sin(u) * r;
      }
    }
    ico.dispose();
    edges.dispose();
    return out;
  }

  if (shape === 'x') {
    return sampleSegmentPoints(
      [
        [-0.85, 1.05, 0.85, -1.05],
        [-0.68, 1.05, 1.02, -1.05],
        [0.85, 1.05, -0.85, -1.05],
      ],
      0.1,
      0.34,
      1.35,
      rand,
    );
  }

  if (shape === 'linkedin') {
    return sampleSegmentPoints(
      [
        [-0.75, -0.75, -0.75, 0.25],
        [-0.75, 0.62, -0.75, 0.76],
        [-0.22, -0.75, -0.22, 0.28],
        [-0.22, 0.16, 0.24, 0.28],
        [0.24, 0.28, 0.62, 0.08],
        [0.62, 0.08, 0.62, -0.75],
      ],
      0.12,
      0.32,
      1.35,
      rand,
    );
  }

  if (shape === 'github') {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = i / PARTICLE_COUNT;
      if (p < 0.56) {
        const theta = rand() * Math.PI * 2;
        const phi = Math.acos(2 * rand() - 1);
        const rad = 0.92 * (0.72 + 0.28 * Math.pow(rand(), 0.35));
        out[i * 3] = rad * Math.sin(phi) * Math.cos(theta) * 1.12;
        out[i * 3 + 1] = rad * Math.cos(phi) * 0.92 + 0.22;
        out[i * 3 + 2] = rad * Math.sin(phi) * Math.sin(theta) * 0.78;
      } else if (p < 0.78) {
        const side = i % 2 === 0 ? -1 : 1;
        const t = rand();
        const w = (1 - t) * 0.34;
        out[i * 3] = side * (0.58 + (rand() - 0.5) * w);
        out[i * 3 + 1] = 0.85 + t * 0.62;
        out[i * 3 + 2] = (rand() - 0.5) * 0.36;
      } else {
        const theta = rand() * Math.PI * 2;
        const h = rand();
        const r = 0.42 + h * 0.38;
        out[i * 3] = Math.cos(theta) * r * (0.85 + rand() * 0.15);
        out[i * 3 + 1] = -0.32 - h * 0.98;
        out[i * 3 + 2] = Math.sin(theta) * r * 0.62;
      }
    }
    return out;
  }

  // 'huggingface' -> Geometric 3D tensor cube + orbital symmetry ring
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < PARTICLE_COUNT * 0.65) {
      const face = Math.floor(rand() * 6);
      const u = (rand() - 0.5) * 1.75;
      const v = (rand() - 0.5) * 1.75;
      const d = 0.88;
      if (face === 0) {
        out[i * 3] = d;
        out[i * 3 + 1] = u;
        out[i * 3 + 2] = v;
      } else if (face === 1) {
        out[i * 3] = -d;
        out[i * 3 + 1] = u;
        out[i * 3 + 2] = v;
      } else if (face === 2) {
        out[i * 3] = u;
        out[i * 3 + 1] = d;
        out[i * 3 + 2] = v;
      } else if (face === 3) {
        out[i * 3] = u;
        out[i * 3 + 1] = -d;
        out[i * 3 + 2] = v;
      } else if (face === 4) {
        out[i * 3] = u;
        out[i * 3 + 1] = v;
        out[i * 3 + 2] = d;
      } else {
        out[i * 3] = u;
        out[i * 3 + 1] = v;
        out[i * 3 + 2] = -d;
      }
    } else {
      const a = rand() * Math.PI * 2;
      const r = 1.48 + (rand() - 0.5) * 0.14;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      out[i * 3] = x;
      out[i * 3 + 1] = z * 0.42 + (rand() - 0.5) * 0.08;
      out[i * 3 + 2] = z * 0.9;
    }
  }
  return out;
}

export function createParticlePedestal(
  textures: ProceduralTextureSet,
): ParticlePedestalController {
  const group = new THREE.Group();
  group.position.set(0, -72, 0);

  const disposables: Array<{ dispose: () => void }> = [];

  // 1. Etched Circuit Floor + Precision Machined Multi-Ring Pedestal
  const floorGeo = new THREE.CircleGeometry(18, 64);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.pedestalCircuitMap,
    roughness: 0.64,
    metalness: 0.45,
  });
  disposables.push(floorGeo, floorMat);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -2.2;
  group.add(floor);

  const discGeo = new THREE.CylinderGeometry(2.75, 3.15, 0.24, 64);
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x13151b,
    roughness: 0.28,
    metalness: 0.88,
    bumpMap: textures.brushedMetalMap,
    bumpScale: 0.018,
  });
  disposables.push(discGeo, discMat);
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = -2.08;
  group.add(disc);

  // Inner raised titanium stage
  const innerDiscGeo = new THREE.CylinderGeometry(1.85, 2.0, 0.12, 48);
  const innerDiscMat = new THREE.MeshStandardMaterial({
    color: 0x22252e,
    roughness: 0.24,
    metalness: 0.94,
    bumpMap: textures.brushedMetalMap,
    bumpScale: 0.015,
  });
  disposables.push(innerDiscGeo, innerDiscMat);
  const innerDisc = new THREE.Mesh(innerDiscGeo, innerDiscMat);
  innerDisc.position.y = -1.94;
  group.add(innerDisc);

  // 36 Machined Radial Perimeter Tick Pins (InstancedMesh)
  const tickGeo = new THREE.BoxGeometry(0.04, 0.04, 0.16);
  const tickMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
  });
  disposables.push(tickGeo, tickMat);
  const tickMesh = new THREE.InstancedMesh(tickGeo, tickMat, 36);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    _dummy.position.set(Math.cos(a) * 2.52, -1.95, Math.sin(a) * 2.52);
    _dummy.rotation.set(0, -a, 0);
    _dummy.scale.set(1, 1, i % 3 === 0 ? 1.5 : 0.7);
    _dummy.updateMatrix();
    tickMesh.setMatrixAt(i, _dummy.matrix);
  }
  tickMesh.instanceMatrix.needsUpdate = true;
  tickMesh.computeBoundingSphere();
  group.add(tickMesh);

  // Pure Cyan Glowing Recessed Seam & Concentric Floor Rings
  const ringSpecs = [
    { r: 2.04, w: 0.032, y: -1.87, color: 0x00ffff, op: 0.92 },
    { r: 3.55, w: 0.025, y: -2.17, color: 0x71717a, op: 0.42 },
    { r: 4.95, w: 0.025, y: -2.17, color: 0x00ffff, op: 0.36 },
  ];
  ringSpecs.forEach((spec) => {
    const rGeo = new THREE.RingGeometry(spec.r, spec.r + spec.w, 72);
    rGeo.rotateX(-Math.PI / 2);
    const rMat = new THREE.MeshBasicMaterial({
      color: spec.color,
      transparent: true,
      opacity: spec.op,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    disposables.push(rGeo, rMat);
    const ring = new THREE.Mesh(rGeo, rMat);
    ring.position.y = spec.y;
    group.add(ring);
  });

  // 2. Delicate Structural Wireframe Polyhedron Core (Visible when settled on Neural)
  const latticeGroup = new THREE.Group();
  latticeGroup.position.y = 0.35;
  const icoCoreGeo = new THREE.IcosahedronGeometry(1.36, 1);
  const icoWireGeo = new THREE.EdgesGeometry(icoCoreGeo);
  const icoWireMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.48,
  });
  disposables.push(icoCoreGeo, icoWireGeo, icoWireMat);
  latticeGroup.add(new THREE.LineSegments(icoWireGeo, icoWireMat));
  group.add(latticeGroup);

  // 3. 20,000-Particle Custom GLSL Curl-Swirl Morphing Sculpture (Pure Cyan #00FFFF + Monochrome)
  const shapeBuffers: Record<ParticleShapeId, Float32Array> = {
    neural: generateShapeBuffer('neural'),
    github: generateShapeBuffer('github'),
    x: generateShapeBuffer('x'),
    huggingface: generateShapeBuffer('huggingface'),
    linkedin: generateShapeBuffer('linkedin'),
  };

  let currentShape: ParticleShapeId = 'neural';
  let morphProgress = 1;

  const geometry = new THREE.BufferGeometry();
  const posFrom = new Float32Array(shapeBuffers.neural);
  const posTo = new Float32Array(shapeBuffers.neural);
  const seeds = new Float32Array(PARTICLE_COUNT);
  const accentMix = new Float32Array(PARTICLE_COUNT);

  const rand = createRng(8842);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    seeds[i] = rand() * 100;
    // ~9% crisp pure cyan particles amidst monochrome white/silver cloud
    accentMix[i] = rand() < 0.09 ? 1.0 : 0.0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(posTo, 3));
  geometry.setAttribute('aPosFrom', new THREE.BufferAttribute(posFrom, 3));
  geometry.setAttribute('aPosTo', new THREE.BufferAttribute(posTo, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aAccent', new THREE.BufferAttribute(accentMix, 1));
  disposables.push(geometry);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: 1 },
      uSprite: { value: textures.particleSprite },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: `
      attribute vec3 aPosFrom;
      attribute vec3 aPosTo;
      attribute float aSeed;
      attribute float aAccent;

      uniform float uTime;
      uniform float uMorph;
      uniform float uPixelRatio;

      varying float vAccent;
      varying float vDepth;

      void main() {
        float t = smoothstep(0.0, 1.0, uMorph);
        vec3 basePos = mix(aPosFrom, aPosTo, t);

        float swirlAmp = sin(t * 3.14159265) * 1.45;
        vec3 swirl = vec3(
          sin(aSeed * 0.7 + uTime * 2.4 + basePos.y * 2.2),
          cos(aSeed * 1.1 + uTime * 2.0 + basePos.x * 2.2),
          sin(aSeed * 1.7 - uTime * 2.3 + basePos.z * 2.2)
        ) * swirlAmp;

        vec3 idle = vec3(
          sin(uTime * 1.35 + aSeed) * 0.022,
          cos(uTime * 1.15 + aSeed * 1.3) * 0.026,
          sin(uTime * 0.95 + aSeed * 0.7) * 0.022
        );

        vec3 finalPos = basePos + swirl + idle;
        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        float sizeBase = mix(17.0, 24.0, aAccent);
        gl_PointSize = (sizeBase * uPixelRatio) / max(1.2, -mvPosition.z);

        vAccent = aAccent;
        vDepth = clamp((-mvPosition.z - 4.0) / 14.0, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uSprite;
      varying float vAccent;
      varying float vDepth;

      void main() {
        vec4 tex = texture2D(uSprite, gl_PointCoord);
        if (tex.a < 0.06) discard;

        // Strictly monochrome white/grey + pure cyan (0.0, 1.0, 1.0)
        vec3 mono = mix(vec3(0.97, 0.97, 0.98), vec3(0.54, 0.55, 0.58), vDepth);
        vec3 pureCyan = vec3(0.0, 1.0, 1.0);
        vec3 color = mix(mono, pureCyan, vAccent);

        gl_FragColor = vec4(color, tex.a * 0.9);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  disposables.push(material);

  const points = new THREE.Points(geometry, material);
  points.position.y = 0.35;
  group.add(points);

  return {
    group,
    setTargetShape: (shapeId) => {
      if (shapeId === currentShape && morphProgress >= 0.99) return;
      const attrFrom = geometry.attributes.aPosFrom as THREE.BufferAttribute;
      const attrTo = geometry.attributes.aPosTo as THREE.BufferAttribute;
      const arrFrom = attrFrom.array as Float32Array;
      const arrTo = attrTo.array as Float32Array;

      const t = THREE.MathUtils.smoothstep(morphProgress, 0, 1);
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        arrFrom[i] = THREE.MathUtils.lerp(arrFrom[i], arrTo[i], t);
      }
      arrTo.set(shapeBuffers[shapeId]);

      attrFrom.needsUpdate = true;
      attrTo.needsUpdate = true;
      currentShape = shapeId;
      morphProgress = 0;
    },
    update: (elapsed, delta, pointerX) => {
      if (morphProgress < 1) {
        morphProgress = Math.min(1, morphProgress + delta * 0.88);
      }
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uMorph.value = morphProgress;

      const rotY = elapsed * 0.24 + pointerX * 0.35;
      points.rotation.y = rotY;
      latticeGroup.rotation.y = rotY;
      latticeGroup.rotation.x = Math.sin(elapsed * 0.4) * 0.08;
      icoWireMat.opacity =
        currentShape === 'neural' ? Math.max(0, (morphProgress - 0.5) * 0.95) : 0;
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
