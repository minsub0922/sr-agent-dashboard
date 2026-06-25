import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, Check, Loader2, FolderPlus, FolderCheck, Layers, ArrowRight, Boxes } from "lucide-react";
import type { Note } from "../data";
import { getProject, getAgent } from "../data";
import type { OrganizePlan } from "../inbox-organize";
import { AgentAvatar } from "./agent-bits";
import { cn } from "./ui/utils";

const STEPS = ["분석", "클러스터링", "프로젝트 매칭", "생성·배치", "완료"];

const STATUS: string[] = [
  "미분류 노트를 분석하는 중…",
  "의미 임베딩으로 군집화하는 중…",
  "클러스터를 기존 프로젝트와 대조하는 중…",
  "신규 프로젝트·에이전트를 생성하고 노트를 배치하는 중…",
  "자동 정리가 완료되었습니다.",
];

export function InboxOrganizeFlow({
  plan,
  notes,
  onCommit,
  onClose,
}: {
  plan: OrganizePlan;
  notes: Note[];
  onCommit: () => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const committed = useRef(false);
  const noteMap = useMemo(() => Object.fromEntries(notes.map((n) => [n.id, n])), [notes]);

  // 단계 자동 진행 (마지막 단계는 사용자 확인 대기)
  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 2 ? 1500 : 1150);
    return () => clearTimeout(t);
  }, [step]);

  // 생성·배치 단계에서 1회 커밋
  useEffect(() => {
    if (step >= 3 && !committed.current) {
      committed.current = true;
      onCommit();
    }
  }, [step, onCommit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && step >= STEPS.length - 1 && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onClose]);

  const newAgents = plan.emerging ? 2 : 0;
  const routed = Object.keys(plan.assignments).length;

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/55" onClick={() => step >= STEPS.length - 1 && onClose()} />

      <div className="org-flow relative z-10 flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/50">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-chart-5" />

        {/* 헤더 */}
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <span className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div className="leading-tight">
            <h2 className="tracking-tight">인박스 자동 정리</h2>
            <p className="font-mono text-[11px] text-muted-foreground">ATLAS · 분석 → 클러스터링 → 프로젝트/에이전트 생성</p>
          </div>
          {step >= STEPS.length - 1 && (
            <button onClick={onClose} className="ml-auto grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* 스텝퍼 */}
        <div className="flex items-center gap-1 px-5 pt-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border text-[10px] transition-colors",
                    i < step ? "border-signal bg-signal/20 text-signal" : i === step ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  {i < step ? <Check className="size-3" /> : i + 1}
                </span>
                <span className={cn("font-mono text-[10px] uppercase tracking-wide", i <= step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < step ? "bg-signal/50" : "bg-border")} />}
            </div>
          ))}
        </div>

        {/* 상태줄 */}
        <div className="flex items-center gap-2 px-5 pt-4 text-sm">
          {step < STEPS.length - 1 ? <Loader2 className="size-4 animate-spin text-primary" /> : <Check className="size-4 text-signal" />}
          <span className={step >= STEPS.length - 1 ? "text-foreground" : "text-muted-foreground"}>{STATUS[step]}</span>
        </div>

        {/* 본문 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === 0 ? (
            <div className="space-y-2">
              <div className="font-mono text-[11px] text-muted-foreground">미분류 노트 {plan.total}건</div>
              {plan.noteIds.map((id, i) => {
                const n = noteMap[id];
                if (!n) return null;
                return (
                  <div key={id} className="org-scan relative overflow-hidden rounded-lg border border-border bg-background/40 px-3 py-2" style={{ animationDelay: `${i * 90}ms` }}>
                    <p className="line-clamp-1 text-[13px] text-foreground/85">{n.excerpt}</p>
                    <span className="org-sweep pointer-events-none absolute inset-y-0 w-1/3" />
                  </div>
                );
              })}
            </div>
          ) : step >= STEPS.length - 1 ? (
            <Summary total={plan.total} clusters={plan.existing.length + (plan.emerging ? 1 : 0)} newProjects={plan.emerging ? 1 : 0} newAgents={newAgents} routed={routed} plan={plan} noteMap={noteMap} />
          ) : (
            <div className="space-y-3">
              {/* 기존 클러스터 */}
              {plan.existing.map((c) => {
                const project = getProject(c.projectId);
                return (
                  <ClusterCard
                    key={c.projectId}
                    color={project?.color ?? "var(--primary)"}
                    theme={c.theme}
                    similarity={c.similarity}
                    notes={c.noteIds.map((id) => noteMap[id]).filter(Boolean)}
                    step={step}
                    badge={
                      step >= 2 ? (
                        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `color-mix(in oklab, ${project?.color} 16%, transparent)`, color: project?.color }}>
                          <FolderCheck className="size-3" />기존 프로젝트
                        </span>
                      ) : null
                    }
                    footer={
                      step >= 3 ? (
                        <div className="flex items-center gap-2 font-mono text-[11px] text-signal">
                          <Check className="size-3.5" />
                          {project?.name}에 배정 완료
                        </div>
                      ) : null
                    }
                  />
                );
              })}

              {/* 신규(emerging) 클러스터 */}
              {plan.emerging && (
                <ClusterCard
                  color={plan.emerging.project.color}
                  theme={plan.emerging.theme}
                  similarity={plan.emerging.similarity}
                  notes={plan.emerging.noteIds.map((id) => noteMap[id]).filter(Boolean)}
                  step={step}
                  badge={
                    step >= 2 ? (
                      <span className="org-pulse inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `color-mix(in oklab, ${plan.emerging.project.color} 18%, transparent)`, color: plan.emerging.project.color }}>
                        <FolderPlus className="size-3" />신규 프로젝트 필요
                      </span>
                    ) : null
                  }
                  footer={
                    step >= 3 ? (
                      <div className="org-rise space-y-2 rounded-lg border border-border bg-background/40 p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ background: plan.emerging.project.color }} />
                          <span className="text-[13px]">{plan.emerging.project.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{plan.emerging.project.codename}</span>
                          <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] text-signal"><Check className="size-3" />생성됨</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {[plan.emerging.lead, plan.emerging.sub].map((a) => (
                            <div key={a.id} className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1">
                              <AgentAvatar agent={a} size={20} showRing={false} />
                              <span className="font-mono text-[11px]" style={{ color: a.accent }}>{a.codename}</span>
                              <span className="font-mono text-[9px] text-warn">스폰됨</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  }
                />
              )}
            </div>
          )}
        </div>

        {/* 완료 푸터 */}
        {step >= STEPS.length - 1 && (
          <div className="border-t border-border p-4">
            <button onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              확인 <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      <FlowStyles />
    </div>
  );
}

