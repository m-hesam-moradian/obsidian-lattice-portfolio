import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';

interface CubeModule {
  mesh: THREE.Group;
  basePos: THREE.Vector3;
  splitDir: THREE.Vector3;
  rotDelta: THREE.Vector3;
}

interface SignalEdge {
  start: THREE.Vector3;
  end: THREE.Vector3;
  speed: number;
  phase: number;
}

export interface SummitAnchor {
  label: string;
  sublabel: string;
  worldPos: THREE.Vector3;
}

export interface NeuralSummitController {
  group: THREE.Group;
  anchors: SummitAnchor[];
  update: (
    elapsed: number,
    delta: number,
    splitFactor: number,
    pointerX: number,
    pointerY: number,
  ) => void;
  dispose: () => void;
}

const _dummy = new THREE.Object3D();
const _vecA = new THREE.Vector3();

function terrainHeight(x: number, z: number): number {
  const dist = Math.sqrt(x * x + z * z);
  const flatMask = THREE.MathUtils.smoothstep(dist, 3.2, 13.0);
  const ridge1 =
    Math.sin(x * 0.18 + 0.35) * Math.cos(z * 0.16 - 0.25) * 3.1 +
    Math.sin((x + z) * 0.085) * 2.5;
  const ridge2 =
    Math.sin(x * 0.44 - z * 0.36) * 0.9 + Math.cos(z * 0.54) * 0.6;
  const bowl = Math.max(0, (dist - 12.5) * 0.12);
  return (ridge1 + ridge2 + bowl) * flatMask;
}

