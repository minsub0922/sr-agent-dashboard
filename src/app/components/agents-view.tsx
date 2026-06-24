import { Network } from "lucide-react";
import type { Agent, Project } from "../data";
import { agents, getAgent, projects } from "../data";
import { AgentAvatar, StatusDot, statusLabel } from "./agent-bits";
import { cn } from "./ui/utils";

type Tier = "atlas" | "lead" | "sub";

function OrgNode({
  agent,
  project,
  tier,
  delay = 0,
  onOpen,
}: {
  agent: Agent;
  project?: Project;
  tier: Tier;
  delay?: number;
  onOpen: (id: string) => void;
}) {
  const accent = tier === "atlas" ? "var(--primary)" : project?.color ?? agent.accent;
  const size = tier === "atlas" ? 42 : tier === "lead" ? 34 : 28;
  const roleLabel = tier === "atlas" ? "오케스트레이터" : tier === "lead" ? "리드" : "서브";
  const subtitle = tier === "atlas" ? agent.specialty : tier === "lead" ? project?.name : agent.specialty;
  const minWidth = tier === "atlas" ? 230 : tier === "lead" ? 168 : 138;

  return (
    <button
      onClick={() => onOpen(agent.id)}
      style={{ minWidth, borderColor: `color-mix(in oklab, ${accent} ${tier === "sub" ? 26 : tier === "lead" ? 38 : 46}%, transparent)`, animationDelay: `${delay}ms` }}
      className={cn(
        "org-node group relative inline-flex flex-col items-stretch gap-2 overflow-hidden rounded-xl border bg-card px-4 py-3 text-left align-top transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/25",
        tier === "atlas" && "bg-gradient-to-b from-primary/[0.10] to-card px-5 py-3.5",
      )}
    >
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent, opacity: tier === "sub" ? 0.5 : 0.9 }} />

      <div className="flex items-center gap-2.5">
        <AgentAvatar agent={agent} size={size} live />
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={cn("font-mono font-semibold", tier === "atlas" ? "text-base" : "text-sm")} style={{ color: accent }}>
              {agent.codename}
            </span>
            <span className="rounded px-1 py-px font-mono text-[9px] uppercase tracking-wide" style={{ background: `color-mix(in oklab, ${accent} 16%, transparent)`, color: accent }}>
              {roleLabel}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="leading-none">{agent.emoji}</span>
            <span className="truncate">{agent.name}</span>
          </div>
        </div>
      </div>

      {tier !== "sub" && subtitle && (
        <div className="truncate text-[11px] leading-snug text-muted-foreground/90">{subtitle}</div>
      )}

      <div className="mt-0.5 flex items-center gap-2 border-t border-border pt-2 font-mono text-[10px] text-muted-foreground">
        <StatusDot status={agent.status} />
        <span>{statusLabel(agent.status)}</span>
        {tier === "atlas" ? (
          <span className="ml-auto tabular-nums">라우팅 {agent.notesRouted.toLocaleString()} · {agent.accuracy}%</span>
        ) : (
          <span className="ml-auto tabular-nums">정확도 {agent.accuracy}%</span>
        )}
      </div>
    </button>
  );
}

export function AgentsView({ onOpenAgent }: { onOpenAgent: (id: string) => void }) {
  const atlas = getAgent("a-atlas")!;
  const activeCount = agents.filter((a) => a.status === "active" || a.status === "processing").length;
  const lineFor = (c: string, pct: number) => `color-mix(in oklab, ${c} ${pct}%, transparent)`;

  return (
    <div className="space-y-6">
      {/* 범례 / 요약 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card px-4 py-3">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <Network className="size-3.5 text-primary" />계층 구조
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="size-2.5 rounded-full bg-primary" />오케스트레이터
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="size-2.5 rounded-full border-2 border-muted-foreground" />리드
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="size-2 rounded-full bg-muted-foreground" />서브
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          총 <span className="text-foreground">{agents.length}</span> 에이전트 · 활성 <span className="text-signal">{activeCount}</span>
        </span>
      </div>

      {/* 조직도 */}
      <div className="overflow-x-auto pb-4">
        <div className="org-tree mx-auto w-max">
          <ul>
            <li>
              <OrgNode agent={atlas} tier="atlas" onOpen={onOpenAgent} />
              <ul style={{ ["--org-line" as string]: lineFor("var(--primary)", 42) } as React.CSSProperties}>
                {projects.map((p, pi) => {
                  const lead = getAgent(p.leadAgentId)!;
                  const subs = p.subAgentIds.map((id) => getAgent(id)!);
                  return (
                    <li key={p.id}>
                      <OrgNode agent={lead} project={p} tier="lead" delay={120 + pi * 70} onOpen={onOpenAgent} />
                      {subs.length > 0 && (
                        <ul style={{ ["--org-line" as string]: lineFor(p.color, 52) } as React.CSSProperties}>
                          {subs.map((s, si) => (
                            <li key={s.id}>
                              <OrgNode agent={s} project={p} tier="sub" delay={300 + pi * 70 + si * 50} onOpen={onOpenAgent} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </div>
      </div>

      <OrgStyles />
    </div>
  );
}

/* 조직도 커넥터 — CSS 트리. 마운트 시 1회 주입 */
function OrgStyles() {
  const LINE = "var(--org-line, color-mix(in oklab, var(--foreground) 18%, transparent))";
  return (
    <style>{`
      .org-tree ul { display:flex; justify-content:center; position:relative; margin:0; padding:26px 0 0; list-style:none; }
      .org-tree > ul { padding-top:0; }
      .org-tree li { position:relative; list-style:none; padding:26px 14px 0; text-align:center; }
      .org-tree li::before, .org-tree li::after {
        content:''; position:absolute; top:0; right:50%; width:50%; height:26px;
        border-top:1.5px solid ${LINE};
      }
      .org-tree li::after { right:auto; left:50%; border-left:1.5px solid ${LINE}; }
      .org-tree li:only-child::before, .org-tree li:only-child::after { display:none; }
      .org-tree li:only-child { padding-top:0; }
      .org-tree li:first-child::before, .org-tree li:last-child::after { border:0 none; }
      .org-tree li:last-child::before { border-right:1.5px solid ${LINE}; border-radius:0 8px 0 0; }
      .org-tree li:first-child::after { border-radius:8px 0 0 0; }
      .org-tree ul ul::before { content:''; position:absolute; top:0; left:50%; width:0; height:26px; border-left:1.5px solid ${LINE}; }
      @keyframes org-rise-k { from { opacity:0; transform: translateY(7px) scale(.97);} to { opacity:1; transform:none;} }
      .org-node { animation: org-rise-k .5s cubic-bezier(.2,.7,.2,1) both; }
      @media (prefers-reduced-motion: reduce) { .org-node { animation:none !important; } }
    `}</style>
  );
}
