import * as THREE from 'three';

export interface ProceduralTextureSet {
  basaltBumpMap: THREE.CanvasTexture;
  brushedMetalMap: THREE.CanvasTexture;
  pedestalCircuitMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  particleSprite: THREE.CanvasTexture;
  cyanGlowSprite: THREE.CanvasTexture;
  dispose: () => void;
}

function createBasaltBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#787878';
    ctx.fillRect(0, 0, size, size);

    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 5200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 0.5 + rand() * 2.1;
      const v = Math.floor(72 + rand() * 115);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(25,25,25,0.42)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 64; i++) {
      ctx.beginPath();
      const sx = rand() * size;
      const sy = rand() * size;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (rand() - 0.5) * 58, sy + (rand() - 0.5) * 58);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createBrushedMetalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(0, 0, size, size);

    let seed = 4242;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let y = 0; y < size; y += 1) {
      const shade = Math.floor(105 + rand() * 65);
      ctx.fillStyle = `rgba(${shade},${shade},${shade},0.48)`;
      ctx.fillRect(0, y, size, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createPedestalCircuitTexture(
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;

    ctx.fillStyle = '#090a0d';
    ctx.fillRect(0, 0, size, size);

    // Subtle concentric technical rings
    const ringRadii = [120, 195, 270, 345, 420, 480];
    ringRadii.forEach((r, idx) => {
      ctx.strokeStyle =
        idx === 1 ? 'rgba(0, 255, 255, 0.36)' : 'rgba(228, 228, 231, 0.14)';
      ctx.lineWidth = idx === 1 ? 2 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Radial telemetry spokes & circuit traces
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const inner = i % 3 === 0 ? 125 : 275;
      const outer = i % 2 === 0 ? 475 : 415;
      ctx.strokeStyle =
        i % 6 === 0
          ? 'rgba(0, 255, 255, 0.28)'
          : 'rgba(212, 212, 216, 0.12)';
      ctx.lineWidth = i % 6 === 0 ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.stroke();
    }

    // Precision tick marks on outer perimeter
    for (let i = 0; i < 144; i++) {
      const angle = (i / 144) * Math.PI * 2;
      const r1 = 450;
      const r2 = i % 4 === 0 ? 468 : 458;
      ctx.strokeStyle =
        i % 12 === 0
          ? 'rgba(0, 255, 255, 0.55)'
          : 'rgba(161, 161, 170, 0.25)';
      ctx.lineWidth = i % 12 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.48)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createParticleSpriteTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.28, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.18)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createCyanGlowSpriteTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.18, 'rgba(0, 255, 255, 0.92)');
    grad.addColorStop(0.48, 'rgba(0, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createProceduralTextures(
  maxAnisotropy: number,
): ProceduralTextureSet {
  const basaltBumpMap = createBasaltBumpTexture(maxAnisotropy);
  const brushedMetalMap = createBrushedMetalTexture(maxAnisotropy);
  const pedestalCircuitMap = createPedestalCircuitTexture(maxAnisotropy);
  const contactShadowMap = createContactShadowTexture();
  const particleSprite = createParticleSpriteTexture();
  const cyanGlowSprite = createCyanGlowSpriteTexture();

  return {
    basaltBumpMap,
    brushedMetalMap,
    pedestalCircuitMap,
    contactShadowMap,
    particleSprite,
    cyanGlowSprite,
    dispose: () => {
      basaltBumpMap.dispose();
      brushedMetalMap.dispose();
      pedestalCircuitMap.dispose();
      contactShadowMap.dispose();
      particleSprite.dispose();
      cyanGlowSprite.dispose();
    },
  };
}