function ClusterCard({
  color,
  theme,
  similarity,
  notes,
  step,
  badge,
  footer,
}: {
  color: string;
  theme: string;
  similarity: number;
  notes: Note[];
  step: number;
  badge: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="org-rise rounded-xl border border-border bg-background/30 p-3.5" style={{ borderColor: `color-mix(in oklab, ${color} 30%, var(--border))` }}>
      <div className="flex items-center gap-2">
        <Layers className="size-3.5" style={{ color }} />
        <span className="text-sm">{theme}</span>
        <span className="font-mono text-[10px] text-muted-foreground">노트 {notes.length}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">유사도</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
          <span className="block h-full rounded-full" style={{ width: `${Math.round(similarity * 100)}%`, background: color }} />
        </div>
        <span className="font-mono text-[10px] tabular-nums" style={{ color }}>{Math.round(similarity * 100)}%</span>
      </div>
      <div className="mt-2 space-y-1">
        {notes.map((n) => (
          <p key={n.id} className="line-clamp-1 border-l-2 pl-2 text-[12px] text-muted-foreground" style={{ borderColor: `color-mix(in oklab, ${color} 40%, transparent)` }}>
            {n.excerpt}
          </p>
        ))}
      </div>
      {footer && <div className="mt-2.5">{footer}</div>}
    </div>
  );
}

function Summary({
  total,
  clusters,
  newProjects,
  newAgents,
  routed,
  plan,
  noteMap,
}: {
  total: number;
  clusters: number;
  newProjects: number;
  newAgents: number;
  routed: number;
  plan: OrganizePlan;
  noteMap: Record<string, Note>;
}) {
  const stats = [
    { label: "분석", value: total },
    { label: "클러스터", value: clusters },
    { label: "신규 프로젝트", value: newProjects },
    { label: "에이전트 스폰", value: newAgents },
    { label: "라우팅", value: routed },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="org-rise rounded-lg border border-border bg-background/40 p-2.5 text-center">
            <div className="text-xl font-semibold tabular-nums">{s.value}</div>
            <div className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {plan.existing.map((c) => {
          const project = getProject(c.projectId);
          return (
            <div key={c.projectId} className="flex items-center gap-2 rounded-lg border border-border bg-background/30 px-3 py-2">
              <FolderCheck className="size-4" style={{ color: project?.color }} />
              <span className="text-[13px]">{project?.name}</span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">노트 {c.noteIds.length}건 배정</span>
            </div>
          );
        })}
        {plan.emerging && (
          <div className="rounded-lg border border-border bg-background/30 px-3 py-2" style={{ borderColor: `color-mix(in oklab, ${plan.emerging.project.color} 35%, var(--border))` }}>
            <div className="flex items-center gap-2">
              <Boxes className="size-4" style={{ color: plan.emerging.project.color }} />
              <span className="text-[13px]">{plan.emerging.project.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{plan.emerging.project.codename} · 신규</span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">노트 {plan.emerging.noteIds.length}건</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {[plan.emerging.lead, plan.emerging.sub].map((a) => (
                <div key={a.id} className="flex items-center gap-1.5">
                  <AgentAvatar agent={a} size={18} showRing={false} />
                  <span className="font-mono text-[11px]" style={{ color: a.accent }}>{a.codename}</span>
                </div>
              ))}
              <span className="font-mono text-[10px] text-muted-foreground">· 에이전트 탭 조직도에서 확인</span>
            </div>
          </div>
        )}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">{Object.keys(noteMap).length > 0 ? "인박스에서 라우팅 결과를 확인하세요." : ""}</p>
    </div>
  );
}

function FlowStyles() {
  return (
    <style>{`
      @keyframes of-pop { from { opacity:0; transform: scale(.96) translateY(8px);} to { opacity:1; transform:none;} }
      .org-flow { animation: of-pop .3s cubic-bezier(.2,.8,.2,1) both; }
      @keyframes of-rise { from { opacity:0; transform: translateY(7px);} to { opacity:1; transform:none;} }
      .org-rise { animation: of-rise .4s cubic-bezier(.2,.7,.2,1) both; }
      .org-scan { animation: of-rise .4s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes of-sweep { 0% { left:-33%; } 100% { left:120%; } }
      .org-sweep { background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--primary) 22%, transparent), transparent); animation: of-sweep 1.1s ease-in-out infinite; }
      @keyframes of-pulse { 0%,100% { opacity:1; } 50% { opacity:.55; } }
      .org-pulse { animation: of-pulse 1.4s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce){ .org-flow,.org-rise,.org-scan,.org-sweep,.org-pulse { animation:none !important; } }
    `}</style>
  );
}
