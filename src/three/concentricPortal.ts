import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';

interface RingSegment {
  group: THREE.Group;
  speed: number;
  tiltAxis: 'x' | 'y' | 'z';
}

export interface ConcentricPortalController {
  group: THREE.Group;
  update: (elapsed: number, delta: number, portalActivation: number) => void;
  dispose: () => void;
}

const _dummy = new THREE.Object3D();

export function createConcentricPortal(
  textures: ProceduralTextureSet,
): ConcentricPortalController {
  const group = new THREE.Group();
  group.position.set(0, -54, 0);

  const disposables: Array<{ dispose: () => void }> = [];
  const rings: RingSegment[] = [];

  const ringMatDark = new THREE.MeshStandardMaterial({
    color: 0x12141a,
    roughness: 0.3,
    metalness: 0.88,
    bumpMap: textures.brushedMetalMap,
    bumpScale: 0.015,
  });
  const ringMatSilver = new THREE.MeshStandardMaterial({
    color: 0x52525b,
    roughness: 0.22,
    metalness: 0.94,
    bumpMap: textures.brushedMetalMap,
    bumpScale: 0.012,
  });
  const wireMat = new THREE.LineBasicMaterial({
    color: 0xe4e4e7,
    transparent: true,
    opacity: 0.38,
  });
  const basaltColMat = new THREE.MeshStandardMaterial({
    color: 0x0c0e12,
    roughness: 0.72,
    metalness: 0.35,
    bumpMap: textures.basaltBumpMap,
    bumpScale: 0.08,
  });
  disposables.push(ringMatDark, ringMatSilver, wireMat, basaltColMat);

  // 1. Hexagonal Basalt Canyon Columns Surrounding the Abyssal Portal
  const colGeo = new THREE.CylinderGeometry(0.68, 0.72, 16, 6);
  disposables.push(colGeo);

  const canyonCols: Array<{ x: number; y: number; z: number; scaleY: number }> =
    [];
  let seed = 3141;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let layer = 0; layer < 2; layer++) {
    const radius = 8.4 + layer * 1.85;
    const count = 34 + layer * 10;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + layer * 0.14;
      canyonCols.push({
        x: Math.cos(a) * radius + (rand() - 0.5) * 0.3,
        y: (rand() - 0.5) * 3.5 + 1.5,
        z: Math.sin(a) * radius + (rand() - 0.5) * 0.3,
        scaleY: 0.75 + rand() * 0.65,
      });
    }
  }

  const canyonMesh = new THREE.InstancedMesh(
    colGeo,
    basaltColMat,
    canyonCols.length,
  );
  canyonCols.forEach((c, idx) => {
    _dummy.position.set(c.x, c.y, c.z);
    _dummy.rotation.set(0, (idx % 6) * (Math.PI / 6), 0);
    _dummy.scale.set(1, c.scaleY, 1);
    _dummy.updateMatrix();
    canyonMesh.setMatrixAt(idx, _dummy.matrix);
  });
  canyonMesh.instanceMatrix.needsUpdate = true;
  canyonMesh.computeBoundingSphere();
  group.add(canyonMesh);

  // 2. Machined Segmented Iris + Tilted Gyroscope Rings
  const radii = [6.3, 5.0, 3.85, 2.75, 1.8];
  const axes: Array<'y' | 'x' | 'z'> = ['y', 'y', 'y', 'x', 'z'];

  radii.forEach((radius, rIdx) => {
    const ringGroup = new THREE.Group();
    const arcCount = rIdx >= 3 ? 2 : rIdx % 2 === 0 ? 4 : 3;
    const gap = rIdx >= 3 ? 0.18 : 0.28;
    const arcLen = (Math.PI * 2) / arcCount - gap;
    const tubeRadius = 0.24 - rIdx * 0.025;

    for (let a = 0; a < arcCount; a++) {
      const startAngle = a * ((Math.PI * 2) / arcCount);
      const segGeo = new THREE.TorusGeometry(
        radius,
        tubeRadius,
        8,
        28,
        arcLen,
      );
      segGeo.rotateX(Math.PI / 2);
      segGeo.rotateY(startAngle);
      disposables.push(segGeo);

      const segMesh = new THREE.Mesh(
        segGeo,
        rIdx % 2 === 0 ? ringMatDark : ringMatSilver,
      );
      ringGroup.add(segMesh);

      const edgeGeo = new THREE.EdgesGeometry(segGeo, 25);
      disposables.push(edgeGeo);
      ringGroup.add(new THREE.LineSegments(edgeGeo, wireMat));
    }

    ringGroup.position.y = (2 - rIdx) * 0.42;
    group.add(ringGroup);
    rings.push({
      group: ringGroup,
      speed: (rIdx % 2 === 0 ? 1 : -1) * (0.22 + rIdx * 0.11),
      tiltAxis: axes[rIdx],
    });
  });

  // Pure Cyan Inner Threshold Hairline & Expanding Shockwave Ring
  const cyanRingGeo = new THREE.TorusGeometry(1.32, 0.022, 12, 64);
  cyanRingGeo.rotateX(Math.PI / 2);
  const cyanRingMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.65,
  });
  disposables.push(cyanRingGeo, cyanRingMat);
  const cyanRing = new THREE.Mesh(cyanRingGeo, cyanRingMat);
  cyanRing.position.y = -0.8;
  group.add(cyanRing);

  const shockGeo = new THREE.RingGeometry(1.4, 1.55, 64);
  shockGeo.rotateX(-Math.PI / 2);
  const shockMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  disposables.push(shockGeo, shockMat);
  const shockRing = new THREE.Mesh(shockGeo, shockMat);
  shockRing.position.y = -0.82;
  group.add(shockRing);

  let currentActivation = 0;

  return {
    group,
    update: (elapsed, delta, portalActivation) => {
      currentActivation = THREE.MathUtils.damp(
        currentActivation,
        portalActivation,
        4.5,
        delta,
      );

      rings.forEach((ring, idx) => {
        if (ring.tiltAxis === 'y') {
          ring.group.rotation.y = elapsed * ring.speed + currentActivation * 0.9;
        } else if (ring.tiltAxis === 'x') {
          ring.group.rotation.x = Math.sin(elapsed * 0.6) * 0.45;
          ring.group.rotation.y = elapsed * ring.speed;
        } else {
          ring.group.rotation.z = Math.cos(elapsed * 0.55) * 0.45;
          ring.group.rotation.y = elapsed * ring.speed;
        }
        const irisExpand = 1 + currentActivation * (0.16 + idx * 0.04);
        ring.group.scale.set(irisExpand, 1, irisExpand);
      });

      cyanRingMat.opacity = 0.35 + currentActivation * 0.65;
      const pulsePhase = (elapsed * 0.9) % 1;
      const shockScale = 1 + pulsePhase * (1.8 + currentActivation * 2.2);
      shockRing.scale.set(shockScale, shockScale, 1);
      shockMat.opacity = (1 - pulsePhase) * (0.15 + currentActivation * 0.5);
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
