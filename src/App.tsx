import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { CaseStudyModal } from './components/CaseStudyModal';
import { HudOverlay } from './components/HudOverlay';
import {
  CHAPTERS,
  ChapterDefinition,
  ENGINEER_PROFILE,
  PEDESTAL_CHANNELS,
  PROJECT_CASE_STUDIES,
} from './data/portfolioData';
import {
  MonolithScreenMarker,
  SceneEngine,
  SummitCalloutMarker,
} from './three/SceneEngine';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<SceneEngine | null>(null);

  const [activeChapter, setActiveChapter] =
    useState<ChapterDefinition['id']>('summit');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeMarker, setActiveMarker] = useState<MonolithScreenMarker | null>(
    null,
  );
  const [summitCallouts, setSummitCallouts] = useState<SummitCalloutMarker[]>(
    [],
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [pedestalIndex, setPedestalIndex] = useState(0);
  const [contextLost, setContextLost] = useState(false);

  const selectedProject = useMemo(
    () =>
      PROJECT_CASE_STUDIES.find((p) => p.id === selectedProjectId) ?? null,
    [selectedProjectId],
  );

  // Initialize Three.js SceneEngine once on mount
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const engine = new SceneEngine(mountEl, {
      onChapterChange: (chapterId) => {
        setActiveChapter(chapterId);
      },
      onScrollProgress: (progress) => {
        setScrollProgress(progress);
        soundEngine.updateScrollModulation(progress);
      },
      onHoverMonolith: (projectId) => {
        if (projectId) {
          soundEngine.playHoverTick();
        }
      },
      onSelectMonolith: (projectId) => {
        soundEngine.playSelectChime();
        setSelectedProjectId(projectId);
      },
      onMarkerUpdate: (marker) => {
        setActiveMarker(marker);
      },
      onSummitCalloutsUpdate: (callouts) => {
        setSummitCallouts(callouts);
      },
      onContextLost: (lost) => {
        setContextLost(lost);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
      soundEngine.dispose();
    };
  }, []);

  // Pause scroll interaction while reading a case study
  useEffect(() => {
    engineRef.current?.setPaused(selectedProjectId !== null);
  }, [selectedProjectId]);

  // Keyboard navigation between chapters and pedestal shapes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedProjectId) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        const idx = CHAPTERS.findIndex((c) => c.id === activeChapter);
        const next = CHAPTERS[Math.min(CHAPTERS.length - 1, idx + 1)];
        engineRef.current?.setScrollTarget(next.scrollTarget);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        const idx = CHAPTERS.findIndex((c) => c.id === activeChapter);
        const prev = CHAPTERS[Math.max(0, idx - 1)];
        engineRef.current?.setScrollTarget(prev.scrollTarget);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChapter, selectedProjectId]);

  const handleToggleSound = useCallback(async () => {
    const next = !soundEnabled;
    await soundEngine.setEnabled(next);
    setSoundEnabled(next);
  }, [soundEnabled]);

  const handleJumpToChapter = useCallback((scrollTarget: number) => {
    soundEngine.playHoverTick();
    engineRef.current?.setScrollTarget(scrollTarget);
  }, []);

  const handleOpenProject = useCallback((projectId: string) => {
    soundEngine.playSelectChime();
    setSelectedProjectId(projectId);
  }, []);

  const handleSelectPedestalIndex = useCallback((idx: number) => {
    const normalized =
      (idx + PEDESTAL_CHANNELS.length) % PEDESTAL_CHANNELS.length;
    setPedestalIndex(normalized);
    const channel = PEDESTAL_CHANNELS[normalized];
    engineRef.current?.setPedestalShape(channel.id);
    soundEngine.playMorphSweep();
  }, []);

  const handlePrevPedestal = useCallback(() => {
    handleSelectPedestalIndex(pedestalIndex - 1);
  }, [handleSelectPedestalIndex, pedestalIndex]);

  const handleNextPedestal = useCallback(() => {
    handleSelectPedestalIndex(pedestalIndex + 1);
  }, [handleSelectPedestalIndex, pedestalIndex]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#040506] text-[#FAFAFA]">
      {/* Dedicated isolated WebGL canvas container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Interactive 3D AI and Blockchain portfolio viewport"
      />

      {/* Graceful WebGL Context Loss Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#040506] p-8 text-center">
          <div className="max-w-md border border-white/15 bg-[#090B0E] p-8">
            <h1 className="font-display text-xl font-semibold tracking-wider">
              {ENGINEER_PROFILE.wordmark}
            </h1>
            <p className="mt-2 text-sm text-[#A1A1AA]">
              3D WebGL context was interrupted. Restore hardware acceleration or
              reload to continue exploring the neural architecture.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 border border-white/20 px-4 py-2 font-mono text-xs text-[#FAFAFA] hover:border-[#00FFFF]"
            >
              Reload Viewport
            </button>
          </div>
        </div>
      )}

      {/* Minimal Perimeter DOM HUD */}
      <HudOverlay
        activeChapter={activeChapter}
        scrollProgress={scrollProgress}
        soundEnabled={soundEnabled}
        activeMarker={activeMarker}
        summitCallouts={summitCallouts}
        pedestalIndex={pedestalIndex}
        onToggleSound={handleToggleSound}
        onJumpToChapter={handleJumpToChapter}
        onOpenProject={handleOpenProject}
        onPrevPedestal={handlePrevPedestal}
        onNextPedestal={handleNextPedestal}
        onSelectPedestalIndex={handleSelectPedestalIndex}
      />

      {/* Full Case Study Overlay */}
      <CaseStudyModal
        project={selectedProject}
        onClose={() => setSelectedProjectId(null)}
        onSelectProject={handleOpenProject}
      />
    </main>
  );
}
