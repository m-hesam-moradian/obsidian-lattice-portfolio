import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
  CHAPTERS,
  ChapterDefinition,
  PROJECT_CASE_STUDIES,
  ParticleShapeId,
} from '../data/portfolioData';
import { createConcentricPortal } from './concentricPortal';
import { createNeuralSummit } from './neuralSummit';
import { createParticlePedestal } from './particlePedestal';
import { createProceduralTextures } from './proceduralTextures';
import { createProjectMonoliths } from './projectMonoliths';
import { createWarpTunnel } from './warpTunnel';

export interface MonolithScreenMarker {
  id: string;
  indexLabel: string;
  title: string;
  domain: string;
  x: number;
  y: number;
  visible: boolean;
  isHovered: boolean;
}

export interface SummitCalloutMarker {
  label: string;
  sublabel: string;
  x: number;
  y: number;
}

export interface SceneCallbacks {
  onChapterChange: (chapterId: ChapterDefinition['id']) => void;
  onScrollProgress: (progress: number) => void;
  onHoverMonolith: (projectId: string | null) => void;
  onSelectMonolith: (projectId: string) => void;
  onMarkerUpdate: (marker: MonolithScreenMarker | null) => void;
  onSummitCalloutsUpdate: (callouts: SummitCalloutMarker[]) => void;
  onContextLost: (lost: boolean) => void;
}

