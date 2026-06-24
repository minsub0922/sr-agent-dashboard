import { useState } from "react";
import { Plus, FolderKanban } from "lucide-react";
import type { Agent, Project } from "../data";
import { agents as baseAgents, getAgent, projects as baseProjects } from "../data";
import { AgentAvatar, StatusDot, statusLabel } from "./agent-bits";
import { AgentChat } from "./agent-chat";
import { cn } from "./ui/utils";
import { ProjectSetupChat, type NewProjectDraft } from "./project-setup-chat";

interface ProjectEntry {
  project: Project;
  lead: Agent;
  subs: Agent[];
}

function baseEntries(): ProjectEntry[] {
  return baseProjects.map((p) => ({
    project: p,
    lead: getAgent(p.leadAgentId)!,
    subs: p.subAgentIds.map((id) => getAgent(id)!),
  }));
}

const codenamePool = ["RIGEL", "MAIA", "CETUS", "DRACO", "PHEN", "LYNX", "ARIA", "ZEPH"];
const emojiPool = ["🛰️", "📦", "⭐", "🧩", "🔧", "🌙", "🪐", "🧠"];
let customSeq = 0;

function buildProjectFromDraft(draft: NewProjectDraft): ProjectEntry {
  customSeq += 1;
  const pid = `p-custom-${customSeq}`;
  const aid = `a-custom-${customSeq}`;
  const codename = codenamePool[(customSeq - 1) % codenamePool.length];
  const emoji = emojiPool[(customSeq - 1) % emojiPool.length];
  const lead: Agent = {
    id: aid,
    codename,
    name: `리드 · ${draft.name}`,
    emoji,
    role: "lead",
    specialty: draft.description || draft.keywords || "새 프로젝트 지식 관리",
    status: "training",
    accent: draft.color,
    projectId: pid,
    notesRouted: 0,
    accuracy: 80,
  };
  const project: Project = {
    id: pid,
    name: draft.name,
    codename: (draft.name.replace(/[^A-Za-z가-힣]/g, "").slice(0, 3) || codename.slice(0, 3)).toUpperCase(),
    description: draft.description,
    color: draft.color,
    leadAgentId: aid,
    subAgentIds: [],
    noteCount: 0,
    knowledgeCount: 0,
    health: 100,
    lastUpdated: new Date().toISOString(),
  };
  return { project, lead, subs: [] };
}

export function ChatView() {
  const [extra, setExtra] = useState<ProjectEntry[]>([]);
  const entries = [...baseEntries(), ...extra];
  const [activeId, setActiveId] = useState<string>(entries[0]?.project.id ?? "");
  const creating = activeId === "__new__";
  const active = entries.find((e) => e.project.id === activeId);

  function handleCreate(draft: NewProjectDraft) {
    const entry = buildProjectFromDraft(draft);
    // baseAgents에 동적 추가 — 채팅 외 화면에서도 getAgent로 조회되도록
    baseAgents.push(entry.lead);
    setExtra((prev) => [...prev, entry]);
    setActiveId(entry.project.id);
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      {/* 프로젝트 목록 */}
      <div className="hidden w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card md:flex">
        <div className="border-b border-border px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">대화</div>
          <div className="mt-0.5 text-sm">프로젝트 선택</div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {entries.map((e) => {
            const p = e.project;
            const selected = p.id === activeId;
            return (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                  selected ? "bg-secondary" : "hover:bg-secondary/50",
                )}
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg"
                  style={{ background: `color-mix(in oklab, ${p.color} 18%, transparent)`, color: p.color }}
                >
                  <FolderKanban className="size-4" />
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-sm">{p.name}</div>
                  <div className="mt-1 flex items-center gap-1">
                    {[e.lead, ...e.subs].slice(0, 4).map((a) => (
                      <span key={a.id} style={{ fontSize: 12 }} title={a.codename}>{a.emoji}</span>
                    ))}
                    <span className="ml-0.5 font-mono text-[10px] text-muted-foreground">
                      에이전트 {1 + e.subs.length}
                    </span>
                  </div>
                </div>
                <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} />
              </button>
            );
          })}
        </div>

        {/* 프로젝트 추가 */}
        <div className="border-t border-border p-2">
          <button
            onClick={() => setActiveId("__new__")}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-sm transition-colors",
              creating
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <Plus className="size-4" />
            프로젝트 추가
          </button>
        </div>
      </div>

      {/* 대화 스레드 */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {creating ? (
          <>
            <div className="flex items-center gap-3 border-b border-border px-5 py-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
                <Plus className="size-4" />
              </span>
              <div className="leading-tight">
                <div className="text-sm">새 프로젝트 만들기</div>
                <div className="font-mono text-[11px] text-muted-foreground">설정 도우미와 대화하며 만들어요</div>
              </div>
            </div>
            <div className="min-h-0 flex-1 p-4">
              <ProjectSetupChat onCreate={handleCreate} onCancel={() => setActiveId(entries[0]?.project.id ?? "")} />
            </div>
          </>
        ) : active ? (
          <>
            {/* 헤더 — 프로젝트 + 에이전트 팀 */}
            <div className="flex items-center gap-3 border-b border-border px-5 py-3">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-lg"
                style={{ background: `color-mix(in oklab, ${active.project.color} 18%, transparent)`, color: active.project.color }}
              >
                <FolderKanban className="size-5" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{active.project.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{active.project.codename}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {[active.lead, ...active.subs].map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-0.5" title={`${a.codename} · ${statusLabel(a.status)}`}>
                      <AgentAvatar agent={a} size={18} showRing={false} />
                    </span>
                  ))}
                  <span className="ml-1 font-mono text-[11px] text-muted-foreground">
                    리드 {active.lead.codename}
                  </span>
                  <StatusDot status={active.lead.status} />
                </div>
              </div>
            </div>

            {/* 대화 — 프로젝트의 리드 에이전트와 */}
            <div className="min-h-0 flex-1 p-4">
              <AgentChat key={active.project.id} agent={active.lead} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
