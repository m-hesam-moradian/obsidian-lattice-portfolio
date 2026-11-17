import { ArrowLeft, ArrowRight, ExternalLink, X } from 'lucide-react';
import { useEffect } from 'react';
import { PROJECT_CASE_STUDIES, ProjectCaseStudy } from '../data/portfolioData';

interface CaseStudyModalProps {
  project: ProjectCaseStudy | null;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
}

export function CaseStudyModal({
  project,
  onClose,
  onSelectProject,
}: CaseStudyModalProps) {
  useEffect(() => {
    if (!project) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [project, onClose]);

  if (!project) return null;

  const currentIdx = PROJECT_CASE_STUDIES.findIndex((p) => p.id === project.id);
  const prevProject =
    PROJECT_CASE_STUDIES[
      (currentIdx - 1 + PROJECT_CASE_STUDIES.length) %
        PROJECT_CASE_STUDIES.length
    ];
  const nextProject =
    PROJECT_CASE_STUDIES[(currentIdx + 1) % PROJECT_CASE_STUDIES.length];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-study-title"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#040506]/90 p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="obsidian-scroll relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-y-auto border border-white/15 bg-[#090B0E] p-6 md:p-10 text-[#FAFAFA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Metadata & Close */}
        <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums text-[#A1A1AA]">
              <span className="text-[#00FFFF]">{project.indexLabel}</span>
              <span aria-hidden="true">/</span>
              <span>{project.domain}</span>
              <span aria-hidden="true">·</span>
              <span>{project.year}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#71717A]">{project.coordinates}</span>
            </div>
            <h2
              id="case-study-title"
              className="mt-2 font-display text-2xl md:text-3xl font-semibold tracking-tight text-[#FAFAFA]"
            >
              {project.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-[#D4D4D8]">
              {project.summary}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close case study"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/15 text-[#A1A1AA] hover:border-[#00FFFF]/70 hover:text-[#FAFAFA] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FFFF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Split Layout: Animated System Architecture Flow (Left) + Performance Metrics (Right) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 border border-white/10 bg-[#0C0E13] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-xs tracking-wider text-[#71717A]">
                01. System Architecture Graph
              </h3>
              <span className="font-mono text-[11px] text-[#00FFFF]">
                DATA PIPELINE
              </span>
            </div>

            {/* Animated SVG Signal Flow */}
            <div className="relative mb-4 hidden sm:block">
              <svg
                viewBox="0 0 600 64"
                className="w-full h-14 overflow-visible"
                aria-hidden="true"
              >
                <line
                  x1="60"
                  y1="32"
                  x2="540"
                  y2="32"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="1"
                />
                <line
                  x1="60"
                  y1="32"
                  x2="540"
                  y2="32"
                  stroke="#00FFFF"
                  strokeWidth="1.5"
                  className="animate-cyan-flow"
                />
                {[60, 220, 380, 540].map((cx, i) => (
                  <g key={cx}>
                    <rect
                      x={cx - 10}
                      y="22"
                      width="20"
                      height="20"
                      fill="#090B0E"
                      stroke={i === 0 ? '#00FFFF' : 'rgba(255,255,255,0.4)'}
                      strokeWidth="1.2"
                    />
                    <circle
                      cx={cx}
                      cy="32"
                      r="3"
                      fill={i === 0 || i === 3 ? '#00FFFF' : '#FAFAFA'}
                    />
                  </g>
                ))}
              </svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.architectureNodes.map((node, idx) => (
                <div
                  key={node.stage}
                  className="border border-white/10 bg-[#080A0D] p-3.5"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-[#71717A]">
                    <span className={idx === 0 ? 'text-[#00FFFF]' : ''}>
                      {node.stage}
                    </span>
                    <span className="text-[#52525B]">0{idx + 1}</span>
                  </div>
                  <div className="mt-1 font-display text-sm font-medium text-[#FAFAFA]">
                    {node.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#A1A1AA]">
                    {node.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-5 flex flex-col justify-between border border-white/10 bg-[#0C0E13] p-5">
            <div>
              <h3 className="font-mono text-xs tracking-wider text-[#71717A] mb-4">
                02. Performance Benchmarks
              </h3>
              <div className="divide-y divide-white/10">
                {project.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="py-3 first:pt-0 last:pb-0 flex items-baseline justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-medium text-[#D4D4D8]">
                        {metric.label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#71717A]">
                        {metric.context}
                      </div>
                    </div>
                    <div className="font-mono text-lg font-medium tabular-nums text-[#00FFFF] shrink-0">
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="font-mono text-[11px] text-[#71717A] mb-2">
                CORE STACK
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#D4D4D8]">
                {project.stack.map((tech, idx) => (
                  <span key={tech} className="inline-flex items-center gap-2">
                    <span>{tech}</span>
                    {idx < project.stack.length - 1 && (
                      <span aria-hidden="true" className="text-[#52525B]">
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Challenge & Engineering Solution */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/10 pt-6">
          <div>
            <h3 className="font-mono text-xs tracking-wider text-[#71717A]">
              03. Technical Bottleneck
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#D4D4D8]">
              {project.challenge}
            </p>
          </div>
          <div>
            <h3 className="font-mono text-xs tracking-wider text-[#71717A]">
              04. Architectural Solution
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#D4D4D8]">
              {project.solution}
            </p>
          </div>
        </section>

        {/* Actions & Navigation Footer */}
        <div className="mt-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 pt-6 font-mono text-xs">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onSelectProject(prevProject.id)}
              className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#00FFFF]" />
              <span>{prevProject.indexLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectProject(nextProject.id)}
              className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <span>{nextProject.indexLabel}</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#00FFFF]" />
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {project.links.repository && (
              <a
                href={project.links.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-white/15 px-3.5 py-2 text-xs text-[#D4D4D8] hover:border-[#00FFFF]/70 hover:text-[#FAFAFA] transition-colors whitespace-nowrap"
              >
                <span>Repository</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {project.links.paperOrDemo && (
              <a
                href={project.links.paperOrDemo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#040506] hover:bg-[#00FFFF] transition-colors whitespace-nowrap"
              >
                <span>Weights &amp; Spec</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
