import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import {
  CHAPTERS,
  ChapterDefinition,
  ENGINEER_PROFILE,
  PEDESTAL_CHANNELS,
} from '../data/portfolioData';
import {
  MonolithScreenMarker,
  SummitCalloutMarker,
} from '../three/SceneEngine';

interface HudOverlayProps {
  activeChapter: ChapterDefinition['id'];
  scrollProgress: number;
  soundEnabled: boolean;
  activeMarker: MonolithScreenMarker | null;
  summitCallouts: SummitCalloutMarker[];
  pedestalIndex: number;
  onToggleSound: () => void;
  onJumpToChapter: (scrollTarget: number) => void;
  onOpenProject: (projectId: string) => void;
  onPrevPedestal: () => void;
  onNextPedestal: () => void;
  onSelectPedestalIndex: (idx: number) => void;
}

export function HudOverlay({
  activeChapter,
  scrollProgress,
  soundEnabled,
  activeMarker,
  summitCallouts,
  pedestalIndex,
  onToggleSound,
  onJumpToChapter,
  onOpenProject,
  onPrevPedestal,
  onNextPedestal,
  onSelectPedestalIndex,
}: HudOverlayProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const currentChannel = PEDESTAL_CHANNELS[pedestalIndex];
  const isSummit = activeChapter === 'summit';
  const isPedestal = activeChapter === 'pedestal';

  const handleChannelAction = () => {
    if (currentChannel.isEmail) {
      void navigator.clipboard?.writeText(ENGINEER_PROFILE.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      window.open(currentChannel.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-6 md:p-8 select-none">
      {/* Top Perimeter */}
      <header className="flex items-start justify-between gap-8">
        <div className="pointer-events-auto flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onJumpToChapter(0)}
            className="text-left font-display text-lg font-semibold tracking-[0.18em] text-[#FAFAFA] hover:text-[#00FFFF] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FFFF]"
          >
            {ENGINEER_PROFILE.wordmark}
          </button>
          <p className="text-xs text-[#A1A1AA] tracking-wide whitespace-nowrap">
            {ENGINEER_PROFILE.roleLine}
          </p>
        </div>

        <div
          className={`hidden sm:block max-w-xs text-right transition-opacity duration-300 ${
            isSummit ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <p className="text-xs font-mono text-[#71717A] tracking-wider mb-1">
            01 · Architecture &amp; Consensus
          </p>
          <p className="text-xs leading-relaxed text-[#D4D4D8]">
            {ENGINEER_PROFILE.manifesto}
          </p>
        </div>
      </header>

      {/* Projected 3D Technical Callout Pins on Summit */}
      {isSummit &&
        summitCallouts.map((callout, idx) => {
          const isLeft = idx === 2;
          return (
            <div
              key={callout.label}
              style={{
                transform: `translate3d(${callout.x}px, ${callout.y}px, 0)`,
              }}
              className="pointer-events-none fixed top-0 left-0 hidden md:block"
            >
              <div className="relative">
                {/* Surgical pure cyan anchor node */}
                <span className="block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-[#00FFFF]" />
                {/* Diagonal leader stem + crisp label */}
                <div
                  className={`absolute top-0 flex items-center gap-2 ${
                    isLeft
                      ? 'right-3 -translate-y-6 flex-row-reverse text-right'
                      : 'left-3 -translate-y-6 text-left'
                  }`}
                >
                  <span className="block h-px w-8 bg-white/35" />
                  <div className="border border-white/12 bg-[#07080B]/85 px-2.5 py-1">
                    <div className="font-mono text-[10px] tracking-widest text-[#00FFFF] whitespace-nowrap">
                      {callout.label}
                    </div>
                    <div className="font-mono text-[9px] tracking-wider text-[#A1A1AA] whitespace-nowrap">
                      {callout.sublabel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

      {/* Projected 2D Targeting Reticle for Active Floating Crystal */}
      {activeMarker && (
        <div
          style={{
            transform: `translate3d(${activeMarker.x}px, ${activeMarker.y}px, 0) translate(-50%, -50%)`,
          }}
          className="pointer-events-none fixed top-0 left-0 z-10 transition-transform duration-75"
        >
          <button
            type="button"
            onClick={() => onOpenProject(activeMarker.id)}
            className="pointer-events-auto group relative flex flex-col items-start text-left focus-visible:outline-none"
          >
            <div
              className={`relative px-4 py-3 border transition-colors duration-200 bg-[#060709]/85 ${
                activeMarker.isHovered
                  ? 'border-[#00FFFF]/80'
                  : 'border-white/22 hover:border-white/50'
              }`}
            >
              <span className="absolute -top-px -left-px h-2.5 w-2.5 border-t border-l border-[#00FFFF]" />
              <span className="absolute -top-px -right-px h-2.5 w-2.5 border-t border-r border-white/60" />
              <span className="absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-white/60" />
              <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-[#00FFFF]" />

              <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-[#A1A1AA]">
                <span className="text-[#00FFFF]">{activeMarker.indexLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">{activeMarker.domain}</span>
              </div>
              <div className="mt-0.5 font-display text-sm font-medium text-[#FAFAFA] whitespace-nowrap">
                {activeMarker.title}
              </div>
              <div className="mt-1.5 font-mono text-[11px] tracking-wider text-[#D4D4D8] group-hover:text-[#00FFFF] transition-colors whitespace-nowrap">
                Inspect Architecture →
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Right Edge Vertical Chapter Rail */}
      <nav
        aria-label="Portfolio sections"
        className="pointer-events-auto fixed right-6 md:right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-end gap-4"
      >
        {CHAPTERS.map((ch) => {
          const isActive = ch.id === activeChapter;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => onJumpToChapter(ch.scrollTarget)}
              className="group flex items-center gap-3 py-1 text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FFFF]"
            >
              <span
                className={`font-mono text-[11px] tabular-nums transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[#FAFAFA]'
                    : 'text-[#71717A] group-hover:text-[#D4D4D8]'
                }`}
              >
                {ch.index} · {ch.label}
              </span>
              <span
                className={`block h-[2px] transition-all duration-200 ${
                  isActive
                    ? 'w-5 bg-[#00FFFF]'
                    : 'w-2.5 bg-[#3F3F46] group-hover:bg-[#A1A1AA]'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Bottom Perimeter */}
      <footer className="flex items-end justify-between gap-4">
        <div className="pointer-events-auto flex items-center gap-5">
          <button
            type="button"
            onClick={onToggleSound}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#D4D4D8] hover:text-[#FAFAFA] border border-white/12 hover:border-white/30 bg-[#08090C]/85 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FFFF]"
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-[#00FFFF]" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-[#71717A]" />
            )}
            <span>Sound: {soundEnabled ? 'On' : 'Off'}</span>
          </button>

          <span className="hidden lg:inline font-mono text-[11px] text-[#71717A] whitespace-nowrap">
            {ENGINEER_PROFILE.copyright}
          </span>
        </div>

        {isSummit && (
          <div className="pointer-events-auto flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => onJumpToChapter(CHAPTERS[1].scrollTarget)}
              className="px-4 py-2 font-mono text-[11px] tracking-wider text-[#A1A1AA] hover:text-[#FAFAFA] border border-white/12 hover:border-[#00FFFF]/60 bg-[#08090C]/85 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FFFF]"
            >
              Scroll to Descend ↓
            </button>
          </div>
        )}

        {isPedestal && (
          <div className="pointer-events-auto mx-auto flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2.5 border border-white/15 bg-[#08090C]/92">
              <button
                type="button"
                aria-label="Previous network channel"
                onClick={onPrevPedestal}
                className="flex h-9 w-9 items-center justify-center border border-white/12 text-[#D4D4D8] hover:text-[#FAFAFA] hover:border-[#00FFFF]/70 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FFFF]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="min-w-[200px] sm:min-w-[250px] text-center px-2">
                <div className="font-mono text-[11px] tabular-nums text-[#71717A]">
                  {currentChannel.indexLabel} · {currentChannel.handle}
                </div>
                <div className="font-display text-base font-medium text-[#FAFAFA]">
                  {currentChannel.label}
                </div>
                <p className="mt-0.5 text-xs text-[#A1A1AA] line-clamp-1">
                  {currentChannel.description}
                </p>
              </div>

              <button
                type="button"
                aria-label="Next network channel"
                onClick={onNextPedestal}
                className="flex h-9 w-9 items-center justify-center border border-white/12 text-[#D4D4D8] hover:text-[#FAFAFA] hover:border-[#00FFFF]/70 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FFFF]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {PEDESTAL_CHANNELS.map((ch, idx) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onSelectPedestalIndex(idx)}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors whitespace-nowrap shrink-0 border ${
                    idx === pedestalIndex
                      ? 'border-[#00FFFF]/70 text-[#FAFAFA] bg-[#0D1014]'
                      : 'border-white/10 text-[#71717A] hover:text-[#D4D4D8] bg-[#08090C]/85'
                  }`}
                >
                  {ch.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleChannelAction}
                className="flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] text-[#040506] bg-[#FAFAFA] hover:bg-[#00FFFF] transition-colors whitespace-nowrap shrink-0"
              >
                {currentChannel.isEmail ? (
                  copiedEmail ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Copied Email</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>{currentChannel.actionLabel}</span>
                    </>
                  )
                ) : (
                  <>
                    <span>{currentChannel.actionLabel}</span>
                    <ExternalLink className="h-3 w-3" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onJumpToChapter(0)}
                className="flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] text-[#D4D4D8] hover:text-[#FAFAFA] border border-white/14 bg-[#08090C]/90 transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowUp className="h-3 w-3 text-[#00FFFF]" />
                <span>Summit</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom-Right Depth Telemetry */}
        <div className="pointer-events-auto flex items-center gap-3 font-mono text-[11px] tabular-nums text-[#71717A] whitespace-nowrap">
          <span>DEPTH</span>
          <div className="h-px w-12 bg-white/15 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[#00FFFF]"
              style={{ width: `${Math.round(scrollProgress * 100)}%` }}
            />
          </div>
          <span className="text-[#D4D4D8] w-8 text-right">
            {String(Math.round(scrollProgress * 100)).padStart(3, '0')}%
          </span>
        </div>
      </footer>
    </div>
  );
}
