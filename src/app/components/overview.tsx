import { Inbox, Workflow, BrainCircuit, Boxes } from "lucide-react";
import type { Note } from "../data";
import { activity, agents, getAgent, projects, timeAgo } from "../data";
import { AgentAvatar, StatusDot } from "./agent-bits";
import { NoteCard } from "./note-card";
import { AgentGridCard } from "./agent-grid-card";
import type { ViewKey } from "./sidebar-nav";

function StatChip({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="flex min-w-[180px] shrink-0 items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${accent} 16%, transparent)`, color: accent }}>
        <Icon className="size-4" />
      </span>
      <div className="leading-tight">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold tabular-nums">{value}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{sub}</span>
        </div>
      </div>
    </div>
  );
}

export function Overview({
  notes,
  onRoute,
  onNavigate,
  onOpenProject,
  onOpenAgent,
}: {
  notes: Note[];
  onRoute: (n: Note) => void;
  onNavigate: (v: ViewKey) => void;
  onOpenProject: (id: string) => void;
  onOpenAgent: (id: string) => void;
}) {
  const analyzing = notes.filter((n) => n.stage === "analyzing");
  const inbox = notes.filter((n) => n.stage === "inbox");
  const pipeline = [...analyzing, ...inbox, ...notes.filter((n) => n.stage === "routed")].slice(0, 4);

  const roster = [...agents].sort((a, b) => {
    const order = { processing: 0, active: 1, training: 2, idle: 3 } as const;
    return order[a.status] - order[b.status];
  });

  return (
    <div className="space-y-8">
      {/* 요약 지표 — 최상단 가로 스크롤 */}
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        <StatChip icon={Workflow} label="오늘 수집" value="176" sub="어제 +8%" accent="var(--primary)" />
        <StatChip icon={Inbox} label="검토 대기" value={String(inbox.length)} sub="낮은 신뢰도" accent="var(--warn)" />
        <StatChip icon={BrainCircuit} label="지식 업데이트" value="41" sub="4개 프로젝트" accent="var(--signal)" />
        <StatChip icon={Boxes} label="활성 에이전트" value="7 / 10" sub="대기 3 · 학습 1" accent="oklch(0.74 0.13 222)" />
        <StatChip icon={Workflow} label="자동 라우팅" value="92%" sub="최근 7일" accent="oklch(0.72 0.18 350)" />
      </div>

      {/* 에이전트 현황 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="tracking-tight">에이전트 현황</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[11px] text-signal">
              <span className="size-1.5 animate-pulse rounded-full bg-signal" />
              {agents.filter((a) => a.status !== "idle").length}명 활동 중
            </span>
          </div>
          <button onClick={() => onNavigate("agents")} className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">
            전체 에이전트 →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {roster.slice(0, 9).map((a) => (
            <AgentGridCard key={a.id} agent={a} onOpen={onOpenAgent} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* 라이브 파이프라인 */}
        <section className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="tracking-tight">라이브 파이프라인</h2>
              {analyzing.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] text-primary">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  {analyzing.length}건 분석 중
                </span>
              )}
            </div>
            <button onClick={() => onNavigate("inbox")} className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">
              인박스 보기 →
            </button>
          </div>
          <div className="grid gap-3">
            {pipeline.map((n) => (
              <NoteCard key={n.id} note={n} onRoute={onRoute} />
            ))}
          </div>
        </section>

        {/* 활동 피드 */}
        <section className="space-y-4">
          <h2 className="tracking-tight">에이전트 활동</h2>
          <div className="rounded-xl border border-border bg-card p-2">
            {activity.map((item, i) => {
              const agent = getAgent(item.agentId)!;
              return (
                <button
                  key={item.id}
                  onClick={() => onOpenAgent(agent.id)}
                  className="relative flex w-full gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-secondary/40"
                >
                  {i < activity.length - 1 && (
                    <span className="absolute left-[26px] top-11 h-[calc(100%-2rem)] w-px bg-border" />
                  )}
                  <AgentAvatar agent={agent} size={28} />
                  <div className="min-w-0 flex-1 leading-snug">
                    <p className="text-sm">
                      <span className="font-mono" style={{ color: agent.accent }}>{agent.codename}</span>
                      <span className="text-muted-foreground">{item.action}</span>{" "}
                      <span className="text-foreground">{item.target}</span>
                    </p>
                    <span className="font-mono text-[11px] text-muted-foreground">{timeAgo(item.at)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* 프로젝트 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="tracking-tight">프로젝트</h2>
          <button onClick={() => onNavigate("projects")} className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">
            전체 프로젝트 →
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {projects.map((p) => {
            const lead = getAgent(p.leadAgentId)!;
            return (
              <button
                key={p.id}
                onClick={() => onOpenProject(p.id)}
                className="group rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: p.color }} />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{p.codename}</span>
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">{timeAgo(p.lastUpdated)}</span>
                </div>
                <div className="mt-2 tracking-tight">{p.name}</div>
                <div className="mt-3 flex items-center gap-2">
                  <AgentAvatar agent={lead} size={24} />
                  <span className="font-mono text-xs" style={{ color: lead.accent }}>{lead.codename}</span>
                  <StatusDot status={lead.status} />
                  <div className="ml-auto flex -space-x-1.5">
                    {p.subAgentIds.map((id) => {
                      const a = getAgent(id)!;
                      return <AgentAvatar key={id} agent={a} size={20} showRing={false} />;
                    })}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
                  <span>노트 {p.noteCount.toLocaleString()}</span>
                  <span>지식 {p.knowledgeCount}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
