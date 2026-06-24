import { ChevronRight } from "lucide-react";
import type { Agent } from "../data";
import { getProject } from "../data";
import { AgentAvatar, StatusDot, statusLabel } from "./agent-bits";

function activityLine(agent: Agent): string {
  if (agent.status === "processing") return "노트 분석 중…";
  if (agent.status === "training") return "학습 중…";
  if (agent.status === "active") return "대기·수신 중";
  return "유휴";
}

export function AgentGridCard({ agent, onOpen }: { agent: Agent; onOpen: (id: string) => void }) {
  const project = getProject(agent.projectId);
  const working = agent.status === "processing" || agent.status === "training";
  return (
    <button
      onClick={() => onOpen(agent.id)}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between">
        <AgentAvatar agent={agent} size={44} live />
        <StatusDot status={agent.status} />
      </div>

      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm" style={{ color: agent.accent }}>{agent.codename}</span>
          <span className="rounded bg-secondary px-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            {agent.role === "lead" ? "리드" : "서브"}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{project ? project.name : "전체 프로젝트"}</div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px]" style={{ color: working ? agent.accent : "var(--muted-foreground)" }}>
          {activityLine(agent)}
        </span>
        <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </button>
  );
}

export function statusText(agent: Agent) {
  return statusLabel(agent.status);
}