const _camPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _rayPointer = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class SceneEngine {
  private container: HTMLElement;
  private callbacks: SceneCallbacks;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private isSoftwareGl: boolean;
  private reducedMotion: boolean;

  private frameId = 0;
  private isDisposed = false;
  private isPaused = false;

  private scrollTarget = 0;
  private scrollCurrent = 0;
  private pointerX = 0;
  private pointerY = 0;
  private smoothPointerX = 0;
  private smoothPointerY = 0;
  private hoveredMonolithId: string | null = null;
  private lastChapterId: ChapterDefinition['id'] = 'summit';
  private lastReportedScroll = -1;

  private raycaster = new THREE.Raycaster();
  private lastRaycastTime = 0;

  private cameraSpline: THREE.CatmullRomCurve3;
  private lookSpline: THREE.CatmullRomCurve3;

  private textures: ReturnType<typeof createProceduralTextures>;
  private envMap: THREE.Texture;
  private neuralSummit: ReturnType<typeof createNeuralSummit>;
  private monoliths: ReturnType<typeof createProjectMonoliths>;
  private portal: ReturnType<typeof createConcentricPortal>;
  private pedestal: ReturnType<typeof createParticlePedestal>;
  private warpTunnel: ReturnType<typeof createWarpTunnel>;
  private ambientDust: {
    points: THREE.Points;
    geometry: THREE.BufferGeometry;
    material: THREE.PointsMaterial;
  };

  private touchStartY = 0;
  private isTouching = false;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040506);
    this.scene.fog = new THREE.FogExp2(0x040506, 0.022);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envMap = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    this.scene.environment = this.envMap;
    roomEnv.dispose();
    pmremGenerator.dispose();

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 140);
    this.camera.position.set(0, 3.6, 8.2);
    this.raycaster.layers.set(1);

    // Hardware GPU post-processing bloom strictly tuned for pure-cyan cores & streaks
    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.48, // crisp glow without washing dark obsidian
        0.42,
        0.74,
      );
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }

    // Three-Point Monochrome Studio Lighting Rig + Subtle Pure Cyan Rim
    const hemiLight = new THREE.HemisphereLight(0xf4f4f5, 0x07080a, 0.68);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.35);
    keyLight.position.set(6, 13, 8);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -9;
      keyLight.shadow.camera.right = 9;
      keyLight.shadow.camera.top = 9;
      keyLight.shadow.camera.bottom = -9;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00ffff, 0.72);
    rimLight.position.set(-7, 4, -9);
    this.scene.add(rimLight);

    const lowerFill = new THREE.PointLight(0xffffff, 2.6, 48, 1.2);
    lowerFill.position.set(0, -26, 7);
    this.scene.add(lowerFill);

    const pedestalSpot = new THREE.PointLight(0xffffff, 3.4, 34, 1.1);
    pedestalSpot.position.set(0, -67, 4.5);
    this.scene.add(pedestalSpot);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    this.neuralSummit = createNeuralSummit(this.textures, this.isSoftwareGl);
    this.scene.add(this.neuralSummit.group);

    this.monoliths = createProjectMonoliths();
    this.scene.add(this.monoliths.group);

    this.portal = createConcentricPortal(this.textures);
    this.scene.add(this.portal.group);

    this.pedestal = createParticlePedestal(this.textures);
    this.scene.add(this.pedestal.group);

    this.warpTunnel = createWarpTunnel();
    this.scene.add(this.warpTunnel.group);

    // Subtle floating monochrome data motes
    const dustCount = 520;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    let seed = 731;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (rand() - 0.5) * 26;
      dustPos[i * 3 + 1] = 8 - rand() * 88;
      dustPos[i * 3 + 2] = (rand() - 0.5) * 22;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.085,
      map: this.textures.particleSprite,
      color: 0xe4e4e7,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    this.scene.add(dustPoints);
    this.ambientDust = {
      points: dustPoints,
      geometry: dustGeo,
      material: dustMat,
    };

    // Continuous 3D Camera Trajectory Splines
    this.cameraSpline = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 3.6, 8.2), // 0.00 Summit Cube Lattice & Neural Core
        new THREE.Vector3(0, 2.1, 9.8), // 0.12 Exploded Cube Split
        new THREE.Vector3(-0.3, -14.2, 6.6), // 0.24 Crystal 01
        new THREE.Vector3(0.4, -22.2, 6.6), // 0.36 Crystal 02
        new THREE.Vector3(-0.3, -30.2, 6.6), // 0.48 Crystal 03
        new THREE.Vector3(0.4, -38.2, 6.6), // 0.60 Crystal 04
        new THREE.Vector3(0, -45.5, 2.2), // 0.69 Basalt Canyon Portal View
        new THREE.Vector3(0, -57.5, 0.8), // 0.79 Gyroscope Dive + Warp
        new THREE.Vector3(0, -70.6, 7.2), // 0.91 Machined Pedestal
        new THREE.Vector3(0, -70.6, 7.0), // 1.00 Settled Pedestal
      ],
      false,
      'catmullrom',
      0.35,
    );

    this.lookSpline = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 2.45, 0),
        new THREE.Vector3(0, 2.25, 0),
        new THREE.Vector3(-1.55, -14.5, 0.6),
        new THREE.Vector3(1.65, -22.5, -0.4),
        new THREE.Vector3(-1.55, -30.5, 0.5),
        new THREE.Vector3(1.65, -38.5, -0.3),
        new THREE.Vector3(0, -54.0, 0),
        new THREE.Vector3(0, -71.5, 0),
        new THREE.Vector3(0, -71.6, 0),
        new THREE.Vector3(0, -71.6, 0),
      ],
      false,
      'catmullrom',
      0.35,
    );

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.startLoop();
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('click', this.handleClick);
    canvas.addEventListener('touchstart', this.handleTouchStart, {
      passive: true,
    });
    canvas.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    canvas.addEventListener('touchend', this.handleTouchEnd);
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private handleResize = (): void => {
    if (this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.composer?.setSize(width, height);
    this.bloomPass?.resolution.set(width, height);
  };

  private handleWheel = (e: WheelEvent): void => {
    if (this.isPaused || this.isDisposed) return;
    e.preventDefault();
    const delta = e.deltaY * 0.00042;
    this.scrollTarget = THREE.MathUtils.clamp(
      this.scrollTarget + delta,
      0,
      1,
    );
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (this.isPaused || e.touches.length !== 1) return;
    this.isTouching = true;
    this.touchStartY = e.touches[0].clientY;
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (this.isPaused || !this.isTouching || e.touches.length !== 1) return;
    e.preventDefault();
    const dy = this.touchStartY - e.touches[0].clientY;
    this.touchStartY = e.touches[0].clientY;
    this.scrollTarget = THREE.MathUtils.clamp(
      this.scrollTarget + dy * 0.0011,
      0,
      1,
    );
  };

  private handleTouchEnd = (): void => {
    this.isTouching = false;
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (this.isDisposed) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isPaused) {
      this.setHoveredMonolith(null);
      return;
    }

    const now = performance.now();
    if (now - this.lastRaycastTime < 35) return;
    this.lastRaycastTime = now;

    _rayPointer.set(this.pointerX, this.pointerY);
    this.raycaster.setFromCamera(_rayPointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.monoliths.hitboxes, false);
    const hitId =
      hits.length > 0 ? (hits[0].object.userData.projectId as string) : null;
    this.setHoveredMonolith(hitId);
  };

  private handleClick = (e: MouseEvent): void => {
    if (this.isPaused || this.isDisposed) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    _rayPointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(_rayPointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.monoliths.hitboxes, false);
    if (hits.length > 0) {
      const id = hits[0].object.userData.projectId as string;
      this.callbacks.onSelectMonolith(id);
    }
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.callbacks.onContextLost(true);
  };

  private handleContextRestored = (): void => {
    this.callbacks.onContextLost(false);
  };

  private setHoveredMonolith(id: string | null): void {
    if (id === this.hoveredMonolithId) return;
    this.hoveredMonolithId = id;
    this.renderer.domElement.style.cursor = id ? 'pointer' : 'default';
    this.callbacks.onHoverMonolith(id);
  }

  public setScrollTarget(target: number): void {
    this.scrollTarget = THREE.MathUtils.clamp(target, 0, 1);
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (paused) {
      this.setHoveredMonolith(null);
    }
  }

  public setPedestalShape(shapeId: ParticleShapeId): void {
    this.pedestal.setTargetShape(shapeId);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop(): void {
    const tick = () => {
      if (this.isDisposed) return;

      const rawDelta = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.getElapsedTime();
      const motionScale = this.reducedMotion ? 0.15 : 1.0;
      const animElapsed = elapsed * motionScale;

      const prevScroll = this.scrollCurrent;
      this.scrollCurrent = THREE.MathUtils.damp(
        this.scrollCurrent,
        this.scrollTarget,
        this.reducedMotion ? 12 : 4.2,
        rawDelta,
      );
      const scrollVelocity = Math.abs(this.scrollCurrent - prevScroll) / Math.max(rawDelta, 0.008);

      this.smoothPointerX = THREE.MathUtils.damp(
        this.smoothPointerX,
        this.pointerX,
        5,
        rawDelta,
      );
      this.smoothPointerY = THREE.MathUtils.damp(
        this.smoothPointerY,
        this.pointerY,
        5,
        rawDelta,
      );

      if (Math.abs(this.scrollCurrent - this.lastReportedScroll) > 0.002) {
        this.lastReportedScroll = this.scrollCurrent;
        this.callbacks.onScrollProgress(this.scrollCurrent);
      }

      const activeChapter =
        CHAPTERS.find(
          (c) =>
            this.scrollCurrent >= c.range[0] &&
            this.scrollCurrent <= c.range[1],
        ) || CHAPTERS[0];
      if (activeChapter.id !== this.lastChapterId) {
        this.lastChapterId = activeChapter.id;
        this.callbacks.onChapterChange(activeChapter.id);
      }

      // Camera Spline + Dynamic FOV surge during warp dives
      this.cameraSpline.getPointAt(this.scrollCurrent, _camPos);
      this.lookSpline.getPointAt(this.scrollCurrent, _lookTarget);

      const warpA = 1 - Math.min(1, Math.abs(this.scrollCurrent - 0.165) / 0.055);
      const warpB = 1 - Math.min(1, Math.abs(this.scrollCurrent - 0.795) / 0.065);
      const warpIntensity = Math.min(
        1,
        Math.max(warpA, warpB) * (0.45 + Math.min(0.55, scrollVelocity * 2.5)),
      );

      const targetFov = 46 + warpIntensity * 16;
      if (Math.abs(this.camera.fov - targetFov) > 0.05) {
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, rawDelta);
        this.camera.updateProjectionMatrix();
      }

      const parallaxAmp =
        this.scrollCurrent > 0.65 && this.scrollCurrent < 0.85 ? 0.1 : 0.44;
      _camPos.x += this.smoothPointerX * parallaxAmp;
      _camPos.y += this.smoothPointerY * parallaxAmp * 0.5;

      this.camera.position.copy(_camPos);
      this.camera.lookAt(_lookTarget);

      // Update Summit
      const pointerDist = Math.hypot(this.smoothPointerX, this.smoothPointerY);
      const hoverSplit = Math.max(0, 1 - pointerDist * 1.1) * 0.42;
      const scrollSplit = THREE.MathUtils.smoothstep(
        this.scrollCurrent,
        0.01,
        0.13,
      );
      this.neuralSummit.update(
        animElapsed,
        rawDelta,
        Math.min(1, hoverSplit + scrollSplit),
        this.smoothPointerX,
        this.smoothPointerY,
      );

      this.monoliths.update(animElapsed, rawDelta, this.hoveredMonolithId);

      const portalActivation =
        1 - Math.min(1, Math.abs(this.scrollCurrent - 0.75) / 0.12);
      this.portal.update(animElapsed, rawDelta, Math.max(0, portalActivation));

      this.pedestal.update(animElapsed, rawDelta, this.smoothPointerX);

      this.warpTunnel.update(
        animElapsed,
        rawDelta,
        warpIntensity,
        this.camera.position.y,
      );

      this.ambientDust.points.rotation.y = animElapsed * 0.015;

      this.updateMonolithScreenMarker();
      this.updateSummitCallouts();

      if (this.composer && !this.isSoftwareGl) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private updateSummitCallouts(): void {
    if (this.isPaused || this.scrollCurrent > 0.14) {
      this.callbacks.onSummitCalloutsUpdate([]);
      return;
    }

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const projected: SummitCalloutMarker[] = [];

    for (const anchor of this.neuralSummit.anchors) {
      _projVec.copy(anchor.worldPos);
      _projVec.project(this.camera);
      if (_projVec.z < 1) {
        projected.push({
          label: anchor.label,
          sublabel: anchor.sublabel,
          x: ((_projVec.x + 1) / 2) * width,
          y: ((-_projVec.y + 1) / 2) * height,
        });
      }
    }
    this.callbacks.onSummitCalloutsUpdate(projected);
  }

  private updateMonolithScreenMarker(): void {
    if (
      this.isPaused ||
      this.scrollCurrent < 0.18 ||
      this.scrollCurrent > 0.65
    ) {
      this.callbacks.onMarkerUpdate(null);
      return;
    }

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    let targetEntry = this.monoliths.entries.find(
      (e) => e.id === this.hoveredMonolithId,
    );
    if (!targetEntry) {
      let bestDist = Infinity;
      for (const entry of this.monoliths.entries) {
        const d = Math.abs(entry.group.position.y - this.camera.position.y);
        if (d < bestDist) {
          bestDist = d;
          targetEntry = entry;
        }
      }
    }

    if (!targetEntry) {
      this.callbacks.onMarkerUpdate(null);
      return;
    }

    _projVec.copy(targetEntry.group.position);
    _projVec.project(this.camera);

    const visible = _projVec.z < 1 && Math.abs(_projVec.x) < 1.15;
    const x = ((_projVec.x + 1) / 2) * width;
    const y = ((-_projVec.y + 1) / 2) * height;
    const meta = PROJECT_CASE_STUDIES.find((p) => p.id === targetEntry?.id);

    if (!meta || !visible) {
      this.callbacks.onMarkerUpdate(null);
      return;
    }

    this.callbacks.onMarkerUpdate({
      id: meta.id,
      indexLabel: meta.indexLabel,
      title: meta.title,
      domain: meta.domain,
      x,
      y,
      visible,
      isHovered: targetEntry.id === this.hoveredMonolithId,
    });
  }

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    const canvas = this.renderer.domElement;
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('click', this.handleClick);
    canvas.removeEventListener('touchstart', this.handleTouchStart);
    canvas.removeEventListener('touchmove', this.handleTouchMove);
    canvas.removeEventListener('touchend', this.handleTouchEnd);
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener(
      'webglcontextrestored',
      this.handleContextRestored,
    );

    this.neuralSummit.dispose();
    this.monoliths.dispose();
    this.portal.dispose();
    this.pedestal.dispose();
    this.warpTunnel.dispose();
    this.ambientDust.geometry.dispose();
    this.ambientDust.material.dispose();
    this.textures.dispose();
    this.envMap.dispose();
    this.composer?.dispose();
    this.renderer.dispose();

    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
