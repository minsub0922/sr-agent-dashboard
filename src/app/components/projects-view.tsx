import { ArrowUpRight } from "lucide-react";
import { getAgent, projects, timeAgo } from "../data";
import { AgentAvatar, StatusDot, statusLabel } from "./agent-bits";

export function ProjectsView({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {projects.map((p) => {
        const lead = getAgent(p.leadAgentId)!;
        const subs = p.subAgentIds.map((id) => getAgent(id)!);
        return (
          <button
            key={p.id}
            onClick={() => onOpenProject(p.id)}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
          >
            <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: p.color }} />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: p.color }} />
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{p.codename}</span>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>

            <h2 className="mt-2 tracking-tight">{p.name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

            {/* 에이전트 팀 */}
            <div className="mt-4 rounded-xl border border-border bg-background/40 p-3">
              <div className="mb-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">에이전트 팀</div>
              <div className="flex items-center gap-2.5">
                <AgentAvatar agent={lead} size={36} />
                <div className="leading-tight">
                  <div className="font-mono text-sm" style={{ color: lead.accent }}>{lead.codename}</div>
                  <div className="text-xs text-muted-foreground">리드 · {statusLabel(lead.status)}</div>
                </div>
                <StatusDot status={lead.status} />
                {subs.length > 0 && <div className="mx-1 h-8 w-px bg-border" />}
                <div className="flex items-center gap-2">
                  {subs.map((s) => (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <AgentAvatar agent={s} size={28} showRing={false} />
                    </div>
                  ))}
                  {subs.length === 0 && <span className="font-mono text-xs text-muted-foreground">서브 에이전트 없음</span>}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Metric label="노트" value={p.noteCount.toLocaleString()} />
              <Metric label="지식" value={String(p.knowledgeCount)} />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">신선도</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${p.health}%`, background: p.color }} />
                  </div>
                  <span className="font-mono text-xs tabular-nums" style={{ color: p.color }}>{p.health}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 font-mono text-[11px] text-muted-foreground">{timeAgo(p.lastUpdated)} 업데이트</div>
          </button>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
