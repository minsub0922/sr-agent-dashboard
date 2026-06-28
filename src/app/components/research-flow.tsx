import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Target,
  FileSearch,
  Lightbulb,
  FlaskConical,
  MessageSquareQuote,
  BrainCircuit,
  Loader2,
  Cpu,
  Search,
  Quote,
  Radio,
  Layers,
  CheckCircle2,
  CircleDashed,
  Star,
  FileText,
  Network,
} from "lucide-react";
import { getAgent, type Agent } from "../data";
import { AgentAvatar } from "./agent-bits";
import { cn } from "./ui/utils";
import { researchStages, type StageKey } from "../lab-data";
import {
  topicExploration,
  candidateTopics,
  keywordAgentPool,
  flowPapers,
  graphNodes,
  graphEdges,
  graphRelMeta,
  hypothesisExploration,
  designSections,
  professors,
  feedbackKindMeta,
  feedbackFeed,
  contextChunks,
  draftSections,
  draftMeta,
  type CandidateTopic,
  type HypothesisCandidate,
  type GraphRel,
  type FeedbackKind,
} from "../research-flow-data";

/* ──────────────────────────────────────────────────────────────────────────
 * 공통 훅 / 유틸
 * ────────────────────────────────────────────────────────────────────────── */

// total개를 stepMs 간격으로 0→total 순차 노출. run=false면 즉시 완료 상태.
function useReveal(total: number, stepMs: number, run = true) {
  const [n, setN] = useState(run ? 0 : total);
  useEffect(() => {
    if (!run) {
      setN(total);
      return;
    }
    setN(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= total) clearInterval(t);
    }, stepMs);
    return () => clearInterval(t);
  }, [total, stepMs, run]);
  return n;
}

// 토큰 치환: {topic} {hyp} {kw0..} → 값.
function fill(s: string, map: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? `{${k}}`);
}

const stageIconMap: Record<StageKey, typeof Target> = {
  topic: Target,
  literature: FileSearch,
  ideation: Lightbulb,
  design: FlaskConical,
  feedback: MessageSquareQuote,
  synthesis: BrainCircuit,
};

// 작은 "에이전트 가동 중" 칩.
function ActiveAgents({ ids, label, busy = true }: { ids: string[]; label: string; busy?: boolean }) {
  const agents = ids.map((id) => getAgent(id)).filter(Boolean) as Agent[];
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-2.5 py-1">
      <span className="flex -space-x-1.5">
        {agents.map((a) => (
          <span key={a.id} title={a.codename} className={busy ? "lab-bob" : undefined} style={{ animationDelay: `${(a.id.length % 5) * 0.12}s` }}>
            <AgentAvatar agent={a} size={20} showRing={false} />
          </span>
        ))}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {busy && <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-signal align-middle" />}
        {label}
      </span>
    </div>
  );
}

function StageHeading({ icon: Icon, kicker, title, desc, right }: { icon: typeof Target; kicker: string; title: string; desc: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-primary">{kicker}</div>
          <h2 className="text-xl tracking-tight">{title}</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      {right}
    </div>
  );
}