export function createNeuralSummit(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): NeuralSummitController {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  // 1. Sculpted Obsidian Terrain Ridge
  const terrainGeo = new THREE.PlaneGeometry(96, 96, 88, 88);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    posAttr.setY(i, terrainHeight(x, z) - 0.05);
  }
  terrainGeo.computeVertexNormals();
  disposables.push(terrainGeo);

  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x0a0b0e,
    roughness: 0.88,
    metalness: 0.22,
    bumpMap: textures.basaltBumpMap,
    bumpScale: 0.18,
  });
  disposables.push(terrainMat);

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = !isSoftwareGl;
  group.add(terrainMesh);

  // Subtle monochrome wireframe contour lines on ridges
  const terrainWireGeo = terrainGeo.clone();
  disposables.push(terrainWireGeo);
  const terrainWireMat = new THREE.MeshBasicMaterial({
    color: 0x52525b,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  disposables.push(terrainWireMat);
  const terrainWire = new THREE.Mesh(terrainWireGeo, terrainWireMat);
  terrainWire.position.y = 0.015;
  group.add(terrainWire);

  // 2. Stepped Hexagonal Basalt Column Plinth (InstancedMesh)
  const hexColGeo = new THREE.CylinderGeometry(0.42, 0.44, 1.0, 6);
  const hexColMat = new THREE.MeshStandardMaterial({
    color: 0x111318,
    roughness: 0.62,
    metalness: 0.45,
    bumpMap: textures.basaltBumpMap,
    bumpScale: 0.06,
  });
  disposables.push(hexColGeo, hexColMat);

  const colPositions: Array<{ x: number; z: number; h: number }> = [];
  let seed = 5150;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let ring = 0; ring < 5; ring++) {
    const r = 1.0 + ring * 0.72;
    const count = 8 + ring * 7;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ring * 0.25;
      const x = Math.cos(a) * r + (rand() - 0.5) * 0.15;
      const z = Math.sin(a) * r + (rand() - 0.5) * 0.15;
      const h = Math.max(0.28, (1.45 - ring * 0.22) * (0.72 + rand() * 0.45));
      colPositions.push({ x, z, h });
    }
  }

  const basaltColumns = new THREE.InstancedMesh(
    hexColGeo,
    hexColMat,
    colPositions.length,
  );
  basaltColumns.castShadow = !isSoftwareGl;
  basaltColumns.receiveShadow = !isSoftwareGl;

  colPositions.forEach((col, idx) => {
    _dummy.position.set(col.x, col.h * 0.5 - 0.08, col.z);
    _dummy.rotation.set(0, (idx % 6) * (Math.PI / 6), 0);
    _dummy.scale.set(1, col.h, 1);
    _dummy.updateMatrix();
    basaltColumns.setMatrixAt(idx, _dummy.matrix);
  });
  basaltColumns.instanceMatrix.needsUpdate = true;
  basaltColumns.computeBoundingSphere();
  group.add(basaltColumns);

  // Subtle pure-cyan telemetry ring inlaid on plinth
  const plinthCyanRingGeo = new THREE.RingGeometry(2.65, 2.69, 64);
  plinthCyanRingGeo.rotateX(-Math.PI / 2);
  const plinthCyanRingMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  disposables.push(plinthCyanRingGeo, plinthCyanRingMat);
  const plinthCyanRing = new THREE.Mesh(plinthCyanRingGeo, plinthCyanRingMat);
  plinthCyanRing.position.y = 0.04;
  group.add(plinthCyanRing);

  // 3. Clean Multi-Layer 3D Neural Network Core (Focal Heart at y = 2.65)
  const coreGroup = new THREE.Group();
  coreGroup.position.set(0, 2.65, 0);
  group.add(coreGroup);

  const layerSpecs = [
    { y: -0.95, radius: 0.62, count: 6 },
    { y: -0.3, radius: 0.92, count: 8 },
    { y: 0.3, radius: 0.92, count: 8 },
    { y: 0.95, radius: 0.58, count: 5 },
  ];

  const layerNodes: THREE.Vector3[][] = [];
  const allNodes: THREE.Vector3[] = [];

  layerSpecs.forEach((layer, layerIdx) => {
    const nodesInLayer: THREE.Vector3[] = [];
    const angleOffset = layerIdx * 0.35;
    for (let i = 0; i < layer.count; i++) {
      const theta = (i / layer.count) * Math.PI * 2 + angleOffset;
      const radialJitter = i % 2 === 0 ? 1.0 : 0.68;
      const v = new THREE.Vector3(
        Math.cos(theta) * layer.radius * radialJitter,
        layer.y + (i % 2 === 0 ? 0.04 : -0.04),
        Math.sin(theta) * layer.radius * radialJitter,
      );
      nodesInLayer.push(v);
      allNodes.push(v);
    }
    if (layerIdx === 1 || layerIdx === 2) {
      const center = new THREE.Vector3(0, layer.y, 0);
      nodesInLayer.push(center);
      allNodes.push(center);
    }
    layerNodes.push(nodesInLayer);
  });

  const nodeGeo = new THREE.OctahedronGeometry(0.064, 1);
  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.18,
    metalness: 0.88,
    emissive: 0x00ffff,
    emissiveIntensity: 0.25,
  });
  disposables.push(nodeGeo, nodeMat);

  const nodeInstanced = new THREE.InstancedMesh(
    nodeGeo,
    nodeMat,
    allNodes.length,
  );
  allNodes.forEach((pos, idx) => {
    _dummy.position.copy(pos);
    _dummy.scale.setScalar(idx % 3 === 0 ? 1.25 : 0.85);
    _dummy.updateMatrix();
    nodeInstanced.setMatrixAt(idx, _dummy.matrix);
  });
  nodeInstanced.instanceMatrix.needsUpdate = true;
  nodeInstanced.computeBoundingSphere();
  coreGroup.add(nodeInstanced);

  const edgePositions: number[] = [];
  const cyanEdgePositions: number[] = [];
  const signalEdges: SignalEdge[] = [];

  for (let l = 0; l < layerNodes.length - 1; l++) {
    const curr = layerNodes[l];
    const next = layerNodes[l + 1];
    curr.forEach((a, ia) => {
      next.forEach((b, ib) => {
        const dist = a.distanceTo(b);
        if (dist < 1.55 || (ia + ib) % 4 === 0) {
          if ((ia + ib + l) % 4 === 0) {
            cyanEdgePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
          } else {
            edgePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
          }
          if ((ia + ib + l) % 2 === 0) {
            signalEdges.push({
              start: a,
              end: b,
              speed: 0.55 + ((ia * 7 + ib) % 5) * 0.14,
              phase: (ia * 0.23 + ib * 0.39 + l * 0.17) % 1,
            });
          }
        }
      });
    });
  }

  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(edgePositions, 3),
  );
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0xe4e4e7,
    transparent: true,
    opacity: 0.38,
  });
  disposables.push(edgeGeo, edgeMat);
  coreGroup.add(new THREE.LineSegments(edgeGeo, edgeMat));

  const cyanEdgeGeo = new THREE.BufferGeometry();
  cyanEdgeGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(cyanEdgePositions, 3),
  );
  const cyanEdgeMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.72,
  });
  disposables.push(cyanEdgeGeo, cyanEdgeMat);
  coreGroup.add(new THREE.LineSegments(cyanEdgeGeo, cyanEdgeMat));

  // Luminous Pure Cyan Core Singularity Sprite
  const coreSpriteMat = new THREE.SpriteMaterial({
    map: textures.cyanGlowSprite,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  disposables.push(coreSpriteMat);
  const coreSprite = new THREE.Sprite(coreSpriteMat);
  coreSprite.scale.set(2.35, 2.35, 1);
  coreGroup.add(coreSprite);

  // High-speed pure cyan neural signal packets
  const pulseCount = Math.min(signalEdges.length, 44);
  const pulseGeo = new THREE.SphereGeometry(0.028, 8, 8);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
  });
  disposables.push(pulseGeo, pulseMat);
  const pulseMesh = new THREE.InstancedMesh(pulseGeo, pulseMat, pulseCount);
  pulseMesh.frustumCulled = false;
  coreGroup.add(pulseMesh);

  // 4. Architectural 3x3x3 Modular Obsidian Cube Lattice (26 Outer Cubes Splitting Radially)
  const latticeGroup = new THREE.Group();
  latticeGroup.position.set(0, 2.65, 0);
  group.add(latticeGroup);

  const cubeSize = 0.84;
  const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const cubeEdgeGeo = new THREE.EdgesGeometry(cubeGeo);
  const cageGeo = new THREE.BoxGeometry(
    cubeSize * 1.12,
    cubeSize * 1.12,
    cubeSize * 1.12,
  );
  const cageEdgeGeo = new THREE.EdgesGeometry(cageGeo);
  const cornerNodeGeo = new THREE.BoxGeometry(0.045, 0.045, 0.045);

  const cubeMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f1116,
    roughness: 0.24,
    metalness: 0.78,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
    bumpMap: textures.basaltBumpMap,
    bumpScale: 0.025,
    transparent: true,
    opacity: 0.92,
  });
  const silverEdgeMat = new THREE.LineBasicMaterial({
    color: 0xe4e4e7,
    transparent: true,
    opacity: 0.55,
  });
  const cyanCageMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.42,
  });
  const cyanCornerMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
  });

  disposables.push(
    cubeGeo,
    cubeEdgeGeo,
    cageGeo,
    cageEdgeGeo,
    cornerNodeGeo,
    cubeMat,
    silverEdgeMat,
    cyanCageMat,
    cyanCornerMat,
  );

  const cubes: CubeModule[] = [];
  const spacing = 1.08;

  for (let gx = -1; gx <= 1; gx++) {
    for (let gy = -1; gy <= 1; gy++) {
      for (let gz = -1; gz <= 1; gz++) {
        // Leave center hollow for the luminous Neural Network Core
        if (gx === 0 && gy === 0 && gz === 0) continue;
        // Leave center front face open at rest so the clean neural network is immediately visible
        if (gx === 0 && gy === 0 && gz === 1) continue;

        const mod = new THREE.Group();
        const body = new THREE.Mesh(cubeGeo, cubeMat);
        body.castShadow = !isSoftwareGl;
        body.receiveShadow = !isSoftwareGl;
        mod.add(body);

        mod.add(new THREE.LineSegments(cubeEdgeGeo, silverEdgeMat));

        // Outer architectural wireframe cage on corner/axial blocks
        if (Math.abs(gx) + Math.abs(gy) + Math.abs(gz) >= 2) {
          mod.add(new THREE.LineSegments(cageEdgeGeo, cyanCageMat));
          const dot = new THREE.Mesh(cornerNodeGeo, cyanCornerMat);
          dot.position.set(
            gx * cubeSize * 0.56,
            gy * cubeSize * 0.56,
            gz * cubeSize * 0.56,
          );
          mod.add(dot);
        }

        const basePos = new THREE.Vector3(
          gx * spacing,
          gy * spacing,
          gz * spacing,
        );
        mod.position.copy(basePos);
        latticeGroup.add(mod);

        const splitDir = basePos.clone().normalize();
        cubes.push({
          mesh: mod,
          basePos,
          splitDir,
          rotDelta: new THREE.Vector3(
            gz * 0.25,
            (gx - gz) * 0.3,
            gx * 0.22,
          ),
        });
      }
    }
  }

  // Vector telemetry tethers linking split cubes back to the neural core
  const tetherPositions = new Float32Array(cubes.length * 2 * 3);
  const tetherGeo = new THREE.BufferGeometry();
  tetherGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(tetherPositions, 3),
  );
  const tetherMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.0,
  });
  disposables.push(tetherGeo, tetherMat);
  latticeGroup.add(new THREE.LineSegments(tetherGeo, tetherMat));

  // 3D Projected Anchor Pins for Summit HUD Callouts
  const anchors: SummitAnchor[] = [
    {
      label: 'NEURAL CORE',
      sublabel: '4-LAYER SYNAPTIC LATTICE',
      worldPos: new THREE.Vector3(0, 3.65, 0.2),
    },
    {
      label: 'SHARD MATRIX',
      sublabel: '25 MODULAR BLOCK UNITS',
      worldPos: new THREE.Vector3(1.55, 3.25, 1.15),
    },
    {
      label: 'SYNAPSE BUS',
      sublabel: '0xFF · ZERO-KNOWLEDGE',
      worldPos: new THREE.Vector3(-1.55, 1.85, 1.15),
    },
  ];

  let currentSplit = 0;

  return {
    group,
    anchors,
    update: (elapsed, delta, splitFactor, pointerX, pointerY) => {
      currentSplit = THREE.MathUtils.damp(currentSplit, splitFactor, 4.2, delta);

      // Core neural lattice motion
      coreGroup.rotation.y = elapsed * 0.22 + pointerX * 0.25;
      coreGroup.rotation.x = THREE.MathUtils.damp(
        coreGroup.rotation.x,
        pointerY * 0.16,
        4,
        delta,
      );

      const coreBreath = 2.15 + Math.sin(elapsed * 2.2) * 0.28 + currentSplit * 1.15;
      coreSprite.scale.set(coreBreath, coreBreath, 1);
      coreSpriteMat.opacity = 0.58 + currentSplit * 0.38;

      for (let i = 0; i < pulseCount; i++) {
        const edge = signalEdges[i];
        const t = (elapsed * edge.speed + edge.phase) % 1;
        _vecA.lerpVectors(edge.start, edge.end, t);
        _dummy.position.copy(_vecA);
        const sPulse = 0.75 + Math.sin(t * Math.PI) * 0.65;
        _dummy.scale.setScalar(sPulse);
        _dummy.updateMatrix();
        pulseMesh.setMatrixAt(i, _dummy.matrix);
      }
      pulseMesh.instanceMatrix.needsUpdate = true;

      // Cube lattice radial explosion / split
      latticeGroup.rotation.y = -elapsed * 0.08 + pointerX * 0.16;
      const tetherAttr = tetherGeo.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < cubes.length; i++) {
        const c = cubes[i];
        const hoverFloat = Math.sin(elapsed * 1.15 + i * 0.5) * 0.035;
        const spread = 0.28 + currentSplit * 1.85;

        c.mesh.position.set(
          c.basePos.x + c.splitDir.x * spread,
          c.basePos.y + c.splitDir.y * spread + hoverFloat,
          c.basePos.z + c.splitDir.z * spread,
        );
        c.mesh.rotation.set(
          c.rotDelta.x * currentSplit,
          c.rotDelta.y * currentSplit,
          c.rotDelta.z * currentSplit,
        );

        tetherAttr.setXYZ(i * 2, 0, 0, 0);
        tetherAttr.setXYZ(
          i * 2 + 1,
          c.mesh.position.x,
          c.mesh.position.y,
          c.mesh.position.z,
        );
      }
      tetherAttr.needsUpdate = true;
      tetherMat.opacity = 0.14 + Math.min(0.45, currentSplit * 0.55);
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
