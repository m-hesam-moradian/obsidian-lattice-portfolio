import * as THREE from 'three';

export interface WarpTunnelController {
  group: THREE.Group;
  update: (
    elapsed: number,
    delta: number,
    intensity: number,
    cameraY: number,
  ) => void;
  dispose: () => void;
}

const STREAK_COUNT = 220;
const _dummy = new THREE.Object3D();

export function createWarpTunnel(): WarpTunnelController {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const streakGeo = new THREE.CylinderGeometry(0.014, 0.004, 1.0, 5);
  const streakMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  disposables.push(streakGeo, streakMat);

  const mesh = new THREE.InstancedMesh(streakGeo, streakMat, STREAK_COUNT);
  mesh.frustumCulled = false;

  const meta: Array<{
    angle: number;
    radius: number;
    yOffset: number;
    speed: number;
    isCyan: boolean;
  }> = [];

  let seed = 9001;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const colorWhite = new THREE.Color(0xffffff);
  const colorCyan = new THREE.Color(0x00ffff);

  for (let i = 0; i < STREAK_COUNT; i++) {
    const isCyan = i % 3 === 0;
    meta.push({
      angle: rand() * Math.PI * 2,
      radius: 1.55 + rand() * 5.2,
      yOffset: (rand() - 0.5) * 26,
      speed: 14 + rand() * 18,
      isCyan,
    });
    mesh.setColorAt(i, isCyan ? colorCyan : colorWhite);
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  group.add(mesh);

  let currentIntensity = 0;

  return {
    group,
    update: (elapsed, delta, intensity, cameraY) => {
      currentIntensity = THREE.MathUtils.damp(
        currentIntensity,
        intensity,
        7.5,
        delta,
      );

      if (currentIntensity < 0.01) {
        mesh.visible = false;
        return;
      }

      mesh.visible = true;
      streakMat.opacity = Math.min(0.85, currentIntensity * 0.9);
      group.position.set(0, cameraY, 0);

      for (let i = 0; i < STREAK_COUNT; i++) {
        const m = meta[i];
        const y = ((m.yOffset + elapsed * m.speed) % 26) - 13;
        const streakLen = 1.2 + currentIntensity * 5.8;

        _dummy.position.set(
          Math.cos(m.angle) * m.radius,
          y,
          Math.sin(m.angle) * m.radius,
        );
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(1, streakLen, 1);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
