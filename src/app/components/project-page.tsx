import { ArrowLeft, BookOpen, GitMerge, Plus, RefreshCw, Network, Loader2 } from "lucide-react";
import type { KnowledgeEntry, Note } from "../data";
import { getAgent, getProject, knowledge, timeAgo } from "../data";
import { AgentAvatar, StatusDot, statusLabel } from "./agent-bits";
import { NoteCard } from "./note-card";

const deltaMeta = {
  added: { icon: Plus, color: "var(--signal)", label: "추가" },
  updated: { icon: RefreshCw, color: "var(--primary)", label: "수정" },
  merged: { icon: GitMerge, color: "oklch(0.74 0.13 222)", label: "병합" },
} as const;

export function ProjectPage({
  projectId,
  notes,
  onBack,
  onOpenAgent,
}: {
  projectId: string;
  notes: Note[];
  onBack: () => void;
  onOpenAgent: (id: string) => void;
}) {
  const project = getProject(projectId);
  if (!project) return null;
  const lead = getAgent(project.leadAgentId)!;
  const subs = project.subAgentIds.map((id) => getAgent(id)!);
  const processing = notes.filter((n) => n.projectId === project.id && n.stage !== "routed");
  const routed = notes.filter((n) => n.projectId === project.id && n.stage === "routed").slice(0, 6);
  const entries: KnowledgeEntry[] = knowledge.filter((k) => getAgent(k.agentId)?.projectId === project.id);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          뒤로
        </button>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
          <span className="absolute inset-x-0 top-0 h-1" style={{ background: project.color }} />
          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-60 flex-1">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: project.color }} />
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{project.codename}</span>
              </div>
              <h1 className="mt-2 tracking-tight">{project.name}</h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex gap-3">
              <Stat label="노트" value={project.noteCount.toLocaleString()} />
              <Stat label="지식" value={String(project.knowledgeCount)} />
              <Stat label="신선도" value={`${project.health}%`} color={project.color} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 좌측: 노트 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 처리 중인 노트 */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Loader2 className={`size-4 text-primary ${processing.some((n) => n.stage === "analyzing") ? "animate-spin" : ""}`} />
              <h2 className="tracking-tight">처리 중인 노트</h2>
              {processing.length > 0 && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] text-primary tabular-nums">
                  {processing.length}
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {processing.map((n) => (
                <NoteCard key={n.id} note={n} />
              ))}
              {processing.length === 0 && <Empty text="현재 처리 중인 노트가 없습니다." />}
            </div>
          </section>

          {/* 최근 라우팅된 노트 */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <GitMerge className="size-4 text-muted-foreground" />
              <h2 className="tracking-tight">최근 라우팅된 노트</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {routed.map((n) => (
                <NoteCard key={n.id} note={n} />
              ))}
              {routed.length === 0 && <Empty text="라우팅된 노트가 없습니다." />}
            </div>
          </section>
        </div>

        {/* 우측: 에이전트 팀 + 지식 */}
        <div className="space-y-6">
          {/* 에이전트 팀 */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Network className="size-4 text-muted-foreground" />
              <h2 className="tracking-tight">에이전트 팀</h2>
            </div>
            <div className="space-y-2.5">
              <AgentRow agent={lead} role="리드 에이전트" onOpen={onOpenAgent} />
              {subs.map((s) => (
                <AgentRow key={s.id} agent={s} role="서브 에이전트" onOpen={onOpenAgent} />
              ))}
            </div>
          </section>

          {/* 최근 지식 업데이트 */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" />
              <h2 className="tracking-tight">최근 지식 업데이트</h2>
            </div>
            <div className="space-y-2.5">
              {entries.map((k) => {
                const meta = deltaMeta[k.delta];
                const agent = getAgent(k.agentId)!;
                const Icon = meta.icon;
                return (
                  <div key={k.id} className="rounded-xl border border-border bg-card p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase" style={{ background: `color-mix(in oklab, ${meta.color} 16%, transparent)`, color: meta.color }}>
                        <Icon className="size-3" />
                        {meta.label}
                      </span>
                      <span className="text-sm">{k.title}</span>
                      <span className="ml-auto font-mono text-[11px] text-muted-foreground">{timeAgo(k.updatedAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{k.summary}</p>
                    <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                      <span style={{ color: agent.accent }}>{agent.codename}</span>
                      <span>작성</span>
                    </div>
                  </div>
                );
              })}
              {entries.length === 0 && <Empty text="아직 지식 변경이 없습니다." />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-4 py-2.5 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

function AgentRow({ agent, role, onOpen }: { agent: ReturnType<typeof getAgent> & {}; role: string; onOpen: (id: string) => void }) {
  if (!agent) return null;
  return (
    <button
      onClick={() => onOpen(agent.id)}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
    >
      <AgentAvatar agent={agent} size={38} live />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm" style={{ color: agent.accent }}>{agent.codename}</span>
          <StatusDot status={agent.status} />
        </div>
        <div className="truncate text-xs text-muted-foreground">{role} · {agent.specialty}</div>
      </div>
      <div className="text-right leading-tight">
        <div className="font-mono text-sm tabular-nums">{agent.accuracy}%</div>
        <div className="font-mono text-[10px] uppercase text-muted-foreground">{statusLabel(agent.status)}</div>
      </div>
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground sm:col-span-2">{text}</div>;
}
