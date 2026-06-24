import { Plus, RefreshCw, GitMerge } from "lucide-react";
import { getAgent, getProject, knowledge, timeAgo } from "../data";
import { AgentAvatar } from "./agent-bits";

const deltaMeta = {
  added: { icon: Plus, color: "var(--signal)", label: "추가" },
  updated: { icon: RefreshCw, color: "var(--primary)", label: "수정" },
  merged: { icon: GitMerge, color: "oklch(0.74 0.13 222)", label: "병합" },
} as const;

export function KnowledgeView({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const sorted = [...knowledge].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative pl-6">
        <span className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
        <div className="space-y-4">
          {sorted.map((k) => {
            const meta = deltaMeta[k.delta];
            const agent = getAgent(k.agentId)!;
            const project = getProject(agent.projectId);
            const Icon = meta.icon;
            return (
              <div key={k.id} className="relative">
                <span className="absolute -left-[22px] top-4 grid size-4 place-items-center rounded-full border border-border bg-background">
                  <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
                </span>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase" style={{ background: `color-mix(in oklab, ${meta.color} 16%, transparent)`, color: meta.color }}>
                      <Icon className="size-3" />
                      {meta.label}
                    </span>
                    {project && (
                      <button
                        onClick={() => onOpenProject(project.id)}
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span className="size-1.5 rounded-full" style={{ background: project.color }} />
                        {project.name}
                      </button>
                    )}
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">{timeAgo(k.updatedAt)}</span>
                  </div>
                  <h3 className="mt-2 tracking-tight">{k.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{k.summary}</p>
                  <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                    <AgentAvatar agent={agent} size={22} showRing={false} />
                    <span className="font-mono text-[11px]" style={{ color: agent.accent }}>{agent.codename}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">이(가) 변경함</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
