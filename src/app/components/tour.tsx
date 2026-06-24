import { useEffect, useState } from "react";
import {
  Sparkles,
  MessageSquare,
  LayoutGrid,
  Inbox,
  FolderKanban,
  Bot,
  Tags,
  Rocket,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import type { ViewKey } from "./sidebar-nav";
import { cn } from "./ui/utils";

export interface TourStep {
  target: string | null; // data-tour 값 (null = 화면 중앙)
  view?: ViewKey;
  icon: typeof Sparkles;
  title: string;
  body: string;
}

export const tourSteps: TourStep[] = [
  {
    target: null,
    view: "chat",
    icon: Sparkles,
    title: "SRNote에 오신 걸 환영해요",
    body: "흩어진 노트를 AI 에이전트가 분류·라우팅해 프로젝트별 ‘지식’으로 합성하는 워크스페이스예요. 30초면 핵심을 다 둘러봐요.",
  },
  { target: "nav-chat", view: "chat", icon: MessageSquare, title: "채팅", body: "에이전트와 대화하며 무엇이든 묻고, 새 노트를 바로 남길 수 있어요." },
  { target: "nav-overview", view: "overview", icon: LayoutGrid, title: "개요", body: "쌓인 지식의 성장 추이·프로젝트 분포·최근 변경을 한눈에 봐요." },
  { target: "nav-inbox", view: "inbox", icon: Inbox, title: "인박스", body: "새로 들어온 노트를 검토하고 알맞은 프로젝트로 라우팅해요." },
  { target: "nav-projects", view: "projects", icon: FolderKanban, title: "프로젝트", body: "각 프로젝트의 지식 베이스와 담당 에이전트를 모아서 봐요." },
  { target: "nav-agents", view: "agents", icon: Bot, title: "에이전트", body: "오케스트레이터 → 리드 → 서브로 이어지는 에이전트 조직도예요." },
  { target: "nav-knowledge", view: "knowledge", icon: Tags, title: "지식", body: "키워드 워드맵으로 쌓인 지식을 탐색해요. 단어를 누르면 관련 노트가 마우스 옆에 떠요." },
  {
    target: null,
    view: "chat",
    icon: Rocket,
    title: "준비 완료!",
    body: "언제든 사이드바 하단의 ? 버튼으로 이 가이드를 다시 볼 수 있어요. 이제 시작해 보세요.",
  },
];

const CARD_W = 330;

export function Tour({
  stepIndex,
  onNext,
  onPrev,
  onClose,
}: {
  stepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const step = tourSteps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === tourSteps.length - 1;
  const [rect, setRect] = useState<DOMRect | null>(null);

  // 대상(사이드바 항목) 위치 측정 — 단계 변경/리사이즈/스크롤 시 갱신
  useEffect(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(measure));
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step.target, stepIndex]);

  // Esc / 화살표 키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "Enter") onNext();
      else if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onPrev, onClose]);

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const pad = 8;
  const hole = rect ? { x: rect.left - pad, y: rect.top - pad, w: rect.width + pad * 2, h: rect.height + pad * 2 } : null;

  // 카드 위치
  let cardLeft: number;
  let cardTop: number;
  if (hole) {
    cardLeft = hole.x + hole.w + 18;
    if (cardLeft + CARD_W > vw - 16) cardLeft = Math.max(16, hole.x - CARD_W - 18);
    cardTop = Math.min(Math.max(16, hole.y - 8), vh - 250);
  } else {
    cardLeft = (vw - CARD_W) / 2;
    cardTop = Math.max(48, vh / 2 - 150);
  }

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* 딤 + 스포트라이트 구멍 */}
      <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: "auto" }}>
        <defs>
          <mask id="tour-hole">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hole && <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx="12" fill="black" style={{ transition: "all .32s cubic-bezier(.4,.1,.2,1)" }} />}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(8,8,14,0.66)" mask="url(#tour-hole)" />
      </svg>

      {/* 하이라이트 링 */}
      {hole && (
        <div
          className="pointer-events-none absolute rounded-xl"
          style={{
            left: hole.x,
            top: hole.y,
            width: hole.w,
            height: hole.h,
            boxShadow: "0 0 0 2px var(--primary), 0 0 26px 3px color-mix(in oklab, var(--primary) 45%, transparent)",
            transition: "all .32s cubic-bezier(.4,.1,.2,1)",
          }}
        />
      )}

      {/* 툴팁 카드 */}
      <div
        className="tour-pop absolute w-[330px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/50"
        style={{ left: cardLeft, top: cardTop }}
        role="dialog"
      >
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-chart-5" />
        <div className="p-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon style={{ width: 18, height: 18 }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                둘러보기 · {stepIndex + 1}/{tourSteps.length}
              </div>
              <h3 className="truncate tracking-tight">{step.title}</h3>
            </div>
            <button onClick={onClose} title="건너뛰기" className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

          {/* 진행 점 */}
          <div className="mt-4 flex items-center gap-1.5">
            {tourSteps.map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 rounded-full transition-all", i === stepIndex ? "w-5 bg-primary" : "w-1.5 bg-secondary")}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {!isFirst && (
              <button onClick={onPrev} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="size-3.5" />이전
              </button>
            )}
            <button onClick={onClose} className="ml-auto font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground">
              건너뛰기
            </button>
            <button onClick={onNext} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-mono text-[11px] text-primary-foreground transition-opacity hover:opacity-90">
              {isLast ? "시작하기" : "다음"}
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tour-pop-k { from { opacity:0; transform: scale(.94) translateY(6px);} to { opacity:1; transform:none;} }
        .tour-pop { animation: tour-pop-k .34s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce){ .tour-pop { animation:none !important; } }
      `}</style>
    </div>
  );
}
