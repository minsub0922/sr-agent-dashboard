import { useState } from "react";
import { getAgent, getProject } from "../data";
import { AgentAvatar, StatusDot, statusLabel } from "./agent-bits";
import { AgentChat } from "./agent-chat";
import { cn } from "./ui/utils";

// 대화 가능한 에이전트 순서 — 오케스트레이터 먼저, 이후 리드/서브
const chatAgentIds = [
  "a-atlas",
  "a-orion", "a-vega", "a-lyra",
  "a-nova", "a-iris", "a-juno",
  "a-helix", "a-echo",
  "a-sol",
];

export function ChatView() {
  const [activeId, setActiveId] = useState("a-atlas");
  const active = getAgent(activeId)!;
  const activeProject = getProject(active.projectId);

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      {/* 대화 목록 */}
      <div className="hidden w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card md:flex">
        <div className="border-b border-border px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">대화</div>
          <div className="mt-0.5 text-sm">에이전트 선택</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {chatAgentIds.map((id) => {
            const a = getAgent(id)!;
            const project = getProject(a.projectId);
            const selected = id === activeId;
            return (
              <button
                key={id}
                onClick={() => setActiveId(id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
                  selected ? "bg-secondary" : "hover:bg-secondary/50",
                )}
              >
                <AgentAvatar agent={a} size={32} live />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-mono text-sm" style={{ color: a.accent }}>{a.codename}</span>
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {project ? project.name : "전체 프로젝트"}
                  </div>
                </div>
                <StatusDot status={a.status} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 대화 스레드 */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {/* 헤더 */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <AgentAvatar agent={active} size={38} live />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm" style={{ color: active.accent }}>{active.codename}</span>
              <StatusDot status={active.status} label />
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {active.name} · {activeProject ? activeProject.name : "전체 프로젝트"}
            </div>
          </div>
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
            정확도 {active.accuracy}% · {statusLabel(active.status)}
          </span>
        </div>

        {/* 메시지 + 입력 */}
        <div className="min-h-0 flex-1 p-4">
          <AgentChat key={active.id} agent={active} />
        </div>
      </div>
    </div>
  );
}
