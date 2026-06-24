import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  FlaskConical,
  Sparkles,
  Radio,
  Users,
  FileSearch,
  Lightbulb,
  BrainCircuit,
  MessageSquareQuote,
  Target,
  ArrowRight,
  Network,
  Zap,
  RefreshCw,
} from "lucide-react";
import { getAgent } from "../data";
import { AgentAvatar } from "./agent-bits";
import { cn } from "./ui/utils";
import {
  researchStages,
  stageIndex,
  researchTopics,
  labPapers,
  labIdeas,
  collabFeed,
  labEdges,
  graphRing,
  graphHubId,
  kindMeta,
  labSession,
  type CollabKind,
  type CollabEvent,
  type StageKey,
} from "../lab-data";

/* ──────────────────────────────────────────────────────────────────────────
 * 작은 훅들
 * ────────────────────────────────────────────────────────────────────────── */

// 숫자 카운트업.
function useCountUp(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

// 단어 교체(타이핑 느낌).
function RotatingWord({ words, interval = 2100 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);
  return (
    <span key={i} className="lab-rise inline-block bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">
      {words[i]}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 협업 그래프 (히어로 센터피스)
 * ────────────────────────────────────────────────────────────────────────── */

const CX = 470;
const CY = 240;
const RX = 372;
const RY = 192;

type Pt = { id: string; x: number; y: number };

const ringPts: Pt[] = graphRing.map((id, i) => {
  const ang = ((-90 + (360 / graphRing.length) * i) * Math.PI) / 180;
  return { id, x: CX + RX * Math.cos(ang), y: CY + RY * Math.sin(ang) };
});

function posOf(id: string): Pt {
  if (id === graphHubId) return { id, x: CX, y: CY };
  return ringPts.find((p) => p.id === id)!;
}

function arc(a: Pt, b: Pt, bow = 0.16): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx + (mx - CX) * bow;
  const cy = my + (my - CY) * bow;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

function CollabGraph({ onOpenAgent }: { onOpenAgent: (id: string) => void }) {
  const hub = getAgent(graphHubId)!;

  return (
    <div className="relative">
      {/* 은은한 배경 글로우 */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)" }}
      />
      <svg viewBox="0 0 940 500" className="relative w-full" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="lab-hub-fill" cx="35%" cy="30%">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--primary) 55%, var(--card))" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--primary) 16%, var(--card))" />
          </radialGradient>
        </defs>

        {/* 허브 스포크 — ATLAS가 모든 에이전트를 연결 */}
        {ringPts.map((p) => (
          <path
            key={`spoke-${p.id}`}
            d={arc({ id: "h", x: CX, y: CY }, p, 0.05)}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="1 7"
            className="lab-dash-slow"
            style={{ opacity: 0.5 }}
          />
        ))}

        {/* 협업 엣지 + 흐르는 입자 */}
        {labEdges.map((e, i) => {
          const a = posOf(e.from);
          const b = posOf(e.to);
          const color = kindMeta[e.kind].color;
          const d = arc(a, b, 0.18);
          return (
            <g key={`edge-${i}`}>
              <path id={`labedge-${i}`} d={d} fill="none" stroke={color} strokeWidth={1.4} style={{ opacity: 0.22 }} />
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeDasharray="2 12"
                className="lab-dash"
                style={{ opacity: 0.7 }}
              />
              <circle r={3.6} style={{ fill: color, filter: `drop-shadow(0 0 5px ${color})` }}>
                <animateMotion dur={`${3 + (i % 4) * 0.7}s`} begin={`${(i % 5) * 0.5}s`} repeatCount="indefinite" rotate="auto">
                  <mpath href={`#labedge-${i}`} />
                </animateMotion>
              </circle>
              {i % 3 === 0 && (
                <circle r={2.4} style={{ fill: color, opacity: 0.7 }}>
                  <animateMotion dur={`${4 + (i % 3)}s`} begin={`${1 + (i % 4) * 0.6}s`} repeatCount="indefinite">
                    <mpath href={`#labedge-${i}`} />
                  </animateMotion>
                </circle>
              )}
            </g>
          );
        })}

        {/* 노드 헤일로 */}
        {ringPts.map((p) => {
          const a = getAgent(p.id)!;
          const energetic = a.status === "processing" || a.status === "active" || a.status === "training";
          return (
            <circle
              key={`halo-${p.id}`}
              cx={p.x}
              cy={p.y}
              r={34}
              fill={`color-mix(in oklab, ${a.accent} 30%, transparent)`}
              className={energetic ? "lab-halo" : undefined}
              style={{ transformBox: "fill-box", transformOrigin: "center", opacity: energetic ? undefined : 0.12 }}
            />
          );
        })}

        {/* 허브 회전 링 */}
        <circle
          cx={CX}
          cy={CY}
          r={52}
          fill="none"
          stroke="color-mix(in oklab, var(--primary) 55%, transparent)"
          strokeWidth={1.4}
          strokeDasharray="3 9"
          className="lab-spin"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        <circle cx={CX} cy={CY} r={66} fill="color-mix(in oklab, var(--primary) 22%, transparent)" className="lab-halo" style={{ transformBox: "fill-box", transformOrigin: "center" }} />

        {/* 링 에이전트 노드 (foreignObject로 아바타 재사용) */}
        {ringPts.map((p) => {
          const a = getAgent(p.id)!;
          return (
            <foreignObject key={`node-${p.id}`} x={p.x - 46} y={p.y - 30} width={92} height={86} style={{ overflow: "visible" }}>
              <div className="flex cursor-pointer flex-col items-center" onClick={() => onOpenAgent(p.id)}>
                <div className="transition-transform duration-200 hover:scale-110">
                  <AgentAvatar agent={a} size={48} live />
                </div>
                <div className="mt-1 rounded-md bg-card/80 px-1.5 font-mono text-[10px] leading-tight backdrop-blur" style={{ color: a.accent }}>
                  {a.codename}
                </div>
              </div>
            </foreignObject>
          );
        })}

        {/* 허브 노드 (ATLAS) */}
        <foreignObject x={CX - 60} y={CY - 46} width={120} height={104} style={{ overflow: "visible" }}>
          <div className="flex cursor-pointer flex-col items-center" onClick={() => onOpenAgent(graphHubId)}>
            <div className="transition-transform duration-200 hover:scale-105">
              <AgentAvatar agent={hub} size={62} live />
            </div>
            <div className="mt-1.5 flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[11px] text-primary backdrop-blur">
              <Sparkles className="size-3" />
              {hub.codename}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">오케스트레이터</div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 연구 프로세스 파이프라인
 * ────────────────────────────────────────────────────────────────────────── */

const stageIcon: Record<StageKey, typeof Target> = {
  topic: Target,
  literature: FileSearch,
  ideation: Lightbulb,
  design: FlaskConical,
  feedback: MessageSquareQuote,
  synthesis: BrainCircuit,
};

function ResearchPipeline() {
  const counts = researchStages.map(
    (s) => researchTopics.filter((t) => stageIndex[t.stage] === stageIndex[s.key]).length,
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Network className="size-4 text-primary" />
        <h2 className="tracking-tight">연구 프로세스</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">상시 가동 · 6단계</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
        {/* 단계 위로 흐르는 라이브 펄스 */}
        <div className="pointer-events-none absolute inset-x-5 top-1/2 h-px -translate-y-6 bg-border">
          <span className="lab-sweep absolute -top-px h-1 w-24 -translate-y-px rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
        </div>

        <div className="relative grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {researchStages.map((s, i) => {
            const Icon = stageIcon[s.key];
            const n = counts[i];
            return (
              <div key={s.key} className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "relative grid size-12 place-items-center rounded-xl border transition-colors",
                    n > 0 ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-background/50 text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {n > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary font-mono text-[10px] text-primary-foreground">
                      {n}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm">{s.label}</div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{s.sub}</div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground/70">0{i + 1}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 실험 주제 카드
 * ────────────────────────────────────────────────────────────────────────── */

function TopicCard({ topicId, onOpenAgent }: { topicId: string; onOpenAgent: (id: string) => void }) {
  const t = researchTopics.find((x) => x.id === topicId)!;
  const lead = getAgent(t.leadAgentId)!;
  const stageLabel = researchStages.find((s) => s.key === t.stage)!.label;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: t.color }} />
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: t.color }}>
          {stageLabel}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
          <Sparkles className="size-3" /> 참신성 {t.novelty}
        </span>
      </div>

      <div className="mt-1.5 tracking-tight">{t.title}</div>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.question}</p>

      {/* 진행률 */}
      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full transition-all" style={{ width: `${t.progress}%`, background: t.color }} />
        </div>
      </div>

      {/* 팀 + 지표 */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center -space-x-1.5">
          <button onClick={() => onOpenAgent(lead.id)} title={lead.codename}>
            <AgentAvatar agent={lead} size={26} live />
          </button>
          {t.collaboratorIds.map((id) => {
            const a = getAgent(id)!;
            return (
              <button key={id} onClick={() => onOpenAgent(id)} title={a.codename}>
                <AgentAvatar agent={a} size={22} showRing={false} />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileSearch className="size-3" /> {t.papers}
          </span>
          <span className="inline-flex items-center gap-1">
            <Lightbulb className="size-3" /> {t.ideas}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 실시간 협업 로그 (스트리밍)
 * ────────────────────────────────────────────────────────────────────────── */

type StampedEvent = { key: number; ev: CollabEvent };

function fireBurst() {
  const colors = ["#a78bfa", "#34d399", "#fbbf24", "#60a5fa", "#f472b6"];
  confetti({ particleCount: 70, spread: 78, startVelocity: 38, gravity: 0.9, scalar: 0.9, origin: { x: 0.5, y: 0.42 }, colors });
}

function CollabLog() {
  const [items, setItems] = useState<StampedEvent[]>(() =>
    collabFeed.slice(0, 4).map((ev, i) => ({ key: i, ev })),
  );
  const idx = useRef(4);
  const counter = useRef(4);
  const lastBurst = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      const ev = collabFeed[idx.current % collabFeed.length];
      idx.current += 1;
      counter.current += 1;
      const key = counter.current;
      setItems((prev) => [...prev.slice(-6), { key, ev }]);
      if (ev.breakthrough && Date.now() - lastBurst.current > 9000) {
        lastBurst.current = Date.now();
        fireBurst();
      }
    }, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="flex h-full flex-col space-y-4">
      <div className="flex items-center gap-2">
        <Radio className="size-4 text-signal" />
        <h2 className="tracking-tight">실시간 협업 로그</h2>
        <span className="lab-blink ml-auto inline-flex items-center gap-1.5 rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[11px] text-signal">
          <span className="size-1.5 rounded-full bg-signal" /> STREAMING
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-hidden rounded-2xl border border-border bg-card p-3">
        {items.map(({ key, ev }) => {
          const from = getAgent(ev.from)!;
          const to = ev.to === "ALL" ? null : getAgent(ev.to)!;
          const meta = kindMeta[ev.kind];
          const KIcon = meta.icon;
          return (
            <div
              key={key}
              className={cn(
                "lab-rise flex gap-2.5 rounded-lg border p-2.5",
                ev.breakthrough ? "border-primary/40 bg-primary/[0.07]" : "border-transparent bg-background/40",
              )}
            >
              <AgentAvatar agent={from} size={26} />
              <div className="min-w-0 flex-1 leading-snug">
                <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
                  <span style={{ color: from.accent }}>{from.codename}</span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span style={{ color: to ? to.accent : "var(--primary)" }}>{to ? to.codename : "ALL"}</span>
                  <span
                    className="ml-1 inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px]"
                    style={{ background: `color-mix(in oklab, ${meta.color} 16%, transparent)`, color: meta.color }}
                  >
                    <KIcon className="size-2.5" />
                    {meta.label}
                  </span>
                  {ev.breakthrough && (
                    <span className="inline-flex items-center gap-1 rounded bg-primary/20 px-1.5 py-px text-[10px] text-primary">
                      <Zap className="size-2.5" /> 돌파구
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-foreground/90">{ev.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 논문 탐색 / 아이디어 창출
 * ────────────────────────────────────────────────────────────────────────── */

function PapersPanel({ onOpenAgent }: { onOpenAgent: (id: string) => void }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <FileSearch className="size-4" style={{ color: kindMeta.paper.color }} />
        <h2 className="tracking-tight">논문 탐색</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{labPapers.length}편 큐레이션</span>
      </div>
      <div className="space-y-2">
        {labPapers.map((p) => {
          const a = getAgent(p.foundBy)!;
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${kindMeta.paper.color} 16%, transparent)`, color: kindMeta.paper.color }}>
                <FileSearch className="size-4" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm">{p.title}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{p.venue}</div>
              </div>
              <button onClick={() => onOpenAgent(a.id)} title={`${a.codename}가 발견`} className="shrink-0">
                <AgentAvatar agent={a} size={24} showRing={false} />
              </button>
              <div className="w-14 shrink-0 text-right">
                <div className="font-mono text-sm tabular-nums" style={{ color: kindMeta.paper.color }}>{p.relevance}%</div>
                <div className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">관련도</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function IdeasPanel({ onOpenAgent }: { onOpenAgent: (id: string) => void }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-4 text-primary" />
        <h2 className="tracking-tight">아이디어 창출</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">에이전트 발산</span>
      </div>
      <div className="space-y-2">
        {labIdeas.map((idea) => {
          const a = getAgent(idea.byAgentId)!;
          return (
            <div key={idea.id} className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm">{idea.text}</p>
              <div className="mt-2.5 flex items-center gap-3">
                <button onClick={() => onOpenAgent(a.id)} className="flex items-center gap-1.5" title={a.codename}>
                  <AgentAvatar agent={a} size={20} showRing={false} />
                  <span className="font-mono text-[11px]" style={{ color: a.accent }}>{a.codename}</span>
                </button>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <Sparkles className="size-3" /> 참신성 {idea.novelty}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[11px] text-signal">
                  <Users className="size-3" /> {idea.endorsements} 동의
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 통계 칩
 * ────────────────────────────────────────────────────────────────────────── */

function StatChip({ icon: Icon, label, value, suffix, accent }: { icon: typeof Target; label: string; value: number; suffix?: string; accent: string }) {
  const v = useCountUp(value);
  return (
    <div className="flex min-w-[150px] flex-1 items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${accent} 16%, transparent)`, color: accent }}>
        <Icon className="size-4" />
      </span>
      <div className="leading-tight">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold tabular-nums">
          {Math.round(v)}
          {suffix}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 메인 뷰
 * ────────────────────────────────────────────────────────────────────────── */

export function LabView({ onOpenAgent }: { onOpenAgent: (id: string) => void }) {
  const totalPapers = researchTopics.reduce((s, t) => s + t.papers, 0);
  const totalIdeas = researchTopics.reduce((s, t) => s + t.ideas, 0);

  return (
    <div className="space-y-8">
      <LabStyles />

      {/* 히어로 */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.10] via-card to-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
            <FlaskConical className="size-3.5" />
            Experimental Beta
          </span>
          <span className="lab-blink inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-destructive">
            <span className="size-1.5 rounded-full bg-destructive" /> Live Session
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {labSession.startedLabel} · 참여 {labSession.participants} · {labSession.cycles}번째 사이클
          </span>
          <button
            className="ml-auto hidden items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            title="라이브 데모"
          >
            <RefreshCw className="size-3.5" /> 자동 진행 중
          </button>
        </div>

        <h2 className="mt-4 max-w-2xl text-2xl leading-snug tracking-tight sm:text-3xl">
          에이전트들이 함께 <RotatingWord words={["논문을 읽고", "가설을 세우고", "서로를 반박하고", "지식으로 합성합니다"]} />
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          각 프로젝트의 담당 에이전트가 한 테이블에 모여 실험 주제를 정하고, 선행 연구를 탐색하고, 아이디어를 주고받으며 자율적으로 연구를 진행합니다.
        </p>

        {/* 협업 그래프 */}
        <div className="mt-2">
          <CollabGraph onOpenAgent={onOpenAgent} />
        </div>

        {/* 범례 */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          {(Object.keys(kindMeta) as CollabKind[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: kindMeta[k].color }} />
              {kindMeta[k].label}
            </span>
          ))}
        </div>
      </section>

      {/* 통계 */}
      <div className="-mx-1 flex flex-wrap gap-3 px-1">
        <StatChip icon={FlaskConical} label="진행 중 실험" value={researchTopics.length} accent="var(--primary)" />
        <StatChip icon={FileSearch} label="탐색한 논문" value={totalPapers} accent={kindMeta.paper.color} />
        <StatChip icon={Lightbulb} label="생성된 아이디어" value={totalIdeas} accent="var(--warn)" />
        <StatChip icon={BrainCircuit} label="합성된 지식" value={9} accent="var(--signal)" />
        <StatChip icon={Users} label="참여 에이전트" value={10} accent="oklch(0.74 0.13 222)" />
        <StatChip icon={Zap} label="라이브 합의율" value={92} suffix="%" accent="oklch(0.72 0.18 350)" />
      </div>

      {/* 연구 프로세스 */}
      <ResearchPipeline />

      {/* 실험 주제 + 협업 로그 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="space-y-4 xl:col-span-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-primary" />
            <h2 className="tracking-tight">실험 주제</h2>
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{researchTopics.length}개 활성</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {researchTopics.map((t) => (
              <TopicCard key={t.id} topicId={t.id} onOpenAgent={onOpenAgent} />
            ))}
          </div>
        </section>

        <CollabLog />
      </div>

      {/* 논문 + 아이디어 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PapersPanel onOpenAgent={onOpenAgent} />
        <IdeasPanel onOpenAgent={onOpenAgent} />
      </div>
    </div>
  );
}

/* 키프레임 — 컴포넌트 마운트 시 1회 주입 */
function LabStyles() {
  return (
    <style>{`
      @keyframes lab-dash { to { stroke-dashoffset: -140; } }
      .lab-dash { animation: lab-dash 1.6s linear infinite; }
      .lab-dash-slow { animation: lab-dash 6s linear infinite; }
      @keyframes lab-halo-k { 0%,100% { opacity:.18; transform: scale(1);} 50% { opacity:.42; transform: scale(1.16);} }
      .lab-halo { animation: lab-halo-k 3.2s ease-in-out infinite; }
      @keyframes lab-rise-k { from { opacity:0; transform: translateY(7px);} to { opacity:1; transform: none;} }
      .lab-rise { animation: lab-rise-k .5s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes lab-spin-k { to { transform: rotate(360deg); } }
      .lab-spin { animation: lab-spin-k 26s linear infinite; }
      @keyframes lab-blink-k { 0%,100% { opacity:1; } 50% { opacity:.35; } }
      .lab-blink { animation: lab-blink-k 1.8s ease-in-out infinite; }
      @keyframes lab-sweep-k { 0% { left:-12%; } 100% { left:104%; } }
      .lab-sweep { animation: lab-sweep-k 3.6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .lab-dash, .lab-dash-slow, .lab-halo, .lab-spin, .lab-sweep, .lab-blink { animation: none !important; }
      }
    `}</style>
  );
}