// 에이전트 답변(스트리밍)이 끝난 뒤, 버튼을 눌러야 다음 산출물을 생성하는 게이트.
// ready=false면 대기(비활성), ready=true면 생성 버튼 노출.
function GenerateGate({
  icon: Icon,
  ready,
  onGenerate,
  label,
  waitingLabel,
  hint,
}: {
  icon: typeof Sparkles;
  ready: boolean;
  onGenerate: () => void;
  label: string;
  waitingLabel: string;
  hint?: string;
}) {
  return (
    <div className="lab-rise flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-5 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
        <Icon className="size-6" />
      </span>
      {hint && <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">{hint}</p>}
      <button
        onClick={onGenerate}
        disabled={!ready}
        className={cn(
          "group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
          ready
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
            : "cursor-not-allowed border border-border bg-card text-muted-foreground opacity-60",
        )}
      >
        {ready ? (
          <>
            <Sparkles className="size-4" />
            {label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        ) : (
          <>
            <Loader2 className="size-4 animate-spin" />
            {waitingLabel}
          </>
        )}
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 메인 — 6단계 세션 셸
 * ────────────────────────────────────────────────────────────────────────── */

export function ResearchFlow({ onBack, onOpenAgent }: { onBack: () => void; onOpenAgent: (id: string) => void }) {
  const [stage, setStage] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [ready, setReady] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedHypoId, setSelectedHypoId] = useState<string | null>(null);

  const onReady = useCallback(() => setReady(true), []);

  const selectedTopic: CandidateTopic = useMemo(
    () => candidateTopics.find((t) => t.id === selectedTopicId) ?? candidateTopics[0],
    [selectedTopicId],
  );
  const selectedHypo: HypothesisCandidate = useMemo(() => {
    const all = selectedTopic.hypotheses;
    return all.find((h) => h.id === selectedHypoId) ?? all.find((h) => h.recommended) ?? all[0];
  }, [selectedTopic, selectedHypoId]);

  const tokenMap = useMemo<Record<string, string>>(() => {
    const kw = selectedTopic.keywords;
    return {
      topic: selectedTopic.title,
      hyp: selectedHypo.statement,
      kw0: kw[0] ?? "",
      kw1: kw[1] ?? "",
      kw2: kw[2] ?? "",
      kw3: kw[3] ?? "",
      kw4: kw[4] ?? "",
    };
  }, [selectedTopic, selectedHypo]);

  // 단계 전환 시 ready 초기화.
  useEffect(() => {
    setReady(false);
  }, [stage]);

  const canNext = useMemo(() => {
    if (stage === 0) return !!selectedTopicId;
    if (stage === 2) return !!selectedHypoId;
    return ready;
  }, [stage, ready, selectedTopicId, selectedHypoId]);

  const goNext = useCallback(() => {
    setStage((s) => {
      const ns = Math.min(researchStages.length - 1, s + 1);
      setMaxReached((m) => Math.max(m, ns));
      return ns;
    });
  }, []);
  const goPrev = useCallback(() => setStage((s) => Math.max(0, s - 1)), []);
  const jumpTo = useCallback((i: number) => setStage((s) => (i <= maxReached ? i : s)), [maxReached]);

  const stageKey = researchStages[stage].key;
  const isLast = stage === researchStages.length - 1;

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <LabFlowStyles />

      {/* 상단 바 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> 연구실
        </button>
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary">
            <FlaskConical className="size-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm tracking-tight">AI 공동연구 세션</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Autonomous Research · 6 Stages</div>
          </div>
        </div>
        <span className="lab-blink ml-auto inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-destructive">
          <span className="size-1.5 rounded-full bg-destructive" /> Live
        </span>
      </div>

      {/* 스테퍼 */}
      <Stepper stage={stage} maxReached={maxReached} onJump={jumpTo} />

      {/* 단계 콘텐츠 */}
      <div className="relative mt-5 flex-1">
        <div key={stage} className="lab-fade">
          {stageKey === "topic" && (
            <StageTopic
              run={maxReached === 0 || stage === 0}
              selectedId={selectedTopicId}
              onSelect={setSelectedTopicId}
              onReady={onReady}
              onOpenAgent={onOpenAgent}
            />
          )}
          {stageKey === "literature" && (
            <StageLiterature topic={selectedTopic} tokenMap={tokenMap} onReady={onReady} onOpenAgent={onOpenAgent} />
          )}
          {stageKey === "ideation" && (
            <StageHypothesis
              topic={selectedTopic}
              selectedId={selectedHypoId}
              onSelect={setSelectedHypoId}
              onReady={onReady}
              onOpenAgent={onOpenAgent}
            />
          )}
          {stageKey === "design" && <StageDesign topic={selectedTopic} hypo={selectedHypo} tokenMap={tokenMap} onReady={onReady} onOpenAgent={onOpenAgent} />}
          {stageKey === "feedback" && <StageFeedback onReady={onReady} />}
          {stageKey === "synthesis" && <StageSynthesis topic={selectedTopic} tokenMap={tokenMap} onReady={onReady} />}
        </div>
      </div>

      {/* 하단 내비게이션 */}
      <div className="sticky bottom-0 mt-6 flex items-center gap-3 border-t border-border bg-background/85 py-3 backdrop-blur">
        <button
          onClick={goPrev}
          disabled={stage === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors enabled:hover:border-primary/40 disabled:opacity-40"
        >
          <ArrowLeft className="size-4" /> 이전
        </button>

        <div className="mx-auto flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">단계</span>
          <span className="tabular-nums text-foreground">{String(stage + 1).padStart(2, "0")}</span>
          <span>/ 06 ·</span>
          <span>{researchStages[stage].label}</span>
        </div>

        {isLast ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-signal/50 bg-signal/15 px-4 py-2 text-sm text-signal transition-colors hover:bg-signal/25"
          >
            <Check className="size-4" /> 세션 종료
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={!canNext}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-all",
              canNext ? "bg-primary text-primary-foreground hover:opacity-90" : "cursor-not-allowed border border-border bg-card text-muted-foreground opacity-60",
            )}
          >
            {stage === 0 && !selectedTopicId ? "주제를 선택하세요" : stage === 2 && !selectedHypoId ? "가설을 선택하세요" : "다음 단계"}
            <ArrowRight className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 스테퍼
 * ────────────────────────────────────────────────────────────────────────── */

function Stepper({ stage, maxReached, onJump }: { stage: number; maxReached: number; onJump: (i: number) => void }) {
  return (
    <div className="mt-5 rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center">
        {researchStages.map((s, i) => {
          const Icon = stageIconMap[s.key];
          const done = i < stage;
          const current = i === stage;
          const reachable = i <= maxReached;
          return (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <button
                onClick={() => onJump(i)}
                disabled={!reachable}
                className={cn("group flex items-center gap-2", reachable ? "cursor-pointer" : "cursor-not-allowed")}
              >
                <span
                  className={cn(
                    "relative grid size-9 shrink-0 place-items-center rounded-xl border transition-colors",
                    current
                      ? "border-primary bg-primary/15 text-primary"
                      : done
                        ? "border-signal/50 bg-signal/15 text-signal"
                        : reachable
                          ? "border-border bg-background/60 text-muted-foreground group-hover:text-foreground"
                          : "border-border bg-background/40 text-muted-foreground/50",
                  )}
                >
                  {done ? <CheckCircle2 className="size-5" /> : <Icon className="size-[18px]" />}
                  {current && <span className="absolute inset-0 rounded-xl ring-2 ring-primary/40 lab-ring" />}
                </span>
                <div className="hidden text-left md:block">
                  <div className={cn("text-[13px] leading-tight", current ? "text-foreground" : "text-muted-foreground")}>{s.label}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/70">
                    {String(i + 1).padStart(2, "0")} · {s.sub}
                  </div>
                </div>
              </button>
              {i < researchStages.length - 1 && (
                <div className="mx-2 hidden h-px flex-1 overflow-hidden bg-border sm:block">
                  <div className={cn("h-full transition-all duration-500", done ? "w-full bg-signal/60" : "w-0")} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 1단계 — 주제 탐색 & 큐레이션
 * ────────────────────────────────────────────────────────────────────────── */

function StageTopic({
  run,
  selectedId,
  onSelect,
  onReady,
  onOpenAgent,
}: {
  run: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReady: () => void;
  onOpenAgent: (id: string) => void;
}) {
  // 1) 리드 에이전트 탐색 단상 스트리밍 → 2) '후보군 생성하기' 버튼 → 3) 큐레이션 → 후보 4개 노출.
  const shown = useReveal(topicExploration.length, 520, run);
  const explored = shown >= topicExploration.length;
  // 재방문(!run)이거나 이미 주제를 고른 경우엔 버튼 없이 바로 후보 노출.
  const [curated, setCurated] = useState(!run || !!selectedId);
  const [generating, setGenerating] = useState(false);
  const genTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generate = useCallback(() => {
    setGenerating(true);
    genTimer.current = setTimeout(() => {
      setCurated(true);
      setGenerating(false);
    }, 900);
  }, []);

  useEffect(() => () => { if (genTimer.current) clearTimeout(genTimer.current); }, []);

  useEffect(() => {
    if (curated) onReady();
  }, [curated, onReady]);

  const leadIds = ["a-forge", "a-prism", "a-nexus", "a-canvas", "a-bastion"];

  return (
    <div className="space-y-6">
      <StageHeading
        icon={Target}
        kicker="STAGE 01 · 주제 정의"
        title="에이전트들이 연구 주제를 탐색합니다"
        desc="각 프로젝트의 담당 에이전트가 후보 주제를 발산하면, 오케스트레이터가 중복을 제거하고 참신성·실현성으로 큐레이션해 4개로 좁힙니다."
        right={<ActiveAgents ids={leadIds} label={explored ? "탐색 완료" : "주제 탐색 중"} busy={!explored} />}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* 좌: 탐색 스트림 */}
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <Search className="size-3.5" /> 에이전트 탐색 스트림
          </div>
          <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
            {topicExploration.slice(0, shown).map((f, i) => {
              const a = getAgent(f.agentId)!;
              return (
                <div key={i} className="lab-rise flex gap-2.5 rounded-lg border border-transparent bg-background/40 p-2.5">
                  <button onClick={() => onOpenAgent(a.id)}>
                    <AgentAvatar agent={a} size={26} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px]" style={{ color: a.accent }}>
                      {a.codename}
                    </div>
                    <p className="text-sm leading-snug text-foreground/90">{f.text}</p>
                  </div>
                </div>
              );
            })}
            {!explored && (
              <div className="flex items-center gap-2 px-1 py-1 font-mono text-[11px] text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> 탐색 중…
              </div>
            )}
            {explored && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px]",
                  curated ? "border-signal/40 bg-signal/10 text-signal" : "border-primary/40 bg-primary/10 text-primary",
                )}
              >
                {curated ? <Check className="size-3.5" /> : generating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                <AgentAvatar agent={getAgent("a-atlas")!} size={18} showRing={false} />
                {curated
                  ? "오케스트레이터 큐레이션 완료 · 후보 4개"
                  : generating
                    ? "SRNote 오케스트레이터가 큐레이션 중…"
                    : "탐색 완료 · 후보군 생성을 기다리는 중"}
              </div>
            )}
          </div>
        </div>

        {/* 우: 후보 4개 */}
        <div className="lg:col-span-3">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> 큐레이션된 주제 후보 — 하나를 선택하세요
          </div>
          {curated ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {candidateTopics.map((t, i) => (
                <TopicCandidateCard key={t.id} topic={t} index={i} selected={selectedId === t.id} onSelect={() => onSelect(t.id)} onOpenAgent={onOpenAgent} />
              ))}
            </div>
          ) : generating ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card/50" />
              ))}
            </div>
          ) : (
            <GenerateGate
              icon={Sparkles}
              ready={explored}
              onGenerate={generate}
              label="후보군 생성하기"
              waitingLabel="에이전트 탐색을 기다리는 중…"
              hint="오케스트레이터가 탐색 결과를 큐레이션해 참신성·실현성으로 4개 후보를 추립니다."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-12 shrink-0 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="w-7 shrink-0 text-right font-mono text-[10px] tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function TopicCandidateCard({
  topic,
  index,
  selected,
  onSelect,
  onOpenAgent,
}: {
  topic: CandidateTopic;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onOpenAgent: (id: string) => void;
}) {
  const lead = getAgent(topic.leadAgentId)!;
  return (
    <button
      onClick={onSelect}
      style={{ animationDelay: `${index * 90}ms` }}
      className={cn(
        "lab-rise group relative overflow-hidden rounded-xl border bg-card p-3.5 text-left transition-all",
        selected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/40",
      )}
    >
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: lead.accent }} />
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">후보 {String(index + 1).padStart(2, "0")}</span>
        {topic.recommended && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-primary">
            <Star className="size-2.5" /> 추천
          </span>
        )}
        <span className={cn("ml-auto grid size-5 place-items-center rounded-full border transition-colors", selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent")}>
          <Check className="size-3" />
        </span>
      </div>

      <div className="mt-1.5 tracking-tight">{topic.title}</div>
      <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{topic.angle}</p>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {topic.keywords.slice(0, 3).map((k) => (
          <span key={k} className="rounded-md bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {k}
          </span>
        ))}
        {topic.keywords.length > 3 && <span className="px-1 font-mono text-[10px] text-muted-foreground">+{topic.keywords.length - 3}</span>}
      </div>

      <div className="mt-3 space-y-1">
        <MetricBar label="참신성" value={topic.novelty} color="var(--primary)" />
        <MetricBar label="실현성" value={topic.feasibility} color="var(--signal)" />
        <MetricBar label="임팩트" value={topic.impact} color="var(--warn)" />
      </div>

      <div className="mt-3 flex items-center -space-x-1.5">
        <span onClick={(e) => { e.stopPropagation(); onOpenAgent(lead.id); }} title={`리드 · ${lead.codename}`}>
          <AgentAvatar agent={lead} size={22} />
        </span>
        {topic.contributorIds.map((id) => {
          const a = getAgent(id)!;
          return (
            <span key={id} onClick={(e) => { e.stopPropagation(); onOpenAgent(id); }} title={a.codename}>
              <AgentAvatar agent={a} size={18} showRing={false} />
            </span>
          );
        })}
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 2단계 — 논문 탐색 & 지식 그래프
 * ────────────────────────────────────────────────────────────────────────── */

const GW = 820;
const GH = 470;
const GCX = 410;
const GCY = 222;
const GR1 = 130;
const GR2 = 200;

const nodeGlyph: Record<string, string> = {
  topic: "🎯",
  keyword: "🔑",
  concept: "🧩",
  paper: "📄",
  dataset: "🗂",
  metric: "📊",
};
const nodeColor: Record<string, string> = {
  topic: "var(--primary)",
  keyword: "var(--primary)",
  concept: "oklch(0.72 0.18 350)",
  paper: "oklch(0.74 0.13 222)",
  dataset: "var(--warn)",
  metric: "var(--signal)",
};

function useGraphLayout() {
  return useMemo(() => {
    const byLayer: Record<number, typeof graphNodes> = { 0: [], 1: [], 2: [] };
    graphNodes.forEach((n) => byLayer[n.layer].push(n));
    const pos: Record<string, { x: number; y: number }> = {};
    pos[byLayer[0][0].id] = { x: GCX, y: GCY };
    ([1, 2] as const).forEach((layer) => {
      const arr = byLayer[layer];
      const R = layer === 1 ? GR1 : GR2;
      const offset = layer === 1 ? -90 : -90 + 360 / arr.length / 2;
      arr.forEach((n, i) => {
        const ang = ((offset + (360 / arr.length) * i) * Math.PI) / 180;
        pos[n.id] = { x: GCX + R * Math.cos(ang), y: GCY + R * Math.sin(ang) };
      });
    });
    return pos;
  }, []);
}

function KnowledgeGraph({ tick, tokenMap }: { tick: number; tokenMap: Record<string, string> }) {
  const pos = useGraphLayout();
  const labelOf = (n: (typeof graphNodes)[number]) => fill(n.label, tokenMap);

  return (
    <svg viewBox={`0 0 ${GW} ${GH}`} className="w-full" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="kg-topic" cx="35%" cy="30%">
          <stop offset="0%" stopColor="color-mix(in oklab, var(--primary) 70%, var(--card))" />
          <stop offset="100%" stopColor="color-mix(in oklab, var(--primary) 22%, var(--card))" />
        </radialGradient>
      </defs>

      {/* 엣지 */}
      {graphEdges.map((e, i) => {
        if (e.reveal > tick) return null;
        const a = pos[e.from];
        const b = pos[e.to];
        if (!a || !b) return null;
        const color = graphRelMeta[e.rel].color;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const cx = mx + (mx - GCX) * 0.12;
        const cy = my + (my - GCY) * 0.12;
        const d = `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
        const semantic = e.rel === "supports" || e.rel === "refutes" || e.rel === "derives" || e.rel === "measures";
        return (
          <g key={`e-${i}`} className="lab-edge-in">
            <path id={`kg-edge-${i}`} d={d} fill="none" stroke={color} strokeWidth={1.3} style={{ opacity: 0.32 }} />
            <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="2 10" className="lab-dash" style={{ opacity: 0.7 }} />
            <circle r={2.6} style={{ fill: color, filter: `drop-shadow(0 0 4px ${color})` }}>
              <animateMotion dur={`${2.4 + (i % 4) * 0.5}s`} repeatCount="indefinite">
                <mpath href={`#kg-edge-${i}`} />
              </animateMotion>
            </circle>
            {semantic && (
              <text x={cx} y={cy} dy={-3} textAnchor="middle" className="lab-edge-label" style={{ fill: color, fontSize: 9 }}>
                {graphRelMeta[e.rel].label}
              </text>
            )}
          </g>
        );
      })}

      {/* 노드 */}
      {graphNodes.map((n) => {
        if (n.reveal > tick) return null;
        const p = pos[n.id];
        if (!p) return null;
        const isTopic = n.type === "topic";
        const r = isTopic ? 30 : n.layer === 1 ? 17 : 13;
        const color = nodeColor[n.type];
        const outward = n.layer === 2 ? (p.x >= GCX ? 1 : -1) : 0;
        const labelX = n.layer === 2 ? p.x + outward * (r + 6) : p.x;
        const labelY = isTopic ? p.y + r + 16 : n.layer === 1 ? p.y + r + 12 : p.y + 3;
        const anchor = n.layer === 2 ? (outward > 0 ? "start" : "end") : "middle";
        return (
          <g key={`n-${n.id}`} className="lab-node-in">
            {isTopic && <circle cx={p.x} cy={p.y} r={r + 12} fill="color-mix(in oklab, var(--primary) 18%, transparent)" className="lab-halo" style={{ transformBox: "fill-box", transformOrigin: "center" }} />}
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={isTopic ? "url(#kg-topic)" : `color-mix(in oklab, ${color} 20%, var(--card))`}
              stroke={color}
              strokeWidth={isTopic ? 1.6 : 1.2}
              style={{ filter: isTopic ? "drop-shadow(0 0 10px color-mix(in oklab, var(--primary) 40%, transparent))" : undefined }}
            />
            <text x={p.x} y={p.y} dy={isTopic ? 5 : 4} textAnchor="middle" style={{ fontSize: isTopic ? 22 : n.layer === 1 ? 14 : 11 }}>
              {nodeGlyph[n.type]}
            </text>
            {isTopic ? (
              <foreignObject x={p.x - 95} y={labelY - 10} width={190} height={40} style={{ overflow: "visible" }}>
                <div className="text-center text-[12px] font-medium leading-tight text-foreground">{labelOf(n)}</div>
              </foreignObject>
            ) : (
              <text x={labelX} y={labelY} textAnchor={anchor} style={{ fontSize: 10.5, fill: "var(--foreground)" }}>
                {labelOf(n).length > 20 ? labelOf(n).slice(0, 19) + "…" : labelOf(n)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function StageLiterature({
  topic,
  tokenMap,
  onReady,
  onOpenAgent,
}: {
  topic: CandidateTopic;
  tokenMap: Record<string, string>;
  onReady: () => void;
  onOpenAgent: (id: string) => void;
}) {
  const tick = useReveal(9, 680, true);
  useEffect(() => {
    if (tick >= 8) onReady();
  }, [tick, onReady]);

  // 키워드별 서브 에이전트.
  const kwAgents = topic.keywords.map((kw, i) => ({ kw, agent: getAgent(keywordAgentPool[i % keywordAgentPool.length])! }));
  // 키워드별 논문 + 등장 reveal.
  const paperReveal = (nodeId: string) => graphNodes.find((n) => n.id === nodeId)?.reveal ?? 99;
  const kwDone = (i: number) => {
    const papers = flowPapers.filter((p) => p.kwIndex === i);
    if (papers.length === 0) return tick >= 4;
    return tick >= Math.max(...papers.map((p) => paperReveal(p.nodeId)));
  };
  const visiblePapers = flowPapers.filter((p) => paperReveal(p.nodeId) <= tick).sort((a, b) => b.relevance - a.relevance);

  return (
    <div className="space-y-5">
      <StageHeading
        icon={FileSearch}
        kicker="STAGE 02 · 논문 탐색 · 지식 그래프"
        title="키워드별 서브 에이전트가 논문을 모아 그래프로 엮습니다"
        desc="선택한 주제의 키워드마다 검색 서브 에이전트를 띄워 선행 연구를 수집하고, 문서 사이의 인용·지지·반박 관계를 지식 그래프로 구조화합니다."
        right={<ActiveAgents ids={kwAgents.map((k) => k.agent.id)} label={tick >= 8 ? "그래프 완성" : "탐색·연결 중"} busy={tick < 8} />}
      />

      {/* 키워드 에이전트 스폰 라인 */}
      <div className="flex flex-wrap gap-2">
        {kwAgents.map(({ kw, agent }, i) => {
          const done = kwDone(i);
          const found = flowPapers.filter((p) => p.kwIndex === i && paperReveal(p.nodeId) <= tick).length;
          return (
            <div key={i} className="lab-rise flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5" style={{ animationDelay: `${i * 80}ms` }}>
              <button onClick={() => onOpenAgent(agent.id)}>
                <AgentAvatar agent={agent} size={22} live />
              </button>
              <div className="leading-tight">
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <Search className="size-3 text-muted-foreground" />
                  <span className="text-foreground">{kw}</span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                  {done ? (
                    <span className="text-signal">완료 · {found}편</span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="size-2.5 animate-spin" /> 검색 중
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* 지식 그래프 */}
        <div className="xl:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-3">
            <div className="mb-1 flex items-center gap-2">
              <Network className="size-4 text-primary" />
              <span className="text-sm">지식 그래프</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {graphNodes.filter((n) => n.reveal <= tick).length} 노드 · {graphEdges.filter((e) => e.reveal <= tick).length} 관계
              </span>
              <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
                {(Object.keys(graphRelMeta) as GraphRel[]).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                    <span className="h-0.5 w-3 rounded-full" style={{ background: graphRelMeta[k].color }} />
                    {graphRelMeta[k].label}
                  </span>
                ))}
              </span>
            </div>
            <KnowledgeGraph tick={tick} tokenMap={tokenMap} />
          </div>
        </div>

        {/* 논문 스트림 */}
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <Quote className="size-3.5" style={{ color: nodeColor.paper }} /> 수집된 논문 ({visiblePapers.length})
          </div>
          <div className="space-y-2">
            {visiblePapers.map((p) => {
              const a = kwAgents[p.kwIndex]?.agent ?? getAgent("a-atom")!;
              return (
                <div key={p.id} className="lab-rise flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${nodeColor.paper} 16%, transparent)`, color: nodeColor.paper }}>
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[13px]">{p.title}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{p.venue}</div>
                  </div>
                  <button onClick={() => onOpenAgent(a.id)} title={a.codename} className="shrink-0">
                    <AgentAvatar agent={a} size={20} showRing={false} />
                  </button>
                  <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums" style={{ color: nodeColor.paper }}>
                    {p.relevance}%
                  </span>
                </div>
              );
            })}
            {visiblePapers.length === 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3 font-mono text-[11px] text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> 논문 수집 대기 중…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 3단계 — 가설 구체화 & 선택
 * ────────────────────────────────────────────────────────────────────────── */

function StageHypothesis({
  topic,
  selectedId,
  onSelect,
  onReady,
  onOpenAgent,
}: {
  topic: CandidateTopic;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReady: () => void;
  onOpenAgent: (id: string) => void;
}) {
  const shown = useReveal(hypothesisExploration.length, 620, true);
  const explored = shown >= hypothesisExploration.length;
  // 이미 가설을 고른 재방문이면 버튼 없이 바로 후보 노출.
  const [refined, setRefined] = useState(!!selectedId);
  const [generating, setGenerating] = useState(false);
  const genTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generate = useCallback(() => {
    setGenerating(true);
    genTimer.current = setTimeout(() => {
      setRefined(true);
      setGenerating(false);
    }, 900);
  }, []);

  useEffect(() => () => { if (genTimer.current) clearTimeout(genTimer.current); }, []);

  useEffect(() => {
    if (refined) onReady();
  }, [refined, onReady]);

  const ideaAgents = Array.from(new Set(topic.hypotheses.map((h) => h.byAgentId)));

  return (
    <div className="space-y-6">
      <StageHeading
        icon={Lightbulb}
        kicker="STAGE 03 · 가설·아이디어"
        title="연구실 에이전트들이 가설을 구체화합니다"
        desc="여러 전용 에이전트가 관측을 반증 가능한 명제로 좁히고, 교란 변수와 검정력을 사전 점검해 4개의 후보 가설을 제시합니다."
        right={<ActiveAgents ids={ideaAgents} label={refined ? "가설 도출 완료" : "가설 발산 중"} busy={!refined} />}
      />

      {/* 선택 주제 컨텍스트 */}
      <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.06] px-3 py-2">
        <Target className="size-4 text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">선택 주제</span>
        <span className="text-sm">{topic.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* 탐색 스트림 */}
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <BrainCircuit className="size-3.5" /> 가설 정련 로그
          </div>
          <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
            {hypothesisExploration.slice(0, shown).map((f, i) => {
              const a = getAgent(f.agentId)!;
              return (
                <div key={i} className="lab-rise flex gap-2.5 rounded-lg bg-background/40 p-2.5">
                  <AgentAvatar agent={a} size={24} />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px]" style={{ color: a.accent }}>{a.codename}</div>
                    <p className="text-sm leading-snug text-foreground/90">{f.text}</p>
                  </div>
                </div>
              );
            })}
            {!refined && (
              <div className="flex items-center gap-2 px-1 font-mono text-[11px] text-muted-foreground">
                {explored && !generating ? (
                  <>
                    <Check className="size-3.5 text-signal" /> 발산 완료 · 후보 생성을 기다리는 중
                  </>
                ) : (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> {explored ? "후보 정리 중…" : "가설 발산 중…"}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 후보 가설 4개 */}
        <div className="lg:col-span-3">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> 후보 가설 — 검증할 하나를 선택하세요
          </div>
          {refined ? (
            <div className="space-y-2.5">
              {topic.hypotheses.map((h, i) => (
                <HypoCard key={h.id} hypo={h} index={i} selected={selectedId === h.id} onSelect={() => onSelect(h.id)} onOpenAgent={onOpenAgent} />
              ))}
            </div>
          ) : generating ? (
            <div className="space-y-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card/50" />
              ))}
            </div>
          ) : (
            <GenerateGate
              icon={Sparkles}
              ready={explored}
              onGenerate={generate}
              label="후보군 생성하기"
              waitingLabel="가설 발산을 기다리는 중…"
              hint="에이전트들이 발산한 관측을 반증 가능한 후보 가설로 정리합니다."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function HypoCard({ hypo, index, selected, onSelect, onOpenAgent }: { hypo: HypothesisCandidate; index: number; selected: boolean; onSelect: () => void; onOpenAgent: (id: string) => void }) {
  const a = getAgent(hypo.byAgentId)!;
  return (
    <button
      onClick={onSelect}
      style={{ animationDelay: `${index * 90}ms` }}
      className={cn("lab-rise relative block w-full overflow-hidden rounded-xl border bg-card p-3.5 text-left transition-all", selected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/40")}
    >
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors", selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent")}>
          <Check className="size-3" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">H{index + 1}</span>
            {hypo.recommended && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-primary">
                <Star className="size-2.5" /> 추천
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-snug text-foreground">{hypo.statement}</p>
          <div className="mt-1 text-[12px] text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wide">근거</span> · {hypo.basis}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span onClick={(e) => { e.stopPropagation(); onOpenAgent(a.id); }} className="inline-flex items-center gap-1.5" title={a.codename}>
              <AgentAvatar agent={a} size={18} showRing={false} />
              <span className="font-mono text-[11px]" style={{ color: a.accent }}>{a.codename}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
              <span className="text-primary">참신성 {hypo.novelty}</span>
              <span className="text-signal">실현성 {hypo.feasibility}</span>
              <span className="text-warn">검증성 {hypo.testability}</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 4단계 — 실험 설계
 * ────────────────────────────────────────────────────────────────────────── */

function StageDesign({
  hypo,
  tokenMap,
  onReady,
  onOpenAgent,
}: {
  topic: CandidateTopic;
  hypo: HypothesisCandidate;
  tokenMap: Record<string, string>;
  onReady: () => void;
  onOpenAgent: (id: string) => void;
}) {
  const tick = useReveal(designSections.length + 1, 1050, true);
  const done = tick > designSections.length;
  useEffect(() => {
    if (done) onReady();
  }, [done, onReady]);

  return (
    <div className="space-y-5">
      <StageHeading
        icon={FlaskConical}
        kicker="STAGE 04 · 실험 설계"
        title="실험 설계 에이전트 그룹이 세부 프로토콜을 작성합니다"
        desc="확정된 가설을 변수·조건·표본·지표·타당도 위협으로 분해해, 각 설계 에이전트가 자신의 섹션을 동시에 채웁니다."
        right={<ActiveAgents ids={designSections.map((d) => d.agentId)} label={done ? "설계 완료" : "설계 작성 중"} busy={!done} />}
      />

      {/* 확정 가설 */}
      <div className="flex items-start gap-2 rounded-xl border border-signal/30 bg-signal/[0.06] px-3 py-2.5">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-signal" />
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-signal">확정 가설</span>
          <p className="text-sm">{hypo.statement}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {designSections.map((sec, i) => {
          const visible = i < tick;
          const writing = i === tick - 1 && !done;
          const a = getAgent(sec.agentId)!;
          if (!visible) {
            return <div key={sec.id} className="h-40 rounded-xl border border-dashed border-border bg-card/30" />;
          }
          return (
            <div key={sec.id} className="lab-rise overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <button onClick={() => onOpenAgent(a.id)}>
                  <AgentAvatar agent={a} size={24} live={writing} />
                </button>
                <div className="leading-tight">
                  <div className="text-[13px]">{sec.title}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wide" style={{ color: a.accent }}>{a.codename}</div>
                </div>
                <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <ul className="space-y-1.5 p-3">
                {sec.lines.map((ln, li) => (
                  <li key={li} className="lab-rise flex gap-1.5 text-[12.5px] leading-snug text-foreground/90" style={{ animationDelay: `${li * 160}ms` }}>
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/70" />
                    <span>{fill(ln, tokenMap)}</span>
                  </li>
                ))}
                {writing && (
                  <li className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" /> 작성 중…
                  </li>
                )}
              </ul>
            </div>
          );
        })}

        {done && (
          <div className="lab-rise flex flex-col items-center justify-center gap-2 rounded-xl border border-signal/40 bg-signal/[0.07] p-4 text-center">
            <CheckCircle2 className="size-7 text-signal" />
            <div className="text-sm">실험 설계 동결</div>
            <p className="font-mono text-[11px] text-muted-foreground">5개 섹션 · 교차 검토 준비 완료</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 5단계 — 교수 그룹 상호 피드백 (원형)
 * ────────────────────────────────────────────────────────────────────────── */

const FW = 600;
const FH = 430;
const FCX = 300;
const FCY = 200;
const FR = 150;

function ProfAvatar({ emoji, accent, size = 46, speaking = false }: { emoji: string; accent: string; size?: number; speaking?: boolean }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-2xl"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${accent} 32%, transparent), color-mix(in oklab, ${accent} 10%, transparent))`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 50%, transparent)`,
      }}
    >
      {speaking && <span className="absolute inset-0 animate-ping rounded-2xl opacity-50" style={{ background: `color-mix(in oklab, ${accent} 34%, transparent)` }} />}
      <span className="relative">{emoji}</span>
    </span>
  );
}

function StageFeedback({ onReady }: { onReady: () => void }) {
  const [log, setLog] = useState<{ key: number; ev: (typeof feedbackFeed)[number] }[]>([]);
  const [count, setCount] = useState(0);
  const counter = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      const ev = feedbackFeed[counter.current % feedbackFeed.length];
      counter.current += 1;
      const key = counter.current;
      setLog((prev) => [...prev.slice(-6), { key, ev }]);
      setCount((c) => c + 1);
    }, 1850);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (count >= 3) onReady();
  }, [count, onReady]);

  const profPos = useMemo(
    () =>
      professors.map((p, i) => {
        const ang = ((-90 + (360 / professors.length) * i) * Math.PI) / 180;
        return { id: p.id, x: FCX + FR * Math.cos(ang), y: FCY + FR * Math.sin(ang) };
      }),
    [],
  );
  const posById = useMemo(() => Object.fromEntries(profPos.map((p) => [p.id, p])), [profPos]);
  const pairs = useMemo(() => {
    const out: [string, string][] = [];
    for (let i = 0; i < professors.length; i++) for (let j = i + 1; j < professors.length; j++) out.push([professors[i].id, professors[j].id]);
    return out;
  }, []);

  const last = log[log.length - 1];
  const current = last?.ev;
  const a = current ? posById[current.from] : null;
  const b = current ? posById[current.to] : null;
  const curColor = current ? feedbackKindMeta[current.kind].color : "var(--primary)";
  const consensus = Math.min(96, 50 + count * 6);

  return (
    <div className="space-y-5">
      <StageHeading
        icon={MessageSquareQuote}
        kicker="STAGE 05 · 상호 피드백"
        title="교수 그룹 5인이 원형으로 둘러앉아 교차 검토합니다"
        desc="방법론·통계·도메인·재현성·비판 관점의 검토 에이전트가 서로 질문하고 반박하며, 합의에 이를 때까지 설계를 다듬습니다. 엣지가 펄스하면 메시지가 오가는 것입니다."
        right={
          <span className="lab-blink inline-flex items-center gap-1.5 rounded-full bg-signal/15 px-2.5 py-1 font-mono text-[11px] text-signal">
            <Radio className="size-3.5" /> 실시간 토론
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 원형 토론 그래프 */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-3">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 20%, transparent), transparent 70%)" }}
          />
          <svg viewBox={`0 0 ${FW} ${FH}`} className="relative w-full" style={{ overflow: "visible" }}>
            {/* 정적 엣지 (전체 그물망) */}
            {pairs.map(([f, t], i) => {
              const pf = posById[f];
              const pt = posById[t];
              const isActive = current && ((current.from === f && current.to === t) || (current.from === t && current.to === f));
              return (
                <line
                  key={`p-${i}`}
                  x1={pf.x}
                  y1={pf.y}
                  x2={pt.x}
                  y2={pt.y}
                  stroke={isActive ? curColor : "var(--border)"}
                  strokeWidth={isActive ? 2 : 1}
                  style={{ opacity: isActive ? 0.85 : 0.4, transition: "stroke 0.3s, opacity 0.3s" }}
                />
              );
            })}

            {/* 활성 엣지 펄스 */}
            {a && b && (
              <g key={last!.key}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={curColor} strokeWidth={2.4} strokeLinecap="round" className="lab-edge-pulse" style={{ filter: `drop-shadow(0 0 6px ${curColor})` }} />
                <circle r={4.5} style={{ fill: curColor, filter: `drop-shadow(0 0 6px ${curColor})` }}>
                  <animate attributeName="cx" from={a.x} to={b.x} dur="1s" begin="0s" fill="freeze" />
                  <animate attributeName="cy" from={a.y} to={b.y} dur="1s" begin="0s" fill="freeze" />
                </circle>
              </g>
            )}

            {/* 중심 합의 코어 */}
            <circle cx={FCX} cy={FCY} r={34} fill="color-mix(in oklab, var(--primary) 10%, var(--card))" stroke="color-mix(in oklab, var(--primary) 40%, transparent)" strokeWidth={1} strokeDasharray="3 7" className="lab-spin" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
            <text x={FCX} y={FCY - 2} textAnchor="middle" style={{ fontSize: 17, fontWeight: 600, fill: "var(--foreground)" }}>
              {consensus}%
            </text>
            <text x={FCX} y={FCY + 12} textAnchor="middle" style={{ fontSize: 8, letterSpacing: 1, fill: "var(--muted-foreground)" }}>
              합의율
            </text>

            {/* 교수 노드 */}
            {professors.map((p) => {
              const pos = posById[p.id];
              const speaking = current?.from === p.id;
              const targeted = current?.to === p.id;
              return (
                <foreignObject key={p.id} x={pos.x - 46} y={pos.y - 38} width={92} height={92} style={{ overflow: "visible" }}>
                  <div className="flex flex-col items-center">
                    <div style={{ transform: targeted ? "scale(1.08)" : undefined, transition: "transform 0.3s" }}>
                      <ProfAvatar emoji={p.emoji} accent={p.accent} size={46} speaking={speaking} />
                    </div>
                    <div className="mt-1 rounded-md bg-card/80 px-1.5 font-mono text-[9px] leading-tight backdrop-blur" style={{ color: p.accent }}>
                      {p.codename}
                    </div>
                    <div className="font-mono text-[8px] text-muted-foreground">{p.name}</div>
                  </div>
                </foreignObject>
              );
            })}
          </svg>

          {/* 종류 범례 */}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {(Object.keys(feedbackKindMeta) as FeedbackKind[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                <span className="size-1.5 rounded-full" style={{ background: feedbackKindMeta[k].color }} />
                {feedbackKindMeta[k].label}
              </span>
            ))}
          </div>
        </div>

        {/* 실시간 로그 */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <Radio className="size-3.5 text-signal" /> 토론 로그
            <span className="lab-blink ml-auto inline-flex items-center gap-1 rounded-full bg-signal/15 px-2 py-0.5 text-signal">
              <span className="size-1.5 rounded-full bg-signal" /> LIVE
            </span>
          </div>
          <div className="flex-1 space-y-2 overflow-hidden rounded-2xl border border-border bg-card p-3">
            {log.map(({ key, ev }) => {
              const pf = professors.find((x) => x.id === ev.from)!;
              const pt = professors.find((x) => x.id === ev.to)!;
              const meta = feedbackKindMeta[ev.kind];
              const KIcon = meta.icon;
              return (
                <div key={key} className={cn("lab-rise flex gap-2.5 rounded-lg border p-2.5", ev.resolved ? "border-signal/40 bg-signal/[0.07]" : "border-transparent bg-background/40")}>
                  <ProfAvatar emoji={pf.emoji} accent={pf.accent} size={26} />
                  <div className="min-w-0 flex-1 leading-snug">
                    <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
                      <span style={{ color: pf.accent }}>{pf.codename}</span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <span style={{ color: pt.accent }}>{pt.codename}</span>
                      <span className="ml-1 inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px]" style={{ background: `color-mix(in oklab, ${meta.color} 16%, transparent)`, color: meta.color }}>
                        <KIcon className="size-2.5" />
                        {meta.label}
                      </span>
                      {ev.resolved && <span className="inline-flex items-center gap-1 rounded bg-signal/20 px-1.5 py-px text-[10px] text-signal"><Check className="size-2.5" /> 합의</span>}
                    </div>
                    <p className="mt-0.5 text-[13px] text-foreground/90">{ev.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 6단계 — 지식 합성 & 논문 초안
 * ────────────────────────────────────────────────────────────────────────── */

function StageSynthesis({ topic, tokenMap, onReady }: { topic: CandidateTopic; tokenMap: Record<string, string>; onReady: () => void }) {
  const chunkN = useReveal(contextChunks.length, 340, true);
  const chunksDone = chunkN >= contextChunks.length;
  const [compacted, setCompacted] = useState(false);
  // 압축 완료 후 '초안 생성하기' 버튼을 눌러야 초안 작성으로 넘어감.
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    if (chunksDone && !compacted) {
      const t = setTimeout(() => setCompacted(true), 1400);
      return () => clearTimeout(t);
    }
  }, [chunksDone, compacted]);

  return (
    <div className="space-y-5">
      <StageHeading
        icon={BrainCircuit}
        kicker="STAGE 06 · 지식 합성"
        title="모든 컨텍스트를 압축해 논문 초안으로 합성합니다"
        desc="주제·논문·그래프·가설·실험설계·피드백을 하나의 컨텍스트로 압축하고, 합성 에이전트가 최종 지식으로 엮어 논문 초안을 작성합니다."
        right={<ActiveAgents ids={["a-atlas", "a-weave"]} label={drafting ? "초안 합성" : compacted ? "압축 완료" : "컨텍스트 압축"} busy={drafting || !compacted} />}
      />

      {/* 압축 단계 */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {contextChunks.slice(0, chunkN).map((c, i) => (
            <div
              key={c.id}
              className={cn("lab-rise inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2.5 py-1.5", compacted && "lab-collapse")}
              style={{ animationDelay: compacted ? `${i * 70}ms` : undefined }}
            >
              <Layers className="size-3.5 text-primary" />
              <span className="text-[12px]">{c.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{c.count}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 font-mono text-[11px]">
          {!compacted ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> 컨텍스트 압축 중… {Math.round((chunkN / contextChunks.length) * 100)}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-signal">
              <Check className="size-3.5" /> 6개 컨텍스트 → 1 합성 코어 · 압축률 8.4×
            </span>
          )}
        </div>
      </div>

      {/* 초안 생성 게이트 → 초안 */}
      {drafting ? (
        <DraftWriter topic={topic} tokenMap={tokenMap} onComplete={onReady} />
      ) : (
        <GenerateGate
          icon={FileText}
          ready={compacted}
          onGenerate={() => setDrafting(true)}
          label="초안 생성하기"
          waitingLabel="컨텍스트 압축을 기다리는 중…"
          hint="압축된 합성 코어를 바탕으로 합성 에이전트가 논문 초안을 작성합니다."
        />
      )}
    </div>
  );
}

function DraftWriter({ topic, tokenMap, onComplete }: { topic: CandidateTopic; tokenMap: Record<string, string>; onComplete: () => void }) {
  const n = useReveal(draftSections.length + 1, 1150, true);
  const done = n > draftSections.length;
  const firedRef = useRef(false);

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      onComplete();
      confetti({ particleCount: 90, spread: 80, startVelocity: 40, gravity: 0.9, scalar: 0.9, origin: { x: 0.5, y: 0.5 }, colors: ["#a78bfa", "#34d399", "#fbbf24", "#60a5fa", "#f472b6"] });
    }
  }, [done, onComplete]);

  return (
    <div className="lab-rise overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card to-card">
      {/* 논문 헤더 */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
          <FileText className="size-3.5" /> Working Draft · v0.1
        </div>
        <h3 className="mt-1.5 text-lg leading-snug tracking-tight">{topic.title}: 자율 에이전트 공동연구를 통한 검증 설계</h3>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
          <span>{draftMeta.authorsLabel}</span>
          <span>{draftMeta.venueLabel}</span>
        </div>
      </div>

      {/* 본문 섹션 */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 md:grid-cols-2">
        {draftSections.map((s, i) => {
          const visible = i < n;
          const writing = i === n - 1 && !done;
          if (!visible) return <div key={i} className="h-20 rounded-lg border border-dashed border-border/60 bg-card/20" />;
          return (
            <div key={i} className="lab-rise">
              <div className="font-mono text-[11px] uppercase tracking-widest text-primary">{s.heading}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground/90">
                {fill(s.body, tokenMap)}
                {writing && <span className="lab-caret ml-0.5 inline-block h-3.5 w-0.5 -translate-y-px bg-primary align-middle" />}
              </p>
            </div>
          );
        })}
      </div>

      {/* 완료 배너 */}
      {done && (
        <div className="lab-rise flex flex-wrap items-center gap-3 border-t border-signal/30 bg-signal/[0.06] px-5 py-3">
          <CheckCircle2 className="size-5 text-signal" />
          <div className="text-sm">논문 초안 합성 완료 — 6단계 자율 연구 사이클이 마무리되었습니다.</div>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Star className="size-3.5 text-warn" /> 지식 베이스에 반영 준비됨
          </span>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 키프레임
 * ────────────────────────────────────────────────────────────────────────── */

function LabFlowStyles() {
  return (
    <style>{`
      @keyframes lf-fade { from { opacity:0; transform: translateY(8px) scale(.997);} to { opacity:1; transform:none;} }
      .lab-fade { animation: lf-fade .42s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes lf-rise { from { opacity:0; transform: translateY(7px);} to { opacity:1; transform:none;} }
      .lab-rise { animation: lf-rise .45s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes lf-dash { to { stroke-dashoffset: -120; } }
      .lab-dash { animation: lf-dash 1.5s linear infinite; }
      @keyframes lf-halo { 0%,100% { opacity:.2; transform: scale(1);} 50% { opacity:.45; transform: scale(1.14);} }
      .lab-halo { animation: lf-halo 3s ease-in-out infinite; }
      @keyframes lf-blink { 0%,100% { opacity:1; } 50% { opacity:.35; } }
      .lab-blink { animation: lf-blink 1.8s ease-in-out infinite; }
      @keyframes lf-spin { to { transform: rotate(360deg); } }
      .lab-spin { animation: lf-spin 22s linear infinite; }
      @keyframes lf-ring { 0%,100% { opacity:.5; } 50% { opacity:1; } }
      .lab-ring { animation: lf-ring 1.6s ease-in-out infinite; }
      @keyframes lf-bob { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-2px);} }
      .lab-bob { display:inline-block; animation: lf-bob 1.4s ease-in-out infinite; }
      @keyframes lf-node { from { opacity:0; transform: scale(.6);} to { opacity:1; transform: scale(1);} }
      .lab-node-in { animation: lf-node .5s cubic-bezier(.2,.8,.2,1) both; transform-box: fill-box; transform-origin: center; }
      @keyframes lf-edge { from { opacity:0;} to { opacity:1;} }
      .lab-edge-in { animation: lf-edge .6s ease both; }
      .lab-edge-label { animation: lf-edge .8s ease both; }
      @keyframes lf-pulse { 0% { opacity:.2;} 35% { opacity:1;} 100% { opacity:.55;} }
      .lab-edge-pulse { animation: lf-pulse 1s ease-out; }
      @keyframes lf-caret { 0%,100% { opacity:1;} 50% { opacity:0;} }
      .lab-caret { animation: lf-caret 0.9s step-end infinite; }
      @keyframes lf-collapse { 0% { opacity:1; transform: none;} 60% { opacity:1;} 100% { opacity:.55; transform: scale(.94);} }
      .lab-collapse { animation: lf-collapse .9s ease both; }
      @media (prefers-reduced-motion: reduce) {
        .lab-dash,.lab-halo,.lab-blink,.lab-spin,.lab-ring,.lab-bob,.lab-edge-pulse { animation: none !important; }
      }
    `}</style>
  );
}

