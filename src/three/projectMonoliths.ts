import * as THREE from 'three';
import { ArtifactType, PROJECT_CASE_STUDIES } from '../data/portfolioData';

export interface MonolithEntry {
  id: string;
  group: THREE.Group;
  hitbox: THREE.Mesh;
  artifact: THREE.Group;
  basePosition: THREE.Vector3;
  hoverAmount: number;
}

export interface ProjectMonolithsController {
  group: THREE.Group;
  hitboxes: THREE.Mesh[];
  entries: MonolithEntry[];
  update: (
    elapsed: number,
    delta: number,
    hoveredId: string | null,
  ) => void;
  dispose: () => void;
}

function createCrystalShardGeometry(): THREE.BufferGeometry {
  // Double-terminated faceted obsidian crystal shard (7-sided asymmetric prism with sharp crown & tail)
  const sides = 7;
  const positions: number[] = [];
  const indices: number[] = [];

  const topTip = [0.05, 2.35, -0.04];
  const botTip = [-0.04, -2.25, 0.05];

  const upperRing: Array<[number, number, number]> = [];
  const lowerRing: Array<[number, number, number]> = [];

  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const rUpper = 1.05 + (i % 2 === 0 ? 0.16 : -0.1);
    const rLower = 0.88 + (i % 3 === 0 ? 0.12 : -0.08);
    upperRing.push([
      Math.cos(a) * rUpper,
      1.18 + (i % 2 === 0 ? 0.18 : -0.14),
      Math.sin(a) * rUpper,
    ]);
    lowerRing.push([
      Math.cos(a + 0.12) * rLower,
      -1.08 + (i % 2 === 0 ? -0.16 : 0.12),
      Math.sin(a + 0.12) * rLower,
    ]);
  }

  // Vertex 0 = topTip, Vertex 1 = botTip, 2..2+sides-1 = upperRing, 2+sides.. = lowerRing
  positions.push(...topTip, ...botTip);
  upperRing.forEach((p) => positions.push(...p));
  lowerRing.forEach((p) => positions.push(...p));

  const uStart = 2;
  const lStart = 2 + sides;

  for (let i = 0; i < sides; i++) {
    const next = (i + 1) % sides;
    // Top crown facets
    indices.push(0, uStart + next, uStart + i);
    // Middle body quads (2 triangles)
    indices.push(uStart + i, uStart + next, lStart + i);
    indices.push(uStart + next, lStart + next, lStart + i);
    // Bottom point facets
    indices.push(1, lStart + i, lStart + next);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geo.setIndex(indices);
  const nonIndexed = geo.toNonIndexed();
  geo.dispose();
  nonIndexed.computeVertexNormals();
  return nonIndexed;
}

function buildInnerArtifact(
  type: ArtifactType,
  disposables: Array<{ dispose: () => void }>,
  silverMat: THREE.Material,
  darkMat: THREE.Material,
  wireMat: THREE.LineBasicMaterial,
  cyanLineMat: THREE.LineBasicMaterial,
  cyanMat: THREE.Material,
): THREE.Group {
  const art = new THREE.Group();

  if (type === 'attention-lattice') {
    const outerCube = new THREE.BoxGeometry(0.92, 0.92, 0.92);
    const innerCube = new THREE.BoxGeometry(0.52, 0.52, 0.52);
    const e1 = new THREE.EdgesGeometry(outerCube);
    const e2 = new THREE.EdgesGeometry(innerCube);
    disposables.push(outerCube, innerCube, e1, e2);
    art.add(new THREE.LineSegments(e1, wireMat));
    art.add(new THREE.LineSegments(e2, cyanLineMat));

    const nodeGeo = new THREE.OctahedronGeometry(0.08, 0);
    disposables.push(nodeGeo);
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          const n = new THREE.Mesh(nodeGeo, silverMat);
          n.position.set(x * 0.46, y * 0.46, z * 0.46);
          art.add(n);
        }
      }
    }
    const core = new THREE.Mesh(nodeGeo, cyanMat);
    core.scale.setScalar(1.4);
    art.add(core);
  } else if (type === 'zk-circuit') {
    const knotGeo = new THREE.TorusKnotGeometry(0.42, 0.04, 72, 10, 2, 3);
    disposables.push(knotGeo);
    art.add(new THREE.Mesh(knotGeo, silverMat));

    const octGeo = new THREE.OctahedronGeometry(0.74, 0);
    const octEdges = new THREE.EdgesGeometry(octGeo);
    disposables.push(octGeo, octEdges);
    art.add(new THREE.LineSegments(octEdges, cyanLineMat));

    const coreGeo = new THREE.OctahedronGeometry(0.16, 0);
    disposables.push(coreGeo);
    art.add(new THREE.Mesh(coreGeo, cyanMat));
  } else if (type === 'consensus-mesh') {
    const ringGeo = new THREE.TorusGeometry(0.56, 0.016, 8, 48);
    disposables.push(ringGeo);
    const r1 = new THREE.Mesh(ringGeo, silverMat);
    const r2 = new THREE.Mesh(ringGeo, silverMat);
    const r3 = new THREE.Mesh(ringGeo, cyanMat);
    r2.rotation.x = Math.PI / 2.3;
    r3.rotation.y = Math.PI / 2.3;
    r3.scale.setScalar(0.74);
    art.add(r1, r2, r3);

    const blockGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    disposables.push(blockGeo);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const b = new THREE.Mesh(blockGeo, i % 3 === 0 ? cyanMat : darkMat);
      b.position.set(Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0);
      if (i % 3 === 0) b.scale.setScalar(0.65);
      art.add(b);
    }
  } else {
    // agent-graph
    const icoGeo = new THREE.IcosahedronGeometry(0.56, 1);
    const icoEdges = new THREE.EdgesGeometry(icoGeo);
    disposables.push(icoGeo, icoEdges);
    art.add(new THREE.LineSegments(icoEdges, wireMat));

    const innerIco = new THREE.IcosahedronGeometry(0.32, 0);
    const innerEdges = new THREE.EdgesGeometry(innerIco);
    disposables.push(innerIco, innerEdges);
    art.add(new THREE.LineSegments(innerEdges, cyanLineMat));

    const orbitGeo = new THREE.TorusGeometry(0.72, 0.012, 8, 48);
    disposables.push(orbitGeo);
    const orbit = new THREE.Mesh(orbitGeo, silverMat);
    orbit.rotation.x = Math.PI / 3;
    art.add(orbit);

    const beaconGeo = new THREE.SphereGeometry(0.06, 8, 8);
    disposables.push(beaconGeo);
    const beacon = new THREE.Mesh(beaconGeo, cyanMat);
    beacon.position.set(0.72, 0, 0);
    orbit.add(beacon);
  }

  return art;
}

export function createProjectMonoliths(): ProjectMonolithsController {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const entries: MonolithEntry[] = [];
  const hitboxes: THREE.Mesh[] = [];

  const shellGeo = createCrystalShardGeometry();
  const shellEdgesGeo = new THREE.EdgesGeometry(shellGeo, 12);
  disposables.push(shellGeo, shellEdgesGeo);

  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f5,
    roughness: 0.2,
    metalness: 0.9,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x16181f,
    roughness: 0.35,
    metalness: 0.78,
  });
  const wireMat = new THREE.LineBasicMaterial({
    color: 0xe4e4e7,
    transparent: true,
    opacity: 0.55,
  });
  const cyanLineMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.85,
  });
  const cyanMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
  });
  const hitboxGeo = new THREE.BoxGeometry(2.6, 4.6, 2.6);
  const hitboxMat = new THREE.MeshBasicMaterial({
    visible: false,
  });

  disposables.push(
    silverMat,
    darkMat,
    wireMat,
    cyanLineMat,
    cyanMat,
    hitboxGeo,
    hitboxMat,
  );

  // Staggered depths so flanking crystal shards remain visible in background mist
  const positions = [
    new THREE.Vector3(-1.85, -14.5, 0.6),
    new THREE.Vector3(2.05, -22.5, -0.4),
    new THREE.Vector3(-1.9, -30.5, 0.5),
    new THREE.Vector3(1.95, -38.5, -0.3),
  ];

  PROJECT_CASE_STUDIES.forEach((project, idx) => {
    const mGroup = new THREE.Group();
    const basePos = positions[idx] || new THREE.Vector3(0, -14 - idx * 8, 0);
    mGroup.position.copy(basePos);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d1015,
      roughness: 0.12,
      metalness: 0.45,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    });
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xd4d4d8,
      transparent: true,
      opacity: 0.42,
    });
    disposables.push(glassMat, edgeMat);

    const shellMesh = new THREE.Mesh(shellGeo, glassMat);
    shellMesh.renderOrder = 2;
    const shellEdges = new THREE.LineSegments(shellEdgesGeo, edgeMat);
    mGroup.add(shellMesh, shellEdges);

    // Subtle pure-cyan apex node on crystal tip
    const apexDotGeo = new THREE.OctahedronGeometry(0.055, 0);
    disposables.push(apexDotGeo);
    const apexDot = new THREE.Mesh(apexDotGeo, cyanMat);
    apexDot.position.set(0.05, 2.42, -0.04);
    mGroup.add(apexDot);

    const artifact = buildInnerArtifact(
      project.artifactType,
      disposables,
      silverMat,
      darkMat,
      wireMat,
      cyanLineMat,
      cyanMat,
    );
    mGroup.add(artifact);

    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.layers.set(1);
    hitbox.userData.projectId = project.id;
    mGroup.add(hitbox);
    hitboxes.push(hitbox);

    group.add(mGroup);
    entries.push({
      id: project.id,
      group: mGroup,
      hitbox,
      artifact,
      basePosition: basePos.clone(),
      hoverAmount: 0,
    });
  });

  return {
    group,
    hitboxes,
    entries,
    update: (elapsed, delta, hoveredId) => {
      entries.forEach((entry, idx) => {
        const isHovered = entry.id === hoveredId;
        entry.hoverAmount = THREE.MathUtils.damp(
          entry.hoverAmount,
          isHovered ? 1 : 0,
          6,
          delta,
        );

        const bob = Math.sin(elapsed * 0.85 + idx * 1.3) * 0.24;
        entry.group.position.y = entry.basePosition.y + bob;
        entry.group.rotation.y =
          Math.sin(elapsed * 0.25 + idx) * 0.16 + entry.hoverAmount * 0.32;

        const scale = 1 + entry.hoverAmount * 0.065;
        entry.group.scale.setScalar(scale);

        entry.artifact.rotation.y = elapsed * (0.5 + entry.hoverAmount * 0.65);
        entry.artifact.rotation.x = Math.sin(elapsed * 0.45 + idx) * 0.2;
      });
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
